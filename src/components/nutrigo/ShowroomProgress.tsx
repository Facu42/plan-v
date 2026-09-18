import { Icon } from '../shared/Icon';
import { CarePanel } from './CarePanel';
import { NvBadge, NvRing, NvState } from './primitives';
import type { ShowroomPatient } from './showroom-model';
import './showroom-progress.css';

function formatSleep(minutes: number | null): string {
  if (minutes === null) return 'Sin registros';
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours} h${remainder ? ` ${remainder} min` : ''}`;
}

function shortDate(value: string): string {
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' }).format(new Date(`${value}T12:00:00`));
}

export function buildProgressView(patient: ShowroomPatient) {
  const activeDays = patient.journey.days.filter((day) => day.hydration > 0 || day.energy !== null || day.sleepMinutes !== null || day.reviewedMeals > 0 || day.pendingMeals > 0).length;
  const energyRecordedDays = patient.journey.days.filter((day) => day.energy !== null).length;
  const maxHydration = patient.journey.days.reduce((maximum, day) => Math.max(maximum, day.hydration), 0);
  const maxMeals = patient.journey.days.reduce((maximum, day) => Math.max(maximum, day.reviewedMeals + day.pendingMeals), 0);
  const recentIds = new Set(patient.journey.days.flatMap((day) => day.mealLogIds));
  const recentLogs = patient.logs.filter((log) => recentIds.has(log.id)).sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime());
  return { activeDays, energyRecordedDays, maxHydration, maxMeals, reviewedMeals: patient.journey.reviewedMeals, pendingMeals: patient.journey.pendingMeals, recentLogs };
}

export function ShowroomProgress({ patient }: { patient: ShowroomPatient }) {
  const view = buildProgressView(patient);
  const sleepAverage = patient.journey.sleepAverageMinutes;
  return <section className="nvp-progress" aria-label="Progreso del paciente">
    <CarePanel patientId={patient.id} />
    <header className="nvp-hero"><div><span className="nv-icon-tile"><Icon name="trend" size={21} /></span><div><h2>Tu progreso, en contexto</h2><p>Datos declarados por vos y comidas revisadas por tu nutricionista.</p></div></div><NvBadge>Últimos 7 días</NvBadge></header>

    <section className="nvp-metrics" aria-label="Resumen semanal">
      <article className="nvp-score"><NvRing value={patient.adherence} label="adherencia" /><div><small>Adherencia actual</small><strong>{patient.adherence}%</strong><p>Las comidas pendientes todavía no suman.</p></div></article>
      <article><span className="nvp-metric-icon mint"><Icon name="drop" size={18} /></span><small>Promedio de agua</small><strong>{patient.journey.hydrationAverage.toLocaleString('es-AR')} vasos/día</strong><p>Sobre siete días; los días sin carga quedan en cero.</p></article>
      <article><span className="nvp-metric-icon gold"><Icon name="moon" size={18} /></span><small>Descanso cargado</small><strong>{sleepAverage === null ? 'Sin promedio' : `Promedio ${formatSleep(sleepAverage)}`}</strong><p>{patient.journey.sleepRecordedDays} de 7 días con registro.</p></article>
      <article><span className="nvp-metric-icon coral"><Icon name="check" size={18} /></span><small>Comidas revisadas</small><strong>{view.reviewedMeals}</strong><p>{view.pendingMeals ? `${view.pendingMeals} todavía en revisión.` : 'Sin revisiones pendientes.'}</p></article>
    </section>

    <div className="nvp-layout">
      <section className="nvp-week-card">
        <header><div><h3>Tu semana</h3><p>Actividad registrada por día, sin completar datos ausentes.</p></div><div className="nvp-legend"><span><i className="water" />Agua</span><span><i className="meal" />Comidas</span></div></header>
        <div className="nvp-chart" aria-label="Actividad semanal">
          {patient.journey.days.map((day) => {
            const meals = day.reviewedMeals + day.pendingMeals;
            return <article key={day.date} className={day.isToday ? 'is-today' : ''}><div className="nvp-bars"><i className="water" title={`${day.hydration} vasos`} style={{ height: `${view.maxHydration ? day.hydration / view.maxHydration * 100 : 0}%` }} /><i className="meal" title={`${meals} comidas`} style={{ height: `${view.maxMeals ? meals / view.maxMeals * 100 : 0}%` }} /></div><strong>{day.isToday ? 'Hoy' : day.label}</strong><small>{shortDate(day.date)}</small></article>;
          })}
        </div>
        <div className="nvp-days" role="list" aria-label="Detalle de los últimos siete días">{patient.journey.days.map((day) => <article key={day.date} role="listitem" className={day.isToday ? 'is-today' : ''}><div><strong>{day.isToday ? 'Hoy' : day.label}</strong><small>{shortDate(day.date)}</small></div><span><Icon name="drop" size={13} />{day.hydration} vasos</span><span><Icon name="moon" size={13} />{formatSleep(day.sleepMinutes)}</span><span><Icon name="sparkle" size={13} />{day.energy ?? 'Sin registro'}</span><span><Icon name="check" size={13} />{day.reviewedMeals} revisadas{day.pendingMeals ? ` · ${day.pendingMeals} pendiente` : ''}</span></article>)}</div>
        <p className="nvp-source-note">No se completan períodos sin registros ni se infieren peso, medidas, calorías o sueño.</p>
      </section>

      <aside className="nvp-side">
        <section className="nvp-goal"><span className="nv-icon-tile"><Icon name="target" size={22} /></span><small>Tu objetivo actual</small><h3>{patient.goal || 'Sin objetivo publicado'}</h3><div><span><i style={{ width: `${Math.max(0, Math.min(100, patient.goalProgress))}%` }} /></span><strong>{patient.goalProgress}%</strong></div><p>El avance es el último valor publicado por tu nutricionista.</p></section>
        <section className="nvp-energy"><header><h3>Energía declarada</h3><NvBadge>{view.energyRecordedDays}/7</NvBadge></header>{view.energyRecordedDays ? <ul>{patient.journey.days.filter((day) => day.energy !== null).map((day) => <li key={day.date}><span>{day.isToday ? 'Hoy' : day.label} · {shortDate(day.date)}</span><strong>{day.energy}</strong></li>)}</ul> : <NvState title="Sin energía registrada" description="Tus registros aparecerán acá." />}</section>
      </aside>
    </div>

    <section className="nvp-meals"><header><div><h3>Comidas de esta semana</h3><p>Estados confirmados por tu nutricionista o todavía en revisión.</p></div><NvBadge>{view.recentLogs.length}</NvBadge></header>{view.recentLogs.length ? <div>{view.recentLogs.map((log) => <article key={log.id}><span className="nvp-meal-icon"><Icon name="leaf" size={17} /></span><div><strong>{log.slot}</strong><p>{log.description || 'Sin descripción registrada'}</p><small>{new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(log.logged_at))}</small></div><NvBadge tone={log.status === 'pending_review' ? 'gold' : 'green'}>{log.status === 'pending_review' ? 'En revisión' : log.status === 'adjusted' ? 'Ajustada' : 'Confirmada'}</NvBadge></article>)}</div> : <NvState title="Sin comidas registradas esta semana" description="Cuando registres comidas, sus estados aparecerán en este resumen." />}</section>
  </section>;
}
