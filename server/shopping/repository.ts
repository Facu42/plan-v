import { randomUUID } from 'node:crypto';
import { getRequestDb } from '../db/supabase-client.js';
import { CareError } from '../care/errors.js';
import { getPublishedMealPlan } from '../plans/repository.js';
import { deriveShoppingFromPlan } from './derive.js';
import {
  shoppingSourceKey,
  type ShoppingLine,
  type ShoppingListView,
} from '../../src/types/shopping.js';
import type { RecipeUnit } from '../../src/types/recipes.js';

export { CareError } from '../care/errors.js';

type Manual = {
  id: string;
  patient_id: string;
  name: string;
  quantity: number;
  unit: RecipeUnit;
  client_id: string;
  checked: boolean;
};

const manuals = new Map<string, Manual>();
const checks = new Map<string, boolean>();

function checkKey(patientId: string, sourceKey: string) {
  return `${patientId}::${sourceKey}`;
}

export function resetShoppingMemory() {
  manuals.clear();
  checks.clear();
}

export function shoppingDbError(error: { code?: string } | null) {
  if (!error) return;
  if (['42P01', '42883', 'PGRST202', 'PGRST205'].includes(error.code ?? '')) {
    throw new CareError(501, 'Las compras requieren instalar la migración de este módulo.');
  }
  if (error.code === '42501') throw new CareError(403, 'No tenés permiso para esta acción.');
  if (error.code === 'PT404' || error.code === 'PGRST116') throw new CareError(404, 'Ese ítem no está en la lista.');
  if (error.code === '23505') throw new CareError(409, 'Ese agregado ya está en la lista.');
  if (['22023', '23514', '22P02'].includes(error.code ?? '')) throw new CareError(400, 'Revisá el nombre, la cantidad y la unidad.');
  throw new CareError(503, 'No se pudo confirmar el guardado. Reintentá sin cerrar el formulario.');
}

function asList(data: unknown): ShoppingListView {
  const row = data as Record<string, unknown>;
  const items = Array.isArray(row.items) ? row.items.map((entry) => {
    const item = entry as Record<string, unknown>;
    return {
      id: String(item.id),
      kind: item.kind as ShoppingLine['kind'],
      source_key: String(item.source_key),
      name: String(item.name),
      quantity: item.quantity == null ? null : Number(item.quantity),
      unit: item.unit == null ? null : String(item.unit),
      occurrences: Number(item.occurrences ?? 1),
      checked: Boolean(item.checked),
    } satisfies ShoppingLine;
  }) : [];
  return {
    plan_version: row.plan_version == null ? null : Number(row.plan_version),
    period_start: row.period_start == null ? null : String(row.period_start),
    period_end: row.period_end == null ? null : String(row.period_end),
    items,
  };
}

async function memoryFromPlan(patientId: string): Promise<ShoppingListView> {
  const plan = await getPublishedMealPlan(patientId, false);
  const checkMap = new Map<string, boolean>();
  for (const [key, value] of checks) {
    if (key.startsWith(`${patientId}::`)) checkMap.set(key.slice(patientId.length + 2), value);
  }
  const derived = deriveShoppingFromPlan(plan, checkMap);
  const extra: ShoppingLine[] = [...manuals.values()]
    .filter((row) => row.patient_id === patientId)
    .map((row) => ({
      id: row.id,
      kind: 'manual' as const,
      source_key: shoppingSourceKey('manual', row.name, row.unit, row.id),
      name: row.name,
      quantity: row.quantity,
      unit: row.unit,
      occurrences: 1,
      checked: row.checked || checkMap.get(shoppingSourceKey('manual', row.name, row.unit, row.id)) === true,
    }));
  return {
    ...derived,
    items: [...derived.items, ...extra].sort((a, b) => a.name.localeCompare(b.name, 'es-AR') || (a.unit ?? '').localeCompare(b.unit ?? '', 'es-AR')),
  };
}

export async function getShoppingList(patientId: string, persistent: boolean): Promise<ShoppingListView> {
  if (!persistent) return memoryFromPlan(patientId);
  const { data, error } = await getRequestDb().rpc('get_shopping_list', { target_patient: patientId });
  shoppingDbError(error);
  return asList(data);
}

export async function addShoppingManual(
  patientId: string,
  input: { name: string; quantity: number; unit: RecipeUnit; client_id: string },
  persistent: boolean,
): Promise<ShoppingListView> {
  if (!persistent) {
    const existing = [...manuals.values()].find((row) => row.patient_id === patientId && row.client_id === input.client_id);
    if (existing) {
      if (existing.name !== input.name.trim() || existing.quantity !== input.quantity || existing.unit !== input.unit) {
        throw new CareError(409, 'Ese agregado ya está en la lista.');
      }
      return memoryFromPlan(patientId);
    }
    const id = randomUUID();
    manuals.set(id, {
      id,
      patient_id: patientId,
      name: input.name.trim(),
      quantity: input.quantity,
      unit: input.unit,
      client_id: input.client_id,
      checked: false,
    });
    return memoryFromPlan(patientId);
  }
  const { data, error } = await getRequestDb().rpc('add_shopping_manual', { payload: { patient_id: patientId, ...input } });
  shoppingDbError(error);
  return asList(data);
}

export async function setShoppingChecked(
  patientId: string,
  input: { source_key: string; checked: boolean },
  persistent: boolean,
): Promise<ShoppingListView> {
  if (!persistent) {
    const list = await memoryFromPlan(patientId);
    if (!list.items.some((item) => item.source_key === input.source_key)) {
      throw new CareError(404, 'Ese ítem no está en la lista.');
    }
    const key = checkKey(patientId, input.source_key);
    if (input.checked) checks.set(key, true);
    else checks.delete(key);
    const manualId = input.source_key.startsWith('manual:') ? input.source_key.slice(7) : null;
    if (manualId && manuals.has(manualId)) {
      manuals.get(manualId)!.checked = input.checked;
    }
    return memoryFromPlan(patientId);
  }
  const { data, error } = await getRequestDb().rpc('set_shopping_checked', {
    payload: { patient_id: patientId, source_key: input.source_key, checked: input.checked },
  });
  shoppingDbError(error);
  return asList(data);
}

export async function deleteShoppingManual(patientId: string, itemId: string, persistent: boolean): Promise<ShoppingListView> {
  if (!persistent) {
    const row = manuals.get(itemId);
    if (!row || row.patient_id !== patientId) throw new CareError(404, 'Ese ítem no está en la lista.');
    manuals.delete(itemId);
    checks.delete(checkKey(patientId, shoppingSourceKey('manual', row.name, row.unit, row.id)));
    return memoryFromPlan(patientId);
  }
  const { data, error } = await getRequestDb().rpc('delete_shopping_manual', { payload: { patient_id: patientId, item_id: itemId } });
  shoppingDbError(error);
  return asList(data);
}
