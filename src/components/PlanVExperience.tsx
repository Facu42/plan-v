import { useEffect, useState } from 'react';
import { PatientApp } from './patient/PatientApp';
import { CrmDashboard } from './crm/CrmDashboard';
import { useAppStore } from '../store/useAppStore';

export function PlanVExperience() {
  const [view, setView] = useState<'patient' | 'pro'>('patient');
  const { boot, loading, error, aiEnabled } = useAppStore();

  useEffect(() => {
    boot();
  }, [boot]);

  if (loading) {
    return (
      <div className="plan-v-app loading-screen">
        <div className="loading-card">
          <p className="eyebrow">Plan V</p>
          <h2>Cargando…</h2>
        </div>
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

  return (
    <div className="plan-v-app">
      <div className="prototype-switch" role="group" aria-label="Cambiar vista">
        <span>Vista</span>
        <button type="button" onClick={() => setView('patient')} className={view === 'patient' ? 'active' : ''}>Paciente</button>
        <button type="button" onClick={() => setView('pro')} className={view === 'pro' ? 'active' : ''}>Nutricionista</button>
        <span className={`ai-pill ${aiEnabled ? 'live' : 'mock'}`} title={aiEnabled ? 'OpenAI conectado' : 'Modo demo (sin OPENAI_API_KEY)'}>
          IA {aiEnabled ? 'live' : 'demo'}
        </span>
      </div>
      {view === 'patient' ? <PatientApp /> : <CrmDashboard />}
    </div>
  );
}
