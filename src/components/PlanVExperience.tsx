import { lazy, Suspense, useEffect, useState } from 'react';

const PatientApp = lazy(() => import('./patient/PatientApp').then(({ PatientApp }) => ({ default: PatientApp })));
const CrmDashboard = lazy(() => import('./crm/CrmDashboard').then(({ CrmDashboard }) => ({ default: CrmDashboard })));
import { LoginScreen } from './auth/LoginScreen';
import { useAuth } from '../context/AuthContext';
import { forgetPendingInvite, pendingInviteIdFromLocation, PENDING_INVITE_STORAGE_KEY } from '../context/invite-link';
import { useAppStore } from '../store/useAppStore';
import { api } from '../api/client';
import { readThemePreference, writeThemePreference, type ThemePreference } from '../theme-preference';
import { Mark } from './shared/Icon';
import { canUseDemoRoleSwitch, shouldShowNutrigo } from './design-entry';
import { PwaChrome } from '../pwa/PwaChrome';

const NutrigoShowroom = lazy(() => import('./nutrigo/NutrigoShowroom').then(({ NutrigoShowroom }) => ({ default: NutrigoShowroom })));

export function PlanVExperience() {
  const { session, demoMode, isNutri, isPatient, profile, signOut, loading: authLoading } = useAuth();
  const [view, setView] = useState<'patient' | 'pro'>('patient');
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'accepting' | 'unconfirmed' | 'unavailable' | 'linked'>('idle');
  const [theme, setTheme] = useState<ThemePreference>(() => readThemePreference(
    typeof window === 'undefined' ? null : window.localStorage,
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
  ));
  const { boot, reset, loading, error, aiEnabled, supabaseEnabled, patients } = useAppStore();
  const darkMode = theme === 'dark';
  const toggleTheme = () => setTheme((current) => current === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    writeThemePreference(typeof window === 'undefined' ? null : window.localStorage, theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    if (authLoading) return;
    if (!session && !demoMode) {
      reset();
      return;
    }
    if (session && !isNutri && !isPatient) return;
    void boot({ isNutri, isPatient });
  }, [authLoading, session, demoMode, isNutri, isPatient, boot, reset]);

  useEffect(() => {
    if (!session || !isPatient || inviteStatus !== 'idle') return;
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
  }, [session, isPatient, inviteStatus, boot]);

  useEffect(() => {
    if (isNutri) setView('pro');
    if (isPatient) setView('patient');
  }, [isNutri, isPatient]);

  useEffect(() => {
    if (session && isNutri && profile) {
      api.setupNutritionist(profile.full_name || 'Verónica Trenti').catch(() => {});
    }
  }, [session, isNutri, profile]);

  if (authLoading) {
    return (
      <div className={`plan-v-app loading-screen${darkMode ? ' dark' : ''}`}>
        <PwaChrome />
        <div className="loading-card"><Mark /><p className="eyebrow">Plan V</p><h2>Cargando…</h2></div>
      </div>
    );
  }

  if (!session && !demoMode) {
    return <div className={`plan-v-app${darkMode ? ' dark' : ''}`}><PwaChrome /><LoginScreen darkMode={darkMode} onToggleTheme={toggleTheme} /></div>;
  }

  if (session && !isNutri && !isPatient) {
    return (
      <div className={`plan-v-app loading-screen${darkMode ? ' dark' : ''}`}>
        <PwaChrome />
        <div className="loading-card">
          <Mark />
          <p className="eyebrow">Plan V</p>
          <h2>Tu cuenta todavía no está vinculada</h2>
          <p>Cuando aceptes la invitación de tu nutricionista vas a ver tu plan. No se listan pacientes de otras cuentas.</p>
          <button type="button" className="primary-button" onClick={() => signOut()}>Cerrar sesión</button>
        </div>
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
      <div className={`plan-v-app loading-screen${darkMode ? ' dark' : ''}`}>
        <PwaChrome />
        <div className="loading-card">
          <Mark />
          <p className="eyebrow">Plan V</p>
          <h2>Tu cuenta todavía no está vinculada</h2>
          <p>{waiting}</p>
          <button type="button" className="primary-button" onClick={() => signOut()}>Cerrar sesión</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`plan-v-app loading-screen${darkMode ? ' dark' : ''}`}>
        <PwaChrome />
        <div className="loading-card"><Mark /><p className="eyebrow">Plan V</p><h2>Cargando datos…</h2></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`plan-v-app loading-screen${darkMode ? ' dark' : ''}`}>
        <PwaChrome />
        <div className="loading-card error">
          <Mark />
          <p className="eyebrow">Plan V</p>
          <h2>No pudimos conectar</h2>
          <p>{error}</p>
          <p className="hint">Ejecutá <code>npm run dev</code> (incluye el servidor API).</p>
        </div>
      </div>
    );
  }

  if (shouldShowNutrigo({ development: import.meta.env.DEV, demoMode, hasSession: Boolean(session), supabaseEnabled, search: window.location.search })) {
    const lockedRole = session ? (isNutri ? 'pro' as const : 'patient' as const) : null;
    return (
      <Suspense fallback={<div className="plan-v-app loading-screen" role="status">Cargando consultorio…</div>}>
        <PwaChrome />
        <NutrigoShowroom
          darkMode={darkMode}
          onToggleTheme={toggleTheme}
          lockedRole={lockedRole}
          allowRoleSwitch={canUseDemoRoleSwitch({ demoMode, hasSession: Boolean(session) })}
          onSignOut={session ? signOut : undefined}
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
          <div className="loading-card"><Mark /><p className="eyebrow">Plan V</p><h2>Cargando módulo…</h2></div>
        </div>
      )}>
        {view === 'patient'
          ? <PatientApp darkMode={darkMode} onToggleTheme={toggleTheme} />
          : <CrmDashboard darkMode={darkMode} onToggleTheme={toggleTheme} />}
      </Suspense>
    </div>
  );
}
