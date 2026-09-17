import { useMemo, useState, type FormEvent } from 'react';
import { Icon } from '../shared/Icon';
import { api } from '../../api/client';
import { useAppStore } from '../../store/useAppStore';
import type { ShowroomPatient } from './showroom-model';
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

export function ShowroomExercise({ patient, now = new Date() }: { patient: ShowroomPatient; now?: Date }) {
  const refreshPatient = useAppStore((state) => state.refreshPatient);
  const summary = useMemo(() => buildActivitySummary(patient.activities, now), [patient.activities, now]);
  const [open, setOpen] = useState(false);
  const [activity, setActivity] = useState('');
  const [minutes, setMinutes] = useState('30');
  const [intensity, setIntensity] = useState<Intensity>('moderada');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const duration = Number(minutes);
    if (activity.trim().length < 2 || !Number.isInteger(duration) || duration < 1 || duration > 600) {
      setStatus('Revisá la actividad y la duración.');
      return;
    }
    setSaving(true);
    setStatus('');
    try {
      await api.logActivity(patient.id, { activity, duration_minutes: duration, intensity, note: note || undefined });
      try { await refreshPatient(patient.id); } catch { /* El registro ya fue confirmado por la API. */ }
      setActivity(''); setMinutes('30'); setIntensity('moderada'); setNote(''); setOpen(false);
      setStatus('Actividad registrada.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'No se pudo registrar la actividad.');
    } finally {
      setSaving(false);
    }
  }

  return <section className="nvexercise" aria-labelledby="exercise-title">
    <header className="nvexercise-hero">
      <div><span className="nvexercise-kicker"><Icon name="heart" size={15} /> Actividad autodeclarada</span><h1 id="exercise-title">Movimiento registrado</h1><p>Anotá el movimiento que realmente hiciste. Este espacio no prescribe rutinas ni estima calorías.</p></div>
      <button className="nv-button primary" type="button" onClick={() => { setOpen(true); setStatus(''); }}><Icon name="plus" size={17} /> Registrar actividad</button>
    </header>

    <div className="nvexercise-stats" aria-label="Resumen de los últimos siete días">
      <article><Icon name="calendar" size={20} /><span>Últimos 7 días</span><strong>{summary.sessions}</strong><small>{summary.sessions === 1 ? 'sesión' : 'sesiones'}</small></article>
      <article><Icon name="clock" size={20} /><span>Tiempo registrado</span><strong>{summary.minutes}</strong><small>minutos</small></article>
      <article><Icon name="heart" size={20} /><span>Por intensidad</span><div className="nvexercise-intensity"><b>{summary.byIntensity.suave}</b> suave · <b>{summary.byIntensity.moderada}</b> moderada · <b>{summary.byIntensity.intensa}</b> intensa</div></article>
    </div>

    <div className="nvexercise-content">
      <section className="nvexercise-list" aria-label="Actividad registrada">
        <div className="nvexercise-heading"><div><small>HISTORIAL PERSONAL</small><h2>Actividad reciente</h2></div><span>{patient.activities.length} {patient.activities.length === 1 ? 'registro' : 'registros'}</span></div>
        {patient.activities.length ? patient.activities.map((entry) => <article className="nvexercise-entry" key={entry.id}>
          <span className={`nvexercise-dot is-${entry.intensity}`} aria-hidden="true"><Icon name="heart" size={18} /></span>
          <div><div className="nvexercise-entry-title"><h3>{entry.activity}</h3><span>{entry.duration_minutes} min</span></div><p>{formatActivityDate(entry.logged_at)} · Intensidad {intensityLabel[entry.intensity].toLowerCase()}</p>{entry.note && <blockquote>{entry.note}</blockquote>}</div>
        </article>) : <div className="nvexercise-empty"><span><Icon name="heart" size={28} /></span><h3>Todavía no registraste actividad</h3><p>Cuando hagas una caminata, movilidad u otra actividad, podés anotarla acá.</p><button className="nv-button" type="button" onClick={() => setOpen(true)}>Registrar actividad</button></div>}
      </section>
      <aside className="nvexercise-note"><span>ACERCA DE ESTA SECCIÓN</span><h2>Tu registro, sin supuestos</h2><p>Plan V conserva el tipo de actividad, la duración, la intensidad percibida y la nota que vos cargás.</p><ul><li>No calcula gasto energético.</li><li>No inventa series ni repeticiones.</li><li>Tu nutricionista puede ver el registro para acompañar tu proceso.</li></ul></aside>
    </div>

    {status && <p className="nvexercise-status" role="status">{status}</p>}
    {open && <div className="nvexercise-modal" role="dialog" aria-modal="true" aria-labelledby="activity-form-title"><form onSubmit={submit}>
      <header><div><small>REGISTRO PERSONAL</small><h2 id="activity-form-title">Registrar actividad</h2></div><button type="button" aria-label="Cerrar" onClick={() => setOpen(false)}>×</button></header>
      <label>Actividad<input autoFocus value={activity} onChange={(event) => setActivity(event.target.value)} placeholder="Ej. Caminata al aire libre" maxLength={80} required /></label>
      <div className="nvexercise-form-row"><label>Duración (min)<input type="number" min="1" max="600" value={minutes} onChange={(event) => setMinutes(event.target.value)} required /></label><label>Intensidad percibida<select value={intensity} onChange={(event) => setIntensity(event.target.value as Intensity)}><option value="suave">Suave</option><option value="moderada">Moderada</option><option value="intensa">Intensa</option></select></label></div>
      <label>Nota opcional<textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} placeholder="¿Cómo te sentiste?" /></label>
      {status && <p role="alert">{status}</p>}
      <footer><button className="nv-button" type="button" onClick={() => setOpen(false)}>Cancelar</button><button className="nv-button primary" type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar actividad'}</button></footer>
    </form></div>}
  </section>;
}
