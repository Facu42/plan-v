import type { Patient } from '../../types';
import { Icon, Mark, ScoreRing } from '../shared/Icon';
import { gaugeLabel } from '../../store/useAppStore';

export function PatientCamino({ patient }: { patient: Patient }) {
  return (
    <main className="patient-shell patient-subpage">
      <header className="patient-topbar">
        <div className="brand-lockup"><Mark /><span>Mi camino</span></div>
      </header>

      <section className="subpage-hero">
        <p className="eyebrow">Tu evolución</p>
        <h1>Adherencia</h1>
        <p>Un número, no un juicio. Verónica te acompaña en el proceso.</p>
      </section>

      <section className="camino-score-card">
        <ScoreRing score={patient.adherence_score} label={gaugeLabel(patient.adherence_score)} />
        <p className="camino-note">Este número refleja tu ritmo de la semana. No incluye estimaciones pendientes de revisión.</p>
      </section>

      <section className="habit-summary">
        <div className="habit-pill"><Icon name="drop" size={16} /><span>Agua hoy</span><strong>{patient.hydration}/8</strong></div>
        <div className="habit-pill"><Icon name="sparkle" size={16} /><span>Energía</span><strong>{patient.energy ?? '—'}</strong></div>
      </section>

      <section className="logs-section">
        <div className="section-heading"><div><p className="eyebrow">Registros</p><h2>Tus comidas</h2></div></div>
        <div className="patient-logs">
          {patient.meal_logs.length === 0 && <p className="empty-state">Todavía no cargaste comidas. ¡Empezá con una foto!</p>}
          {patient.meal_logs.map((log) => (
            <article key={log.id} className={`log-card status-${log.status}`}>
              <div className="log-head">
                <strong>{log.slot}</strong>
                <span className={`status-chip ${log.status}`}>
                  {log.status === 'pending_review' ? 'Pendiente de Vero' : log.status === 'confirmed' ? 'Confirmado' : 'Ajustado'}
                </span>
              </div>
              <p className="log-foods">{log.foods.map((f) => f.name).join(', ')}</p>
              {log.macros && log.confidence >= 0.45 && (
                <p className="log-macros">{log.macros.kcal} kcal · P {log.macros.protein_g}g · C {log.macros.carbs_g}g · G {log.macros.fat_g}g</p>
              )}
              {log.status === 'pending_review' && (
                <p className="log-pending">Estimación · pendiente de revisión · Verónica lo confirma</p>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
