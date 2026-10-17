import type { HabitLog, MealLog } from '../../types';
import { argentinaDay, previousDay } from './screens/ar-time';

/** Lo que el servidor le manda a la paciente: sus últimas 20 comidas y 14 días de hábitos. */
export const PATIENT_MEAL_PAGE = 20;
export const PATIENT_HABIT_PAGE = 14;

export type Streak = {
  /** Días seguidos con algún registro, contando hasta hoy (o hasta ayer si hoy todavía no registró). */
  days: number;
  /** Ya registró algo hoy. */
  today: boolean;
  /** La racha llega hasta el borde de lo que se ve: puede ser más larga. */
  atLeast: boolean;
};

const declared = (habit: Pick<HabitLog, 'hydration' | 'energy' | 'sleep_minutes' | 'steps' | 'symptoms'>) =>
  habit.hydration > 0 || habit.energy != null || habit.sleep_minutes != null || habit.steps != null || (habit.symptoms?.length ?? 0) > 0;

/**
 * Racha de la paciente: un día cuenta si cargó una comida o algún hábito (agua, sueño, pasos, ánimo o síntomas).
 * Los días son de Argentina. Como solo se ven las últimas comidas y hábitos, la cuenta se frena donde dejan de
 * verse y lo marca con `atLeast`, sin inventar días que no se pueden comprobar.
 */
export function buildStreak(
  meals: readonly Pick<MealLog, 'logged_at'>[],
  habits: readonly Pick<HabitLog, 'date' | 'hydration' | 'energy' | 'sleep_minutes' | 'steps' | 'symptoms'>[],
  now = new Date(),
): Streak {
  const active = new Set<string>();
  const mealDays: string[] = [];
  for (const meal of meals) {
    const day = argentinaDay(new Date(meal.logged_at));
    if (!day) continue;
    mealDays.push(day);
    active.add(day);
  }
  for (const habit of habits) if (/^\d{4}-\d{2}-\d{2}$/.test(habit.date) && declared(habit)) active.add(habit.date);

  // Antes de este día no se puede saber si faltó un registro: la lista de comidas o de hábitos ya no llega.
  const oldest = (days: string[]) => days.reduce((min, day) => (day < min ? day : min), days[0] ?? '');
  const limits = [
    meals.length >= PATIENT_MEAL_PAGE ? oldest(mealDays) : '',
    habits.length >= PATIENT_HABIT_PAGE ? oldest(habits.map(habit => habit.date)) : '',
  ].filter(Boolean);
  const knownFrom = limits.reduce((max, day) => (day > max ? day : max), '');

  const today = argentinaDay(now);
  const registeredToday = active.has(today);
  let day = registeredToday ? today : previousDay(today);
  let days = 0;
  while (active.has(day) && (!knownFrom || day > knownFrom)) {
    days += 1;
    day = previousDay(day);
  }
  // El primer día visible de la lista puede estar incompleto: se cuenta pero la racha queda «al menos».
  const atLeast = Boolean(knownFrom) && day === knownFrom && active.has(day);
  if (atLeast) days += 1;
  return { days, today: registeredToday, atLeast };
}

/** Texto bajo el saludo de Inicio. Con menos de dos días seguidos queda el texto de siempre. */
export function streakLabel(streak: Streak): string | null {
  if (streak.days < 2) return null;
  // Corto a propósito: entra en una línea del celular (390) igual que el texto del archivo.
  const count = streak.atLeast ? `${streak.days} días o más seguidos` : `${streak.days} días seguidos`;
  return streak.today ? `¡Llevás ${count} registrando! 🔥` : `Llevás ${count}. Registrá hoy para seguir.`;
}
