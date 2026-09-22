import { getRequestDb } from '../db/supabase-client.js';
import { CareError } from '../care/errors.js';
import { getPatient } from '../store.js';
import { assertReadyToPublish, evaluateMealPlanDraft } from '../ai-eval/evaluate.js';
import { loadEvalHealth } from '../ai-eval/health.js';
import { getRecipeSnapshot, listProfessionalRecipes } from '../recipes/repository.js';
import {
  planSlotKey,
  planSlotLabel,
  type MealPlanDraftInput,
  type PatientMealPlan,
  type PlanItemView,
  type PlanRecipeDetail,
  type PlanSlot,
  type PlanVersionView,
  type ProfessionalMealPlan,
} from '../../src/types/plans.js';

export { CareError } from '../care/errors.js';

type MemItem = {
  id: string;
  version_id: string;
  for_date: string;
  slot: PlanSlot;
  recipe_id: string | null;
  recipe_version: number | null;
  recipe_title: string | null;
  recipe_version_id: string | null;
  free_text: string | null;
  portions: number | null;
  public_note: string;
};
type MemVersion = {
  id: string;
  meal_plan_id: string;
  version: number;
  status: 'draft' | 'published' | 'archived';
  period_start: string;
  period_end: string;
  published_at: string | null;
  created_at: string;
};
type MemPlan = {
  id: string;
  patient_id: string;
  nutritionist_id: string;
  timezone: string;
  created_at: string;
};

const plans = new Map<string, MemPlan>();
const versions = new Map<string, MemVersion>();
const items = new Map<string, MemItem>();

export function resetMealPlanMemory() {
  plans.clear();
  versions.clear();
  items.clear();
}

export function mealPlanDbError(error: { code?: string; message?: string } | null) {
  if (!error) return;
  if (['42P01', '42883', 'PGRST202', 'PGRST205'].includes(error.code ?? '')) {
    throw new CareError(501, 'Los planes fechados requieren instalar la migración de este módulo.');
  }
  if (error.code === '42501') throw new CareError(403, 'No tenés permiso para esta acción.');
  if (error.code === '23505' || error.code === 'PT409') {
    if (error.message === 'meal_plan_allergies') {
      throw new CareError(409, 'El plan incluye un alimento declarado como alergia o restricción. Revisalo antes de publicar.');
    }
    if (error.message === 'meal_plan_allergies_unknown') {
      throw new CareError(409, 'Completá alergias y restricciones con el paciente antes de publicar.');
    }
    if (error.message === 'meal_plan_incomplete') {
      throw new CareError(409, 'Este borrador todavía tiene texto de demostración o pendientes. Completalo antes de publicar.');
    }
    throw new CareError(409, 'El plan publicado no se puede sobrescribir. Publicá una versión nueva.');
  }
  if (['22023', '23514', '22P02'].includes(error.code ?? '')) throw new CareError(400, 'Revisá las fechas, los momentos y las recetas o textos del plan.');
  throw new CareError(503, 'No se pudo confirmar el guardado. Reintentá sin cerrar el formulario.');
}

function asNumber(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) throw new CareError(400, 'Revisá las fechas, los momentos y las recetas o textos del plan.');
  return n;
}

function asRecipeDetail(row: unknown, fallbackTitle: string | null, fallbackVersion: number | null): PlanRecipeDetail | null {
  if (!row || typeof row !== 'object') return null;
  const detail = row as Record<string, unknown>;
  const ingredientsRaw = Array.isArray(detail.ingredients) ? detail.ingredients : [];
  const title = String(detail.title ?? fallbackTitle ?? '');
  if (!title) return null;
  return {
    title,
    version: detail.version == null ? fallbackVersion ?? 1 : asNumber(detail.version),
    yield_portions: asNumber(detail.yield_portions),
    steps: Array.isArray(detail.steps) ? detail.steps.map((step) => String(step)) : [],
    nutrient_source: String(detail.nutrient_source ?? ''),
    ingredients: ingredientsRaw.map((item) => {
      const line = item as Record<string, unknown>;
      return {
        id: String(line.id),
        name: String(line.name),
        quantity: asNumber(line.quantity),
        unit: String(line.unit),
      };
    }),
  };
}

function asItem(row: Record<string, unknown>, snapshot?: PlanRecipeDetail | null): PlanItemView {
  const slot = planSlotLabel(String(row.slot ?? ''));
  if (!slot) throw new CareError(400, 'Revisá las fechas, los momentos y las recetas o textos del plan.');
  const recipeTitle = row.recipe_title ? String(row.recipe_title) : null;
  const recipeVersion = row.recipe_version == null ? null : asNumber(row.recipe_version);
  return {
    id: String(row.id),
    for_date: String(row.for_date).slice(0, 10),
    slot,
    recipe_id: row.recipe_id ? String(row.recipe_id) : null,
    recipe_version: recipeVersion,
    recipe_title: recipeTitle,
    recipe: snapshot === undefined ? asRecipeDetail(row.recipe, recipeTitle, recipeVersion) : snapshot,
    free_text: row.free_text ? String(row.free_text) : null,
    portions: row.portions == null ? null : asNumber(row.portions),
    public_note: String(row.public_note ?? ''),
  };
}

function asVersion(row: Record<string, unknown>): PlanVersionView {
  const status = row.status;
  if (status !== 'draft' && status !== 'published' && status !== 'archived') {
    throw new CareError(503, 'No se pudo confirmar el guardado. Reintentá sin cerrar el formulario.');
  }
  const rawItems = Array.isArray(row.items) ? row.items : [];
  return {
    id: String(row.id),
    version: asNumber(row.version),
    status,
    period_start: String(row.period_start).slice(0, 10),
    period_end: String(row.period_end).slice(0, 10),
    published_at: row.published_at ? String(row.published_at) : null,
    items: rawItems.map((item) => asItem(item as Record<string, unknown>)),
  };
}

function asProfessional(row: Record<string, unknown>): ProfessionalMealPlan {
  return {
    id: String(row.id),
    patient_id: String(row.patient_id),
    timezone: String(row.timezone),
    created_at: String(row.created_at),
    current: asVersion(row.current as Record<string, unknown>),
    published: row.published ? asVersion(row.published as Record<string, unknown>) : null,
  };
}

function asPatient(row: Record<string, unknown>): PatientMealPlan {
  const rawItems = Array.isArray(row.items) ? row.items : [];
  return {
    id: String(row.id),
    timezone: String(row.timezone),
    version: asNumber(row.version),
    period_start: String(row.period_start).slice(0, 10),
    period_end: String(row.period_end).slice(0, 10),
    published_at: String(row.published_at),
    items: rawItems.map((item) => asItem(item as Record<string, unknown>)),
  };
}

function planVersions(planId: string): MemVersion[] {
  return [...versions.values()].filter((row) => row.meal_plan_id === planId).sort((a, b) => a.version - b.version);
}

function versionItems(versionId: string): PlanItemView[] {
  return [...items.values()]
    .filter((item) => item.version_id === versionId)
    .sort((a, b) => a.for_date.localeCompare(b.for_date) || (planSlotKey(a.slot) ?? '').localeCompare(planSlotKey(b.slot) ?? ''))
    .map((item) => ({
      id: item.id,
      for_date: item.for_date,
      slot: item.slot,
      recipe_id: item.recipe_id,
      recipe_version: item.recipe_version,
      recipe_title: item.recipe_title,
      recipe: getRecipeSnapshot(item.recipe_version_id),
      free_text: item.free_text,
      portions: item.portions,
      public_note: item.public_note,
    }));
}

function memVersionView(row: MemVersion): PlanVersionView {
  return {
    id: row.id,
    version: row.version,
    status: row.status,
    period_start: row.period_start,
    period_end: row.period_end,
    published_at: row.published_at,
    items: versionItems(row.id),
  };
}

function memProfessional(row: MemPlan): ProfessionalMealPlan {
  const list = planVersions(row.id);
  const current = list[list.length - 1];
  if (!current) throw new CareError(404, 'Plan no encontrado.');
  const published = list.find((entry) => entry.status === 'published') ?? null;
  return {
    id: row.id,
    patient_id: row.patient_id,
    timezone: row.timezone,
    created_at: row.created_at,
    current: memVersionView(current),
    published: published ? memVersionView(published) : null,
  };
}

function memPatient(row: MemPlan): PatientMealPlan | null {
  const published = planVersions(row.id).find((entry) => entry.status === 'published');
  if (!published || !published.published_at) return null;
  return {
    id: row.id,
    timezone: row.timezone,
    version: published.version,
    period_start: published.period_start,
    period_end: published.period_end,
    published_at: published.published_at,
    items: versionItems(published.id),
  };
}

async function resolveRecipe(nutritionistId: string, recipeId: string, recipeVersion: number | undefined, persistent: boolean) {
  const catalog = await listProfessionalRecipes(nutritionistId, persistent);
  const recipe = catalog.find((entry) => entry.id === recipeId);
  const published = recipe?.published;
  if (!published) throw new CareError(400, 'Revisá las fechas, los momentos y las recetas o textos del plan.');
  if (recipeVersion != null && published.version !== recipeVersion) {
    const match = recipe.current.published_at && recipe.current.version === recipeVersion ? recipe.current : null;
    if (!match) throw new CareError(400, 'Revisá las fechas, los momentos y las recetas o textos del plan.');
    return { recipe_id: recipe.id, recipe_version: match.version, recipe_title: recipe.title, recipe_version_id: match.id };
  }
  return { recipe_id: recipe.id, recipe_version: published.version, recipe_title: recipe.title, recipe_version_id: published.id };
}

async function writeDraft(nutritionistId: string, patientId: string, input: MealPlanDraftInput, persistent: boolean): Promise<ProfessionalMealPlan> {
  if (!getPatient(patientId)) throw new CareError(404, 'Paciente no encontrado.');
  const now = new Date().toISOString();
  const existing = [...plans.values()].find((row) => row.patient_id === patientId && row.nutritionist_id === nutritionistId);
  if (existing && existing.id !== input.id) throw new CareError(409, 'El plan publicado no se puede sobrescribir. Publicá una versión nueva.');
  const prepared: Omit<MemItem, 'id' | 'version_id'>[] = [];
  const seen = new Set<string>();
  for (const item of input.items) {
    const slot = planSlotLabel(item.slot);
    if (!slot) throw new CareError(400, 'Revisá las fechas, los momentos y las recetas o textos del plan.');
    const key = `${item.for_date}|${planSlotKey(slot)}`;
    if (seen.has(key)) throw new CareError(400, 'Revisá las fechas, los momentos y las recetas o textos del plan.');
    seen.add(key);
    const hasRecipe = Boolean(item.recipe_id);
    const freeText = item.free_text?.trim() || null;
    if (hasRecipe === Boolean(freeText)) throw new CareError(400, 'Revisá las fechas, los momentos y las recetas o textos del plan.');
    const linked = item.recipe_id
      ? await resolveRecipe(nutritionistId, item.recipe_id, item.recipe_version, persistent)
      : { recipe_id: null, recipe_version: null, recipe_title: null, recipe_version_id: null };
    prepared.push({
      for_date: item.for_date,
      slot,
      recipe_id: linked.recipe_id,
      recipe_version: linked.recipe_version,
      recipe_title: linked.recipe_title,
      recipe_version_id: linked.recipe_version_id,
      free_text: linked.recipe_id ? null : freeText,
      portions: item.portions ?? null,
      public_note: item.public_note ?? '',
    });
  }
  const plan = existing ?? {
    id: input.id,
    patient_id: patientId,
    nutritionist_id: nutritionistId,
    timezone: input.timezone || 'America/Argentina/Buenos_Aires',
    created_at: now,
  };
  plan.timezone = input.timezone || plan.timezone;
  plans.set(plan.id, plan);
  const list = planVersions(plan.id);
  const latest = list[list.length - 1];
  let target: MemVersion;
  if (!latest || latest.status !== 'draft') {
    target = {
      id: crypto.randomUUID(),
      meal_plan_id: plan.id,
      version: (latest?.version ?? 0) + 1,
      status: 'draft',
      period_start: input.period_start,
      period_end: input.period_end,
      published_at: null,
      created_at: now,
    };
    versions.set(target.id, target);
  } else {
    target = latest;
    target.period_start = input.period_start;
    target.period_end = input.period_end;
    for (const item of [...items.values()].filter((row) => row.version_id === target.id)) items.delete(item.id);
  }
  for (const item of prepared) {
    const row: MemItem = { id: crypto.randomUUID(), version_id: target.id, ...item };
    items.set(row.id, row);
  }
  return memProfessional(plan);
}

export async function getProfessionalMealPlan(nutritionistId: string, patientId: string, persistent: boolean): Promise<ProfessionalMealPlan | null> {
  if (!persistent) {
    const plan = [...plans.values()].find((row) => row.patient_id === patientId && row.nutritionist_id === nutritionistId);
    return plan ? memProfessional(plan) : null;
  }
  const { data, error } = await getRequestDb().rpc('list_professional_meal_plan', { target_patient: patientId });
  mealPlanDbError(error);
  if (!data) return null;
  return asProfessional(data as Record<string, unknown>);
}

export async function getPublishedMealPlan(patientId: string, persistent: boolean): Promise<PatientMealPlan | null> {
  if (!persistent) {
    const plan = [...plans.values()].find((row) => row.patient_id === patientId);
    return plan ? memPatient(plan) : null;
  }
  const { data, error } = await getRequestDb().rpc('list_published_meal_plan', { target_patient: patientId });
  mealPlanDbError(error);
  if (!data) return null;
  return asPatient(data as Record<string, unknown>);
}

export async function saveMealPlanDraft(
  nutritionistId: string,
  patientId: string,
  input: MealPlanDraftInput,
  persistent: boolean,
): Promise<ProfessionalMealPlan> {
  if (!persistent) return writeDraft(nutritionistId, patientId, input, false);
  const { data, error } = await getRequestDb().rpc('save_meal_plan_draft', { target_patient: patientId, payload: input });
  mealPlanDbError(error);
  return asProfessional(data as Record<string, unknown>);
}

export async function publishMealPlan(
  nutritionistId: string,
  planId: string,
  expectedVersion: number,
  persistent: boolean,
): Promise<ProfessionalMealPlan> {
  if (!persistent) {
    const plan = plans.get(planId);
    if (!plan || plan.nutritionist_id !== nutritionistId) throw new CareError(403, 'No tenés permiso para esta acción.');
    const version = planVersions(planId).find((row) => row.version === expectedVersion);
    if (!version) throw new CareError(400, 'Revisá las fechas, los momentos y las recetas o textos del plan.');
    if (versionItems(version.id).length < 1) throw new CareError(400, 'Revisá las fechas, los momentos y las recetas o textos del plan.');
    const health = await loadEvalHealth(plan.patient_id, false);
    assertReadyToPublish(evaluateMealPlanDraft({
      period_start: version.period_start,
      period_end: version.period_end,
      items: versionItems(version.id),
    }, health));
    if (version.status === 'published') return memProfessional(plan);
    if (version.status !== 'draft') throw new CareError(409, 'El plan publicado no se puede sobrescribir. Publicá una versión nueva.');
    for (const row of planVersions(planId)) {
      if (row.status === 'published') row.status = 'archived';
    }
    version.status = 'published';
    version.published_at = new Date().toISOString();
    return memProfessional(plan);
  }
  const { data, error } = await getRequestDb().rpc('publish_meal_plan', { target_plan: planId, expected_version: expectedVersion });
  mealPlanDbError(error);
  return asProfessional(data as Record<string, unknown>);
}
