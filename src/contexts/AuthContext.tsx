import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import { useVolunteerPing } from "@/hooks/useVolunteerPing";

type Role = "user" | "volunteer" | "ngo_supervisor";

interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  ngo_name: string | null;
  skills: string[] | null;
  is_verified: boolean | null;
  rating: number | null;
  avatar_url: string | null;
  tasks_completed: number | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: Role | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = async (userId: string) => {
    const [{ data: prof }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, phone, city, ngo_name, skills, is_verified, rating, avatar_url").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId).limit(1),
    ]);
    setProfile(prof as Profile | null);
    setRole((roles?.[0]?.role as Role) ?? "user");
  };

  useEffect(() => {
    let mounted = true;

    const initializeSession = async (sess: Session | null) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (!sess?.user) {
        setProfile(null);
        setRole(null);
        if (mounted) setLoading(false);
        return;
      }

      try {
        await loadUserData(sess.user.id);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        loadUserData(sess.user.id).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setProfile(null);
        setRole(null);
        if (mounted) setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      initializeSession(sess);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRole(null);
  };

  const refreshProfile = async () => {
    if (user) await loadUserData(user.id);
  };

  // Background GPS ping for active volunteers (every 30s while tab is open).
  useVolunteerPing(user?.id ?? null, role);

  return (
    <AuthContext.Provider value={{ user, session, profile, role, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
