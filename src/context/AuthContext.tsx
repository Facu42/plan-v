import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getProfile, supabase, supabaseConfigured, type Profile } from '../lib/supabase';
import { isLocalDemoAllowed, PUBLIC_SIGNUP_ROLE } from './auth-policy';
import { pendingInviteIdFromLocation, rememberPendingInvite, PENDING_INVITE_STORAGE_KEY } from './invite-link';
import { useAppStore } from '../store/useAppStore';

type AuthState = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isNutri: boolean;
  isPatient: boolean;
  demoMode: boolean;
  demoAllowed: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  enterDemoMode: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

function frontAuthEnv() {
  return {
    DEV: import.meta.env.DEV,
    VITE_ALLOW_DEMO: import.meta.env.VITE_ALLOW_DEMO,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const demoAllowed = isLocalDemoAllowed(frontAuthEnv());
  const [loading, setLoading] = useState(supabaseConfigured);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const inviteId = pendingInviteIdFromLocation(
      window.location.search,
      window.sessionStorage.getItem(PENDING_INVITE_STORAGE_KEY),
    );
    if (inviteId) rememberPendingInvite(inviteId, window.sessionStorage);
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 2500);

    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      if (data.session?.user) {
        setProfile(await getProfile(data.session.user.id));
      }
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    }).finally(() => window.clearTimeout(timeout));

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, next) => {
      setSession(next);
      if (next?.user) {
        setProfile(await getProfile(next.user.id));
        setDemoMode(false);
      } else {
        setProfile(null);
      }
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthState>(() => ({
    loading,
    session,
    user: session?.user ?? null,
    profile,
    isNutri: profile?.role === 'nutri',
    isPatient: profile?.role === 'paciente',
    demoMode,
    demoAllowed,
    signIn: async (email, password) => {
      if (!supabase) return { error: 'Supabase no configurado' };
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      setDemoMode(false);
      return {};
    },
    signUp: async (email, password, fullName) => {
      if (!supabase) return { error: 'Supabase no configurado' };
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role: PUBLIC_SIGNUP_ROLE } },
      });
      if (error) return { error: error.message };
      return {};
    },
    requestPasswordReset: async (email) => {
      if (!supabase) return { error: 'Supabase no configurado' };
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window === 'undefined' ? undefined : window.location.origin,
      });
      if (error) return { error: error.message };
      return {};
    },
    signOut: async () => {
      useAppStore.getState().reset();
      setSession(null);
      setProfile(null);
      setDemoMode(false);
      if (supabase) await supabase.auth.signOut();
    },
    enterDemoMode: () => {
      if (!demoAllowed) return;
      if (supabase) supabase.auth.signOut().catch(() => {});
      setSession(null);
      setProfile(null);
      setDemoMode(true);
    },
  }), [loading, session, profile, demoMode, demoAllowed]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
