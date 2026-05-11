import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const hasPlaceholderConfig =
  !supabaseUrl ||
  !supabaseAnonKey ||
  supabaseUrl.includes("your-project-ref.supabase.co") ||
  supabaseAnonKey.includes("your_supabase_anon_key");

export const isSupabaseEnabled = !hasPlaceholderConfig;

const missingConfigError = new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local.");

const missingConfigResult = async () => ({
  data: null,
  error: missingConfigError
});

const missingConfigQuery = {
  eq: () => ({
    single: missingConfigResult
  }),
  upsert: () => ({
    select: () => ({
      single: missingConfigResult
    })
  }),
  update: () => ({
    eq: () => ({
      select: () => ({
        single: missingConfigResult
      })
    })
  }),
  select: () => ({
    single: missingConfigResult
  }),
  insert: () => ({
    select: () => ({
      single: missingConfigResult
    })
  }),
  delete: () => ({
    eq: missingConfigResult
  })
};

export const supabase = isSupabaseEnabled
  ? createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    )
  : {
      auth: {
        getSession: async () => ({ data: { session: null }, error: missingConfigError }),
        onAuthStateChange: () => ({
          data: {
            subscription: {
              unsubscribe: () => {}
            }
          }
        }),
        signInWithPassword: missingConfigResult,
        signInWithOAuth: missingConfigResult,
        signInWithOtp: missingConfigResult,
        verifyOtp: missingConfigResult,
        resetPasswordForEmail: missingConfigResult,
        signUp: missingConfigResult,
        signOut: async () => ({ error: null })
      },
      from: () => missingConfigQuery
    };
