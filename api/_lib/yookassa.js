import crypto from "node:crypto";

export function getYooKassaConfig() {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;
  const webhookSecret = process.env.YOOKASSA_WEBHOOK_SECRET;
  const returnUrl = process.env.YOOKASSA_RETURN_URL;
  if (!shopId || !secretKey) {
    throw new Error("Missing YOOKASSA_SHOP_ID or YOOKASSA_SECRET_KEY");
  }
  return { shopId, secretKey, webhookSecret, returnUrl };
}

export function createBasicAuthHeader(shopId, secretKey) {
  const raw = Buffer.from(`${shopId}:${secretKey}`).toString("base64");
  return `Basic ${raw}`;
}

export function parseJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string" && req.body.trim()) return JSON.parse(req.body);
  return {};
}

export function verifyWebhookSignature({ req, rawBody, shopId, secretKey, webhookSecret }) {
  const authHeader = String(req.headers.authorization || "");
  const expectedBasic = createBasicAuthHeader(shopId, secretKey);
  if (authHeader === expectedBasic) return true;

  if (!webhookSecret) return false;

  const signatureHeader = String(req.headers["x-yookassa-signature"] || "");
  if (signatureHeader) {
    const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
    const incoming = Buffer.from(signatureHeader);
    const expectedBuffer = Buffer.from(expected);
    if (incoming.length === expectedBuffer.length && crypto.timingSafeEqual(incoming, expectedBuffer)) return true;
  }

  const sharedHeader = String(req.headers["x-webhook-secret"] || "");
  return sharedHeader === webhookSecret;
}

export async function createYooKassaPayment({ shopId, secretKey, idempotenceKey, payload }) {
  const response = await fetch("https://api.yookassa.ru/v3/payments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: createBasicAuthHeader(shopId, secretKey),
      "Idempotence-Key": idempotenceKey,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.description || "Failed to create YooKassa payment");
    error.status = response.status;
    error.details = data;
    throw error;
  }
  return data;
}
