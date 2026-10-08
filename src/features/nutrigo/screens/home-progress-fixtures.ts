import type { ShowroomPatient } from '../../../components/nutrigo/showroom-model';
import { unavailableCard } from '../../../types/recipe-plate';

/** Datos de prueba de Inicio y Progreso: del caso vacío al caso desbordado. Solo los usan las pruebas. */
export const TODAY = '2026-10-07';
export const NOW = new Date(`${TODAY}T12:00:00-03:00`);

export const basePatient = {
  id: 'p1', name: 'Ana Real', hydration: 5, sleepMinutes: 450, steps: null, nutritionLogCount: 0, kcal: 0, logs: [], messages: [], activities: [],
  macros: { kcal: 0, carbs_g: 0, protein_g: 0, fat_g: 0 },
  journey: { days: [], reviewedMeals: 0, pendingMeals: 0 },
} as unknown as ShowroomPatient;

export const patientWith = (patch: Record<string, unknown>) => ({ ...basePatient, ...patch }) as unknown as ShowroomPatient;

/** Una semana de hábitos (hoy es el último día). */
export const journeyDays = (count: number, make: (index: number) => { hydration: number; sleepMinutes: number | null }) =>
  Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(2026, 9, 7 - (count - 1 - index), 12));
    return { date: date.toISOString().slice(0, 10), mealLogIds: [], ...make(index) };
  });

export const recipeOf = (id: string, title: string, extra: Record<string, unknown> = {}) => ({
  id, title, version: 1, yield_portions: 2, ingredients: [], steps: ['Cocinar.'], nutrient_source: 'Estimación de IA revisada',
  nutrition: { origin: 'ai_estimate', source: 'Estimación de IA revisada', per_portion: { kcal: 620, carbs_g: 80, protein_g: 20, fat_g: 15 } },
  card: unavailableCard(title, 'Almuerzo'), ...extra,
});

export const planItem = (id: string, slot: string, title: string, extra: Record<string, unknown> = {}) =>
  ({ id, for_date: TODAY, slot, free_text: title, portions: 1, public_note: '', recipe_proposal: recipeOf(`r-${id}`, title), ...extra });

export const routineItem = (id: string, name: string, extra: Record<string, unknown> = {}) =>
  ({ id, exercise_id: `e-${id}`, name, category: 'fuerza', sets: 3, reps: 10, rest_seconds: 30, note: null, sort: 0, ...extra });

export const assignment = (items: unknown[]) => ({ id: 'a1', patient_id: 'p1', title: 'Rutina', status: 'active', assigned_at: `${TODAY}T10:00:00Z`, items, feedback: null });

export const homeData = (patch: Record<string, unknown> = {}) => ({
  body: null, target: null, recipes: [], plan: null, exercise: null, care: null, failed: false, ...patch,
});

export const target = { result: { kcal: 2000, carbs_g: 250, protein_g: 100, fat_g: 60 } };
export const weightRow = (id: string, value: number, capturedOn: string, unit = 'kg') =>
  ({ id, patient_id: 'p1', kind: 'weight', value_numeric: value, unit, source: 'patient', captured_on: capturedOn, created_at: `${capturedOn}T12:00:00Z` });
