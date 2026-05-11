export function hasActiveSubscription(profile) {
  if (!profile || profile.subscription_status !== "active") return false;
  const periodEnd = profile.subscription_current_period_end;
  if (!periodEnd) return true;
  const endMs = new Date(periodEnd).getTime();
  return Number.isFinite(endMs) && endMs > Date.now();
}
