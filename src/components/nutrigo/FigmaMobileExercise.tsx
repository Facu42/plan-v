import { useMemo, useRef, useState } from 'react';
import type { PatientExerciseView, ExerciseCategory } from '../../types/exercise';
import type { ShowroomPatient } from './showroom-model';
import searchIcon from '../../assets/figma-mobile/501-22824-imgIconMagnifyingGlass.svg';
import moreIcon from '../../assets/figma-mobile/501-22824-imgIconDotsThree.svg';
import plusIcon from '../../assets/figma-mobile/501-22824-imgIconPlus.svg';
import sortIcon from '../../assets/figma-mobile/501-22824-imgIconSort.svg';
import squatIcon from '../../assets/figma-mobile/501-22824-imgIconSpecialPersonSimpleSquat.svg';
import deadliftIcon from '../../assets/figma-mobile/501-22824-imgIconSpecialPersonSimpleDeadlifts.svg';
import benchPressIcon from '../../assets/figma-mobile/501-22824-imgIconSpecialPersonSimpleBenchPress.svg';
import pullUpIcon from '../../assets/figma-mobile/501-22824-imgIconSpecialPersonSimplePullUps.svg';
import plankIcon from '../../assets/figma-mobile/501-22824-imgIconSpecialPersonSimplePlank.svg';
import bicepIcon from '../../assets/figma-mobile/501-22824-imgIconSpecialPersonSimpleBicepCurls.svg';
import lungeIcon from '../../assets/figma-mobile/501-22824-imgIconSpecialPersonSimpleLunges.svg';
import climberIcon from '../../assets/figma-mobile/501-22824-imgIconSpecialPersonSimpleMountClimbers.svg';
import bikeIcon from '../../assets/figma-mobile/501-22824-imgPersonSimpleBike.svg';
import runIcon from '../../assets/figma-mobile/501-22824-imgIconNavPersonSimpleRun.svg';
import yogaIcon from '../../assets/figma-mobile/501-22824-imgIconSpecialPersonYoga.svg';
import barbellIcon from '../../assets/figma-mobile/501-22824-imgIconSpecialBarbell.svg';
import facebookIcon from '../../assets/figma-mobile/427-14667-imgFacebookLogo.svg';
import twitterIcon from '../../assets/figma-mobile/427-14667-imgTwitterLogo.svg';
import instagramIcon from '../../assets/figma-mobile/427-14667-imgInstagramLogo.svg';
import youtubeIcon from '../../assets/figma-mobile/427-14667-imgYoutubeLogo.svg';
import linkedinIcon from '../../assets/figma-mobile/427-14667-imgLinkedinLogo.svg';
import './figma-mobile-exercise.css';

type ExerciseRow = {
  id: string;
  name: string;
  category: ExerciseCategory | 'activity';
  sets: number | null;
  reps: number | null;
  rest: number | null;
  status: string;
  assignmentId: string | null;
  canFeedback: boolean;
};

const categoryIcon: Record<ExerciseCategory | 'activity', string> = {
  movilidad: yogaIcon, fuerza: barbellIcon, cardio: runIcon,
  equilibrio: yogaIcon, otro: barbellIcon, activity: runIcon,
};
const namedIcons: Array<[RegExp, string]> = [
  [/sentadilla|squat/i, squatIcon], [/peso muerto|deadlift/i, deadliftIcon],
  [/press de banca|bench press/i, benchPressIcon], [/dominada|pull.?up/i, pullUpIcon],
  [/plancha|plank/i, plankIcon], [/bíceps|bicep/i, bicepIcon],
  [/zancada|lunge/i, lungeIcon], [/escalador|mountain climber/i, climberIcon],
  [/bici|bicicleta|bike|cycling/i, bikeIcon],
];
const iconFor = (row: ExerciseRow) => namedIcons.find(([match]) => match.test(row.name))?.[1] ?? categoryIcon[row.category];

export function FigmaMobileExercise({ patient, view, loading, error, busy, onFeedback, onAddActivity }: {
  patient: ShowroomPatient;
  view: PatientExerciseView;
  loading: boolean;
  error: string;
  busy: boolean;
  onFeedback: (assignmentId: string, sets: number, reps: number, note: string) => Promise<boolean>;
  onAddActivity: (activity: string, durationMinutes: number, intensity: 'suave' | 'moderada' | 'intensa') => Promise<boolean>;
}) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'assigned' | 'name' | 'status'>('assigned');
  const [menuOpen, setMenuOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [activityName, setActivityName] = useState('');
  const [duration, setDuration] = useState('30');
  const [intensity, setIntensity] = useState<'suave' | 'moderada' | 'intensa'>('moderada');
  const [feedbackRow, setFeedbackRow] = useState<ExerciseRow | null>(null);
  const [note, setNote] = useState('');
  const tableRef = useRef<HTMLDivElement>(null);
  const [scrollRatio, setScrollRatio] = useState(0);

  const rows = useMemo<ExerciseRow[]>(() => {
    const assigned = view.assignments.flatMap((assignment) => assignment.items.map((item) => ({
      id: item.id, name: item.name, category: item.category, sets: item.sets, reps: item.reps,
      rest: item.rest_seconds, status: assignment.status === 'active' ? 'Asignado' : assignment.status === 'completed' ? 'Completado' : 'Pausado',
      assignmentId: assignment.id, canFeedback: assignment.status === 'active',
    })));
    const activities = (view.activities.length ? view.activities : patient.activities).map((entry) => ({
      id: `activity-${entry.id}`, name: 'activity' in entry ? entry.activity : '', category: 'activity' as const,
      sets: 'sets' in entry && typeof entry.sets === 'number' ? entry.sets : null,
      reps: 'reps' in entry && typeof entry.reps === 'number' ? entry.reps : null, rest: null,
      status: 'Registrado', assignmentId: null, canFeedback: false,
    }));
    return [...assigned, ...activities];
  }, [view.assignments, view.activities, patient.activities]);

  const visible = rows.filter((row) => row.name.toLocaleLowerCase('es-AR').includes(query.trim().toLocaleLowerCase('es-AR')));
  if (sort === 'name') visible.sort((a, b) => a.name.localeCompare(b.name, 'es-AR'));
  if (sort === 'status') visible.sort((a, b) => a.status.localeCompare(b.status, 'es-AR') || a.name.localeCompare(b.name, 'es-AR'));

  const sendFeedback = async () => {
    if (!feedbackRow?.assignmentId) return;
    const saved = await onFeedback(feedbackRow.assignmentId, feedbackRow.sets ?? 0, feedbackRow.reps ?? 0, note);
    if (!saved) return;
    setFeedbackRow(null);
    setNote('');
  };
  const addActivity = async () => {
    const minutes = Number(duration);
    if (!activityName.trim() || !Number.isInteger(minutes) || minutes < 1 || minutes > 600) return;
    const saved = await onAddActivity(activityName.trim(), minutes, intensity);
    if (!saved) return;
    setAddOpen(false);
    setActivityName('');
    setDuration('30');
  };

  return <div className="fmex" data-figma-frame="501:22824" aria-label="Ejercicio">
    <div className="fmex-toolbar" data-figma-node="501:23671">
      <label className="fmex-search"><img src={searchIcon} alt="" /><input type="search" placeholder="Buscar ejercicio" aria-label="Buscar ejercicio" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <div className="fmex-more"><button type="button" aria-label="Opciones de ejercicios" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><img src={moreIcon} alt="" /></button>{menuOpen && <div className="fmex-popover" role="group" aria-label="Ordenar ejercicios"><button type="button" onClick={() => { setSort('assigned'); setMenuOpen(false); }}>Orden de asignación</button><button type="button" onClick={() => { setSort('name'); setMenuOpen(false); }}>Nombre</button><button type="button" onClick={() => { setSort('status'); setMenuOpen(false); }}>Estado</button></div>}</div>
      <button type="button" className="fmex-add" onClick={() => setAddOpen(true)}><img src={plusIcon} alt="" />Agregar ejercicio</button>
    </div>
    {error && <p className="fmex-notice" role="alert">{error}</p>}
    <div className="fmex-table-shell" data-figma-node="501:23703">
    <div className="fmex-table-scroll" ref={tableRef} role="region" aria-label="Tabla de ejercicios" tabIndex={0} onScroll={(event) => { const element = event.currentTarget; setScrollRatio(element.scrollLeft / Math.max(1, element.scrollWidth - element.clientWidth)); }}>
      <div className="fmex-table" role="table" aria-label="Ejercicios y actividad">
        <div className="fmex-row fmex-head" role="row" data-figma-node="501:23704">
          {['Ejercicio', 'Series', 'Reps', 'Pausa', 'Peso', 'Calorías', 'Estado'].map((label) => <span key={label} role="columnheader">{label}<img src={sortIcon} alt="" /></span>)}
        </div>
        {visible.map((row) => <div className="fmex-row" role="row" key={row.id}>
          <span className="fmex-name" role="cell"><i data-category={row.category}><img src={iconFor(row)} alt="" /></i><span>{row.name}</span></span>
          <span role="cell">{row.sets ?? '—'}</span>
          <span role="cell">{row.reps == null ? '—' : <>{row.reps} <small>reps</small></>}</span>
          <span role="cell">{row.rest == null ? '—' : <>{row.rest} <small>s</small></>}</span>
          <span role="cell">—</span><span role="cell">—</span>
          <span role="cell"><button type="button" className="fmex-status" data-status={row.status} disabled={!row.canFeedback} onClick={() => { setFeedbackRow(row); setNote(''); }}>{row.status}</button></span>
        </div>)}
        {!visible.length && <div className="fmex-empty" role="row"><span role="cell">{loading ? 'Cargando ejercicios…' : query ? 'No hay ejercicios para esta búsqueda.' : 'Todavía no hay ejercicios asignados ni actividad registrada.'}</span></div>}
      </div>
    </div>
    <div className="fmex-scrollbar" data-figma-node="501:24018" aria-hidden="true" onClick={(event) => { const rect = event.currentTarget.getBoundingClientRect(); const next = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)); tableRef.current?.scrollTo({ left: next * ((tableRef.current?.scrollWidth ?? 0) - (tableRef.current?.clientWidth ?? 0)), behavior: 'smooth' }); }}><span style={{ transform: `translateX(${scrollRatio * 96}px)` }} /></div>
    </div>
    <footer className="fmex-footer" data-figma-node="501:23221"><strong>Copyright © {new Date().getFullYear()} Plan V</strong><span>Privacidad　 Condiciones　 Contacto</span><span aria-hidden="true">{[facebookIcon, twitterIcon, instagramIcon, youtubeIcon, linkedinIcon].map((src) => <img key={src} src={src} alt="" />)}</span></footer>
    {addOpen && <div className="fmex-modal" role="dialog" aria-modal="true" aria-label="Agregar actividad" onKeyDown={(event) => { if (event.key === 'Escape') setAddOpen(false); }}><form onSubmit={(event) => { event.preventDefault(); void addActivity(); }}><h2>Agregar actividad</h2><label>Actividad<input value={activityName} minLength={2} maxLength={80} required autoFocus onChange={(event) => setActivityName(event.target.value)} placeholder="Ej. Caminata" /></label><label>Duración en minutos<input type="number" min="1" max="600" required value={duration} onChange={(event) => setDuration(event.target.value)} /></label><label>Intensidad<select value={intensity} onChange={(event) => setIntensity(event.target.value as typeof intensity)}><option value="suave">Suave</option><option value="moderada">Moderada</option><option value="intensa">Intensa</option></select></label><div><button type="button" onClick={() => setAddOpen(false)}>Cancelar</button><button type="submit" disabled={busy}>Guardar actividad</button></div></form></div>}
    {feedbackRow && <div className="fmex-modal" role="dialog" aria-modal="true" aria-label="Registrar series hechas" onKeyDown={(event) => { if (event.key === 'Escape') setFeedbackRow(null); }}><form onSubmit={(event) => { event.preventDefault(); void sendFeedback(); }}><h2>{feedbackRow.name}</h2><p>{feedbackRow.sets} series · {feedbackRow.reps} repeticiones</p><label>Cómo te sentiste<input value={note} maxLength={500} onChange={(event) => setNote(event.target.value)} /></label><div><button type="button" onClick={() => setFeedbackRow(null)}>Cancelar</button><button type="submit" disabled={busy}>Registrar series hechas</button></div></form></div>}
  </div>;
}
