import { resolvePlan } from "../../_lib/subscriptionPlans.js";
import { getSupabaseAdmin } from "../../_lib/supabaseAdmin.js";
import { getYooKassaConfig, parseJsonBody, verifyWebhookSignature } from "../../_lib/yookassa.js";
import { isPaymentsEnabled } from "../../_lib/paymentsEnabled.js";

function json(res, status, payload) {
  res.status(status).json(payload);
}

function addMonths(date, months) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function mapPaymentStatus(eventType, paymentStatus) {
  if (eventType === "payment.succeeded" || paymentStatus === "succeeded") return "active";
  if (eventType === "payment.canceled" || paymentStatus === "canceled") return "canceled";
  return "pending";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" });
  }

  try {
    if (!isPaymentsEnabled()) {
      return json(res, 200, { ok: true, ignored: true, reason: "payments_disabled" });
    }
    const { shopId, secretKey, webhookSecret } = getYooKassaConfig();
    const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
    const signatureOk = verifyWebhookSignature({ req, rawBody, shopId, secretKey, webhookSecret });
    if (!signatureOk) return json(res, 401, { error: "Invalid webhook signature" });

    const payload = parseJsonBody(req);
    const eventType = String(payload.event || "");
    const paymentObject = payload.object || {};
    const paymentId = String(paymentObject.id || "");
    const metadata = paymentObject.metadata || {};
    const userId = String(metadata.user_id || "");
    const planCode = String(metadata.plan_code || "");
    const eventId = `${eventType}:${paymentId}`;

    if (!eventType || !paymentId || !userId || !planCode) {
      return json(res, 400, { error: "Webhook payload missing required fields" });
    }

    const supabase = getSupabaseAdmin();
    const { data: webhookRows, error: webhookError } = await supabase
      .from("webhook_events")
      .upsert(
        {
          provider: "yookassa",
          event_id: eventId,
          event_type: eventType,
          signature: String(req.headers["x-yookassa-signature"] || req.headers.authorization || ""),
          payload,
          processed_at: new Date().toISOString(),
        },
        { onConflict: "provider,event_id" },
      )
      .select("id, event_id")
      .limit(1);
    if (webhookError) throw webhookError;

    const plan = resolvePlan(planCode);
    const periodMonths = Number(plan?.periodMonths || metadata.period_months || 1);
    const nextStatus = mapPaymentStatus(eventType, paymentObject.status);

    const now = new Date();
    const periodEnd = addMonths(now, periodMonths);

    const { data: subRows, error: subError } = await supabase
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          plan_code: planCode,
          provider: "yookassa",
          provider_subscription_id: paymentObject.payment_method?.id || paymentId,
          status: nextStatus,
          current_period_start: nextStatus === "active" ? now.toISOString() : null,
          current_period_end: nextStatus === "active" ? periodEnd.toISOString() : null,
          cancel_at_period_end: false,
          canceled_at: nextStatus === "canceled" ? now.toISOString() : null,
          metadata: {
            payment_id: paymentId,
            event_type: eventType,
          },
        },
        { onConflict: "user_id,plan_code,provider" },
      )
      .select("id")
      .limit(1);
    if (subError) throw subError;
    const subscriptionId = Array.isArray(subRows) ? subRows[0]?.id : subRows?.id;

    const { error: transactionError } = await supabase
      .from("payment_transactions")
      .update({
        status: paymentObject.status || nextStatus,
        paid_at: paymentObject.paid ? new Date().toISOString() : null,
        raw_payload: payload,
        subscription_id: subscriptionId || null,
      })
      .eq("provider_payment_id", paymentId);
    if (transactionError) throw transactionError;

    const { error: profileError } = await supabase
      .from("users")
      .update({
        subscription_status: nextStatus,
        subscription_plan: planCode,
        subscription_current_period_end: nextStatus === "active" ? periodEnd.toISOString() : null,
        subscription_cancel_at_period_end: false,
      })
      .eq("id", userId);
    if (profileError) throw profileError;

    return json(res, 200, {
      ok: true,
      event: webhookRows?.[0]?.event_id || eventId,
      status: nextStatus,
    });
  } catch (error) {
    return json(res, Number(error.status || 500), { error: error.message || "Webhook failed" });
  }
}
