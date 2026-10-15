import type { MealLog, Patient } from '../../types';
import { Icon, MacroBar } from '../shared/Icon';
import { groupMealLogsForReview } from './meal-history';

type Props = {
  patient: Patient;
  onReviewMeal: (log: MealLog) => void;
};

const STATUS_LABEL: Record<MealLog['status'], string> = {
  pending_review: 'Pendiente',
  confirmed: 'Confirmada',
  adjusted: 'Ajustada',
};

function formatLoggedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
}

function mealSummary(log: MealLog): string {
  if (log.foods.length > 0) return log.foods.map((food) => food.name).join(', ');
  return log.description ?? 'Sin detalle';
}

function localDateId(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatSleep(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours} h${remainder > 0 ? ` ${remainder} min` : ''}`;
}

function lastWeekHabits(patient: Patient) {
  const byDate = new Map(patient.habit_logs.map((habit) => [habit.date, habit]));
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const id = localDateId(date);
    const habit = byDate.get(id);
    return {
      id,
      label: new Intl.DateTimeFormat('es-AR', { weekday: 'narrow' }).format(date),
      hydration: habit?.hydration ?? null,
      energy: habit?.energy ?? null,
      sleepMinutes: habit?.sleep_minutes ?? null,
      isToday: i === 6,
    };
  });
}

export function CrmMealsHabitsTab({ patient, onReviewMeal }: Props) {
  const { pending, reviewed } = groupMealLogsForReview(patient.meal_logs);
  const week = lastWeekHabits(patient);
  const recordedSleep = week.filter((day) => day.sleepMinutes !== null);
  const sleepAverage = recordedSleep.length > 0
    ? Math.round(recordedSleep.reduce((sum, day) => sum + (day.sleepMinutes ?? 0), 0) / recordedSleep.length)
    : null;

  return (
    <section className="meals-habits-tab" aria-label="Comidas y hábitos">
      <article className="crm-card habits-card">
        <div className="card-heading"><h3>Hábitos · declarados por la paciente</h3></div>
        <div className="habits-summary">
          <div className="habit-metric">
            <Icon name="drop" size={16} />
            <div className="habit-week">
              <b>Hidratación</b>
              <div className="habit-week-bars" role="img" aria-label={`Agua de los últimos 7 días: ${week.map((d) => `${d.label} ${d.hydration ?? 0} de 8`).join(', ')}`}>
                {week.map((day) => (
                  <span className={`habit-day${day.isToday ? ' today' : ''}`} key={day.id}>
                    <i style={{ height: `${((day.hydration ?? 0) / 8) * 100}%` }} />
                    <small>{day.label}</small>
                  </span>
                ))}
              </div>
              <small>Hoy {patient.hydration}/8 vasos</small>
            </div>
          </div>
          <div className="habit-metric">
            <Icon name="heart" size={16} />
            <div>
              <b>Energía</b>
              <p>{patient.energy ?? 'Sin check-in todavía'}</p>
              <small>{week.filter((d) => d.energy && !d.isToday).map((d) => `${d.label} ${d.energy}`).join(' · ') || 'Sin registros anteriores esta semana'}</small>
            </div>
          </div>
          <div className="habit-metric">
            <Icon name="moon" size={16} />
            <div>
              <b>Descanso</b>
              <p>{patient.sleep_minutes === null ? 'Sin registro hoy' : formatSleep(patient.sleep_minutes)}</p>
              <small>{recordedSleep.length} de 7 días registrados{sleepAverage === null ? '' : ` · promedio ${formatSleep(sleepAverage)}`}</small>
            </div>
          </div>
        </div>
      </article>

      <article className="crm-card meal-history-card">
        <div className="card-heading">
          <h3>Pendientes de revisión</h3>
          <span className="menu-badge">{pending.length}</span>
        </div>
        {pending.length === 0 ? (
          <p className="menu-day-empty">Nada para revisar. Las próximas fotos o descripciones de la paciente aparecen acá.</p>
        ) : pending.map((log) => (
          <div className="meal-history-row pending" key={log.id}>
            <div className="meal-history-main">
              <b>{log.slot}</b>
              <small>{mealSummary(log)}</small>
              <span className="meal-history-meta">{formatLoggedAt(log.logged_at)} · confianza {(log.confidence * 100).toFixed(0)}%</span>
            </div>
            <button type="button" onClick={() => onReviewMeal(log)}>Revisar</button>
          </div>
        ))}
      </article>

      <article className="crm-card meal-history-card">
        <div className="card-heading"><h3>Historial revisado</h3><Icon name="history" size={15} /></div>
        {reviewed.length === 0 ? (
          <p className="menu-day-empty">Todavía no hay comidas confirmadas o ajustadas.</p>
        ) : reviewed.map((log) => (
          <div className="meal-history-row" key={log.id}>
            <div className="meal-history-main">
              <b>{log.slot} <em className={`status-chip status-${log.status}`}>{STATUS_LABEL[log.status]}</em></b>
              <small>{mealSummary(log)}</small>
              {log.macros && <MacroBar macros={log.macros} />}
              <span className="meal-history-meta">{formatLoggedAt(log.logged_at)}</span>
            </div>
          </div>
        ))}
      </article>
    </section>
  );
}
