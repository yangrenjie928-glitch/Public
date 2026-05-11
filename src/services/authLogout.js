import { clearMockAuth } from "./mockAuth";
import { supabase } from "../lib/supabase";

export async function authLogout() {
  clearMockAuth();
  await supabase.auth.signOut();
}
