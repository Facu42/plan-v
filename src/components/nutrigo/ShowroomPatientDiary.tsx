import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../shared/Icon';
import { NvBadge, NvButton, NvState } from './primitives';
import type { ShowroomPatient } from './showroom-model';
import { DayAssignedMeals } from './DayMeals';
import { RecipeMacroGrid } from './RecipePlate';
import './showroom-patient-diary.css';

export type PatientDiaryFilter = 'all' | 'pending' | 'reviewed';

const statusLabel = (status: ShowroomPatient['logs'][number]['status']) => status === 'pending_review' ? 'Pendiente de revisión' : status === 'adjusted' ? 'Ajustada' : 'Confirmada';
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-AR').trim();
const weekLabelFmt = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' });

export type MealPlanRelation = 'planned' | 'outside' | 'unknown';

const weekdayFormatter = new Intl.DateTimeFormat('es-AR', { weekday: 'long' });
export function mealLogPlanRelation(log: ShowroomPatient['logs'][number], weekPlan: ShowroomPatient['weekPlan']): MealPlanRelation {
  if (!weekPlan.length) return 'unknown';
  const loggedAt = new Date(log.logged_at);
  if (Number.isNaN(loggedAt.getTime())) return 'unknown';
  const weekday = weekdayFormatter.format(loggedAt);
  const day = weekPlan.find((entry) => normalize(entry.day) === normalize(weekday));
  if (!day) return 'unknown';
  return day.meals.some((meal) => normalize(meal.slot) === normalize(log.slot)) ? 'planned' : 'outside';
}

export function patientVisibleReview(log: ShowroomPatient['logs'][number]) {
  if (log.status === 'pending_review') return null;
  return {
    outcome: log.status,
    headline: log.status === 'adjusted' ? 'Tu nutricionista ajustó este registro' : 'Tu nutricionista confirmó este registro',
    foods: log.foods.map((food) => food.name).filter(Boolean),
    macros: log.macros,
    caption: 'Solo ves el resultado publicado. Las notas internas no se comparten.',
  };
}

function localDateId(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function startOfWeekMonday(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const weekday = start.getDay();
  start.setDate(start.getDate() + (weekday === 0 ? -6 : 1 - weekday));
  return start;
}

export function diaryWeekRange(now: Date, offsetWeeks = 0) {
  const start = startOfWeekMonday(now);
  start.setDate(start.getDate() + offsetWeeks * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  const last = new Date(end);
  last.setDate(last.getDate() - 1);
  return {
    start,
    end,
    offsetWeeks,
    isCurrent: offsetWeeks === 0,
    label: `${weekLabelFmt.format(start)} – ${weekLabelFmt.format(last)}`,
  };
}

export function diaryWeekBounds(loggedAt: readonly string[], now: Date) {
  const current = startOfWeekMonday(now).getTime();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  let minOffset = 0;
  for (const iso of loggedAt) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) continue;
    const offset = Math.round((startOfWeekMonday(date).getTime() - current) / weekMs);
    if (offset < minOffset) minOffset = offset;
  }
  return { minOffset, maxOffset: 0 };
}

export function buildPatientDiaryView(patient: ShowroomPatient, query = '', filter: PatientDiaryFilter = 'all', now = new Date(), weekOffset = 0) {
  const week = diaryWeekRange(now, weekOffset);
  const bounds = diaryWeekBounds(patient.logs.map((log) => log.logged_at), now);
  const weekLogs = patient.logs.filter((log) => {
    const stamped = new Date(log.logged_at).getTime();
    return stamped >= week.start.getTime() && stamped < week.end.getTime();
  });
  const term = normalize(query);
  const logs = [...weekLogs]
    .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())
    .filter((log) => {
      const matchesFilter = filter === 'all' || (filter === 'pending' ? log.status === 'pending_review' : log.status !== 'pending_review');
      const matchesQuery = !term || normalize(`${log.slot} ${log.description ?? ''} ${statusLabel(log.status)}`).includes(term);
      return matchesFilter && matchesQuery;
    });
  const daysWithLogs = new Set(weekLogs.map((log) => localDateId(new Date(log.logged_at)))).size;
  return {
    week,
    bounds,
    logs,
    emptyKind: weekLogs.length === 0 ? 'week' as const : logs.length === 0 ? 'filter' as const : null,
    summary: {
      total: weekLogs.length,
      reviewed: weekLogs.filter((log) => log.status !== 'pending_review').length,
      pending: weekLogs.filter((log) => log.status === 'pending_review').length,
      daysWithLogs,
    },
  };
}

export function ShowroomPatientDiary({ patient, query, now = new Date(), onLogMeal, patientId }: { patient: ShowroomPatient; query: string; now?: Date; onLogMeal: (slot?: string) => void; patientId?: string }) {
  const [filter, setFilter] = useState<PatientDiaryFilter>('all');
  const [weekOffset, setWeekOffset] = useState(0);
  useEffect(() => { setWeekOffset(0); }, [patient.id]);
  const view = useMemo(() => buildPatientDiaryView(patient, query, filter, now, weekOffset), [filter, now, patient, query, weekOffset]);
  const emptyCopy = view.emptyKind === 'week'
    ? (view.week.isCurrent ? 'Todavía no registraste comidas esta semana.' : 'No hay registros en esa semana. El diario no inventa historial.')
    : 'Usá otra búsqueda o cambiá el filtro.';
  return <>
    {patientId ? <DayAssignedMeals patientId={patientId} /> : null}
    <section className="nvpdiary" aria-label="Diario de comidas del paciente">
    <header className="nvpdiary-hero"><div><span className="nv-icon-tile"><Icon name="leaf" size={21} /></span><div><h2>Tu diario de comidas</h2><p>Registrá lo que comiste y seguí el estado de revisión.</p></div></div><NvButton onClick={() => onLogMeal('Almuerzo')}><Icon name="camera" size={15} />Registrar comida</NvButton></header>

    <nav className="nvpdiary-week" aria-label="Semana del diario">
      <button type="button" aria-label="Semana anterior" disabled={weekOffset <= view.bounds.minOffset} onClick={() => setWeekOffset((offset) => offset - 1)}><Icon name="chevron" size={16} /></button>
      <p><strong>{view.week.isCurrent ? 'Esta semana' : 'Semana'}</strong><span>{view.week.label}</span></p>
      <button type="button" aria-label="Semana siguiente" disabled={weekOffset >= view.bounds.maxOffset} onClick={() => setWeekOffset((offset) => offset + 1)}><Icon name="chevron" size={16} /></button>
    </nav>

    <section className="nvpdiary-metrics" aria-label="Resumen del diario"><article><span className="mint"><Icon name="list" size={18} /></span><small>Registros</small><strong>{view.summary.total}</strong><p>{view.week.isCurrent ? 'En esta semana.' : 'En la semana elegida.'}</p></article><article><span className="green"><Icon name="check" size={18} /></span><small>Revisadas</small><strong>{view.summary.reviewed}</strong><p>Confirmadas o ajustadas.</p></article><article><span className="gold"><Icon name="clock" size={18} /></span><small>En revisión</small><strong>{view.summary.pending}</strong><p>Todavía no suman al seguimiento.</p></article><article><span className="coral"><Icon name="calendar" size={18} /></span><small>Días con registros</small><strong>{view.summary.daysWithLogs}/7</strong><p>Solo cuenta lo realmente registrado.</p></article></section>

    <section className="nvpdiary-card">
      <header><div><h3>Últimos registros</h3><p>{query ? `Resultados para “${query}”` : view.week.isCurrent ? 'Ordenados desde el más reciente de esta semana.' : `Registros de ${view.week.label}.`}</p></div><div className="nvpdiary-filters" aria-label="Filtrar registros">{([{ id: 'all', label: 'Todos' }, { id: 'pending', label: 'En revisión' }, { id: 'reviewed', label: 'Revisadas' }] as const).map((option) => <button type="button" key={option.id} aria-pressed={filter === option.id} onClick={() => setFilter(option.id)}>{option.label}</button>)}</div></header>
      {view.logs.length ? <div className="nvpdiary-list">{view.logs.map((log) => {
        const review = patientVisibleReview(log);
        const relation = mealLogPlanRelation(log, patient.weekPlan);
        return <article key={log.id}>
        <span className={`nvpdiary-icon ${log.status}`}><Icon name={log.status === 'pending_review' ? 'clock' : 'check'} size={17} /></span>
        <div className="nvpdiary-copy"><strong>{log.slot}</strong><p>{log.description || 'Sin descripción registrada'}</p><time dateTime={log.logged_at}>{new Intl.DateTimeFormat('es-AR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(log.logged_at))}</time></div>
        <div className="nvpdiary-detail">{review ? <>{review.macros ? <RecipeMacroGrid macros={review.macros} /> : null}<p><strong>{review.macros ? `${review.macros.kcal} kcal` : 'Valores publicados'}</strong><span>{review.macros ? `P ${review.macros.protein_g} g · C ${review.macros.carbs_g} g · G ${review.macros.fat_g} g` : 'Sin información nutricional publicada.'}</span></p></> : <p><strong>Sin valores confirmados</strong><span>Tu nutricionista debe revisarlos.</span></p>}
          {review && <p className="nvpdiary-review"><strong>Revisión profesional</strong><span>{review.headline}. {review.foods.length ? `Alimentos: ${review.foods.join(', ')}` : 'Sin alimentos estructurados registrados.'} {review.caption}</span></p>}</div>
        <div className="nvpdiary-badges">{relation !== 'unknown' && <span className={`nvpdiary-plan-tag ${relation}`}>{relation === 'planned' ? 'Del plan' : 'Fuera del plan'}</span>}<NvBadge tone={log.status === 'pending_review' ? 'gold' : log.status === 'adjusted' ? 'coral' : 'green'}>{statusLabel(log.status)}</NvBadge></div>
      </article>;
      })}</div> : <NvState title={view.emptyKind === 'week' ? 'Sin registros esta semana' : 'Sin registros para mostrar'} description={emptyCopy} />}
      <footer><p><Icon name="sparkle" size={14} /> {patient.weekPlan.length > 0 && '«Del plan» compara el momento del registro con tu plan semanal publicado; no es una evaluación clínica. '}Las estimaciones automáticas no cuentan hasta que tu nutricionista las confirma o ajusta.</p><NvButton className="nv-ghost" onClick={() => onLogMeal('Almuerzo')}><Icon name="plus" size={14} />Agregar registro</NvButton></footer>
    </section>
  </section>
  </>;
}
