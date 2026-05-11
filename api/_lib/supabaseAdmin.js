import { createClient } from "@supabase/supabase-js";

let adminClient = null;

export function getSupabaseAdmin() {
  if (adminClient) return adminClient;
  const url = process.env.SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  adminClient = createClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return adminClient;
}

export async function getUserFromBearer(req) {
  const authHeader = String(req.headers.authorization || "");
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return { user: null, error: new Error("Missing bearer token") };

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return { user: null, error: error || new Error("User not found") };
  return { user: data.user, error: null };
}
