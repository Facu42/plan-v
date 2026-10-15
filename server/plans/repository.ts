import { getRequestDb } from '../db/supabase-client.js';
import { mondayOf, planSlotsSchema, type MealPlan, type MealPlanView, type PlanInput, type PlanSlot } from '../../src/types/plans.js';
import { listRecipes } from '../recipes/repository.js';

export class PlanError extends Error {
  constructor(public status: 400 | 403 | 404 | 409 | 501 | 503, message: string) { super(message); }
}

const versions = new Map<string, MealPlan>();
export function resetPlanMemory() { versions.clear(); }
export function toPlanView(plan: MealPlan): MealPlanView {
  const { nutritionist_id: _owner, ...view } = plan;
  return view;
}
function planDbError(error: { code?: string } | null) {
  if (!error) return;
  if (['42P01', '42883', 'PGRST202', 'PGRST205'].includes(error.code ?? '')) throw new PlanError(501, 'Los planes versionados requieren instalar la migración de este módulo.');
  if (error.code === '42501') throw new PlanError(403, 'No tenés permiso para este plan.');
  if (error.code === 'PT404') throw new PlanError(404, 'Plan no encontrado.');
  if (error.code === 'PT409' || error.code === '23505') throw new PlanError(409, 'El plan cambió o ya está publicado. Recargá y volvé a guardar.');
  if (['22023', '23514', '22P02'].includes(error.code ?? '')) throw new PlanError(400, 'Revisá la semana, los momentos y las recetas publicadas.');
  throw new PlanError(503, 'No se pudo confirmar el plan. Reintentá sin cerrar el editor.');
}
function owned(patientId: string) {
  return [...versions.values()].filter((plan) => plan.patient_id === patientId);
}
function latestPublished(patientId: string) {
  return owned(patientId)
    .filter((plan) => plan.published_at)
    .sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? '') || b.version - a.version)[0] ?? null;
}
function openPlan(patientId: string) {
  return owned(patientId).find((plan) => !plan.published_at) ?? null;
}
async function stampSlots(slots: PlanSlot[], nutritionistId: string, persistent: boolean): Promise<PlanSlot[]> {
  const parsed = planSlotsSchema.safeParse(slots);
  if (!parsed.success) throw new PlanError(400, 'Revisá la semana, los momentos y las recetas publicadas.');
  const recipes = parsed.data.some((item) => item.recipe_id)
    ? await listRecipes(persistent, true, nutritionistId)
    : [];
  return parsed.data.map((item) => {
    if (!item.recipe_id) return { ...item, recipe_id: null, servings: null, title: item.title.trim() };
    const recipe = recipes.find((entry) => entry.id === item.recipe_id && entry.published_at);
    if (!recipe) throw new PlanError(400, 'Sólo se pueden asignar recetas ya publicadas del consultorio.');
    return { day: item.day, slot: item.slot, title: recipe.title, recipe_id: recipe.id, servings: recipe.servings };
  });
}

export async function loadPlanBoard(patientId: string, persistent: boolean, professional: boolean, nutritionistId = 'nutri-demo'): Promise<{ open: MealPlan | null; published: MealPlan | null }> {
  if (!persistent) {
    const published = latestPublished(patientId);
    const open = professional ? openPlan(patientId) : null;
    return { open, published };
  }
  const db = getRequestDb();
  const publishedQuery = db.from('meal_plan_versions').select('id,patient_id,nutritionist_id,version,period_start,slots,created_at,updated_at,published_at')
    .eq('patient_id', patientId).not('published_at', 'is', null).order('published_at', { ascending: false }).limit(1);
  const { data: publishedRows, error: publishedError } = await publishedQuery;
  planDbError(publishedError);
  let open: MealPlan | null = null;
  if (professional) {
    const { data: openRows, error: openError } = await db.from('meal_plan_versions')
      .select('id,patient_id,nutritionist_id,version,period_start,slots,created_at,updated_at,published_at')
      .eq('patient_id', patientId).is('published_at', null).limit(1);
    planDbError(openError);
    open = (openRows?.[0] as MealPlan | undefined) ?? null;
  }
  return { open, published: (publishedRows?.[0] as MealPlan | undefined) ?? null };
}

export async function savePlan(patientId: string, input: PlanInput, persistent: boolean, nutritionistId = 'nutri-demo'): Promise<MealPlan> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.period_start) || input.period_start !== mondayOf(input.period_start)) {
    throw new PlanError(400, 'La semana tiene que empezar un lunes.');
  }
  if (persistent) {
    const { data, error } = await getRequestDb().rpc('save_plan_version', {
      plan_id: input.id,
      patient_id: patientId,
      period_start_value: input.period_start,
      slots_value: input.slots,
      expected_version: input.expected_version,
    });
    planDbError(error);
    return data as MealPlan;
  }
  const slots = await stampSlots(input.slots, nutritionistId, false);
  const existing = versions.get(input.id);
  const open = openPlan(patientId);
  const maxVersion = owned(patientId).reduce((max, plan) => Math.max(max, plan.version), 0);
  const now = new Date().toISOString();
  if (!existing) {
    if (open) throw new PlanError(409, 'Ya hay una copia inédita. Recargá y seguí en esa versión.');
    if (input.expected_version !== maxVersion) throw new PlanError(409, 'El plan cambió o ya está publicado. Recargá y volvé a guardar.');
    const plan: MealPlan = {
      id: input.id,
      patient_id: patientId,
      nutritionist_id: nutritionistId,
      version: maxVersion + 1,
      period_start: input.period_start,
      slots,
      created_at: now,
      updated_at: now,
      published_at: null,
    };
    versions.set(plan.id, plan);
    return plan;
  }
  if (existing.patient_id !== patientId || existing.nutritionist_id !== nutritionistId) throw new PlanError(403, 'No tenés permiso para este plan.');
  if (existing.published_at) throw new PlanError(409, 'Esta versión ya está publicada. Guardá una copia nueva para cambiarla.');
  if (existing.version !== input.expected_version) throw new PlanError(409, 'El plan cambió o ya está publicado. Recargá y volvé a guardar.');
  const next: MealPlan = { ...existing, period_start: input.period_start, slots, updated_at: now };
  versions.set(next.id, next);
  return next;
}

export async function publishPlan(patientId: string, planId: string, expectedVersion: number, persistent: boolean, nutritionistId = 'nutri-demo'): Promise<MealPlan> {
  if (persistent) {
    const { data, error } = await getRequestDb().rpc('publish_plan_version', {
      plan_id: planId,
      expected_version: expectedVersion,
    });
    planDbError(error);
    if (!data) throw new PlanError(404, 'Plan no encontrado.');
    return data as MealPlan;
  }
  const plan = versions.get(planId);
  if (!plan || plan.patient_id !== patientId || plan.nutritionist_id !== nutritionistId) throw new PlanError(404, 'Plan no encontrado.');
  if (plan.version !== expectedVersion) throw new PlanError(409, 'El plan cambió o ya está publicado. Recargá y volvé a guardar.');
  if (plan.published_at) return plan;
  const published: MealPlan = { ...plan, published_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  versions.set(published.id, published);
  return published;
}
