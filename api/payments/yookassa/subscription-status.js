import { getSupabaseAdmin, getUserFromBearer } from "../../_lib/supabaseAdmin.js";

function json(res, status, payload) {
  res.status(status).json(payload);
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return json(res, 405, { error: "Method not allowed" });
  }

  try {
    const { user, error: userError } = await getUserFromBearer(req);
    if (userError || !user) return json(res, 401, { error: "Unauthorized" });

    const planCode = String(req.query.planCode || "").trim();
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("subscriptions")
      .select("id, plan_code, status, current_period_start, current_period_end, cancel_at_period_end, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (planCode) {
      query = query.eq("plan_code", planCode);
    }

    const { data, error } = await query;
    if (error) throw error;

    const subscription = Array.isArray(data) ? (data[0] ?? null) : data;
    const active =
      Boolean(subscription?.status === "active") &&
      (!subscription?.current_period_end || new Date(subscription.current_period_end).getTime() > Date.now());

    return json(res, 200, { subscription, active });
  } catch (error) {
    return json(res, Number(error.status || 500), { error: error.message || "Status read failed" });
  }
}
