import type { Patient } from '../../types';
import { gaugeLabel } from '../../store/useAppStore';
import { Icon, Mark, ScoreRing } from '../shared/Icon';
import { buildJourneySummary } from './journey-summary';

function formatSleep(minutes: number | null): string {
  if (minutes === null) return '—';
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours} h${remainder > 0 ? ` ${remainder} min` : ''}`;
}

function formatMealDate(value: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function PatientCamino({ patient }: { patient: Patient }) {
  const summary = buildJourneySummary(patient);
  const recentLogIds = new Set(summary.days.flatMap((day) => day.mealLogIds));
  const recentMealLogs = patient.meal_logs
    .filter((log) => recentLogIds.has(log.id))
    .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime());

  return (
    <main className="patient-shell patient-subpage">
      <header className="patient-topbar">
        <div className="brand-lockup"><Mark /><span>Mi camino</span></div>
      </header>

      <section className="subpage-hero">
        <p className="eyebrow">Tus últimos 7 días</p>
        <h1>Tu ritmo, en contexto</h1>
        <p>Datos declarados por vos y comidas revisadas por Verónica. Es un seguimiento, no un juicio.</p>
      </section>

      <section className="camino-score-card" aria-label={`Adherencia semanal ${patient.adherence_score}`}>
        <ScoreRing score={patient.adherence_score} label={gaugeLabel(patient.adherence_score)} />
        <p className="camino-note">Este número refleja tu ritmo de la semana. Las comidas pendientes de revisión no suman.</p>
      </section>

      <section className="habit-summary" aria-label="Registros de hoy">
        <div className="habit-pill"><Icon name="drop" size={16} /><span>Agua hoy</span><strong>{patient.hydration}/8</strong></div>
        <div className="habit-pill"><Icon name="sparkle" size={16} /><span>Energía</span><strong>{patient.energy ?? '—'}</strong></div>
        <div className="habit-pill"><Icon name="moon" size={16} /><span>Descanso</span><strong>{formatSleep(patient.sleep_minutes)}</strong></div>
      </section>

      <section className="journey-week" aria-labelledby="journey-week-title">
        <div className="section-heading">
          <div><p className="eyebrow">Resumen declarado</p><h2 id="journey-week-title">Tu semana</h2></div>
        </div>

        <div className="journey-metrics">
          <article><Icon name="drop" size={17} /><span>Promedio de agua</span><strong>{summary.hydrationAverage.toLocaleString('es-AR')} vasos/día</strong></article>
          <article><Icon name="moon" size={17} /><span>Descanso cargado</span><strong>{summary.sleepRecordedDays}/7 días</strong><small>{summary.sleepAverageMinutes === null ? 'Sin promedio todavía' : `Promedio ${formatSleep(summary.sleepAverageMinutes)}`}</small></article>
          <article><Icon name="check" size={17} /><span>Comidas revisadas</span><strong>{summary.reviewedMeals}</strong><small>{summary.pendingMeals > 0 ? `${summary.pendingMeals} en revisión` : 'Sin pendientes'}</small></article>
        </div>

        <div className="journey-days" role="list" aria-label="Detalle de los últimos siete días">
          {summary.days.map((day) => (
            <article key={day.date} className={day.isToday ? 'today' : ''} role="listitem">
              <div className="journey-day-label">
                <strong>{day.isToday ? 'Hoy' : day.label}</strong>
                <time dateTime={day.date}>{new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' }).format(new Date(`${day.date}T12:00:00`))}</time>
              </div>
              <div className="journey-day-values">
                <span aria-label={`Agua: ${day.hydration} de 8`}><Icon name="drop" size={13} />{day.hydration}/8</span>
                <span aria-label={`Descanso: ${formatSleep(day.sleepMinutes)}`}><Icon name="moon" size={13} />{formatSleep(day.sleepMinutes)}</span>
                <span aria-label={`Comidas revisadas: ${day.reviewedMeals}`}><Icon name="check" size={13} />{day.reviewedMeals}</span>
              </div>
              {day.pendingMeals > 0 && <em>{day.pendingMeals} en revisión</em>}
            </article>
          ))}
        </div>
      </section>

      <section className="logs-section">
        <div className="section-heading"><div><p className="eyebrow">Últimos 7 días</p><h2>Tus comidas</h2></div></div>
        <div className="patient-logs">
          {recentMealLogs.length === 0 && <p className="empty-state">Todavía no hay comidas registradas esta semana.</p>}
          {recentMealLogs.map((log) => (
            <article key={log.id} className={`log-card status-${log.status}`}>
              <div className="log-head">
                <div><strong>{log.slot}</strong><time dateTime={log.logged_at}>{formatMealDate(log.logged_at)}</time></div>
                <span className={`status-chip ${log.status}`}>
                  {log.status === 'pending_review' ? 'Pendiente de Vero' : log.status === 'confirmed' ? 'Confirmado' : 'Ajustado'}
                </span>
              </div>
              <p className="log-foods">{log.foods.map((food) => food.name).join(', ') || log.description || 'Sin detalle'}</p>
              {log.macros && log.confidence >= 0.45 && (
                <p className="log-macros">{log.macros.kcal} kcal · P {log.macros.protein_g}g · C {log.macros.carbs_g}g · G {log.macros.fat_g}g</p>
              )}
              {log.status === 'pending_review' && (
                <p className="log-pending">Estimación pendiente · Verónica la revisa antes de sumarla</p>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}