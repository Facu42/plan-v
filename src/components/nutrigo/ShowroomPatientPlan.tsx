import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CaretDown, CaretLeft, CaretRight, Funnel, MagnifyingGlass, ShoppingCart, Swap, X } from '@phosphor-icons/react';
import { careErrorMessage } from '../../api/care';
import { isAbortError } from '../../api/client';
import { plansApi } from '../../api/plans';
import type { PatientMealPlan, PlanItemView } from '../../types/plans';
import { CarePanel } from './CarePanel';
import { PlanPublishedItem } from './MealPlanVersions';
import { mealSlotTone, NvBadge, NvState } from './primitives';
import type { ShowroomPatient } from './showroom-model';
import './plan-fig.css';
import facebookFigma from '../../assets/figma-mobile/427-14667-imgFacebookLogo.svg';
import twitterFigma from '../../assets/figma-mobile/427-14667-imgTwitterLogo.svg';
import instagramFigma from '../../assets/figma-mobile/427-14667-imgInstagramLogo.svg';
import youtubeFigma from '../../assets/figma-mobile/427-14667-imgYoutubeLogo.svg';
import linkedinFigma from '../../assets/figma-mobile/427-14667-imgLinkedinLogo.svg';
import './figma-mobile-plan.css';

/* Meal Plan del .fig (84:2994 escritorio, 470:15300 móvil): barra Cream-BG con mes, búsqueda,
 * filtro y CTA verde; debajo, la tabla semanal: una fila por día y una columna por momento. */

export const WEEK_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const;

export type PlanTone = 'breakfast' | 'lunch' | 'snack' | 'dinner';
export type PlanColumn = { slot: string; tone: PlanTone; optional?: boolean };

// Breakfast/Lunch/Snack/Dinner del archivo → momentos de Plan V. Colación y Extra sólo aparecen si se usan.
export const PLAN_COLUMNS: readonly PlanColumn[] = [
  { slot: 'Desayuno', tone: 'breakfast' },
  { slot: 'Colación', tone: 'snack', optional: true },
  { slot: 'Almuerzo', tone: 'lunch' },
  { slot: 'Merienda', tone: 'snack' },
  { slot: 'Cena', tone: 'dinner' },
  { slot: 'Extra', tone: 'dinner', optional: true },
];

export type PlanWeekDay = { day: string; date: Date; isoDate: string; isToday: boolean };
export type PlanCell = { slot: string; title: string; source: 'template' | 'dated'; item?: PlanItemView };
export type PlanRow = PlanWeekDay & { dated: boolean; cells: Record<string, PlanCell | undefined> };

function noon(date: Date, days = 0): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, 12);
}

export function isoOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function mondayOf(date: Date): Date {
  return noon(date, -((date.getDay() + 6) % 7));
}

export function planWeek(now: Date, offset = 0): PlanWeekDay[] {
  const start = noon(mondayOf(now), offset * 7);
  const today = isoOf(now);
  return WEEK_DAYS.map((day, index) => {
    const date = noon(start, index);
    return { day, date, isoDate: isoOf(date), isToday: isoOf(date) === today };
  });
}

/** Semanas (lunes) cuyo jueves cae en el mes: la regla ISO para numerar "Semana 1…5". */
export function monthWeeks(year: number, month: number): Date[] {
  let monday = mondayOf(new Date(year, month, 1, 12));
  if (noon(monday, 3).getMonth() !== month) monday = noon(monday, 7);
  const weeks: Date[] = [];
  while (noon(monday, 3).getMonth() === month) { weeks.push(monday); monday = noon(monday, 7); }
  return weeks;
}

function weekOffset(now: Date, monday: Date): number {
  return Math.round((noon(monday).getTime() - mondayOf(now).getTime()) / (7 * 86_400_000));
}

function capitalize(value: string): string {
  return value ? value.charAt(0).toLocaleUpperCase('es-AR') + value.slice(1) : value;
}

/** "los lunes", "los sábados": el plan semanal se repite por día de la semana. */
export function weekdayPlural(day: string): string {
  const lower = day.toLocaleLowerCase('es-AR');
  return lower.endsWith('s') ? lower : `${lower}s`;
}

export function planItemTitle(item: PlanItemView): string {
  return item.recipe?.title ?? item.recipe_title ?? item.free_text ?? item.slot;
}

/** Dentro del período de un plan fechado publicado manda esa copia (los días sin indicación quedan vacíos);
 * fuera del período, el plan semanal por día de la semana. Nada se completa por inferencia. */
export function buildWeekTable(
  weekPlan: ShowroomPatient['weekPlan'],
  published: Pick<PatientMealPlan, 'period_start' | 'period_end' | 'items'> | null,
  week: PlanWeekDay[],
): { rows: PlanRow[]; columns: PlanColumn[]; total: number } {
  const rows = week.map((day) => {
    const dated = Boolean(published && day.isoDate >= published.period_start && day.isoDate <= published.period_end);
    const cells: Record<string, PlanCell | undefined> = {};
    if (dated) {
      for (const item of published!.items.filter((entry) => entry.for_date === day.isoDate)) {
        cells[item.slot] = { slot: item.slot, title: planItemTitle(item), source: 'dated', item };
      }
    } else {
      for (const meal of weekPlan.filter((entry) => entry.day === day.day).flatMap((entry) => entry.meals)) {
        cells[meal.slot] = { slot: meal.slot, title: meal.title, source: 'template' };
      }
    }
    return { ...day, dated, cells };
  });
  const used = new Set(rows.flatMap((row) => Object.keys(row.cells)));
  const known = new Set(PLAN_COLUMNS.map((column) => column.slot));
  const columns: PlanColumn[] = [
    ...PLAN_COLUMNS.filter((column) => !column.optional || used.has(column.slot)),
    ...[...used].filter((slot) => !known.has(slot)).map((slot) => ({ slot, tone: 'dinner' as const })),
  ];
  return { rows, columns, total: rows.reduce((sum, row) => sum + Object.keys(row.cells).length, 0) };
}

export function matchesPlanSearch(cell: PlanCell, term: string): boolean {
  const clean = (value: string) => value.toLocaleLowerCase('es-AR').normalize('NFD').replace(/\p{M}/gu, '');
  return !term.trim() || clean(`${cell.slot} ${cell.title} ${cell.item?.public_note ?? ''}`).includes(clean(term.trim()));
}

/** Mes, semana y navegación de la barra: mismo estado para paciente y nutricionista. */
export function useWeekNav(now: Date) {
  const [offset, setOffset] = useState(0);
  const week = useMemo(() => planWeek(now, offset), [now, offset]);
  const thursday = week[3].date;
  const year = thursday.getFullYear();
  const month = thursday.getMonth();
  const weeks = monthWeeks(year, month);
  const weekIndex = Math.max(0, weeks.findIndex((monday) => isoOf(monday) === week[0].isoDate));
  const monthOptions = Array.from({ length: 13 }, (_, index) => {
    const first = new Date(now.getFullYear(), now.getMonth() + index - 6, 1, 12);
    const firstWeek = monthWeeks(first.getFullYear(), first.getMonth())[0];
    return { value: weekOffset(now, firstWeek), label: capitalize(first.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })), key: `${first.getFullYear()}-${first.getMonth()}` };
  });
  return {
    offset, setOffset, week,
    monthName: capitalize(thursday.toLocaleDateString('es-AR', { month: 'long' })),
    year,
    monthKey: `${year}-${month}`,
    monthOptions,
    weekIndex,
    weekOptions: weeks.map((monday, index) => ({ value: weekOffset(now, monday), label: `Semana ${index + 1}` })),
  };
}

export type WeekNav = ReturnType<typeof useWeekNav>;

export function PlanSheet({ title, onClose, wide = false, hideTitle = false, children }: { title: string; onClose: () => void; wide?: boolean; hideTitle?: boolean; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') close.current(); };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); previous?.focus?.(); };
  }, []);
  return <div className="pf-sheet-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className={`pf-sheet${wide ? ' pf-sheet-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={panel}>
      <header className="pf-sheet-head"><h2 className={hideTitle ? 'pf-visually-hidden' : undefined}>{title}</h2><button type="button" className="pf-icon-button" aria-label="Cerrar" onClick={onClose}><X size={18} /></button></header>
      <div className="pf-sheet-body">{children}</div>
    </div>
  </div>;
}

export function ColumnFilter({ columns, hidden, onToggle }: { columns: PlanColumn[]; hidden: ReadonlySet<string>; onToggle: (slot: string) => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  return <div className="pf-popover-root" ref={root}>
    <button type="button" className="pf-picker pf-collapse" aria-expanded={open} aria-haspopup="true" aria-label="Filtrar momentos" onClick={() => setOpen(!open)}>
      <span className="pf-picker-icon"><Funnel size={14} /></span><span className="pf-picker-text">Filtrar</span><span className="pf-picker-caret"><CaretDown size={14} /></span>
    </button>
    {open && <div className="pf-popover" role="group" aria-label="Momentos visibles">
      {columns.map((column) => <label key={column.slot}><input type="checkbox" checked={!hidden.has(column.slot)} onChange={() => onToggle(column.slot)} />{column.slot}</label>)}
    </div>}
  </div>;
}

export function PlanToolbar({ nav, search, onSearch, filter, extra, cta, label }: {
  nav: WeekNav;
  search: string;
  onSearch: (value: string) => void;
  filter: ReactNode;
  extra?: ReactNode;
  cta: ReactNode;
  label: string;
}) {
  const [searchOpen, setSearchOpen] = useState(Boolean(search));
  return <div className="pf-toolbar" role="toolbar" aria-label={label}>
    <div className="pf-toolbar-left">
      <div className="pf-nav-buttons">
        <button type="button" className="pf-icon-button" aria-label="Semana anterior" onClick={() => nav.setOffset(nav.offset - 1)}><CaretLeft size={18} /></button>
        <button type="button" className="pf-icon-button" aria-label="Semana siguiente" onClick={() => nav.setOffset(nav.offset + 1)}><CaretRight size={18} /></button>
      </div>
      <label className="pf-month">
        <span className="pf-month-title"><strong>{nav.monthName}</strong><span>{nav.year}</span></span>
        <CaretDown size={14} aria-hidden="true" />
        <select aria-label="Elegir mes" value={nav.monthOptions.find((option) => option.key === nav.monthKey)?.value ?? ''} onChange={(event) => nav.setOffset(Number(event.target.value))}>
          {!nav.monthOptions.some((option) => option.key === nav.monthKey) && <option value="">{nav.monthName} {nav.year}</option>}
          {nav.monthOptions.map((option) => <option key={option.key} value={option.value}>{option.label}</option>)}
        </select>
      </label>
    </div>
    <div className="pf-toolbar-right">
      <label className={`pf-search${searchOpen ? ' is-open' : ''}`}>
        <MagnifyingGlass size={14} aria-hidden="true" />
        <input type="search" aria-label="Buscar comidas" placeholder="Buscar comida" value={search} onChange={(event) => onSearch(event.target.value)} />
      </label>
      <button type="button" className="pf-icon-button pf-search-toggle" aria-label="Buscar comidas" aria-expanded={searchOpen} onClick={() => setSearchOpen(!searchOpen)}><MagnifyingGlass size={18} /></button>
      {filter}
      {extra}
      {cta}
    </div>
  </div>;
}

export function PlanWeekTable({ rows, columns, nav, label, renderCell }: {
  rows: PlanRow[];
  columns: PlanColumn[];
  nav: WeekNav;
  label: string;
  renderCell: (row: PlanRow, column: PlanColumn) => ReactNode;
}) {
  return <div className="pf-table-scroll">
    <div className="pf-table" role="table" aria-label={label} style={{ ['--pf-cols' as string]: columns.length }}>
      <div className="pf-row pf-head" role="row">
        <div className="pf-week" role="columnheader">
          <label className="pf-week-picker">
            <span>{nav.weekOptions[nav.weekIndex]?.label ?? 'Semana'}</span><CaretDown size={14} aria-hidden="true" />
            <select aria-label="Elegir semana" value={nav.weekOptions[nav.weekIndex]?.value ?? nav.offset} onChange={(event) => nav.setOffset(Number(event.target.value))}>
              {nav.weekOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>
        {columns.map((column) => <div className="pf-category" data-tone={column.tone} role="columnheader" key={column.slot}>{column.slot}</div>)}
      </div>
      {rows.map((row) => <div className="pf-row" role="row" key={row.isoDate} data-plan-day={row.day} aria-current={row.isToday ? 'date' : undefined}>
        <div className="pf-day" role="rowheader"><strong>{row.day}</strong><time dateTime={row.isoDate}>{row.date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }).replace('.', '')}</time></div>
        {columns.map((column) => <div className="pf-slot" role="cell" key={column.slot}>{renderCell(row, column)}</div>)}
      </div>)}
    </div>
  </div>;
}

export function PlanMealCell({ row, column, cell, dim, onOpen }: { row: PlanRow; column: PlanColumn; cell: PlanCell; dim?: boolean; onOpen: () => void }) {
  return <button type="button" className="pf-cell" data-tone={column.tone} data-dim={dim || undefined} data-source={cell.source} aria-label={`${row.day} · ${cell.slot}: ${cell.title}`} onClick={onOpen}>
    <span className="pf-cell-image" aria-hidden="true" />
    <span className="pf-cell-text"><span>{cell.title}</span></span>
  </button>;
}

export function PlanCellDetail({ row, cell, plan }: { row: PlanRow; cell: PlanCell; plan?: Pick<PatientMealPlan, 'version' | 'period_start' | 'period_end'> | null }) {
  return <div className="pf-detail">
    <div className="pf-detail-meta"><NvBadge tone={mealSlotTone(cell.slot)}>{cell.slot}</NvBadge><span>{row.day} {row.date.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}</span></div>
    {cell.item ? <>
      <PlanPublishedItem item={cell.item} />
      {plan && <p className="pf-detail-note">Plan publicado · revisión {plan.version}, del {plan.period_start} al {plan.period_end}.</p>}
    </> : <>
      <h3>{cell.title}</h3>
      <p className="pf-detail-note">Indicación del plan semanal para los {weekdayPlural(row.day)}. Sin cantidades ni porciones registradas.</p>
    </>}
  </div>;
}

export function usePublishedPlan(patientId: string, loader: (patientId: string, signal: AbortSignal) => Promise<PatientMealPlan | null>, refresh = 0) {
  const [plan, setPlan] = useState<PatientMealPlan | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    loader(patientId, controller.signal)
      .then((result) => { setPlan(result); setError(''); })
      .catch((caught) => { if (isAbortError(caught)) return; setPlan(null); setError(careErrorMessage(caught)); });
    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, refresh]);
  return { plan, error };
}

const loadPatientPlan = async (patientId: string, signal: AbortSignal) => (await plansApi.published(patientId, signal)).plan;

export function ShowroomPatientPlan({ patient, now, query, onShopping }: {
  patient: ShowroomPatient;
  now: Date;
  query: string;
  onShopping?: () => void;
}) {
  const nav = useWeekNav(now);
  const { plan, error } = usePublishedPlan(patient.id, loadPatientPlan);
  const [search, setSearch] = useState(query);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<{ row: PlanRow; cell: PlanCell } | null>(null);
  const [alternatives, setAlternatives] = useState(false);
  useEffect(() => setSearch(query), [query]);
  useEffect(() => { setOpen(null); setAlternatives(false); }, [patient.id]);

  const table = useMemo(() => buildWeekTable(patient.weekPlan, plan, nav.week), [patient.weekPlan, plan, nav.week]);
  const columns = table.columns.filter((column) => !hidden.has(column.slot));
  const hasAnyPlan = patient.weekPlan.some((day) => day.meals.length > 0) || Boolean(plan);

  const toolbar = <PlanToolbar
    nav={nav}
    label="Herramientas del plan"
    search={search}
    onSearch={setSearch}
    filter={<ColumnFilter columns={table.columns} hidden={hidden} onToggle={(slot) => setHidden((current) => { const next = new Set(current); if (next.has(slot)) next.delete(slot); else next.add(slot); return next; })} />}
    extra={<button type="button" className="pf-picker pf-collapse" aria-label="Pedir alternativas" onClick={() => setAlternatives(true)}><span className="pf-picker-icon"><Swap size={14} /></span><span className="pf-picker-text">Alternativas</span></button>}
    cta={<button type="button" className="pf-cta pf-collapse" aria-label="Lista de compras" onClick={onShopping}><span className="pf-cta-icon"><ShoppingCart size={18} /></span><span className="pf-cta-text">Lista de compras</span></button>}
  />;

  return <section className="pf-plan" aria-label="Tu plan semanal" data-figma-frame="470:15300">
    {toolbar}
    {error && <p className="pf-error" role="alert">{error}</p>}
    {hasAnyPlan ? <PlanWeekTable rows={table.rows} columns={columns} nav={nav} label="Plan semanal" renderCell={(row, column) => {
      const cell = row.cells[column.slot];
      if (!cell) return <div className="pf-cell pf-cell-empty" data-tone={column.tone}><span className="pf-cell-image" aria-hidden="true" /><span className="pf-cell-text"><span>Sin indicación</span></span></div>;
      return <PlanMealCell row={row} column={column} cell={cell} dim={!matchesPlanSearch(cell, search)} onOpen={() => setOpen({ row, cell })} />;
    }} /> : <NvState title="Tu plan está en preparación" description="Cuando tu nutricionista publique comidas, las vas a encontrar acá organizadas por día." />}
    <footer className="fmp-footer" data-figma-node="470:15469"><strong>Copyright © {now.getFullYear()} Plan V</strong><span>Privacidad　 Condiciones　 Contacto</span><span aria-hidden="true">{[facebookFigma, twitterFigma, instagramFigma, youtubeFigma, linkedinFigma].map((src) => <img key={src} src={src} alt="" width="20" height="20" />)}</span></footer>
    {open && <PlanSheet title={`${open.cell.slot} · ${open.row.day}`} onClose={() => setOpen(null)}><PlanCellDetail row={open.row} cell={open.cell} plan={open.cell.source === 'dated' ? plan : null} /></PlanSheet>}
    {alternatives && <PlanSheet title="Alternativas" wide onClose={() => setAlternatives(false)}><CarePanel patientId={patient.id} mode="menu" /></PlanSheet>}
  </section>;
}
