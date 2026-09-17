import type { HabitLog, MealLog } from '../../types';

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

function localDateId(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function buildJourneySummary(input: JourneyInput, now = new Date()): JourneySummary {
  const habitByDate = new Map(input.habit_logs.map((habit) => [habit.date, habit]));
  const days = Array.from({ length: 7 }, (_, index): JourneyDay => {
    const date = new Date(now);
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const dateId = localDateId(date);
    const habit = habitByDate.get(dateId);

    return {
      date: dateId,
      label: new Intl.DateTimeFormat('es-AR', { weekday: 'short' }).format(date).replace('.', ''),
      isToday: index === 6,
      hydration: habit?.hydration ?? 0,
      energy: habit?.energy ?? null,
      sleepMinutes: habit?.sleep_minutes ?? null,
      reviewedMeals: 0,
      pendingMeals: 0,
      mealLogIds: [],
    };
  });

  const dayByDate = new Map(days.map((day) => [day.date, day]));
  for (const log of input.meal_logs) {
    const loggedAt = new Date(log.logged_at);
    if (Number.isNaN(loggedAt.getTime())) continue;
    const day = dayByDate.get(localDateId(loggedAt));
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
