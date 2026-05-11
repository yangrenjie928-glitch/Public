/** Server: only when PAYMENTS_ENABLED=true (env) may create payments / process webhooks. */
export function isPaymentsEnabled() {
  return String(process.env.PAYMENTS_ENABLED || "").toLowerCase() === "true";
}
