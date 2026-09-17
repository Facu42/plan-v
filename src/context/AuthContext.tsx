import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getProfile, supabase, supabaseConfigured, type Profile } from '../lib/supabase';

type AuthState = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isNutri: boolean;
  isPatient: boolean;
  demoMode: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, fullName: string, role: 'nutri' | 'paciente') => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  enterDemoMode: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

function wantsLocalDemo() {
  if (!import.meta.env.DEV || typeof window === 'undefined') return !supabaseConfigured;
  return new URLSearchParams(window.location.search).get('auth') !== '1';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const localDemo = wantsLocalDemo();
  const [loading, setLoading] = useState(supabaseConfigured && !localDemo);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [demoMode, setDemoMode] = useState(localDemo || !supabaseConfigured);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setDemoMode(true);
      return;
    }

    if (localDemo) {
      supabase.auth.signOut().catch(() => {});
      setSession(null);
      setProfile(null);
      setDemoMode(true);
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
  }, [localDemo]);

  const value = useMemo<AuthState>(() => ({
    loading,
    session,
    user: session?.user ?? null,
    profile,
    isNutri: profile?.role === 'nutri',
    isPatient: profile?.role === 'paciente',
    demoMode,
    signIn: async (email, password) => {
      if (!supabase) return { error: 'Supabase no configurado' };
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      setDemoMode(false);
      return {};
    },
    signUp: async (email, password, fullName, role) => {
      if (!supabase) return { error: 'Supabase no configurado' };
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role } },
      });
      if (error) return { error: error.message };
      return {};
    },
    signOut: async () => {
      if (supabase) await supabase.auth.signOut();
      setDemoMode(false);
    },
    enterDemoMode: () => {
      if (supabase) supabase.auth.signOut().catch(() => {});
      setSession(null);
      setProfile(null);
      setDemoMode(true);
    },
  }), [loading, session, profile, demoMode]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
