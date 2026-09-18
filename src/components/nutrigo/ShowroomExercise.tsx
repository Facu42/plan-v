import { Icon } from '../shared/Icon';
import { CarePanel } from './CarePanel';
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

export function ShowroomExercise({ patient }: { patient: ShowroomPatient; now?: Date }) {
  return <section className="nvexercise" aria-label="Actividad física">
    <CarePanel patientId={patient.id} mode="activity" />
    {patient.activities.length > 0 && <section className="nvexercise-list"><h2>Registros anteriores</h2>{patient.activities.map(entry => <article className="nvexercise-entry" key={entry.id}><Icon name="heart" size={18}/><div><h3>{entry.activity} · {entry.duration_minutes} min</h3><p>{formatActivityDate(entry.logged_at)} · Intensidad {intensityLabel[entry.intensity]}</p>{entry.note && <p>{entry.note}</p>}</div></article>)}</section>}
  </section>;
}
