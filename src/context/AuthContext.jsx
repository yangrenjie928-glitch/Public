import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { isSupabaseEnabled, supabase } from "../lib/supabase";
import { readMockAuth } from "../services/mockAuth";

const AuthContext = createContext(null);
const PROFILE_SELECT =
  "id, username, email, level, exp, role, status, login_days, last_login_date, created_at, subscription_status, subscription_plan, subscription_current_period_end, subscription_cancel_at_period_end";

function applyMockSession(setSession, setProfile) {
  const mock = readMockAuth();
  if (mock?.user && mock?.profile) {
    setSession({ access_token: "mock", user: mock.user });
    setProfile(mock.profile);
  } else {
    setSession(null);
    setProfile(null);
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const ensureProfile = useCallback(async (authUser) => {
    if (!authUser?.id) {
      setProfile(null);
      return;
    }
    if (authUser.app_metadata?.provider === "mock") {
      const mock = readMockAuth();
      setProfile(mock?.profile ?? null);
      return;
    }
    if (!isSupabaseEnabled) {
      setProfile(null);
      return;
    }

    const { data, error } = await supabase
      .from("users")
      .select(PROFILE_SELECT)
      .eq("id", authUser.id)
      .limit(1);

    if (error) {
      setProfile(null);
      return;
    }

    const existingProfile = Array.isArray(data) ? (data[0] ?? null) : data;
    if (existingProfile) {
      setProfile(existingProfile);
      return;
    }

    const normalizedEmail = String(authUser.email || "").trim().toLowerCase();
    const metadataUsername =
      typeof authUser.user_metadata?.username === "string" ? authUser.user_metadata.username.trim() : "";
    const fallbackUsername = normalizedEmail.split("@")[0] || "user";
    const username = metadataUsername || fallbackUsername;

    const { data: insertedProfile, error: insertError } = await supabase
      .from("users")
      .upsert(
        {
          id: authUser.id,
          username,
          email: normalizedEmail,
        },
        { onConflict: "id" },
      )
      .select(PROFILE_SELECT)
      .limit(1);

    if (insertError) {
      setProfile(null);
      return;
    }
    const nextProfile = Array.isArray(insertedProfile) ? (insertedProfile[0] ?? null) : insertedProfile;
    if (!nextProfile) {
      setProfile(null);
      return;
    }
    setProfile(nextProfile);
  }, []);

  useEffect(() => {
    let alive = true;

    const hydrateFromSupabase = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      if (!alive) return;

      if (currentSession?.user) {
        setSession(currentSession);
        await ensureProfile(currentSession.user);
        return;
      }

      applyMockSession(setSession, setProfile);
    };

    void hydrateFromSupabase().finally(() => {
      if (alive) setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (nextSession?.user) {
        setSession(nextSession);
        await ensureProfile(nextSession.user);
      } else {
        applyMockSession(setSession, setProfile);
      }
      if (alive) setLoading(false);
    });

    const onMockEv = () => {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user) return;
        applyMockSession(setSession, setProfile);
      });
    };
    window.addEventListener("china-cloud-mock-auth-change", onMockEv);

    return () => {
      alive = false;
      subscription.unsubscribe();
      window.removeEventListener("china-cloud-mock-auth-change", onMockEv);
    };
  }, [ensureProfile]);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      isSupabaseEnabled,
      isMockAuth: session?.access_token === "mock",
      setProfile,
    }),
    [session, profile, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
