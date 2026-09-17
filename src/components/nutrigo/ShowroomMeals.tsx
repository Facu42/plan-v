import type { ActivityLog, HabitLog, MealLog, Patient } from '../../types';
import { Icon } from '../shared/Icon';
import { NvBadge, NvButton, NvMetric, NvState } from './primitives';
import './showroom-meals.css';

const STATUS_LABEL: Record<MealLog['status'], string> = {
  pending_review: 'Pendiente',
  confirmed: 'Confirmada',
  adjusted: 'Ajustada',
};

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase('es-AR');
}

function mealDetail(log: MealLog): string {
  if (log.foods.length) return log.foods.map((food) => food.name).join(', ');
  return log.description?.trim() || 'Sin detalle registrado';
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
}

function formatSleep(minutes: number | null): string {
  if (minutes === null) return 'Sin registro';
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours} h${remainder ? ` ${remainder} min` : ''}`;
}

export type MealDiary = {
  logs: MealLog[];
  habits: HabitLog[];
  activities: ActivityLog[];
  pending: number;
  reviewed: number;
};

export function buildMealDiary(patient: Patient): MealDiary {
  const logs = patient.meal_logs
    .filter((log) => log.patient_id === patient.id)
    .slice()
    .sort((a, b) => Date.parse(b.logged_at) - Date.parse(a.logged_at));
  const habits = patient.habit_logs
    .filter((habit) => habit.patient_id === patient.id)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));
  return {
    logs,
    habits,
    activities: (patient.activity_logs ?? []).filter((entry) => entry.patient_id === patient.id).slice()
      .sort((a, b) => Date.parse(b.logged_at) - Date.parse(a.logged_at)),
    pending: logs.filter((log) => log.status === 'pending_review').length,
    reviewed: logs.filter((log) => log.status !== 'pending_review').length,
  };
}

export function ShowroomMeals({ patient, patients = [], query, onSelect, onReview }: {
  patient: Patient;
  patients?: Patient[];
  query: string;
  onSelect: (id: string) => void;
  onReview: (log: MealLog) => void;
}) {
  const diary = buildMealDiary(patient);
  const term = normalized(query);
  const visibleLogs = diary.logs.filter((log) => normalized(`${log.slot} ${mealDetail(log)} ${STATUS_LABEL[log.status]}`).includes(term));
  const latestHabit = diary.habits[0];
  const hydration = latestHabit?.hydration ?? patient.hydration;
  const energy = latestHabit?.energy ?? patient.energy;
  const sleep = latestHabit?.sleep_minutes ?? patient.sleep_minutes;

  return <section className="nvm-diary" aria-label={`Comidas y hábitos de ${patient.name}`}>
    <header className="nvm-context">
      <div>
        <span className={`nv-avatar person-${patient.tone}`}>{patient.initials}</span>
        <div><strong>{patient.name}</strong><small>Seguimiento de comidas y hábitos declarados</small></div>
      </div>
      {patients.length > 0 && <label>Paciente
        <select aria-label="Paciente del diario" value={patient.id} onChange={(event) => onSelect(event.target.value)}>
          {patients.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
        </select>
      </label>}
    </header>

    <div className="nvm-metrics" aria-label="Indicadores del diario">
      <NvMetric label="Registros totales" value={diary.logs.length} note="Comidas registradas por la paciente" icon="list" />
      <NvMetric label="Pendientes" value={diary.pending} note="Requieren confirmación profesional" icon="history" tone="gold" />
      <NvMetric label="Revisadas" value={diary.reviewed} note="Confirmadas o ajustadas" icon="check" />
      <NvMetric label="Días con hábitos" value={diary.habits.length} note="Registros declarados disponibles" icon="heart" tone="coral" />
    </div>

    <section className="nvm-habits" aria-labelledby="nvm-habits-title">
      <header><div><span className="nv-icon-tile"><Icon name="heart" size={17} /></span><div><h2 id="nvm-habits-title">Hábitos declarados por la paciente</h2><p>Último registro disponible; no son valores prescritos.</p></div></div>{latestHabit && <time dateTime={latestHabit.date}>{new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' }).format(new Date(`${latestHabit.date}T12:00:00`))}</time>}</header>
      <dl>
        <div><dt><Icon name="drop" size={15} /> Hidratación</dt><dd>{hydration}/8 vasos</dd></div>
        <div><dt><Icon name="heart" size={15} /> Energía</dt><dd>{energy || 'Sin registro'}</dd></div>
        <div><dt><Icon name="moon" size={15} /> Descanso</dt><dd>{formatSleep(sleep)}</dd></div>
      </dl>
    </section>

    <section className="nvm-activities" aria-labelledby="nvm-activities-title">
      <header><div><span className="nv-icon-tile"><Icon name="trend" size={17} /></span><div><h2 id="nvm-activities-title">Actividad autodeclarada</h2><p>Movimiento registrado por la paciente; no es una rutina prescrita.</p></div></div><NvBadge>{diary.activities.length}</NvBadge></header>
      {diary.activities.length ? <div className="nvm-activity-list">{diary.activities.slice(0, 4).map((entry) => <article key={entry.id}><span className="nv-icon-tile"><Icon name="heart" size={15} /></span><div><strong>{entry.activity}</strong><small>{formatDate(entry.logged_at)} · Intensidad {entry.intensity}</small>{entry.note && <p>{entry.note}</p>}</div><b>{entry.duration_minutes} min</b></article>)}</div> : <p className="nvm-activity-empty">La paciente todavía no registró actividad.</p>}
    </section>

    <section className="nvm-table-card" aria-labelledby="nvm-table-title">
      <header><div><h2 id="nvm-table-title">Historial de comidas</h2><p>{visibleLogs.length} de {diary.logs.length} registros</p></div><NvBadge tone={diary.pending ? 'gold' : 'green'}>{diary.pending} pendientes</NvBadge></header>
      {visibleLogs.length ? <div className="nvm-table" role="table" aria-label="Historial de comidas">
        <div className="nvm-table-head" role="row"><span role="columnheader">Fecha</span><span role="columnheader">Comida</span><span role="columnheader">Detalle</span><span role="columnheader">Estado</span><span role="columnheader">Acción</span></div>
        {visibleLogs.map((log) => <article role="row" key={log.id} className={log.status === 'pending_review' ? 'nvm-pending' : ''}>
          <time role="cell" dateTime={log.logged_at}>{formatDate(log.logged_at)}</time>
          <strong role="cell">{log.slot}</strong>
          <span role="cell" className="nvm-detail">{mealDetail(log)}</span>
          <span role="cell"><NvBadge tone={log.status === 'pending_review' ? 'gold' : 'green'}>{STATUS_LABEL[log.status]}</NvBadge></span>
          <span role="cell" className="nvm-action">{log.status === 'pending_review' ? <NvButton onClick={() => onReview(log)}>Revisar</NvButton> : <small>Revisada</small>}</span>
        </article>)}
      </div> : <NvState title="Sin registros para mostrar" description={term ? 'Probá otra búsqueda.' : 'Las comidas enviadas por la paciente aparecerán acá.'} />}
    </section>
  </section>;
}
