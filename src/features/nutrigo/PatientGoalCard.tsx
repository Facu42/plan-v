import type { GoalStatus } from '../../types';
import type { ShowroomPatient } from '../../components/nutrigo/showroom-model';

const STATUS_LABEL: Record<GoalStatus, string> = {
  active: 'Activo',
  paused: 'En pausa',
  completed: 'Completado',
};

function goalDate(value: string | null | undefined) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * El archivo de Nutrigo dibuja el peso, no este objetivo de seguimiento.
 * La tarjeta usa la card del archivo (blanco, radio 16, Poppins, verde) y va debajo del marco.
 */
export function PatientGoalCard({ patient, history = false }: { patient: ShowroomPatient; history?: boolean }) {
  const goal = patient.goal?.trim() ?? '';
  const status = patient.goalStatus ?? null;
  const progress = patient.goalProgress;
  const updated = goalDate(patient.goalUpdatedAt);
  const updates = patient.goalUpdates ?? [];
  return <section className="mcp-goal-card" aria-label="Tu objetivo">
    <header>
      <h2>Tu objetivo</h2>
      <p>Lo marca tu nutricionista. No es la meta de calorías del plan.</p>
    </header>
    <p className="mcp-goal-text">{goal || 'Todavía no hay un objetivo.'}</p>
    <dl>
      <div>
        <dt>Estado</dt>
        <dd>{status ? STATUS_LABEL[status] : 'Tu nutricionista todavía no cargó el estado.'}</dd>
      </div>
      <div>
        <dt>Avance</dt>
        <dd>
          {progress == null ? 'Tu nutricionista todavía no cargó el avance.' : <>
            <span>{progress}%</span>
            <span className="mcp-goal-track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Avance del objetivo">
              <span style={{ width: `${progress}%` }} />
            </span>
          </>}
        </dd>
      </div>
    </dl>
    {updated && <p>Actualizado el {updated}</p>}
    {history && <div>
      <h3>Cambios</h3>
      {updates.length ? <ol>{updates.map((entry) => <li key={entry.id}>
        <strong>{entry.goal}</strong>
        <span>{STATUS_LABEL[entry.status]} · {entry.progress}%</span>
        {goalDate(entry.updated_at) && <time dateTime={entry.updated_at}>{goalDate(entry.updated_at)}</time>}
      </li>)}</ol> : <p>Todavía no hay cambios registrados.</p>}
    </div>}
  </section>;
}
