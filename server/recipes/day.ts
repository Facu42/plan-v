import { randomUUID } from 'node:crypto';
import { getRequestDb } from '../db/supabase-client.js';
import { CareError } from '../care/errors.js';
import { getPatient } from '../store.js';
import type { FoodItem, Macros } from '../../src/types/index.js';
import type { RecipeDayAssignment } from '../../src/types/recipe-plate.js';
import { recordMealAnalysis, saveMealLog } from '../diary/repository.js';
import { readPublishedMemory, recipeDbError } from './repository.js';

type MemDay = RecipeDayAssignment & { nutritionist_id: string; client_id: string | null };

const days = new Map<string, MemDay>();

export function resetRecipeDayMemory() {
  days.clear();
}

function publicDay(row: MemDay): RecipeDayAssignment {
  const { nutritionist_id: _owner, client_id: _client, ...view } = row;
  return view;
}

function completeMacros(card: RecipeDayAssignment['card']): Macros | null {
  const macros = card.macros;
  if (card.macro_status !== 'declared' || !macros) return null;
  if (macros.kcal == null || macros.protein_g == null || macros.carbs_g == null || macros.fat_g == null) return null;
  return {
    kcal: macros.kcal,
    protein_g: macros.protein_g,
    carbs_g: macros.carbs_g,
    fat_g: macros.fat_g,
  };
}

export async function assignRecipeDay(
  nutritionistId: string,
  recipeId: string,
  input: { patient_id: string; expected_version: number; for_date: string; slot: RecipeDayAssignment['slot'] },
  persistent: boolean,
): Promise<RecipeDayAssignment> {
  if (!persistent) {
    if (!getPatient(input.patient_id)) throw new CareError(404, 'Paciente no encontrado.');
    const published = readPublishedMemory(nutritionistId, recipeId, input.expected_version);
    if (!published) throw new CareError(400, 'Publicá la revisión antes de asignarla a un día.');
    const existing = [...days.values()].find((row) => row.patient_id === input.patient_id && row.for_date === input.for_date && row.slot === input.slot);
    const row: MemDay = {
      id: existing?.id ?? randomUUID(),
      nutritionist_id: nutritionistId,
      patient_id: input.patient_id,
      for_date: input.for_date,
      slot: input.slot,
      recipe_id: recipeId,
      recipe_version: published.version,
      title: published.title,
      yield_portions: published.yield_portions,
      ingredients: published.ingredients,
      card: published.card,
      registered_meal_id: existing?.registered_meal_id ?? null,
      client_id: existing?.client_id ?? null,
    };
    days.set(row.id, row);
    return publicDay(row);
  }
  const { data, error } = await getRequestDb().rpc('assign_recipe_day', {
    payload: { recipe_id: recipeId, ...input },
  });
  recipeDbError(error);
  if (!data) throw new CareError(501, 'Asignar la receta a un día requiere instalar la migración de este módulo.');
  return data as RecipeDayAssignment;
}

export async function listRecipeDays(patientId: string, forDate: string | null, persistent: boolean): Promise<RecipeDayAssignment[]> {
  if (!persistent) {
    if (!getPatient(patientId)) throw new CareError(404, 'Paciente no encontrado.');
    return [...days.values()]
      .filter((row) => row.patient_id === patientId && (!forDate || row.for_date === forDate))
      .map(publicDay)
      .sort((a, b) => a.slot.localeCompare(b.slot, 'es-AR'));
  }
  const { data, error } = await getRequestDb().rpc('list_recipe_days', {
    target: patientId,
    for_date: forDate,
  });
  recipeDbError(error);
  return (data ?? []) as RecipeDayAssignment[];
}

export async function registerRecipeDay(
  patientId: string,
  assignmentId: string,
  clientId: string,
  persistent: boolean,
): Promise<{ assignment: RecipeDayAssignment; duplicate: boolean }> {
  if (!persistent) {
    const row = days.get(assignmentId);
    if (!row || row.patient_id !== patientId) throw new CareError(404, 'No encontramos esa comida asignada.');
    if (row.registered_meal_id) return { assignment: publicDay(row), duplicate: true };
    const saved = await saveMealLog(patientId, {
      client_id: clientId,
      slot: row.slot,
      description: row.title,
      photo_url: null,
    }, false);
    if (saved.duplicate && row.registered_meal_id) return { assignment: publicDay(row), duplicate: true };
    const foods: FoodItem[] = row.ingredients.map((item) => ({
      name: item.name,
      portion_est: item.unit === 'g' || item.unit === 'ml' || item.unit === 'u' ? item.quantity : null,
      portion_unit: item.unit === 'g' || item.unit === 'ml' || item.unit === 'u' ? item.unit : 'u',
      confidence: 1,
    }));
    const macros = completeMacros(row.card);
    await recordMealAnalysis(patientId, saved.log.id, {
      status: macros ? 'succeeded' : 'failed',
      foods,
      macros,
      confidence: macros ? 1 : 0,
      note_for_nutri: macros
        ? 'Registrada desde la receta asignada. Macros declarados por la nutricionista, no estimados por IA.'
        : 'Registrada desde la receta asignada. Sin macros declarados.',
      error_code: macros ? null : 'macros_unavailable',
    }, false);
    row.registered_meal_id = saved.log.id;
    row.client_id = clientId;
    return { assignment: publicDay(row), duplicate: saved.duplicate };
  }
  const { data, error } = await getRequestDb().rpc('register_recipe_day', {
    payload: { patient_id: patientId, assignment_id: assignmentId, client_id: clientId },
  });
  recipeDbError(error);
  if (!data) throw new CareError(501, 'Registrar la comida asignada requiere instalar la migración de este módulo.');
  return data as { assignment: RecipeDayAssignment; duplicate: boolean };
}
