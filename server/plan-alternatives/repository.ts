import { getRequestDb } from '../db/supabase-client.js';
import { registerDemoState } from '../demo/state.js';
import { CareError } from '../care/errors.js';
import { listNutritionExchanges } from '../nutrition-capabilities/repository.js';
import type { ExchangeGroup } from '../../src/types/nutrition-capabilities.js';
import type { StoredChoice } from './compute.js';

const memory = new Map<string, StoredChoice>();
registerDemoState('plan-alternatives', () => ({ memory }));
export function resetPlanAlternatives() { memory.clear(); }
const key = (patientId: string, itemId: string, componentId: string) => `${patientId}|${itemId}|${componentId}`;

function dbError(error: { code?: string } | null) {
  if (!error) return;
  if (['42P01', '42883', 'PGRST202', 'PGRST205'].includes(error.code ?? '')) throw new CareError(501, 'Las alternativas del plan todavía no están habilitadas en este entorno.');
  if (error.code === '42501') throw new CareError(403, 'No tenés permiso para esta acción.');
  if (['22023', '22P02'].includes(error.code ?? '')) throw new CareError(400, 'Revisá la alternativa elegida.');
  throw new CareError(503, 'No se pudo confirmar el guardado. Reintentá.');
}

export async function readGroupsAndChoices(patientId: string, owner: string, persistent: boolean): Promise<{ groups: ExchangeGroup[]; choices: StoredChoice[] }> {
  if (!persistent) {
    return { groups: await listNutritionExchanges(owner, false), choices: [...memory.entries()].filter(([id]) => id.startsWith(`${patientId}|`)).map(([, row]) => structuredClone(row)) };
  }
  const { data, error } = await getRequestDb().rpc('list_patient_plan_alternatives', { target_patient: patientId });
  dbError(error);
  const row = (data ?? {}) as { groups?: ExchangeGroup[]; choices?: Array<Omit<StoredChoice, 'name'> & { food_name: string }> };
  return {
    groups: row.groups ?? [],
    choices: (row.choices ?? []).map(({ food_name, ...rest }) => ({ ...rest, name: food_name })),
  };
}

export type ChoiceWrite = { item_id: string; component_id: string; group_id: string; group_revision: number; base_food_id: string; food_id: string; food_revision: number; name: string; quantity: number; unit: 'g' | 'ml' };

export async function saveChoice(patientId: string, write: ChoiceWrite, persistent: boolean) {
  if (!persistent) {
    memory.set(key(patientId, write.item_id, write.component_id), { item_id: write.item_id, component_id: write.component_id, group_id: write.group_id, group_revision: write.group_revision, base_food_id: write.base_food_id, food_id: write.food_id, food_revision: write.food_revision, name: write.name, quantity: write.quantity, unit: write.unit, chosen_at: new Date().toISOString() });
    return;
  }
  const request = { item_id: write.item_id, component_id: write.component_id, group_id: write.group_id, base_food_id: write.base_food_id, food_id: write.food_id, quantity: write.quantity, unit: write.unit };
  const { error } = await getRequestDb().rpc('save_patient_plan_choice', { target_patient: patientId, request });
  dbError(error);
}

export async function removeChoice(patientId: string, itemId: string, componentId: string, persistent: boolean) {
  if (!persistent) { memory.delete(key(patientId, itemId, componentId)); return; }
  const { error } = await getRequestDb().rpc('save_patient_plan_choice', { target_patient: patientId, request: { item_id: itemId, component_id: componentId, food_id: null } });
  dbError(error);
}
