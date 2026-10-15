import type { Patient } from './store.js';

export type AdherenceInput = Pick<Patient, 'meal_logs' | 'weekPlan' | 'todayPlan' | 'habit_logs'>;
export type AdherenceResult = { score: number; why: string };

const MEAL_WEIGHT = 0.75;
const HYDRATION_WEIGHT = 0.25;
const WINDOW_DAYS = 7;

function dateId(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function sameWeekday(planDay: string, date: Date): boolean {
  const expected = new Intl.DateTimeFormat('es-AR', { weekday: 'long' }).format(date).toLocaleLowerCase('es-AR');
  return planDay.toLocaleLowerCase('es-AR').startsWith(expected);
}

export function calculateAdherence(patient: AdherenceInput, today = new Date()): AdherenceResult {
  const windowDates: Date[] = [];
  for (let i = WINDOW_DAYS - 1; i >= 0; i -= 1) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    date.setDate(date.getDate() - i);
    windowDates.push(date);
  }
  const windowIds = new Set(windowDates.map(dateId));

  let planned = 0;
  for (const date of windowDates) {
    const isToday = dateId(date) === dateId(today);
    if (isToday && patient.todayPlan.length > 0) {
      planned += patient.todayPlan.length;
    } else {
      planned += patient.weekPlan.find((day) => sameWeekday(day.day, date))?.meals.length ?? 0;
    }
  }

  let counted = 0;
  let pending = 0;
  for (const log of patient.meal_logs) {
    const logged = new Date(log.logged_at);
    if (Number.isNaN(logged.getTime()) || !windowIds.has(dateId(logged))) continue;
    if (log.status === 'pending_review') pending += 1;
    else counted += 1;
  }

  // Agua: promedio semanal; los días sin registro cuentan como 0.
  let hydrationSum = 0;
  for (const habit of patient.habit_logs) {
    if (windowIds.has(habit.date)) hydrationSum += Math.min(8, Math.max(0, habit.hydration));
  }
  const hydrationAverage = hydrationSum / WINDOW_DAYS;

  const mealRatio = planned === 0 ? 1 : Math.min(1, counted / planned);
  const hydrationRatio = Math.min(1, hydrationAverage / 8);
  const score = Math.round(100 * (MEAL_WEIGHT * mealRatio + HYDRATION_WEIGHT * hydrationRatio));

  const why = `${counted} de ${planned} comidas revisadas esta semana. Agua ${hydrationAverage.toFixed(1)}/8 promedio.`
    + (pending > 0 ? ` ${pending} en revisión (no suman).` : '');

  return { score, why };
}
