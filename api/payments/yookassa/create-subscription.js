import crypto from "node:crypto";
import { resolvePlan } from "../../_lib/subscriptionPlans.js";
import { getSupabaseAdmin, getUserFromBearer } from "../../_lib/supabaseAdmin.js";
import { createYooKassaPayment, getYooKassaConfig, parseJsonBody } from "../../_lib/yookassa.js";
import { isPaymentsEnabled } from "../../_lib/paymentsEnabled.js";

function json(res, status, payload) {
  res.status(status).json(payload);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" });
  }

  try {
    if (!isPaymentsEnabled()) {
      return json(res, 503, { error: "Payments are temporarily disabled" });
    }
    const { user, error: userError } = await getUserFromBearer(req);
    if (userError || !user) return json(res, 401, { error: "Unauthorized" });

    const body = parseJsonBody(req);
    const plan = resolvePlan(body.planCode);
    if (!plan) return json(res, 400, { error: "Unknown planCode" });

    const { shopId, secretKey, returnUrl } = getYooKassaConfig();
    const supabase = getSupabaseAdmin();
    const idempotenceKey = crypto.randomUUID();

    const paymentPayload = {
      amount: {
        value: Number(plan.amount).toFixed(2),
        currency: plan.currency,
      },
      capture: true,
      save_payment_method: true,
      confirmation: {
        type: "redirect",
        return_url: String(body.returnUrl || returnUrl || ""),
      },
      description: `${plan.title} subscription`,
      metadata: {
        user_id: user.id,
        plan_code: plan.code,
        period_months: String(plan.periodMonths),
      },
    };

    if (!paymentPayload.confirmation.return_url) {
      return json(res, 500, { error: "Missing return URL configuration" });
    }

    const payment = await createYooKassaPayment({
      shopId,
      secretKey,
      idempotenceKey,
      payload: paymentPayload,
    });

    const nowIso = new Date().toISOString();
    const { data: subscriptionRows, error: subscriptionError } = await supabase
      .from("subscriptions")
      .insert({
        user_id: user.id,
        plan_code: plan.code,
        provider: "yookassa",
        provider_subscription_id: payment.id,
        status: payment.status || "pending",
        metadata: {
          confirmation_type: payment.confirmation?.type || "",
          first_payment_id: payment.id,
        },
      })
      .select("id")
      .limit(1);
    if (subscriptionError) throw subscriptionError;

    const subscriptionId = Array.isArray(subscriptionRows) ? subscriptionRows[0]?.id : subscriptionRows?.id;
    const { error: transactionError } = await supabase.from("payment_transactions").insert({
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
      paid_at: payment.paid ? nowIso : null,
    });
    if (transactionError) throw transactionError;

    return json(res, 200, {
      checkoutUrl: payment.confirmation?.confirmation_url || "",
      paymentId: payment.id,
      subscriptionId: subscriptionId || null,
      status: payment.status || "pending",
    });
  } catch (error) {
    return json(res, Number(error.status || 500), {
      error: error.message || "Subscription create failed",
      details: error.details || null,
    });
  }
}
