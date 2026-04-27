import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { isSupabaseEnabled, supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId) => {
    if (!userId || !isSupabaseEnabled) {
      setProfile(null);
      return;
    }
    const { data, error } = await supabase
      .from("users")
      .select("id, username, email, level, exp, role, status, created_at")
      .eq("id", userId)
      .single();

    if (error) {
      setProfile(null);
      return;
    }
    setProfile(data);
  };

  useEffect(() => {
    const initialize = async () => {
      const {
        data: { session: currentSession }
      } = await supabase.auth.getSession();

      setSession(currentSession);
      await fetchProfile(currentSession?.user?.id);
      setLoading(false);
    };

    initialize();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user?.id) {
        fetchProfile(nextSession.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      isSupabaseEnabled,
      setProfile
    }),
    [session, profile, loading]
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
