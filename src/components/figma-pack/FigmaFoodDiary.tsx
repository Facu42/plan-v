import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { buildPatientDiaryView, type PatientDiaryFilter } from '../nutrigo/ShowroomPatientDiary';
import type { ShowroomPatient } from '../nutrigo/showroom-model';

type DiaryContextValue = {
  view: ReturnType<typeof buildPatientDiaryView>;
  pageLogs: ShowroomPatient['logs'];
  page: number;
  pages: number;
  setPage: (value: number) => void;
  filter: PatientDiaryFilter;
  setFilter: (value: PatientDiaryFilter) => void;
  search: string;
  setSearch: (value: string) => void;
  weekOffset: number;
  setWeekOffset: (value: number) => void;
  confirmed: { count: number; kcal: number; carbs: number; protein: number; fat: number };
  onLogMeal: (slot?: string) => void;
};
const DiaryContext = createContext<DiaryContextValue | null>(null);
const pageSize = 12;

export function FigmaFoodDiaryProvider({ patient, now = new Date(), onLogMeal, children }: {
  patient: ShowroomPatient;
  now?: Date;
  onLogMeal: (slot?: string) => void;
  children: ReactNode;
}) {
  const [filter, setFilterState] = useState<PatientDiaryFilter>('all');
  const [search, setSearchState] = useState('');
  const [weekOffset, setWeekOffsetState] = useState(0);
  const [page, setPageState] = useState(1);
  const view = useMemo(() => buildPatientDiaryView(patient, search, filter, now, weekOffset), [patient, search, filter, now, weekOffset]);
  const allWeekLogs = useMemo(() => buildPatientDiaryView(patient, '', 'all', now, weekOffset).logs, [patient, now, weekOffset]);
  const confirmed = useMemo(() => allWeekLogs.filter((log) => log.status !== 'pending_review' && log.macros).reduce((total, log) => ({
    count: total.count + 1,
    kcal: total.kcal + (log.macros?.kcal ?? 0),
    carbs: total.carbs + (log.macros?.carbs_g ?? 0),
    protein: total.protein + (log.macros?.protein_g ?? 0),
    fat: total.fat + (log.macros?.fat_g ?? 0),
  }), { count: 0, kcal: 0, carbs: 0, protein: 0, fat: 0 }), [allWeekLogs]);
  const pages = Math.max(1, Math.ceil(view.logs.length / pageSize));
  const safePage = Math.min(page, pages);
  const pageLogs = view.logs.slice((safePage - 1) * pageSize, safePage * pageSize);
  const resetPage = () => setPageState(1);
  return <DiaryContext.Provider value={{
    view, pageLogs, page: safePage, pages, setPage: (value) => setPageState(Math.max(1, Math.min(pages, value))),
    filter, setFilter: (value) => { setFilterState(value); resetPage(); },
    search, setSearch: (value) => { setSearchState(value); resetPage(); },
    weekOffset, setWeekOffset: (value) => { setWeekOffsetState(Math.max(view.bounds.minOffset, Math.min(view.bounds.maxOffset, value))); resetPage(); },
    confirmed, onLogMeal,
  }}>{children}</DiaryContext.Provider>;
}

function useDiary() {
  const context = useContext(DiaryContext);
  if (!context) throw new Error('FigmaFoodDiaryProvider is required');
  return context;
}

const metricConfig = {
  kcal: { label: 'Calorías confirmadas', unit: 'kcal', color: '#c2e66e' },
  carbs: { label: 'Carbohidratos', unit: 'g', color: '#ffcb65' },
  protein: { label: 'Proteínas', unit: 'g', color: '#ffa257' },
  fat: { label: 'Grasas', unit: 'g', color: '#e1e1e2' },
} as const;
export function FigmaDiaryMetric({ kind, icon }: { kind: keyof typeof metricConfig; icon: string }) {
  const diary = useDiary();
  const config = metricConfig[kind];
  return <div className="figma-diary-metric"><span className="figma-diary-metric-icon" style={{ background: config.color }} aria-hidden="true"><img src={icon} alt="" /></span><div><small>{config.label}</small><strong>{diary.confirmed.count ? diary.confirmed[kind].toLocaleString('es-AR') : '—'} <span>{config.unit}</span></strong><p>{diary.confirmed.count ? `${diary.confirmed.count} ${diary.confirmed.count === 1 ? 'comida revisada' : 'comidas revisadas'}` : 'Sin valores revisados'}</p></div></div>;
}

export function FigmaDiaryToolbar({ variant }: { variant: 'desktop' | 'tablet' | 'mobile' }) {
  const diary = useDiary();
  const [filtersOpen, setFiltersOpen] = useState(false);
  if (variant === 'mobile') return <div className="figma-diary-mobile-toolbar">
    <input type="search" value={diary.search} onChange={(event) => diary.setSearch(event.target.value)} placeholder="Buscar comida" aria-label="Buscar comida" />
    <button type="button" className="figma-diary-mobile-filter" aria-label="Filtros y semana" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)}><img src="/figma/screens/FoodDiaryMobile/055c8.svg" alt="" /></button>
    <button type="button" className="figma-diary-mobile-add" aria-label="Registrar comida" onClick={() => diary.onLogMeal('Almuerzo')}>+ Añadir</button>
    {filtersOpen && <div className="figma-diary-mobile-popover"><div className="figma-diary-week"><button type="button" aria-label="Semana anterior" disabled={diary.weekOffset <= diary.view.bounds.minOffset} onClick={() => diary.setWeekOffset(diary.weekOffset - 1)}>‹</button><span>{diary.view.week.isCurrent ? 'Esta semana' : diary.view.week.label}</span><button type="button" aria-label="Semana siguiente" disabled={diary.weekOffset >= diary.view.bounds.maxOffset} onClick={() => diary.setWeekOffset(diary.weekOffset + 1)}>›</button></div><label>Registros<select value={diary.filter} onChange={(event) => diary.setFilter(event.target.value as PatientDiaryFilter)}><option value="all">Todos</option><option value="pending">Pendientes</option><option value="reviewed">Revisadas</option></select></label></div>}
  </div>;
  return <div className={`figma-diary-toolbar figma-diary-toolbar-${variant}`}>
    <div className="figma-diary-week"><h2>Diario de comidas</h2><button type="button" aria-label="Semana anterior" disabled={diary.weekOffset <= diary.view.bounds.minOffset} onClick={() => diary.setWeekOffset(diary.weekOffset - 1)}>‹</button><span>{diary.view.week.isCurrent ? 'Esta semana' : diary.view.week.label}</span><button type="button" aria-label="Semana siguiente" disabled={diary.weekOffset >= diary.view.bounds.maxOffset} onClick={() => diary.setWeekOffset(diary.weekOffset + 1)}>›</button></div>
    <div className="figma-diary-toolbar-actions"><input type="search" value={diary.search} onChange={(event) => diary.setSearch(event.target.value)} placeholder="Buscar comida" aria-label="Buscar comida" /><select value={diary.filter} onChange={(event) => diary.setFilter(event.target.value as PatientDiaryFilter)} aria-label="Filtrar registros"><option value="all">Todos</option><option value="pending">Pendientes</option><option value="reviewed">Revisadas</option></select><button type="button" onClick={() => diary.onLogMeal('Almuerzo')}>+ Registrar comida</button></div>
  </div>;
}

const rowDate = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const statusLabel = (log: ShowroomPatient['logs'][number]) => log.status === 'pending_review'
  ? (log.analysis_status === 'failed' ? 'Análisis no disponible' : 'Pendiente de revisión')
  : log.status === 'adjusted' ? 'Ajustada' : 'Confirmada';

export function FigmaDiaryTable() {
  const diary = useDiary();
  return <div className="figma-diary-table-scroll"><table><thead><tr><th>Fecha y hora</th><th>Categoría</th><th>Comida</th><th>Cantidad</th><th>Calorías</th><th>Carbohidratos</th><th>Proteínas</th><th>Grasas</th><th>Azúcar</th><th>Estado</th></tr></thead><tbody>{diary.pageLogs.map((log) => {
    const macros = log.status !== 'pending_review' ? log.macros : null;
    return <tr key={log.id}><td><time dateTime={log.logged_at}>{rowDate.format(new Date(log.logged_at))}</time></td><td><span className="figma-diary-slot">{log.slot}</span></td><td><strong>{log.description || 'Sin descripción registrada'}</strong></td><td>—</td><td>{macros ? `${macros.kcal} kcal` : '—'}</td><td>{macros ? `${macros.carbs_g} g` : '—'}</td><td>{macros ? `${macros.protein_g} g` : '—'}</td><td>{macros ? `${macros.fat_g} g` : '—'}</td><td>—</td><td><span className={`figma-diary-status ${log.status}`}>{statusLabel(log)}</span></td></tr>;
  })}</tbody></table>{!diary.pageLogs.length && <div className="figma-diary-empty"><strong>{diary.view.emptyKind === 'week' ? 'Sin registros esta semana' : 'Sin registros para mostrar'}</strong><span>{diary.view.emptyKind === 'week' ? 'Registrá una comida para empezar tu diario.' : 'Probá con otra búsqueda o filtro.'}</span></div>}</div>;
}

export function FigmaDiaryPagination() {
  const diary = useDiary();
  return <div className="figma-diary-pagination"><span>Mostrando {diary.pageLogs.length} de {diary.view.logs.length}</span><div><button type="button" aria-label="Página anterior" disabled={diary.page === 1} onClick={() => diary.setPage(diary.page - 1)}>‹</button><span>Página {diary.page} de {diary.pages}</span><button type="button" aria-label="Página siguiente" disabled={diary.page === diary.pages} onClick={() => diary.setPage(diary.page + 1)}>›</button></div></div>;
}
