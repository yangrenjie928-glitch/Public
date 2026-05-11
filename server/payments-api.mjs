import crypto from "node:crypto";
import http from "node:http";
import { URL } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { SUBSCRIPTION_PLANS } from "../api/_lib/subscriptionPlans.js";
import { isPaymentsEnabled } from "../api/_lib/paymentsEnabled.js";

const PORT = Number(process.env.PAYMENTS_API_PORT || 3100);

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

function resolvePlan(planCode) {
  return SUBSCRIPTION_PLANS[String(planCode || "").trim()] ?? null;
}

function createBasicAuthHeader(shopId, secretKey) {
  return `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString("base64")}`;
}

async function getAuthedUser(req, supabase) {
  const authHeader = String(req.headers.authorization || "");
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return { user: null, error: "Missing bearer token" };
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return { user: null, error: "Unauthorized" };
  return { user: data.user, error: null };
}

async function createYooKassaPayment({ shopId, secretKey, payload }) {
  const idempotenceKey = crypto.randomUUID();
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
    error.details = data;
    throw error;
  }
  return { data, idempotenceKey };
}

function addMonths(date, months) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function mapSubscriptionStatus(eventType, paymentStatus) {
  if (eventType === "payment.succeeded" || paymentStatus === "succeeded") return "active";
  if (eventType === "payment.canceled" || paymentStatus === "canceled") return "canceled";
  return "pending";
}

function verifyWebhookSignature(req, rawBody) {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;
  const webhookSecret = process.env.YOOKASSA_WEBHOOK_SECRET;
  if (!shopId || !secretKey) return false;

  const authHeader = String(req.headers.authorization || "");
  if (authHeader === createBasicAuthHeader(shopId, secretKey)) return true;

  if (!webhookSecret) return false;
  const signatureHeader = String(req.headers["x-yookassa-signature"] || "");
  if (signatureHeader) {
    const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
    const incoming = Buffer.from(signatureHeader);
    const expectedBuffer = Buffer.from(expected);
    if (incoming.length === expectedBuffer.length && crypto.timingSafeEqual(incoming, expectedBuffer)) return true;
  }
  return String(req.headers["x-webhook-secret"] || "") === webhookSecret;
}

async function handleCreateSubscription(req, res, supabase) {
  if (!isPaymentsEnabled()) {
    return json(res, 503, { error: "Payments are temporarily disabled" });
  }
  const { user, error } = await getAuthedUser(req, supabase);
  if (error || !user) return json(res, 401, { error: "Unauthorized" });

  const rawBody = await readBody(req);
  const body = rawBody ? JSON.parse(rawBody) : {};
  const plan = resolvePlan(body.planCode);
  if (!plan) return json(res, 400, { error: "Unknown planCode" });

  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;
  const fallbackReturn = process.env.YOOKASSA_RETURN_URL;
  if (!shopId || !secretKey) return json(res, 500, { error: "YooKassa credentials are missing" });

  const returnUrl = String(body.returnUrl || fallbackReturn || "").trim();
  if (!returnUrl) return json(res, 500, { error: "Missing return URL configuration" });

  const paymentPayload = {
    amount: { value: Number(plan.amount).toFixed(2), currency: plan.currency },
    capture: true,
    save_payment_method: true,
    confirmation: { type: "redirect", return_url: returnUrl },
    description: `${plan.title} subscription`,
    metadata: {
      user_id: user.id,
      plan_code: plan.code,
      period_months: String(plan.periodMonths),
    },
  };

  const { data: payment, idempotenceKey } = await createYooKassaPayment({ shopId, secretKey, payload: paymentPayload });

  const { data: subRows, error: subError } = await supabase
    .from("subscriptions")
    .insert({
      user_id: user.id,
      plan_code: plan.code,
      provider: "yookassa",
      provider_subscription_id: payment.id,
      status: payment.status || "pending",
      metadata: { confirmation_type: payment.confirmation?.type || "", first_payment_id: payment.id },
    })
    .select("id")
    .limit(1);
  if (subError) throw subError;

  const subscriptionId = Array.isArray(subRows) ? subRows[0]?.id : subRows?.id;
  const { error: txError } = await supabase.from("payment_transactions").insert({
    subscription_id: subscriptionId || null,
    user_id: user.id,
    plan_code: plan.code,
    provider: "yookassa",
    provider_payment_id: payment.id,
    idempotence_key: idempotenceKey,
    amount: Number(plan.amount).toFixed(2),
    currency: plan.currency,
    status: payment.status || "pending",
    payment_type: "subscription_initial",
    raw_payload: payment,
    paid_at: payment.paid ? new Date().toISOString() : null,
  });
  if (txError) throw txError;

  return json(res, 200, {
    checkoutUrl: payment.confirmation?.confirmation_url || "",
    paymentId: payment.id,
    subscriptionId: subscriptionId || null,
    status: payment.status || "pending",
  });
}

async function handleWebhook(req, res, supabase) {
  if (!isPaymentsEnabled()) {
    return json(res, 200, { ok: true, ignored: true, reason: "payments_disabled" });
  }
  const rawBody = await readBody(req);
  if (!verifyWebhookSignature(req, rawBody)) return json(res, 401, { error: "Invalid webhook signature" });
  const payload = rawBody ? JSON.parse(rawBody) : {};

  const eventType = String(payload.event || "");
  const payment = payload.object || {};
  const paymentId = String(payment.id || "");
  const metadata = payment.metadata || {};
  const userId = String(metadata.user_id || "");
  const planCode = String(metadata.plan_code || "");
  if (!eventType || !paymentId || !userId || !planCode) {
    return json(res, 400, { error: "Webhook payload missing required fields" });
  }

  const eventId = `${eventType}:${paymentId}`;
  const { error: eventError } = await supabase.from("webhook_events").upsert(
    {
      provider: "yookassa",
      event_id: eventId,
      event_type: eventType,
      signature: String(req.headers["x-yookassa-signature"] || req.headers.authorization || ""),
      payload,
      processed_at: new Date().toISOString(),
    },
    { onConflict: "provider,event_id" },
  );
  if (eventError) throw eventError;

  const plan = resolvePlan(planCode);
  const periodMonths = Number(plan?.periodMonths || metadata.period_months || 1);
  const mappedStatus = mapSubscriptionStatus(eventType, payment.status);
  const now = new Date();
  const periodEnd = addMonths(now, periodMonths);

  const { data: subRows, error: subError } = await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        plan_code: planCode,
        provider: "yookassa",
        provider_subscription_id: payment.payment_method?.id || paymentId,
        status: mappedStatus,
        current_period_start: mappedStatus === "active" ? now.toISOString() : null,
        current_period_end: mappedStatus === "active" ? periodEnd.toISOString() : null,
        cancel_at_period_end: false,
        canceled_at: mappedStatus === "canceled" ? now.toISOString() : null,
        metadata: { payment_id: paymentId, event_type: eventType },
      },
      { onConflict: "user_id,plan_code,provider" },
    )
    .select("id")
    .limit(1);
  if (subError) throw subError;
  const subscriptionId = Array.isArray(subRows) ? subRows[0]?.id : subRows?.id;

  const { error: txUpdateError } = await supabase
    .from("payment_transactions")
    .update({
      status: payment.status || mappedStatus,
      paid_at: payment.paid ? new Date().toISOString() : null,
      raw_payload: payload,
      subscription_id: subscriptionId || null,
    })
    .eq("provider_payment_id", paymentId);
  if (txUpdateError) throw txUpdateError;

  const { error: userUpdateError } = await supabase
    .from("users")
    .update({
      subscription_status: mappedStatus,
      subscription_plan: planCode,
      subscription_current_period_end: mappedStatus === "active" ? periodEnd.toISOString() : null,
      subscription_cancel_at_period_end: false,
    })
    .eq("id", userId);
  if (userUpdateError) throw userUpdateError;

  return json(res, 200, { ok: true, event: eventId, status: mappedStatus });
}

async function handleStatus(req, res, supabase, requestUrl) {
  const { user, error } = await getAuthedUser(req, supabase);
  if (error || !user) return json(res, 401, { error: "Unauthorized" });

  const planCode = String(requestUrl.searchParams.get("planCode") || "").trim();
  let query = supabase
    .from("subscriptions")
    .select("id, plan_code, status, current_period_start, current_period_end, cancel_at_period_end, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1);
  if (planCode) query = query.eq("plan_code", planCode);

  const { data, error: readError } = await query;
  if (readError) throw readError;
  const subscription = Array.isArray(data) ? (data[0] ?? null) : data;
  const active =
    Boolean(subscription?.status === "active") &&
    (!subscription?.current_period_end || new Date(subscription.current_period_end).getTime() > Date.now());
  return json(res, 200, { subscription, active });
}

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    if (requestUrl.pathname === "/healthz") return json(res, 200, { ok: true });

    const supabase = getSupabaseAdmin();
    if (requestUrl.pathname === "/api/payments/yookassa/create-subscription" && req.method === "POST") {
      return await handleCreateSubscription(req, res, supabase);
    }
    if (requestUrl.pathname === "/api/payments/yookassa/webhook" && req.method === "POST") {
      return await handleWebhook(req, res, supabase);
    }
    if (requestUrl.pathname === "/api/payments/yookassa/subscription-status" && req.method === "GET") {
      return await handleStatus(req, res, supabase, requestUrl);
    }
    return json(res, 404, { error: "Not found" });
  } catch (error) {
    return json(res, 500, { error: error.message || "Server error" });
  }
});

server.listen(PORT, () => {
  console.log(`payments-api listening on :${PORT}`);
});
