import '@fontsource/poppins/latin-400.css';
import '@fontsource/poppins/latin-500.css';
import '@fontsource/poppins/latin-600.css';
import '@fontsource/poppins/latin-700.css';
import { friendlyError } from '../lib/error-messages';
import { lazy, Suspense, useEffect, useState } from 'react';

const PatientApp = lazy(() => import('./patient/PatientApp').then(({ PatientApp }) => ({ default: PatientApp })));
const CrmDashboard = lazy(() => import('./crm/CrmDashboard').then(({ CrmDashboard }) => ({ default: CrmDashboard })));
import { AuthEntry } from './auth/WelcomeScreen';
import { PasswordResetScreen } from './auth/PasswordResetScreen';
import { ConsentScreen } from './auth/ConsentScreen';
import { MfaScreen } from './auth/MfaScreen';
import { useMfaGate } from '../context/useMfaGate';
import { mfaEnforcedForPath } from '../context/mfa';
import { EntryStatus } from './auth/entry-shell';
import { hasCurrentLegalAcceptance } from '../legal';
import { useAuth } from '../context/AuthContext';
import { forgetPendingInvite, pendingInviteIdFromLocation, PENDING_INVITE_STORAGE_KEY } from '../context/invite-link';
import { useAppStore } from '../store/useAppStore';
import { api } from '../api/client';
import { readThemePreference, writeThemePreference, type ThemePreference } from '../theme-preference';
import { Mark } from './shared/Icon';
import { canUseDemoRoleSwitch, shouldShowNutrigo } from './design-entry';
import { PwaChrome } from '../pwa/PwaChrome';
import { LoadingScreen } from './shared/AppStatus';
import { isAdminPath } from './nutrigo/app-location';
import { isPublicSlug, publicSlugFromPath } from '../types/public-slug';

const AdminCrm = lazy(() => import('./nutrigo/admin-crm/AdminCrm').then(({ AdminCrm }) => ({ default: AdminCrm })));
const NutrigoShowroom = lazy(() => import('./nutrigo/NutrigoShowroom').then(({ NutrigoShowroom }) => ({ default: NutrigoShowroom })));
const StandaloneWorkspace = lazy(() => import('./nutrigo/StandaloneWorkspace').then(({ StandaloneWorkspace }) => ({ default: StandaloneWorkspace })));
const SubscriptionPreview = import.meta.env.DEV
  ? lazy(() => import('./nutrigo/SubscriptionPreview').then(module => ({ default: module.SubscriptionPreview })))
  : null;

export function PlanVExperience() {
  const path=typeof window==='undefined'?'':window.location.pathname;
  const subscriptionReturn=/^\/consultorio\/([a-z0-9][a-z0-9-]{2,59})\/suscripcion\/([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\/?$/i.exec(path);
  const publicSlug=subscriptionReturn?.[1]??publicSlugFromPath(path);
  const teamPath=/^\/equipo\/?$/.test(path);
  const { session, demoMode, passwordRecovery, isNutri, isPatient, profile, signOut, loading: authLoading } = useAuth();
  const [view, setView] = useState<'patient' | 'pro'>('patient');
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'accepting' | 'unconfirmed' | 'unavailable' | 'linked'>('idle');
  const [theme, setTheme] = useState<ThemePreference>(() => readThemePreference(
    typeof window === 'undefined' ? null : window.localStorage,
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
  ));
  const { boot, reset, loading, error, aiEnabled, supabaseEnabled, patients } = useAppStore();
  const darkMode = theme === 'dark';
  // Sin la aceptación vigente no se carga nada ni se acepta la invitación.
  const legalOk = !session || hasCurrentLegalAcceptance(session.user.user_metadata);
  const sessionUserId=session?.user.id??null;
  const mfa = useMfaGate(session, isNutri || isAdminPath(path), !authLoading && !passwordRecovery, mfaEnforcedForPath(path));
  const toggleTheme = () => setTheme((current) => current === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    writeThemePreference(typeof window === 'undefined' ? null : window.localStorage, theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  // La ruta corta es la dirección preferida; /consultorio/<slug> sigue funcionando como enlace histórico.
  useEffect(() => {
    if (!publicSlug || subscriptionReturn || typeof document === 'undefined') return;
    const link = document.createElement('link');
    link.rel = 'canonical';
    link.href = new URL(isPublicSlug(publicSlug) ? `/${encodeURIComponent(publicSlug)}` : `/consultorio/${encodeURIComponent(publicSlug)}`, window.location.origin).href;
    document.head.appendChild(link);
    return () => { link.remove(); };
  }, [publicSlug, subscriptionReturn?.[2]]);

  useEffect(() => {
    if(publicSlug||teamPath){reset();return;}
    if (authLoading || passwordRecovery) return;
    if (!session && !demoMode) {
      reset();
      return;
    }
    if (session && !isNutri && !isPatient) return;
    if (!legalOk || mfa.step) return;
    void boot({ isNutri, isPatient });
  }, [authLoading, session, demoMode, isNutri, isPatient, legalOk, mfa.step, boot, reset, passwordRecovery,publicSlug,teamPath]);

  useEffect(() => {
    setInviteStatus('idle');
    if (publicSlug||teamPath||!sessionUserId || !isPatient || !legalOk) return;
    const stored = typeof window === 'undefined' ? null : window.sessionStorage.getItem(PENDING_INVITE_STORAGE_KEY);
    const inviteId = pendingInviteIdFromLocation(typeof window === 'undefined' ? '' : window.location.search, stored);
    if (!inviteId) return;
    let cancelled = false;
    setInviteStatus('accepting');
    api.acceptInvite(inviteId).then(() => {
      if (cancelled) return;
      forgetPendingInvite(window.sessionStorage);
      const url = new URL(window.location.href);
      url.searchParams.delete('invite');
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
      setInviteStatus('linked');
      boot({ isPatient: true });
    }).catch((reason: unknown) => {
      if (cancelled) return;
      const message = reason instanceof Error ? reason.message : '';
      setInviteStatus(message.includes('Confirmá tu email') ? 'unconfirmed' : 'unavailable');
    });
    return () => { cancelled = true; };
  }, [sessionUserId, isPatient, legalOk, boot,publicSlug,teamPath]);

  useEffect(() => {
    if (isNutri) setView('pro');
    if (isPatient) setView('patient');
  }, [isNutri, isPatient]);

  useEffect(() => {
    if (session && isNutri && profile && legalOk) {
      api.setupNutritionist(profile.full_name || 'Profesional').catch(() => {});
    }
  }, [session, isNutri, profile, legalOk]);

  if (SubscriptionPreview && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('vista') === 'suscripciones') {
    return <Suspense fallback={<LoadingScreen/>}><SubscriptionPreview /></Suspense>;
  }
  if(publicSlug){return <Suspense fallback={<LoadingScreen/>}><PwaChrome install={false}/><StandaloneWorkspace slug={publicSlug} subscriptionId={subscriptionReturn?.[2]}/></Suspense>;}

  if (authLoading) {
    return (
      <div className={`plan-v-app${darkMode ? ' dark' : ''}`}>
        <PwaChrome install={false} />
        <EntryStatus title="Cargando…" />
      </div>
    );
  }

  if (passwordRecovery) {
    return <div className={`plan-v-app${darkMode ? ' dark' : ''}`}><PwaChrome install={false} /><PasswordResetScreen /></div>;
  }

  if (!session && !demoMode) {
    return <div className={`plan-v-app${darkMode ? ' dark' : ''}`}><PwaChrome install={false} /><AuthEntry darkMode={darkMode} onToggleTheme={toggleTheme} /></div>;
  }

  if (session && mfa.step === 'checking') {
    return <div className={`plan-v-app${darkMode ? ' dark' : ''}`}><PwaChrome install={false} /><EntryStatus title="Cargando…" /></div>;
  }

  if (session && (mfa.step === 'verify' || mfa.step === 'enroll')) {
    return <div className={`plan-v-app${darkMode ? ' dark' : ''}`}><PwaChrome install={false} /><MfaScreen mode={mfa.step} onDone={() => { void mfa.refresh(); }} /></div>;
  }

  if (session && !legalOk) {
    return <div className={`plan-v-app${darkMode ? ' dark' : ''}`}><PwaChrome install={false} /><ConsentScreen /></div>;
  }

  if(teamPath){return <Suspense fallback={<LoadingScreen/>}><PwaChrome install={false}/><StandaloneWorkspace darkMode={darkMode} onSignOut={()=>void signOut()}/></Suspense>;}

  // /admin: centro de mando con datos reales de solo lectura.
  if (session && isAdminPath(window.location.pathname)) {
    return (
      <Suspense fallback={<div className="plan-v-app loading-screen" role="status">Cargando…</div>}>
        <PwaChrome />
        <AdminCrm adminName={profile?.full_name || undefined} />
      </Suspense>
    );
  }

  if (session && !isNutri && !isPatient) {
    return (
      <div className={`plan-v-app${darkMode ? ' dark' : ''}`}>
        <PwaChrome install={false} />
        <EntryStatus
          title="Tu cuenta todavía no está vinculada"
          subtitle="Cuando aceptes la invitación de tu nutricionista vas a ver tu plan. No se listan pacientes de otras cuentas."
          action={{ label: 'Cerrar sesión', onClick: () => { void signOut(); } }}
        />
      </div>
    );
  }

  if (session && isPatient && (inviteStatus === 'accepting' || inviteStatus === 'unconfirmed' || (inviteStatus !== 'linked' && !loading && patients.length === 0 && !demoMode))) {
    const waiting = inviteStatus === 'unconfirmed'
      ? 'Confirmá tu email para aceptar la invitación. Después volvé a entrar.'
      : inviteStatus === 'unavailable'
        ? 'Esta invitación no está disponible. Pedile a tu nutricionista una nueva.'
        : inviteStatus === 'accepting'
          ? 'Estamos vinculando tu cuenta con el consultorio…'
          : 'Todavía no hay una ficha vinculada a esta cuenta. Abrí el enlace de invitación o esperá a que tu nutricionista te invite.';
    return (
      <div className={`plan-v-app${darkMode ? ' dark' : ''}`}>
        <PwaChrome install={false} />
        <EntryStatus title="Tu cuenta todavía no está vinculada" subtitle={waiting} action={{ label: 'Cerrar sesión', onClick: () => { void signOut(); } }} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`plan-v-app${darkMode ? ' dark' : ''}`}>
        <PwaChrome install={false} />
        <EntryStatus title="Cargando datos…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`plan-v-app${darkMode ? ' dark' : ''}`}>
        <PwaChrome install={false} />
        <EntryStatus
          title="No pudimos conectar"
          subtitle={friendlyError(error)}
          role="alert"
          hint={import.meta.env.DEV ? <p className="entry-hint">Ejecutá <code>npm run dev</code> (incluye el servidor API).</p> : undefined}
        />
      </div>
    );
  }

  if (shouldShowNutrigo({ development: import.meta.env.DEV, demoMode, hasSession: Boolean(session), supabaseEnabled, search: window.location.search })) {
    const lockedRole = session ? (isNutri ? 'pro' as const : 'patient' as const) : null;
    return (
      <Suspense fallback={<LoadingScreen />}>
        {/* La app de la paciente ofrece instalar en la tarjeta amarilla del menú, como el archivo de Nutrigo. */}
        <PwaChrome install={lockedRole === 'pro'} />
        <NutrigoShowroom
          darkMode={darkMode}
          onToggleTheme={toggleTheme}
          lockedRole={lockedRole}
          allowRoleSwitch={canUseDemoRoleSwitch({ demoMode, hasSession: Boolean(session) })}
          onSignOut={session ? signOut : undefined}
          userName={profile?.full_name || undefined}
        />
      </Suspense>
    );
  }

  const showToggle = demoMode;

  return (
    <div className={`plan-v-app${darkMode ? ' dark' : ''}`}>
      <PwaChrome />
      <div className="prototype-switch" role="group" aria-label="Cambiar vista">
        {showToggle ? (
          <>
            <span>Vista</span>
            <button type="button" onClick={() => setView('patient')} className={view === 'patient' ? 'active' : ''}>Paciente</button>
            <button type="button" onClick={() => setView('pro')} className={view === 'pro' ? 'active' : ''}>Nutricionista</button>
          </>
        ) : (
          <span className="role-badge">{isNutri ? 'Verónica · CRM' : profile?.full_name ?? 'Paciente'}</span>
        )}
        <span className={`ai-pill ${aiEnabled ? 'live' : 'mock'}`}>IA {aiEnabled ? 'live' : 'demo'}</span>
        {import.meta.env.DEV && demoMode && !session && !supabaseEnabled && <a href="?design=nutrigo" style={{ padding: '6px 10px', fontSize: 12, color: 'inherit' }}>Consultorio</a>}
        {supabaseEnabled && <span className="ai-pill live">DB</span>}
        {session && (
          <button type="button" className="signout-btn" onClick={() => signOut()} aria-label="Cerrar sesión">Salir</button>
        )}
      </div>
      <Suspense fallback={(
        <div className="loading-screen" role="status" aria-live="polite">
          <div className="loading-card"><Mark /><p className="eyebrow">Nutridash</p><h2>Cargando módulo…</h2></div>
        </div>
      )}>
        {view === 'patient'
          ? <PatientApp darkMode={darkMode} onToggleTheme={toggleTheme} />
          : <CrmDashboard darkMode={darkMode} onToggleTheme={toggleTheme} />}
      </Suspense>
    </div>
  );
}
