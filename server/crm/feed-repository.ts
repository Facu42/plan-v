import { getRequestDb } from '../db/supabase-client.js';
import { getStore } from '../store.js';
import { readAllRows, type WorkScope } from './repository.js';
import type { FeedHabit, FeedMeal } from './feed.js';

const active = (scope: WorkScope) => scope.patients.filter((patient) => !patient.archived_at && !patient.deactivated_at && !patient.anonymized_at);

/** Lee sólo metadatos (franja, estado, fecha, vasos) del período; nunca descripciones, fotos ni notas. */
export async function loadFeedRows(scope: WorkScope, from: string): Promise<{ patients: { id: string; name: string }[]; meals: FeedMeal[]; habits: FeedHabit[] }> {
  const patients = active(scope).map(({ id, name }) => ({ id, name }));
  const ids = patients.map((patient) => patient.id);
  if (!ids.length) return { patients, meals: [], habits: [] };

  if (!scope.persistent) {
    const memory = new Map(getStore().patients.map((patient) => [patient.id, patient]));
    const meals: FeedMeal[] = []; const habits: FeedHabit[] = [];
    for (const id of ids) {
      const full = memory.get(id);
      if (!full) continue;
      meals.push(...full.meal_logs.map((meal) => ({ id: meal.id, patient_id: id, slot: meal.slot, status: meal.status, logged_at: meal.logged_at })));
      habits.push(...full.habit_logs.map((habit) => ({ patient_id: id, date: habit.date, hydration: habit.hydration, logged_at: `${habit.date}T21:00:00-03:00` })));
    }
    return { patients, meals, habits };
  }

  const db = getRequestDb();
  // Margen de un día: la fecha local se recalcula después en hora de Argentina.
  const since = new Date(Date.parse(`${from}T00:00:00-03:00`) - 86_400_000).toISOString();
  const meals: FeedMeal[] = []; const habits: FeedHabit[] = [];
  for (let index = 0; index < ids.length; index += 100) {
    const batch = ids.slice(index, index + 100);
    const [mealRows, habitRows] = await Promise.all([
      readAllRows((offset, end) => db.from('meal_logs').select('id,patient_id,slot_label,status,logged_at').in('patient_id', batch).gte('logged_at', since).order('logged_at').order('id').range(offset, end)),
      readAllRows((offset, end) => db.from('habit_logs').select('patient_id,date,hydration,logged_at').in('patient_id', batch).gte('date', from).order('date').order('patient_id').range(offset, end)),
    ]);
    meals.push(...mealRows.map((row) => ({ id: String(row.id), patient_id: String(row.patient_id), slot: String(row.slot_label), status: String(row.status), logged_at: String(row.logged_at) })));
    habits.push(...habitRows.map((row) => ({ patient_id: String(row.patient_id), date: String(row.date), hydration: Number(row.hydration) || 0, logged_at: String(row.logged_at) })));
  }
  return { patients, meals, habits };
}
