import type { Patient, SuggestedAction } from '../../types';

export type NextStepTarget =
  | { kind: 'menu'; day: string; slot: string | null }
  | { kind: 'appointment'; editing: boolean };

const WEEK_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export function resolveNextStepTarget(patient: Patient, action: SuggestedAction): NextStepTarget | null {
  if (action === 'turno') return { kind: 'appointment', editing: true };
  if (action !== 'ajuste_menu') return null;

  const plannedSlots = new Set(patient.todayPlan.map((meal) => meal.slot));
  const matchingDay = patient.weekPlan.find((day) => day.meals.some((meal) => plannedSlots.has(meal.slot)));
  const matchingMeal = matchingDay?.meals.find((meal) => plannedSlots.has(meal.slot));
  const fallbackDay = WEEK_DAYS.find((day) => day === matchingDay?.day) ?? 'Lunes';

  return {
    kind: 'menu',
    day: matchingDay?.day ?? fallbackDay,
    slot: matchingMeal?.slot ?? null,
  };
}
