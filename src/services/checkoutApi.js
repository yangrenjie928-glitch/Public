import { supabase } from "../lib/supabase";
import { PAYMENTS_ENABLED } from "../config/payments";

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || "Request failed");
  }
  return payload;
}

export async function createSubscriptionCheckout({ planCode, returnUrl }) {
  if (!PAYMENTS_ENABLED) {
    throw new Error("Онлайн-оплата временно отключена.");
  }
  const headers = await authHeaders();
  const response = await fetch("/api/payments/yookassa/create-subscription", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({ planCode, returnUrl }),
  });
  return parseResponse(response);
}

export async function fetchMySubscriptionStatus(planCode) {
  const headers = await authHeaders();
  const query = planCode ? `?planCode=${encodeURIComponent(planCode)}` : "";
  const response = await fetch(`/api/payments/yookassa/subscription-status${query}`, {
    headers,
  });
  return parseResponse(response);
}
