import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Bread, CalendarBlank, CaretDown, CaretLeft, CaretRight, CheckCircle, Clock, Drop, Fire, Fish, Funnel, MagnifyingGlass, Note, Plus, TrendDown, TrendUp,
} from '@phosphor-icons/react';
import type { Macros, MealStatus } from '../../types';
import { NvState } from './primitives';
import type { ShowroomPatient } from './showroom-model';
import { DayAssignedMeals } from './DayMeals';
import './showroom-patient-diary.css';
import './agenda-diario-fig.css';

export type PatientDiaryFilter = 'all' | 'pending' | 'reviewed';

const statusLabel = (status: MealStatus) => status === 'pending_review' ? 'Pendiente de revisión' : status === 'adjusted' ? 'Ajustada' : 'Confirmada';
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

/* ──────────────────────────────────────────────────────────────────────────
   Tabla del frame "22. Food Diary" (105:2649 / móvil 492:14886), compartida con
   el diario del consultorio (ShowroomMeals).
   ────────────────────────────────────────────────────────────────────────── */

export type DiaryRow = {
  id: string;
  slot: string;
  description: string | null;
  foods: string[];
  macros: Macros | null;
  status: MealStatus;
  logged_at: string;
  /** Sólo en el consultorio: la nota privada del análisis automático. */
  note?: string;
  relation?: MealPlanRelation;
};

export type DiaryScope = number | 'all';
export type MacroTotals = { kcal: number; carbs_g: number; protein_g: number; fat_g: number };

function inWeek(iso: string, now: Date, offset: number) {
  const week = diaryWeekRange(now, offset);
  const stamped = new Date(iso).getTime();
  return stamped >= week.start.getTime() && stamped < week.end.getTime();
}

/** Suma sólo lo revisado: una estimación automática pendiente no cuenta como dato del diario. */
export function diaryMacroTotals(rows: readonly Pick<DiaryRow, 'macros' | 'status'>[]): MacroTotals {
  return rows.reduce<MacroTotals>((sum, row) => {
    if (row.status === 'pending_review' || !row.macros) return sum;
    return { kcal: sum.kcal + row.macros.kcal, carbs_g: sum.carbs_g + row.macros.carbs_g, protein_g: sum.protein_g + row.macros.protein_g, fat_g: sum.fat_g + row.macros.fat_g };
  }, { kcal: 0, carbs_g: 0, protein_g: 0, fat_g: 0 });
}

/** Variación contra la semana anterior; null si no hay base real para comparar. */
export function weekTrend(current: number, previous: number): number | null {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

export function buildDiaryTable(rows: readonly DiaryRow[], { now, scope, filter, query, page, pageSize }: { now: Date; scope: DiaryScope; filter: PatientDiaryFilter; query: string; page: number; pageSize: number }) {
  const scoped = rows.filter((row) => scope === 'all' || inWeek(row.logged_at, now, scope));
  const previous = scope === 'all' ? [] : rows.filter((row) => inWeek(row.logged_at, now, scope - 1));
  const term = normalize(query);
  const matching = [...scoped]
    .sort((a, b) => Date.parse(b.logged_at) - Date.parse(a.logged_at))
    .filter((row) => (filter === 'all' || (filter === 'pending' ? row.status === 'pending_review' : row.status !== 'pending_review'))
      && (!term || normalize(`${row.slot} ${row.description ?? ''} ${row.foods.join(' ')} ${statusLabel(row.status)}`).includes(term)));
  const pages = Math.max(1, Math.ceil(matching.length / pageSize));
  const current = Math.min(Math.max(1, page), pages);
  const totals = diaryMacroTotals(scoped);
  const before = diaryMacroTotals(previous);
  return {
    rows: matching.slice((current - 1) * pageSize, current * pageSize),
    matching: matching.length,
    total: scoped.length,
    page: current,
    pages,
    counts: {
      all: scoped.length,
      pending: scoped.filter((row) => row.status === 'pending_review').length,
      reviewed: scoped.filter((row) => row.status !== 'pending_review').length,
    },
    totals,
    trend: scope === 'all' ? null : {
      kcal: weekTrend(totals.kcal, before.kcal),
      carbs_g: weekTrend(totals.carbs_g, before.carbs_g),
      protein_g: weekTrend(totals.protein_g, before.protein_g),
      fat_g: weekTrend(totals.fat_g, before.fat_g),
    },
  };
}

/** Badge Category - Meal Time: Breakfast Green, Lunch Saffron, Snacks Orange, Dinner Gray-Line. */
export function slotTone(slot: string): 'green' | 'saffron' | 'orange' | 'gray' | 'mint' {
  const key = normalize(slot);
  if (key.startsWith('desayuno')) return 'green';
  if (key.startsWith('almuerzo')) return 'saffron';
  if (key.startsWith('merienda') || key.startsWith('colacion') || key.startsWith('snack')) return 'orange';
  if (key.startsWith('cena')) return 'gray';
  return 'mint';
}

const PAGE_SIZES = [12, 24, 48];
const FILTER_LABEL: Record<PatientDiaryFilter, string> = { all: 'Todos', pending: 'En revisión', reviewed: 'Revisadas' };
const numberFmt = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
const pctFmt = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2, minimumFractionDigits: 0 });
const dateFmt = (iso: string) => { const date = new Date(iso); return Number.isNaN(date.getTime()) ? iso : localDateId(date); };
const timeFmt = (iso: string) => { const date = new Date(iso); return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }); };

function pageList(page: number, pages: number): Array<number | 'gap'> {
  if (pages <= 5) return Array.from({ length: pages }, (_, index) => index + 1);
  const set = new Set([1, 2, 3, pages, page]);
  const sorted = [...set].filter((value) => value >= 1 && value <= pages).sort((a, b) => a - b);
  return sorted.flatMap((value, index) => index > 0 && value - sorted[index - 1] > 1 ? ['gap' as const, value] : [value]);
}

/** Button Picker (2:3507): ícono, texto 11 medium, caret; el select nativo va encima. */
function Picker({ icon, label, ariaLabel, value, onChange, options, className = '' }: {
  icon?: ReactNode; label: string; ariaLabel: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>; className?: string;
}) {
  return <label className={`nvfd-picker ${className}`}>
    {icon}<span>{label}</span><CaretDown size={14} aria-hidden="true" />
    <select aria-label={ariaLabel} value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
  </label>;
}

function DiaryStat({ label, value, unit, tone, icon, trend, scopeLabel }: { label: string; value: number; unit: string; tone: string; icon: ReactNode; trend: number | null | undefined; scopeLabel: string }) {
  return <article className="nvfd-stat">
    <span className={`nvfd-stat-icon ${tone}`} aria-hidden="true">{icon}</span>
    <div>
      <p>{label}</p>
      <p className="nvfd-stat-amount"><strong>{numberFmt.format(value)}</strong><small>{unit}</small></p>
      <p className="nvfd-stat-trend">{trend === null || trend === undefined
        ? <span>{scopeLabel}</span>
        : <><b>{trend >= 0 ? <TrendUp size={14} aria-hidden="true" /> : <TrendDown size={14} aria-hidden="true" />}{`${trend > 0 ? '+' : ''}${pctFmt.format(trend)}%`}</b><span>vs semana pasada</span></>}</p>
    </div>
  </article>;
}

export function FoodDiaryBoard({ rows, now, audience, query, defaultScope, onAdd, onReview, patientPicker, emptyWeekTitle }: {
  rows: readonly DiaryRow[];
  now: Date;
  audience: 'patient' | 'professional';
  query: string;
  defaultScope: DiaryScope;
  onAdd?: () => void;
  onReview?: (id: string) => void;
  patientPicker?: ReactNode;
  emptyWeekTitle: string;
}) {
  const [term, setTerm] = useState(query);
  const [filter, setFilter] = useState<PatientDiaryFilter>('all');
  const [scope, setScope] = useState<DiaryScope>(defaultScope);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  useEffect(() => { setTerm(query); }, [query]);
  useEffect(() => { setPage(1); }, [term, filter, scope, pageSize, rows]);
  const bounds = useMemo(() => diaryWeekBounds(rows.map((row) => row.logged_at), now), [rows, now]);
  const table = useMemo(() => buildDiaryTable(rows, { now, scope, filter, query: term, page, pageSize }), [rows, now, scope, filter, term, page, pageSize]);
  const pro = audience === 'professional';
  const weekOptions = [
    ...Array.from({ length: 1 - bounds.minOffset }, (_, index) => {
      const offset = -index;
      return { value: String(offset), label: offset === 0 ? 'Esta semana' : offset === -1 ? 'Semana anterior' : diaryWeekRange(now, offset).label };
    }),
    { value: 'all', label: 'Todo el historial' },
  ];
  const scopeLabel = weekOptions.find((option) => option.value === String(scope))?.label ?? 'Esta semana';
  const statScope = scope === 'all' ? 'En todo el historial' : scope === 0 ? 'En esta semana' : 'En la semana elegida';
  const emptyScoped = table.total === 0;

  return <div className="nvfd">
    <section className="nvfd-stats" aria-label="Resumen del diario">
      <DiaryStat label="Calorías totales" value={table.totals.kcal} unit="kcal" tone="green" icon={<Fire size={24} />} trend={table.trend?.kcal} scopeLabel={statScope} />
      <DiaryStat label="Carbohidratos totales" value={table.totals.carbs_g} unit="g" tone="saffron" icon={<Bread size={24} />} trend={table.trend?.carbs_g} scopeLabel={statScope} />
      <DiaryStat label="Proteínas totales" value={table.totals.protein_g} unit="g" tone="orange" icon={<Fish size={24} />} trend={table.trend?.protein_g} scopeLabel={statScope} />
      <DiaryStat label="Grasas totales" value={table.totals.fat_g} unit="g" tone="gray" icon={<Drop size={24} />} trend={table.trend?.fat_g} scopeLabel={statScope} />
    </section>

    <section className="nvfd-widget" aria-label={pro ? 'Historial de comidas' : 'Registros del diario'}>
      <header className="nvfd-head">
        <div className="nvfd-head-left">
          <label className="nvfd-search"><MagnifyingGlass size={14} aria-hidden="true" /><input type="search" aria-label="Buscar comidas" placeholder="Buscar comidas" value={term} onChange={(event) => setTerm(event.target.value)} /></label>
          <Picker className="nvfd-filter" icon={<Funnel size={14} aria-hidden="true" />} label={filter === 'all' ? 'Filtrar' : FILTER_LABEL[filter]} ariaLabel="Filtrar registros" value={filter} onChange={(value) => setFilter(value as PatientDiaryFilter)}
            options={(['all', 'pending', 'reviewed'] as const).map((id) => ({ value: id, label: `${FILTER_LABEL[id]} (${table.counts[id]})` }))} />
        </div>
        <div className="nvfd-head-right">
          {patientPicker}
          <Picker icon={<CalendarBlank size={14} aria-hidden="true" />} label={scopeLabel} ariaLabel="Semana del diario" value={String(scope)} onChange={(value) => setScope(value === 'all' ? 'all' : Number(value))} options={weekOptions} />
          {onAdd && <button type="button" className="nvfd-cta" onClick={onAdd}><Plus size={14} aria-hidden="true" />Registrar comida</button>}
        </div>
      </header>

      {table.rows.length ? <div className="nvfd-scroll"><div className={`nvfd-table${pro ? ' nvfd-pro' : ''}`} role="table" aria-label={pro ? 'Historial de comidas' : 'Registros del diario'}>
        <div className="nvfd-row nvfd-row-head" role="row">
          <span role="columnheader">Fecha y hora</span>
          <span role="columnheader">Momento</span>
          <span role="columnheader">Comida</span>
          <span role="columnheader">Calorías</span>
          <span role="columnheader" className="nvfd-macro-head">Macronutrientes<span><i>Carb.</i><i>Prot.</i><i>Grasas</i></span></span>
          <span role="columnheader">Estado</span>
          {pro && <span role="columnheader">Nota IA</span>}
          {pro && <span role="columnheader"><span className="nvfd-sr">Acción</span></span>}
        </div>
        {table.rows.map((row) => {
          const reviewed = row.status !== 'pending_review';
          const macros = reviewed ? row.macros : null;
          return <div role="row" key={row.id} className={`nvfd-row${reviewed ? '' : ' nvfd-pending'}`} data-diary-row={row.id}>
            <span role="cell" className="nvfd-date"><time dateTime={row.logged_at}>{dateFmt(row.logged_at)}</time><small>{timeFmt(row.logged_at)}</small></span>
            <span role="cell"><span className={`nvfd-slot ${slotTone(row.slot)}`}>{row.slot}</span></span>
            <span role="cell" className="nvfd-menu">
              <span>{row.description?.trim() || (row.foods.length ? row.foods.join(', ') : 'Sin descripción registrada')}</span>
              {reviewed && row.foods.length > 0 && Boolean(row.description?.trim()) && normalize(row.foods.join(', ')) !== normalize(row.description ?? '') && <small>Alimentos: {row.foods.join(', ')}</small>}
              {row.relation && row.relation !== 'unknown' && <small className={`nvfd-plan-tag ${row.relation}`}>{row.relation === 'planned' ? 'Del plan' : 'Fuera del plan'}</small>}
            </span>
            <span role="cell" className="nvfd-num">{macros ? <><b>{numberFmt.format(macros.kcal)}</b> kcal</> : <span title="Sin valores confirmados">—</span>}</span>
            <span role="cell" className="nvfd-macros">{(['carbs_g', 'protein_g', 'fat_g'] as const).map((key) => <span key={key}>{macros ? <><b>{numberFmt.format(macros[key])}</b> g</> : '—'}</span>)}</span>
            <span role="cell"><span className="nvfd-status" title={pro ? statusLabel(row.status) : row.status === 'adjusted' ? 'Tu nutricionista ajustó este registro' : row.status === 'confirmed' ? 'Tu nutricionista confirmó este registro' : statusLabel(row.status)}>{reviewed ? <CheckCircle size={14} aria-hidden="true" /> : <Clock size={14} aria-hidden="true" />}{reviewed ? statusLabel(row.status) : pro ? 'Pendiente' : 'En revisión'}</span></span>
            {pro && <span role="cell"><span className="nvfd-note" title={row.note || undefined}><Note size={14} aria-hidden="true" /><span>{row.note?.trim() || 'Sin nota'}</span></span></span>}
            {pro && <span role="cell" className="nvfd-action">{reviewed ? <small>Revisada</small> : <button type="button" className="nvfd-cta" onClick={() => onReview?.(row.id)}>Revisar</button>}</span>}
          </div>;
        })}
      </div></div> : <NvState
        title={emptyScoped && !term && filter === 'all' ? emptyWeekTitle : 'Sin registros para mostrar'}
        description={emptyScoped && !term && filter === 'all'
          ? (pro ? 'Las comidas enviadas por la paciente aparecerán acá.' : scope === 0 ? 'Todavía no registraste comidas esta semana.' : 'No hay registros en ese período. El diario no inventa historial.')
          : 'Usá otra búsqueda o cambiá el filtro.'} />}

      <footer className="nvfd-foot">
        <div className="nvfd-count"><span>Mostrando</span>
          <Picker label={String(pageSize)} ariaLabel="Registros por página" value={String(pageSize)} onChange={(value) => setPageSize(Number(value))} options={PAGE_SIZES.map((size) => ({ value: String(size), label: String(size) }))} />
          <span>de {table.matching}</span>
        </div>
        <nav className="nvfd-pages" aria-label="Páginas del diario">
          <button type="button" aria-label="Página anterior" disabled={table.page <= 1} onClick={() => setPage(table.page - 1)}><CaretLeft size={18} aria-hidden="true" /></button>
          {pageList(table.page, table.pages).map((value, index) => value === 'gap' ? <span key={`gap${index}`} aria-hidden="true">...</span>
            : <button type="button" key={value} aria-current={value === table.page ? 'page' : undefined} onClick={() => setPage(value)}>{value}</button>)}
          <button type="button" aria-label="Página siguiente" disabled={table.page >= table.pages} onClick={() => setPage(table.page + 1)}><CaretRight size={18} aria-hidden="true" /></button>
        </nav>
      </footer>
    </section>
  </div>;
}

export function ShowroomPatientDiary({ patient, query, now = new Date(), onLogMeal, patientId }: { patient: ShowroomPatient; query: string; now?: Date; onLogMeal: (slot?: string) => void; patientId?: string }) {
  const rows = useMemo<DiaryRow[]>(() => patient.logs.map((log) => {
    const review = patientVisibleReview(log);
    return {
      id: log.id,
      slot: log.slot,
      description: log.description,
      foods: review?.foods ?? [],
      macros: review?.macros ?? null,
      status: log.status,
      logged_at: log.logged_at,
      relation: mealLogPlanRelation(log, patient.weekPlan),
    };
  }), [patient]);
  return <section className="nvfd-page" aria-label="Tu diario de comidas">
    <FoodDiaryBoard key={patient.id} rows={rows} now={now} audience="patient" query={query} defaultScope={0} onAdd={() => onLogMeal('Almuerzo')} emptyWeekTitle="Sin registros esta semana" />
    {patientId ? <DayAssignedMeals patientId={patientId} /> : null}
  </section>;
}
