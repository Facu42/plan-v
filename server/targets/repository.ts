import { registerDemoState } from '../demo/state.js';
import { getRequestDb } from '../db/supabase-client.js';
import { CareError as TargetError } from '../care/errors.js';
import type { BodyData, TargetInput, TargetResult } from '../../src/lib/nutrition-target.js';
import { syncConfirmedMemoryTarget } from '../plans/repository.js';


export type StoredTarget = { patient_id: string; inputs: TargetInput; result: TargetResult; published_at: string | null; updated_at: string };
export type TargetWorkspace = { target: StoredTarget | null; draft: StoredTarget | null; published: StoredTarget | null; revision: number };

const memory = new Map<string, TargetWorkspace>();
export function resetTargetMemory() { memory.clear(); }

function dbError(error: { code?: string } | null) {
  if (!error) return;
  if (['42P01', '42883', 'PGRST202', 'PGRST205'].includes(error.code ?? '')) throw new TargetError(501, 'Esta función requiere instalar la migración de metas nutricionales.');
  if (error.code === '42501') throw new TargetError(403, 'No tenés permiso para esta acción.');
  if (['PT409', '40001'].includes(error.code ?? '')) throw new TargetError(409, 'La meta cambió en otra sesión. Recargala antes de guardar.');
  if (['22023', '23514', '22P02'].includes(error.code ?? '')) throw new TargetError(400, 'Revisá los datos de la meta.');
  throw new TargetError(503, 'No se pudo confirmar el guardado. Reintentá.');
}

export async function getTarget(patientId: string, persistent: boolean): Promise<StoredTarget | null> {
  if (!persistent) return memory.get(patientId)?.published ?? null;
  const { data, error } = await getRequestDb().from('nutrition_targets').select('patient_id,inputs,result,published_at,updated_at').eq('patient_id', patientId).not('published_at', 'is', null).maybeSingle();
  dbError(error);
  return (data as StoredTarget | null) ?? null;
}

export async function getTargetWorkspace(patientId: string, persistent: boolean): Promise<TargetWorkspace> {
  if (!persistent) return memory.get(patientId) ?? { target: null, draft: null, published: null, revision: 0 };
  const { data, error } = await getRequestDb().rpc('get_nutrition_target_workspace', { target: patientId });
  dbError(error);
  return data as TargetWorkspace;
}

export async function saveTarget(patientId: string, inputs: TargetInput, result: TargetResult, publish: boolean, persistent: boolean, expectedRevision: number): Promise<TargetWorkspace> {
  if (persistent) {
    const { data, error } = await getRequestDb().rpc('save_nutrition_target_versioned', { target: patientId, target_inputs: inputs, target_result: result, publish, expected_revision: expectedRevision });
    dbError(error);
    return data as TargetWorkspace;
  }
  const previous = memory.get(patientId) ?? { target: null, draft: null, published: null, revision: 0 };
  if (previous.revision !== expectedRevision) throw new TargetError(409, 'La meta cambió en otra sesión. Recargala antes de guardar.');
  const now = new Date().toISOString();
  const row: StoredTarget = { patient_id: patientId, inputs, result, published_at: publish ? now : null, updated_at: now };
  const published = publish ? row : previous.published;
  const draft = publish ? null : row;
  const workspace = { target: draft ?? published, draft, published, revision: previous.revision + 1 };
  if (publish) syncConfirmedMemoryTarget(patientId, { kcal: result.kcal, protein_g: result.protein_g, carbs_g: result.carbs_g, fat_g: result.fat_g, revision: row.updated_at, published_at: now });
  memory.set(patientId, workspace);
  return workspace;
}

export { TargetError };

export type StoredBodyData = { data: (BodyData & { updated_at: string }) | null; requested_at: string | null };
const bodyMemory = new Map<string, BodyData & { updated_at: string }>();
const requestMemory = new Map<string, string>();
export function resetBodyMemory() { bodyMemory.clear(); requestMemory.clear(); }

export async function getBodyData(patientId: string, persistent: boolean): Promise<StoredBodyData> {
  if (!persistent) return { data: bodyMemory.get(patientId) ?? null, requested_at: requestMemory.get(patientId) ?? null };
  const db = getRequestDb();
  const [body, request] = await Promise.all([
    db.from('patient_body_data').select('sex,birth_date,height_cm,weight_kg,updated_at').eq('patient_id', patientId).maybeSingle(),
    db.from('patient_body_data_requests').select('requested_at').eq('patient_id', patientId).maybeSingle(),
  ]);
  dbError(body.error); dbError(request.error);
  const row = body.data as (BodyData & { updated_at: string }) | null;
  return { data: row ? { ...row, height_cm: Number(row.height_cm), weight_kg: Number(row.weight_kg) } : null, requested_at: (request.data as { requested_at: string } | null)?.requested_at ?? null };
}

export async function saveBodyData(patientId: string, body: BodyData, persistent: boolean) {
  if (persistent) {
    const { error } = await getRequestDb().rpc('save_my_body_data', { body });
    dbError(error);
    return;
  }
  bodyMemory.set(patientId, { ...body, updated_at: new Date().toISOString() });
  requestMemory.delete(patientId);
}

export async function requestBodyData(patientId: string, persistent: boolean) {
  if (persistent) {
    const { error } = await getRequestDb().rpc('request_body_data', { target: patientId });
    dbError(error);
    return;
  }
  requestMemory.set(patientId, new Date().toISOString());
}

registerDemoState('targets/repository', () => ({ memory, bodyMemory, requestMemory }));
