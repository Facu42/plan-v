import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { legalAcceptance } from '../legal';
import { googleSignupMetadata, PENDING_GOOGLE_SIGNUP_KEY, rememberGoogleSignup, takeGoogleSignup } from './google-signup';
import type { Session, User } from '@supabase/supabase-js';
import { getProfile, googleSignInEnabled, supabase, supabaseConfigured, type Profile } from '../lib/supabase';
import { api } from '../api/client';
import { isLocalDemoAllowed, professionalDisplayName, PROFESSIONAL_SIGNUP_FLAG, PUBLIC_SIGNUP_ROLE, wantsProfessionalSignup } from './auth-policy';
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
  signUp: (email: string, password: string, fullName: string, professional?: boolean) => Promise<{ error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ error?: string }>;
  googleAvailable: boolean;
  signInWithGoogle: (choice?: { professional?: boolean; acceptedLegal?: boolean }) => Promise<{ error?: string }>;
  acceptLegal: () => Promise<{ error?: string }>;
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

function browserStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

// Al volver de Google: pasa a la cuenta lo elegido antes de salir (nutricionista, términos).
async function applyPendingGoogleSignup(user: User): Promise<User> {
  const store = browserStorage();
  if (!supabase || !store) return user;
  const pending = takeGoogleSignup(store);
  if (!pending) return user;
  const data = googleSignupMetadata(pending, user);
  if (!data) return user;
  const { data: updated, error } = await supabase.auth.updateUser({ data });
  return error || !updated.user ? user : updated.user;
}

// getSession y el aviso de ingreso llegan casi juntos: una sola carga por usuaria.
let inflightProfile: { userId: string; promise: Promise<Profile | null> } | null = null;

function loadProfile(user: User): Promise<Profile | null> {
  if (inflightProfile?.userId === user.id) return inflightProfile.promise;
  const promise = loadProfileOnce(user).finally(() => {
    if (inflightProfile?.promise === promise) inflightProfile = null;
  });
  inflightProfile = { userId: user.id, promise };
  return promise;
}

async function loadProfileOnce(initialUser: User): Promise<Profile | null> {
  const user = await applyPendingGoogleSignup(initialUser);
  const profile = await getProfile(user.id);
  if (!supabase || profile?.role !== 'paciente' || !wantsProfessionalSignup(user.user_metadata)) return profile;
  try {
    await api.claimProfessional(professionalDisplayName(user.user_metadata, profile.full_name || user.email?.split('@')[0] || ''));
    void supabase.auth.updateUser({ data: { [PROFESSIONAL_SIGNUP_FLAG]: false } }).catch(() => {});
    return await getProfile(user.id);
  } catch {
    // Si el servidor no lo permite (cuenta ya vinculada como paciente), sigue como paciente.
    return profile;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const demoAllowed = isLocalDemoAllowed(frontAuthEnv());
  const [loading, setLoading] = useState(supabaseConfigured);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [googleAvailable, setGoogleAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    googleSignInEnabled().then((enabled) => { if (!cancelled) setGoogleAvailable(enabled); });
    return () => { cancelled = true; };
  }, []);

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
        setProfile(await loadProfile(data.session.user));
      }
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    }).finally(() => window.clearTimeout(timeout));

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, next) => {
      setSession(next);
      if (next?.user) {
        setProfile(await loadProfile(next.user));
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
    signUp: async (email, password, fullName, professional = false) => {
      if (!supabase) return { error: 'Supabase no configurado' };
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role: PUBLIC_SIGNUP_ROLE, ...legalAcceptance(), ...(professional ? { [PROFESSIONAL_SIGNUP_FLAG]: true } : {}) } },
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
    googleAvailable,
    signInWithGoogle: async ({ professional = false, acceptedLegal = false } = {}) => {
      if (!supabase) return { error: 'Supabase no configurado' };
      const store = browserStorage();
      if (store) rememberGoogleSignup(store, { professional, acceptedLegal });
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window === 'undefined' ? undefined : window.location.origin,
          queryParams: { prompt: 'select_account' },
        },
      });
      if (error) {
        store?.removeItem(PENDING_GOOGLE_SIGNUP_KEY);
        return { error: 'No se pudo entrar con Google. Probá de nuevo o entrá con tu email.' };
      }
      return {};
    },
    acceptLegal: async () => {
      if (!supabase) return { error: 'Supabase no configurado' };
      const { data, error } = await supabase.auth.updateUser({ data: legalAcceptance() });
      if (error) return { error: 'No se pudo guardar. Probá de nuevo.' };
      if (data.user) setSession((current) => (current ? { ...current, user: data.user } : current));
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
  }), [loading, session, profile, demoMode, demoAllowed, googleAvailable]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
