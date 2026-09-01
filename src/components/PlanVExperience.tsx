import { useEffect, useState } from 'react';
import { PatientApp } from './patient/PatientApp';
import { CrmDashboard } from './crm/CrmDashboard';
import { LoginScreen } from './auth/LoginScreen';
import { useAuth } from '../context/AuthContext';
import { useAppStore } from '../store/useAppStore';
import { api } from '../api/client';
import { supabaseConfigured } from '../lib/supabase';

export function PlanVExperience() {
  const { session, demoMode, isNutri, isPatient, profile, signOut, loading: authLoading } = useAuth();
  const [view, setView] = useState<'patient' | 'pro'>('patient');
  const { boot, loading, error, aiEnabled, supabaseEnabled } = useAppStore();

  useEffect(() => {
    if (authLoading) return;
    if (!session && !demoMode && supabaseConfigured) return;
    boot({ isNutri, isPatient });
  }, [authLoading, session, demoMode, isNutri, isPatient, boot]);

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
      <div className="plan-v-app loading-screen">
        <div className="loading-card"><p className="eyebrow">Plan V</p><h2>Cargando…</h2></div>
      </div>
    );
  }

  if (supabaseConfigured && !session && !demoMode) {
    return <LoginScreen />;
  }

  if (loading) {
    return (
      <div className="plan-v-app loading-screen">
        <div className="loading-card"><p className="eyebrow">Plan V</p><h2>Cargando datos…</h2></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="plan-v-app loading-screen">
        <div className="loading-card error">
          <p className="eyebrow">Plan V</p>
          <h2>No pudimos conectar</h2>
          <p>{error}</p>
          <p className="hint">Ejecutá <code>npm run dev</code> (incluye el servidor API).</p>
        </div>
      </div>
    );
  }

  const showToggle = demoMode || (!isNutri && !isPatient);

  return (
    <div className="plan-v-app">
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
        {supabaseEnabled && <span className="ai-pill live">DB</span>}
        {session && (
          <button type="button" className="signout-btn" onClick={() => signOut()} aria-label="Cerrar sesión">Salir</button>
        )}
      </div>
      {view === 'patient' ? <PatientApp /> : <CrmDashboard />}
    </div>
  );
}
