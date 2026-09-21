import { useEffect, useState, type FormEvent } from 'react';
import { Icon } from '../shared/Icon';
import { CarePanel } from './CarePanel';
import { NvBadge, NvButton, NvState } from './primitives';
import type { ShowroomPatient } from './showroom-model';
import { exerciseApi } from '../../api/exercise';
import { isAbortError } from '../../api/client';
import { careErrorMessage } from '../../api/care';
import {
  EXERCISE_CATEGORY_LABELS,
  SEEDED_EXERCISES,
  type PatientExerciseView,
} from '../../types/exercise';
import './showroom-exercise.css';

type ActivityEntry = ShowroomPatient['activities'][number];
type Intensity = ActivityEntry['intensity'];

const intensityLabel: Record<Intensity, string> = { suave: 'Suave', moderada: 'Moderada', intensa: 'Intensa' };

export function buildActivitySummary(entries: readonly ActivityEntry[], now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 6);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const recent = entries.filter((entry) => {
    const at = new Date(entry.logged_at);
    return Number.isFinite(at.getTime()) && at >= start && at <= end;
  });
  return {
    sessions: recent.length,
    minutes: recent.reduce((total, entry) => total + entry.duration_minutes, 0),
    byIntensity: recent.reduce((total, entry) => {
      total[entry.intensity] += 1;
      return total;
    }, { suave: 0, moderada: 0, intensa: 0 } as Record<Intensity, number>),
  };
}

function formatActivityDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Fecha no disponible';
  return new Intl.DateTimeFormat('es-AR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
}

function emptySnapshot(patientId: string): PatientExerciseView {
  return {
    patient_id: patientId,
    can_assign: false,
    habilitation_verified: false,
    library: SEEDED_EXERCISES.map((entry) => ({ ...entry })),
    assignments: [],
    activities: [],
  };
}

export function ShowroomExercise({
  patient,
  professional = false,
  exercise: injected,
}: {
  patient: ShowroomPatient;
  now?: Date;
  professional?: boolean;
  exercise?: PatientExerciseView | null;
}) {
  const [remote, setRemote] = useState<PatientExerciseView | null>(injected ?? null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!injected);
  const [title, setTitle] = useState('Rutina de movilidad');
  const [selected, setSelected] = useState<string[]>([SEEDED_EXERCISES[0].id]);
  const [busy, setBusy] = useState(false);
  const [feedbackNote, setFeedbackNote] = useState('');

  useEffect(() => {
    if (injected) {
      setRemote(injected);
      setLoading(false);
      setError('');
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError('');
    exerciseApi.get(patient.id, professional, controller.signal).then((result) => {
      setRemote(result.exercise);
      setLoading(false);
    }).catch((failure) => {
      if (isAbortError(failure)) return;
      setRemote(null);
      setLoading(false);
      setError(careErrorMessage(failure));
    });
    return () => controller.abort();
  }, [patient.id, professional, injected]);

  const view = remote ?? emptySnapshot(patient.id);
  const assignedExercises = view.assignments.flatMap((row) => row.items);
  const library = professional ? view.library : view.library.filter((item) => assignedExercises.some((line) => line.exercise_id === item.id));
  const heading = professional ? `Ejercicio de ${patient.name}` : 'Tu actividad física';
  const intro = professional
    ? 'Biblioteca y rutinas de esta paciente. Asignar requiere habilitación verificada en el servidor; ser nutricionista no alcanza.'
    : 'Actividad que vos declarás y, si hay, la rutina que te asignó una profesional habilitada. No se estiman calorías ni se arma una rutina automática.';

  async function assign(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const items = selected.map((id) => {
        const exercise = view.library.find((entry) => entry.id === id) ?? SEEDED_EXERCISES.find((entry) => entry.id === id);
        return {
          exercise_id: id,
          sets: exercise?.default_sets ?? 2,
          reps: exercise?.default_reps ?? 8,
          rest_seconds: exercise?.default_rest_seconds ?? 30,
        };
      });
      const result = await exerciseApi.assign(patient.id, { title, items });
      setRemote(result.exercise);
    } catch (failure) {
      setError(careErrorMessage(failure));
    } finally {
      setBusy(false);
    }
  }

  async function sendFeedback(assignmentId: string, sets: number, reps: number) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const result = await exerciseApi.feedback(patient.id, assignmentId, {
        sets_completed: sets,
        reps_completed: reps,
        note: feedbackNote,
      });
      setRemote(result.exercise);
      setFeedbackNote('');
    } catch (failure) {
      setError(careErrorMessage(failure));
    } finally {
      setBusy(false);
    }
  }

  return <section className="nvexercise" aria-label={professional ? `Ejercicio de ${patient.name}` : 'Actividad física'}>
    {!professional && <CarePanel patientId={patient.id} mode="activity" />}
    <header className="nvexercise-heading"><div><small>{professional ? 'CONSULTORIO' : 'MI SEGUIMIENTO'}</small><h2>{heading}</h2><p>{intro}</p></div>
      {professional && <NvBadge tone={view.can_assign ? 'green' : 'gold'}>{view.can_assign ? 'Habilitación verificada' : 'Sin habilitación verificada'}</NvBadge>}
    </header>
    {error && <p className="nvexercise-status" role="alert">{error}</p>}
    {loading && !remote && <p role="status">Cargando biblioteca…</p>}

    <section className="nvexercise-list" aria-label="Rutinas asignadas">
      <div className="nvexercise-heading"><div><small>RUTINA</small><h2>{professional ? 'Asignadas a esta paciente' : 'Rutina asignada'}</h2></div><span>{view.assignments.length} vigentes</span></div>
      {view.assignments.length ? view.assignments.map((row) => (
        <article className="nvexercise-entry" key={row.id}>
          <span className="nvexercise-dot"><Icon name="heart" size={18} /></span>
          <div>
            <div className="nvexercise-entry-title"><h3>{row.title}</h3><span>{row.status === 'active' ? 'Activa' : row.status}</span></div>
            <p>Asignada {formatActivityDate(row.assigned_at)}. Series y repeticiones definidas por la profesional habilitada.</p>
            <ul>{row.items.map((item) => <li key={item.id}>{item.name}: {item.sets} × {item.reps} · pausa {item.rest_seconds}s{item.note ? ` · ${item.note}` : ''}</li>)}</ul>
            {row.feedback && <p>Feedback: {row.feedback.sets_completed} series · {row.feedback.reps_completed} repeticiones{row.feedback.note ? ` · ${row.feedback.note}` : ''}</p>}
            {!professional && row.status === 'active' && <form className="nvexercise-form-row" onSubmit={(event) => { event.preventDefault(); void sendFeedback(row.id, row.items[0]?.sets ?? 0, row.items[0]?.reps ?? 0); }}>
              <label>Nota de cómo te sentiste<input value={feedbackNote} onChange={(event) => setFeedbackNote(event.target.value)} maxLength={500} /></label>
              <NvButton className="primary" disabled={busy}>Registrar series hechas</NvButton>
            </form>}
          </div>
        </article>
      )) : <NvState title="Todavía no hay una rutina asignada" description="Una profesional con habilitación verificada puede armar series y repeticiones. El rol nutricionista, por sí solo, no prescribe ejercicio." />}
    </section>

    {professional && <section className="nvexercise-list" aria-label="Biblioteca de ejercicios">
      <div className="nvexercise-heading"><div><small>BIBLIOTECA</small><h2>Ejercicios disponibles</h2></div></div>
      {view.library.map((item) => (
        <article className="nvexercise-entry" key={item.id}>
          <span className="nvexercise-dot"><Icon name="list" size={18} /></span>
          <div>
            <div className="nvexercise-entry-title"><h3>{item.name}</h3><span>{EXERCISE_CATEGORY_LABELS[item.category]}</span></div>
            <p>{item.description} Sugerido: {item.default_sets} × {item.default_reps}.</p>
          </div>
        </article>
      ))}
      {view.can_assign ? <form onSubmit={(event) => void assign(event)}>
        <label>Nombre de la rutina<input value={title} onChange={(event) => setTitle(event.target.value)} minLength={2} maxLength={80} required /></label>
        <fieldset><legend>Ejercicios a incluir</legend>{view.library.map((item) => (
          <label key={item.id}><input type="checkbox" checked={selected.includes(item.id)} onChange={() => setSelected((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])} />{item.name}</label>
        ))}</fieldset>
        <NvButton className="primary" disabled={busy || selected.length === 0}>Asignar rutina</NvButton>
      </form> : <p className="nvexercise-note">No se habilita la asignación: falta la verificación de habilitación en el servidor. No hay un casillero para auto-otorgársela.</p>}
    </section>}

    {!professional && library.length > 0 && <section className="nvexercise-list" aria-label="Detalle de ejercicios asignados">
      <div className="nvexercise-heading"><div><small>DETALLE</small><h2>Ejercicios de tu rutina</h2></div></div>
      {library.map((item) => (
        <article className="nvexercise-entry" key={item.id}>
          <span className="nvexercise-dot"><Icon name="list" size={18} /></span>
          <div><h3>{item.name}</h3><p>{item.description}</p></div>
        </article>
      ))}
    </section>}

    {patient.activities.length > 0 && <section className="nvexercise-list"><h2>Registros anteriores</h2>{patient.activities.map((entry) => <article className="nvexercise-entry" key={entry.id}><Icon name="heart" size={18}/><div><h3>{entry.activity} · {entry.duration_minutes} min</h3><p>{formatActivityDate(entry.logged_at)} · Intensidad {intensityLabel[entry.intensity]}</p>{entry.note && <p>{entry.note}</p>}</div></article>)}</section>}
  </section>;
}
