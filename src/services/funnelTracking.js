import { supabase } from "../lib/supabase";

export async function trackFunnelStep(stepName, payload = {}) {
  try {
    const {
      data: { session }
    } = await supabase.auth.getSession();
    const userId = session?.user?.id ?? null;
    await supabase.from("funnel_events").insert({
      user_id: userId,
      step_name: stepName,
      source: "web",
      payload
    });
  } catch {
    // silently ignore tracking errors for UX stability
  }
}
