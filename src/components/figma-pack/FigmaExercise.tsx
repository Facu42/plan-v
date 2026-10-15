import { createContext, useContext, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { ShowroomPatient } from '../nutrigo/showroom-model';

type Entry = ShowroomPatient['activities'][number];
type Intensity = Entry['intensity'];
type ActivityInput = { activity: string; duration_minutes: number; intensity: Intensity; note?: string };
type ExerciseContextValue = {
  patient: ShowroomPatient;
  search: string;
  setSearch: (value: string) => void;
  intensity: 'all' | Intensity;
  setIntensity: (value: 'all' | Intensity) => void;
  period: 'week' | 'all';
  setPeriod: (value: 'week' | 'all') => void;
  sort: 'recent' | 'name';
  setSort: (value: 'recent' | 'name') => void;
  page: number;
  setPage: (value: number) => void;
  pages: number;
  rows: Entry[];
  count: number;
  formOpen: boolean;
  setFormOpen: (value: boolean) => void;
  onLogActivity: (entry: ActivityInput) => Promise<void> | void;
};
const ExerciseContext = createContext<ExerciseContextValue | null>(null);
const pageSize = 12;

export function FigmaExerciseProvider({ patient, now = new Date(), onLogActivity, children }: { patient: ShowroomPatient; now?: Date; onLogActivity: (entry: ActivityInput) => Promise<void> | void; children: ReactNode }) {
  const [search, setSearchState] = useState('');
  const [intensity, setIntensityState] = useState<'all' | Intensity>('all');
  const [period, setPeriodState] = useState<'week' | 'all'>('week');
  const [sort, setSortState] = useState<'recent' | 'name'>('recent');
  const [page, setPageState] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const visible = useMemo(() => {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return patient.activities.filter((entry) => entry.activity.toLocaleLowerCase('es-AR').includes(search.toLocaleLowerCase('es-AR'))
      && (intensity === 'all' || entry.intensity === intensity)
      && (period === 'all' || new Date(entry.logged_at) >= start && new Date(entry.logged_at) <= end))
      .sort((a, b) => sort === 'name' ? a.activity.localeCompare(b.activity, 'es-AR') : new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime());
  }, [patient.activities, search, intensity, period, sort, now]);
  const pages = Math.max(1, Math.ceil(visible.length / pageSize));
  const safePage = Math.min(page, pages);
  const reset = () => setPageState(1);
  return <ExerciseContext.Provider value={{ patient, search, setSearch: (value) => { setSearchState(value); reset(); }, intensity, setIntensity: (value) => { setIntensityState(value); reset(); }, period, setPeriod: (value) => { setPeriodState(value); reset(); }, sort, setSort: (value) => { setSortState(value); reset(); }, page: safePage, setPage: (value) => setPageState(Math.max(1, Math.min(pages, value))), pages, rows: visible.slice((safePage - 1) * pageSize, safePage * pageSize), count: visible.length, formOpen, setFormOpen, onLogActivity }}>{children}</ExerciseContext.Provider>;
}
function useExercise() {
  const context = useContext(ExerciseContext);
  if (!context) throw new Error('FigmaExerciseProvider is required');
  return context;
}
const intensityLabel: Record<Intensity, string> = { suave: 'Suave', moderada: 'Moderada', intensa: 'Intensa' };
const activityDate = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export function FigmaExerciseToolbar({ variant }: { variant: 'desktop' | 'tablet' | 'mobile' }) {
  const exercise = useExercise();
  const [moreOpen, setMoreOpen] = useState(false);
  return <div className={`figma-exercise-toolbar figma-exercise-toolbar-${variant}`}>
    <div className="figma-exercise-toolbar-primary"><input type="search" aria-label="Buscar ejercicio" placeholder="Buscar ejercicio" value={exercise.search} onChange={(event) => exercise.setSearch(event.target.value)} />{variant === 'mobile' && <button type="button" aria-expanded={moreOpen} aria-label="Filtros de ejercicio" onClick={() => setMoreOpen(!moreOpen)}>☰</button>}</div>
    {(variant !== 'mobile' || moreOpen) && <div className="figma-exercise-toolbar-filters"><select aria-label="Intensidad" value={exercise.intensity} onChange={(event) => exercise.setIntensity(event.target.value as 'all' | Intensity)}><option value="all">Todas las intensidades</option><option value="suave">Suave</option><option value="moderada">Moderada</option><option value="intensa">Intensa</option></select><select aria-label="Período" value={exercise.period} onChange={(event) => exercise.setPeriod(event.target.value as 'week' | 'all')}><option value="week">Esta semana</option><option value="all">Todo el historial</option></select><select aria-label="Ordenar ejercicios" value={exercise.sort} onChange={(event) => exercise.setSort(event.target.value as 'recent' | 'name')}><option value="recent">Más recientes</option><option value="name">Nombre</option></select></div>}
    <button className="figma-exercise-add" type="button" onClick={() => exercise.setFormOpen(true)}>+ Registrar actividad</button>
  </div>;
}

export function FigmaExerciseTable() {
  const exercise = useExercise();
  return <div className="figma-exercise-table-scroll"><table><thead><tr><th>Ejercicio</th><th>Duración</th><th>Intensidad</th><th>Fecha</th><th>Nota</th><th>Calorías</th><th>Estado</th></tr></thead><tbody>{exercise.rows.map((entry) => <tr key={entry.id}><td><span className="figma-exercise-icon" aria-hidden="true">♙</span><strong>{entry.activity}</strong></td><td>{entry.duration_minutes} min</td><td>{intensityLabel[entry.intensity]}</td><td><time dateTime={entry.logged_at}>{activityDate.format(new Date(entry.logged_at))}</time></td><td>{entry.note || '—'}</td><td>—</td><td><span className="figma-exercise-status">Registrada</span></td></tr>)}</tbody></table>{exercise.rows.length === 0 && <div className="figma-exercise-empty"><strong>{exercise.patient.activities.length === 0 ? 'Todavía no hay actividades registradas' : 'No hay coincidencias'}</strong><span>{exercise.patient.activities.length === 0 ? 'Usá “Registrar actividad” para agregar la primera.' : 'Probá con otros filtros o con todo el historial.'}</span></div>}</div>;
}

export function FigmaExercisePagination() {
  const exercise = useExercise();
  return <div className="figma-exercise-pagination"><span>Mostrando {exercise.rows.length} de {exercise.count}</span><div><button type="button" aria-label="Página anterior" disabled={exercise.page === 1} onClick={() => exercise.setPage(exercise.page - 1)}>‹</button><span>Página {exercise.page} de {exercise.pages}</span><button type="button" aria-label="Página siguiente" disabled={exercise.page === exercise.pages} onClick={() => exercise.setPage(exercise.page + 1)}>›</button></div></div>;
}

export function FigmaExerciseDialog() {
  const exercise = useExercise();
  const [activity, setActivity] = useState('');
  const [duration, setDuration] = useState('');
  const [intensity, setIntensity] = useState<Intensity>('moderada');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!exercise.formOpen) return null;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const minutes = Number(duration);
    if (activity.trim().length < 2 || !Number.isInteger(minutes) || minutes < 1 || minutes > 600) { setError('Ingresá una actividad y una duración entre 1 y 600 minutos.'); return; }
    setBusy(true); setError('');
    try { await exercise.onLogActivity({ activity: activity.trim(), duration_minutes: minutes, intensity, ...(note.trim() ? { note: note.trim() } : {}) }); exercise.setFormOpen(false); setActivity(''); setDuration(''); setNote(''); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo registrar la actividad.'); }
    finally { setBusy(false); }
  };
  return createPortal(<div className="figma-exercise-dialog-backdrop" role="presentation"><div className="figma-exercise-dialog" role="dialog" aria-modal="true" aria-labelledby="figma-exercise-form-title"><button className="figma-exercise-close" type="button" aria-label="Cerrar" onClick={() => exercise.setFormOpen(false)}>×</button><h2 id="figma-exercise-form-title">Registrar actividad</h2><form onSubmit={(event) => void submit(event)}><label>Actividad<input required minLength={2} maxLength={80} value={activity} onChange={(event) => setActivity(event.target.value)} /></label><label>Duración (minutos)<input required type="number" min={1} max={600} value={duration} onChange={(event) => setDuration(event.target.value)} /></label><label>Intensidad<select value={intensity} onChange={(event) => setIntensity(event.target.value as Intensity)}><option value="suave">Suave</option><option value="moderada">Moderada</option><option value="intensa">Intensa</option></select></label><label>Nota opcional<textarea maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} /></label>{error && <p role="alert">{error}</p>}<button type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar actividad'}</button></form></div></div>, document.body);
}
