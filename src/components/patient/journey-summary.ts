import type { HabitLog, MealLog } from '../../types';
import { argentinaDay } from '../../features/nutrigo/screens/ar-time';

export type JourneyInput = {
  meal_logs: readonly MealLog[];
  habit_logs: readonly HabitLog[];
};

export type JourneyDay = {
  date: string;
  label: string;
  isToday: boolean;
  hydration: number;
  energy: string | null;
  sleepMinutes: number | null;
  steps: number | null;
  reviewedMeals: number;
  pendingMeals: number;
  mealLogIds: string[];
};

export type JourneySummary = {
  days: JourneyDay[];
  reviewedMeals: number;
  pendingMeals: number;
  hydrationAverage: number;
  sleepRecordedDays: number;
  sleepAverageMinutes: number | null;
};

const DAY_MS = 86_400_000;
const WEEK_DAYS = 7;
const weekdayLabel = new Intl.DateTimeFormat('es-AR', { weekday: 'short', timeZone: 'UTC' });

/** Los días se cuentan siempre en Buenos Aires (una sola función de «día argentino»), sin depender de la zona del dispositivo. */
export function buildJourneySummary(input: JourneyInput, now = new Date()): JourneySummary {
  const habitByDate = new Map(input.habit_logs.map((habit) => [habit.date, habit]));
  const today = argentinaDay(now);
  const days = Array.from({ length: WEEK_DAYS }, (_, index): JourneyDay => {
    const noon = new Date(Date.parse(`${today}T12:00:00Z`) - (WEEK_DAYS - 1 - index) * DAY_MS);
    const dateId = noon.toISOString().slice(0, 10);
    const habit = habitByDate.get(dateId);

    return {
      date: dateId,
      label: weekdayLabel.format(noon).replace('.', ''),
      isToday: index === WEEK_DAYS - 1,
      hydration: habit?.hydration ?? 0,
      energy: habit?.energy ?? null,
      sleepMinutes: habit?.sleep_minutes ?? null,
      steps: habit?.steps ?? null,
      reviewedMeals: 0,
      pendingMeals: 0,
      mealLogIds: [],
    };
  });

  const dayByDate = new Map(days.map((day) => [day.date, day]));
  for (const log of input.meal_logs) {
    const loggedAt = new Date(log.logged_at);
    if (Number.isNaN(loggedAt.getTime())) continue;
    const day = dayByDate.get(argentinaDay(loggedAt));
    if (!day) continue;

    day.mealLogIds.push(log.id);
    if (log.status === 'pending_review') day.pendingMeals += 1;
    else day.reviewedMeals += 1;
  }

  const reviewedMeals = days.reduce((total, day) => total + day.reviewedMeals, 0);
  const pendingMeals = days.reduce((total, day) => total + day.pendingMeals, 0);
  const hydrationAverage = Math.round((days.reduce((total, day) => total + day.hydration, 0) / 7) * 10) / 10;
  const sleepValues = days.flatMap((day) => day.sleepMinutes === null ? [] : [day.sleepMinutes]);
  const sleepAverageMinutes = sleepValues.length === 0
    ? null
    : Math.round(sleepValues.reduce((total, minutes) => total + minutes, 0) / sleepValues.length);

  return {
    days,
    reviewedMeals,
    pendingMeals,
    hydrationAverage,
    sleepRecordedDays: sleepValues.length,
    sleepAverageMinutes,
  };
}
