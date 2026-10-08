import { registerDemoState } from '../demo/state.js';
import { getRequestDb } from '../db/supabase-client.js';
import { CareError } from '../care/errors.js';
import { getPatient } from '../store.js';
import { assertReadyToPublish, evaluateRecipeDraft } from '../ai-eval/evaluate.js';
import { loadEvalHealth } from '../ai-eval/health.js';
import {
  RECIPE_UNITS,
  normalizeIngredientName,
  type PatientRecipe,
  type ProfessionalRecipe,
  type RecipeCard,
  type RecipeDraftInput,
  type RecipeItem,
  type RecipeUnit,
  type RecipeVersionView,
} from '../../src/types/recipes.js';
import { getRecipeCard, resetRecipeCards, setRecipeCard } from './presentation.js';
import { unavailableCard } from '../../src/types/recipe-plate.js';
import { generateRecipeCoverImage, recipeCoverEnabled } from '../ai/recipe-cover.js';
import { queueIngredientCovers } from './ingredient-covers.js';
import { logProviderFailure } from '../ai/mode.js';
import { recipeNutritionSchema, resolveRecipeNutrition, type RecipeNutrition } from '../../src/types/ai-nutrition.js';
import { calculateRecipeCatalog, type RecipeCatalogSnapshot } from '../../src/types/recipe-catalog-nutrition.js';
import { listFoods } from '../foods/repository.js';

export { CareError } from '../care/errors.js';

type MemIngredient = { id: string; nutritionist_id: string; name: string; name_normalized: string; base_unit: RecipeUnit; created_at: string };
type MemRecipe = { id: string; nutritionist_id: string; title: string; status: 'draft' | 'published' | 'archived'; created_at: string };
type MemVersion = {
  id: string;
  recipe_id: string;
  title: string;
  revision: string;
  version: number;
  yield_portions: number;
  steps: string[];
  nutrient_source: string;
  published_at: string | null;
  created_at: string;
  nutrition?: RecipeNutrition;
  catalog_recipe?: RecipeCatalogSnapshot;
  final_weight_g?: number | null;
  cooking_minutes?: number | null;
};
type MemLine = { id: string; recipe_version_id: string; ingredient_id: string; quantity: number; unit: RecipeUnit };
type MemAssignment = { recipe_id: string; patient_id: string; nutritionist_id: string; recipe_version_id: string; assigned_at: string };

const ingredients = new Map<string, MemIngredient>();
const recipes = new Map<string, MemRecipe>();
const versions = new Map<string, MemVersion>();
const lines = new Map<string, MemLine>();
const assignments = new Map<string, MemAssignment>();
const professionalFavorites = new Map<string, { nutritionistId: string; recipeId: string }>();

export function resetRecipeMemory() {
  ingredients.clear();
  recipes.clear();
  versions.clear();
  lines.clear();
  assignments.clear();
  professionalFavorites.clear();
  resetRecipeCards();
}

export function recipeDbError(error: { code?: string; message?: string } | null) {
  if (!error) return;
  if (['42P01', '42883', 'PGRST202', 'PGRST205'].includes(error.code ?? '')) {
    throw new CareError(501, 'El catálogo de recetas requiere instalar la migración de este módulo.');
  }
  if (error.code === '42501') throw new CareError(403, 'No tenés permiso para esta acción.');
  if (error.code === 'PT404') throw new CareError(404, 'No encontramos esa comida asignada.');
  if (error.code === '23505' || error.code === 'PT409') {
    if (error.message === 'meal_plan_allergies' || error.message === 'recipe_allergies') {
      throw new CareError(409, 'El contenido incluye un alimento declarado como alergia o restricción. Revisalo antes de publicar.');
    }
    if (error.message === 'meal_plan_allergies_unknown') {
      throw new CareError(409, 'Completá alergias y restricciones con el paciente antes de publicar.');
    }
    if (error.message === 'recipe_incomplete' || error.message === 'meal_plan_incomplete') {
      throw new CareError(409, 'Este borrador todavía tiene texto de demostración o pendientes. Completalo antes de publicar.');
    }
    throw new CareError(409, 'Esa revisión ya fue publicada. Guardá una versión nueva.');
  }
  if (['22023', '23514', '22P02'].includes(error.code ?? '')) throw new CareError(400, 'Revisá el título, las porciones, los pasos, los ingredientes y la fuente nutricional.');
  throw new CareError(503, 'No se pudo confirmar el guardado. Reintentá sin cerrar el formulario.');
}

function asUnit(value: string): RecipeUnit {
  if ((RECIPE_UNITS as readonly string[]).includes(value)) return value as RecipeUnit;
  throw new CareError(400, 'Revisá el título, las porciones, los pasos, los ingredientes y la fuente nutricional.');
}

function asNumber(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) throw new CareError(400, 'Revisá el título, las porciones, los pasos, los ingredientes y la fuente nutricional.');
  return n;
}

function asItem(row: { id?: string; name?: string; quantity?: unknown; unit?: string }): RecipeItem {
  if (!row.id || !row.name || row.unit == null) throw new CareError(503, 'No se pudo confirmar el guardado. Reintentá sin cerrar el formulario.');
  return { id: row.id, name: row.name, quantity: asNumber(row.quantity), unit: asUnit(row.unit) };
}

function asCover(row: Record<string, unknown>, title: string): RecipeCard {
  const status = row.cover_status === 'ready' || row.cover_status === 'failed' ? row.cover_status : 'none';
  const url = status === 'ready' && typeof row.cover_url === 'string' ? row.cover_url : null;
  const alt = typeof row.cover_alt === 'string' && row.cover_alt ? row.cover_alt : title;
  return { ...unavailableCard(title), cover_status: status, cover_url: url, cover_alt: alt };
}

function asVersion(row: Record<string, unknown>, title: string): RecipeVersionView {
  const ingredientsRaw = Array.isArray(row.ingredients) ? row.ingredients : [];
  return {
    id: String(row.id),
    version: asNumber(row.version),
    title: String(row.title ?? title),
    ...(row.revision ? { revision: String(row.revision) } : {}),
    yield_portions: asNumber(row.yield_portions),
    steps: Array.isArray(row.steps) ? row.steps.map((step) => String(step)) : [],
    nutrient_source: String(row.nutrient_source ?? ''),
    ...(row.nutrition ? { nutrition: recipeNutritionSchema.parse(row.nutrition) } : {}),
    ...(row.catalog_recipe ? { catalog_recipe: row.catalog_recipe as RecipeCatalogSnapshot } : {}),
    final_weight_g: row.final_weight_g == null ? null : asNumber(row.final_weight_g),
    cooking_minutes: row.cooking_minutes == null ? null : asNumber(row.cooking_minutes),
    published_at: row.published_at ? String(row.published_at) : null,
    ingredients: ingredientsRaw.map((item) => asItem(item as { id?: string; name?: string; quantity?: unknown; unit?: string })),
    card: row.card ? (row.card as RecipeCard) : asCover(row, title),
  };
}

function asProfessional(row: Record<string, unknown>): ProfessionalRecipe {
  const status = row.status;
  if (status !== 'draft' && status !== 'published' && status !== 'archived') {
    throw new CareError(503, 'No se pudo confirmar el guardado. Reintentá sin cerrar el formulario.');
  }
  const title = String(row.title);
  return {
    id: String(row.id),
    title,
    status,
    created_at: String(row.created_at),
    current: asVersion(row.current as Record<string, unknown>, title),
    published: row.published ? asVersion(row.published as Record<string, unknown>, title) : null,
  };
}

function asPatient(row: Record<string, unknown>): PatientRecipe {
  const ingredientsRaw = Array.isArray(row.ingredients) ? row.ingredients : [];
  const title = String(row.title);
  return {
    id: String(row.id),
    title,
    version: asNumber(row.version),
    yield_portions: asNumber(row.yield_portions),
    steps: Array.isArray(row.steps) ? row.steps.map((step) => String(step)) : [],
    nutrient_source: String(row.nutrient_source ?? ''),
    ...(row.nutrition ? { nutrition: recipeNutritionSchema.parse(row.nutrition) } : {}),
    ingredients: ingredientsRaw.map((item) => asItem(item as { id?: string; name?: string; quantity?: unknown; unit?: string })),
    assigned_at: String(row.assigned_at),
    published_at: String(row.published_at),
    card: row.card ? (row.card as RecipeCard) : asCover(row, title),
  };
}

function parseList<T>(data: unknown, map: (row: Record<string, unknown>) => T): T[] {
  if (data == null) return [];
  const rows = Array.isArray(data) ? data : [];
  return rows.map((row) => map(row as Record<string, unknown>));
}

function recipeVersions(recipeId: string): MemVersion[] {
  return [...versions.values()].filter((row) => row.recipe_id === recipeId).sort((a, b) => a.version - b.version);
}

function versionItems(versionId: string): RecipeItem[] {
  return [...lines.values()]
    .filter((line) => line.recipe_version_id === versionId)
    .map((line) => {
      const ingredient = ingredients.get(line.ingredient_id);
      if (!ingredient) throw new CareError(503, 'No se pudo confirmar el guardado. Reintentá sin cerrar el formulario.');
      return { id: ingredient.id, name: ingredient.name, quantity: line.quantity, unit: line.unit };
    })
    .sort((a, b) => normalizeIngredientName(a.name).localeCompare(normalizeIngredientName(b.name), 'es-AR'));
}

function memVersionView(row: MemVersion): RecipeVersionView {
  return {
    title: row.title, revision: row.revision,
    id: row.id,
    version: row.version,
    yield_portions: row.yield_portions,
    steps: row.steps,
    nutrient_source: row.nutrient_source,
    ...(row.nutrition ? { nutrition: row.nutrition } : {}),
    ...(row.catalog_recipe ? { catalog_recipe: structuredClone(row.catalog_recipe) } : {}),
    final_weight_g: row.final_weight_g ?? null,
    cooking_minutes: row.cooking_minutes ?? null,
    published_at: row.published_at,
    ingredients: versionItems(row.id),
    card: getRecipeCard(row.id, row.title),
  };
}

export function getRecipeSnapshot(recipeVersionId: string | null) {
  if (!recipeVersionId) return null;
  const version = versions.get(recipeVersionId);
  const recipe = version ? recipes.get(version.recipe_id) : undefined;
  if (!version || !recipe || !version.published_at) return null;
  const nutrition = resolveRecipeNutrition(version.nutrition, getRecipeCard(version.id, version.title).macros, version.nutrient_source);
  return {
    title: version.title,
    version: version.version,
    yield_portions: version.yield_portions,
    steps: version.steps,
    nutrient_source: version.nutrient_source,
    card: getRecipeCard(version.id, version.title),
    ...(version.catalog_recipe ? { catalog_recipe: version.catalog_recipe } : {}),
    ...(nutrition ? { nutrition } : {}),
    ingredients: versionItems(version.id),
  };
}

function memProfessional(row: MemRecipe): ProfessionalRecipe {
  const list = recipeVersions(row.id);
  const current = list[list.length - 1];
  if (!current) throw new CareError(404, 'Receta no encontrada.');
  const published = [...list].reverse().find((entry) => entry.published_at);
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    created_at: row.created_at,
    current: memVersionView(current),
    published: published ? memVersionView(published) : null,
  };
}

function upsertIngredient(nutritionistId: string, name: string, unit: RecipeUnit): MemIngredient {
  const name_normalized = normalizeIngredientName(name);
  const existing = [...ingredients.values()].find((row) => row.nutritionist_id === nutritionistId && row.name_normalized === name_normalized);
  if (existing) {
    return existing;
  }
  const row: MemIngredient = {
    id: crypto.randomUUID(),
    nutritionist_id: nutritionistId,
    name: name.trim(),
    name_normalized,
    base_unit: unit,
    created_at: new Date().toISOString(),
  };
  ingredients.set(row.id, row);
  return row;
}

function writeDraft(nutritionistId: string, input: RecipeDraftInput, card?: RecipeCard): ProfessionalRecipe {
  const now = new Date().toISOString();
  let recipe = recipes.get(input.id);
  if (recipe && recipe.nutritionist_id !== nutritionistId) throw new CareError(403, 'No tenés permiso para esta acción.');
  const list = recipeVersions(input.id);
  const latest = list[list.length - 1];
  if (input.expected_revision !== undefined && input.expected_revision !== (latest?.revision ?? null)) throw new CareError(409, 'La receta cambió. Recuperá la versión guardada antes de editar.');
  if (!recipe) {
    recipe = { id: input.id, nutritionist_id: nutritionistId, title: input.title.trim(), status: 'draft', created_at: now };
    recipes.set(recipe.id, recipe);
  } else {
    recipe.title = input.title.trim();
  }
  let target: MemVersion;
  if (!latest || latest.published_at) {
    target = {
      id: crypto.randomUUID(),
      recipe_id: recipe.id,
      title: input.title.trim(),
      revision: crypto.randomUUID(),
      version: (latest?.version ?? 0) + 1,
      yield_portions: input.yield_portions,
      steps: input.steps.map((step) => step.trim()),
      nutrient_source: input.nutrient_source ?? '',
      ...(input.nutrition ? { nutrition: input.nutrition } : latest?.nutrition ? { nutrition: latest.nutrition } : {}),
      published_at: null,
      created_at: now,
    };
    versions.set(target.id, target);
  } else {
    target = latest;
    target.yield_portions = input.yield_portions;
    target.steps = input.steps.map((step) => step.trim());
    target.nutrient_source = input.nutrient_source ?? '';
    target.nutrition = input.nutrition ?? latest.nutrition;
    for (const line of [...lines.values()].filter((row) => row.recipe_version_id === target.id)) lines.delete(line.id);
  }
  target.title = input.title.trim(); target.revision = crypto.randomUUID();
  for (const item of input.items) {
    const ingredient = upsertIngredient(nutritionistId, item.name, item.unit);
    const line: MemLine = {
      id: crypto.randomUUID(),
      recipe_version_id: target.id,
      ingredient_id: ingredient.id,
      quantity: item.quantity,
      unit: item.unit,
    };
    const duplicate = [...lines.values()].find((row) => row.recipe_version_id === target.id && row.ingredient_id === ingredient.id);
    if (duplicate) {
      duplicate.quantity = item.quantity;
      duplicate.unit = item.unit;
    } else {
      lines.set(line.id, line);
    }
  }
  if (latest?.nutrition?.origin === 'ai_estimate' && target.nutrition) {
    target.nutrition = { ...target.nutrition, origin: 'ai_estimate', source: latest.nutrition.source };
    target.nutrient_source = latest.nutrition.source;
  }
  const nutritionalCard = target.nutrition ? { ...unavailableCard(recipe.title), macro_status: 'declared' as const, macros: target.nutrition.per_portion } : undefined;
  setRecipeCard(target.id, card ?? nutritionalCard ?? getRecipeCard(target.id, recipe.title) ?? unavailableCard(recipe.title));
  return memProfessional(recipe);
}

export async function listProfessionalRecipes(nutritionistId: string, persistent: boolean): Promise<ProfessionalRecipe[]> {
  if (!persistent) {
    return [...recipes.values()]
      .filter((row) => row.nutritionist_id === nutritionistId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map(memProfessional);
  }
  const { data, error } = await getRequestDb().rpc('list_professional_recipes');
  recipeDbError(error);
  return parseList(data, asProfessional);
}

export async function saveRecipeDraft(
  nutritionistId: string,
  input: RecipeDraftInput,
  persistent: boolean,
  card?: RecipeCard,
): Promise<ProfessionalRecipe> {
  if (!persistent) {
    const existing = recipes.get(input.id);
    if (existing && existing.nutritionist_id !== nutritionistId) throw new CareError(403, 'No tenés permiso para esta acción.');
    const history = recipeVersions(input.id);
    const prior = history[history.length - 1];
    const linked = input.items.some(item => item.catalog_ref) || Boolean(prior?.catalog_recipe);
    let snapshot: RecipeCatalogSnapshot | undefined;
    let derived: RecipeNutrition | undefined;
    let prepared = input;
    if (linked) {
      try { snapshot = calculateRecipeCatalog(input, await listFoods(nutritionistId, false), prior?.catalog_recipe); }
      catch (error) { throw new CareError(409, error instanceof Error ? error.message : 'Revisá los alimentos de la receta.'); }
      const estimateSource = prior?.catalog_recipe?.estimate_source ?? (prior?.nutrition?.origin === 'ai_estimate' ? prior.nutrition.source : input.nutrition?.origin === 'ai_estimate' ? input.nutrition.source : /^(estimacion_ia|propuesta_ia)\./.test(prior?.nutrient_source ?? '') ? prior!.nutrient_source : /^(estimacion_ia|propuesta_ia)\./.test(input.nutrient_source) ? input.nutrient_source : null);
      snapshot.estimate_origin = Boolean(estimateSource);
      snapshot.estimate_source = estimateSource;
      const source = estimateSource ?? 'catalogo_alimentos.v1';
      const p = snapshot.per_portion;
      const macros = { kcal: p.kcal, protein_g: p.protein, carbs_g: p.carbs, fat_g: p.fat };
      const parsed = recipeNutritionSchema.safeParse({ origin: estimateSource ? 'ai_estimate' : 'declared', source, per_portion: macros });
      derived = parsed.success ? parsed.data : undefined;
      if ((p.kcal ?? 0) > 20000 || [p.protein, p.carbs, p.fat].some(value => (value ?? 0) > 2000)) throw new CareError(400, 'Revisá las cantidades y el rinde: los valores por porción son demasiado altos.');
      prepared = { ...input, nutrient_source: source, nutrition: derived, items: snapshot.lines.map(line => ({ name: line.name, quantity: line.food ? line.grams! : line.quantity, unit: line.food ? 'g' as const : line.unit as RecipeUnit })) };
      card = { ...(card ?? unavailableCard(input.title)), macros: Object.values(macros).some(value => value != null) ? macros : null, macro_status: Object.values(macros).some(value => value != null) ? 'declared' : 'unavailable' };
    }
    const result = writeDraft(nutritionistId, prepared, card);
    const saved = versions.get(result.current.id)!;
    saved.catalog_recipe = snapshot;
    saved.final_weight_g = input.final_weight_g ?? null;
    saved.cooking_minutes = input.cooking_minutes ?? null;
    if (linked) saved.nutrition = derived;
    else if (prior?.catalog_recipe && !input.nutrition) saved.nutrition = undefined;
    return memProfessional(recipes.get(input.id)!);
  }
  const { data, error } = await getRequestDb().rpc('save_recipe_draft', { payload: { ...input, ...(card ? { card } : {}) } });
  recipeDbError(error);
  return asProfessional(data as Record<string, unknown>);
}

function gateRecipePublish(title: string, version: { yield_portions: number; steps: string[]; ingredients: RecipeItem[] }) {
  assertReadyToPublish(evaluateRecipeDraft({
    title,
    yield_portions: version.yield_portions,
    steps: version.steps,
    items: version.ingredients,
  }));
}

export async function publishRecipe(nutritionistId: string, recipeId: string, expectedVersion: number, persistent: boolean, expectedRevision?: string): Promise<ProfessionalRecipe> {
  if (!persistent) {
    const recipe = recipes.get(recipeId);
    if (!recipe || recipe.nutritionist_id !== nutritionistId) throw new CareError(403, 'No tenés permiso para esta acción.');
    const version = recipeVersions(recipeId).find((row) => row.version === expectedVersion);
    if (!version) throw new CareError(400, 'Revisá el título, las porciones, los pasos, los ingredientes y la fuente nutricional.');
    if (expectedRevision !== undefined && expectedRevision !== version.revision) throw new CareError(409, 'La receta cambió. Recuperá la versión guardada antes de publicar.');
    if (versionItems(version.id).length < 1 || version.steps.length < 1) {
      throw new CareError(400, 'Revisá el título, las porciones, los pasos, los ingredientes y la fuente nutricional.');
    }
    gateRecipePublish(version.title ?? recipe.title, { yield_portions: version.yield_portions, steps: version.steps, ingredients: versionItems(version.id) });
    if (!version.published_at) {
      version.published_at = new Date().toISOString();
      recipe.status = 'published';
    }
    return memProfessional(recipe);
  }
  const catalog = await listProfessionalRecipes(nutritionistId, true);
  const recipe = catalog.find((row) => row.id === recipeId);
  if (!recipe) throw new CareError(403, 'No tenés permiso para esta acción.');
  const version = recipe.current.version === expectedVersion ? recipe.current : recipe.published?.version === expectedVersion ? recipe.published : null;
  if (!version) throw new CareError(400, 'Revisá el título, las porciones, los pasos, los ingredientes y la fuente nutricional.');
  gateRecipePublish(recipe.title, version);
  const { data, error } = await getRequestDb().rpc('publish_recipe', { target_recipe: recipeId, expected_version: expectedVersion, expected_revision: expectedRevision });
  recipeDbError(error);
  const published = asProfessional(data as Record<string, unknown>);
  // Automatic photos start only when this version is included in an approved
  // menu. Publishing the library recipe alone never contacts the image model.
  return published;
}

/**
 * El botón explícito de fotos permite reintentar una receta ya publicada.
 * La publicación ya está confirmada: un fallo de foto no revierte ese éxito.
 * Sin proveedor se conserva la portada existente; un intento fallido queda sin URL.
 */
async function attachCoverOnApproval(nutritionistId: string, recipe: ProfessionalRecipe, retry = false): Promise<boolean> {
  const version = recipe.published;
  if (!version || version.card?.cover_status === 'ready' || !recipeCoverEnabled()) return false;
  const { data: token, error: claimError } = await getRequestDb().rpc('claim_recipe_cover', {
    target_version: version.id, retry,
  });
  recipeDbError(claimError);
  if (typeof token !== 'string' || !token) return false;
  const generated = await generateRecipeCoverImage({
    title: version.title ?? recipe.title,
    items: version.ingredients.map((item) => ({ name: item.name, quantity: item.quantity, unit: item.unit })),
    steps: version.steps,
  });
  let cover: { status: 'ready' | 'failed'; url: string | null; alt: string } = {
    status: 'failed', url: null, alt: recipe.title,
  };
  if (generated.status === 'ready') {
    const extension = generated.mime === 'image/jpeg' ? 'jpg' : generated.mime === 'image/webp' ? 'webp' : 'png';
    const path = `${nutritionistId}/${version.id}/${crypto.randomUUID()}.${extension}`;
    try {
      const bucket = getRequestDb().storage.from('recipe-covers');
      const { error } = await bucket.upload(path, generated.bytes, { contentType: generated.mime, upsert: false });
      if (error) throw error;
      cover = { status: 'ready', url: bucket.getPublicUrl(path).data.publicUrl, alt: generated.alt };
    } catch (error) {
      logProviderFailure('recipe-cover-upload', error);
    }
  }
  try {
    const { data, error } = await getRequestDb().rpc('finish_recipe_cover', {
      target_version: version.id,
      claim_token: token,
      cover_status: cover.status,
      cover_url: cover.url,
      cover_alt: cover.alt,
    });
    if (error) throw error;
    const row = data as { cover_status: RecipeCard['cover_status']; cover_url: string | null; cover_alt: string };
    version.card = { ...(version.card ?? unavailableCard(recipe.title)), cover_status: row.cover_status, cover_url: row.cover_url, cover_alt: row.cover_alt };
    if (recipe.current.id === version.id) recipe.current.card = version.card;
  } catch (error) {
    logProviderFailure('recipe-cover-persist', error);
    throw new CareError(503, 'La receta sigue publicada, pero no pudimos guardar la foto. Reintentá más tarde.');
  }
  return true;
}

export async function retryRecipeCover(nutritionistId: string, recipeId: string, expectedVersion: number, persistent: boolean): Promise<ProfessionalRecipe> {
  const catalog = await listProfessionalRecipes(nutritionistId, persistent);
  const recipe = catalog.find((row) => row.id === recipeId);
  if (!recipe) throw new CareError(403, 'No tenés permiso para esta acción.');
  if (!recipe.published || recipe.published.version !== expectedVersion) {
    throw new CareError(409, 'La receta cambió. Volvé a abrir la revisión publicada antes de generar la foto.');
  }
  // Los ingredientes comparten el catálogo: también se reservan si el plato ya tiene foto.
  if (recipeCoverEnabled()) await queueIngredientCovers(() => recipe.published?.ingredients ?? [], { persistent, retry: true });
  if (recipe.published.card?.cover_status === 'ready') return recipe;
  if (!recipeCoverEnabled()) {
    throw new CareError(503, 'La generación de fotos todavía no está habilitada. La receta sigue publicada.');
  }
  if (!persistent) {
    const { enqueueMemoryDish, proposalCoverContext } = await import('./menu-covers.js');
    await enqueueMemoryDish(nutritionistId, proposalCoverContext({ ...recipe.published, title: recipe.published.title ?? recipe.title }), recipe.published.id, true);
    return (await listProfessionalRecipes(nutritionistId, false)).find(row => row.id === recipeId)!;
  }
  if (!await attachCoverOnApproval(nutritionistId, recipe, true)) {
    throw new CareError(409, 'La foto ya se está preparando o se intentó hace poco. Esperá unos minutos y volvé a abrir la receta.');
  }
  return recipe;
}

export async function assignRecipe(
  nutritionistId: string,
  recipeId: string,
  patientId: string,
  expectedVersion: number,
  persistent: boolean,
): Promise<PatientRecipe> {
  if (!persistent) {
    if (!getPatient(patientId)) throw new CareError(404, 'Paciente no encontrado.');
    const recipe = recipes.get(recipeId);
    if (!recipe || recipe.nutritionist_id !== nutritionistId) throw new CareError(403, 'No tenés permiso para esta acción.');
    const version = recipeVersions(recipeId).find((row) => row.version === expectedVersion);
    if (!version || !version.published_at) throw new CareError(400, 'Revisá el título, las porciones, los pasos, los ingredientes y la fuente nutricional.');
    const health = await loadEvalHealth(patientId, false);
    assertReadyToPublish(evaluateRecipeDraft({
      title: version.title,
      yield_portions: version.yield_portions,
      steps: version.steps,
      items: versionItems(version.id),
    }, health, { requireHealth: true }));
    const key = `${recipeId}:${patientId}`;
    const row: MemAssignment = {
      recipe_id: recipeId,
      patient_id: patientId,
      nutritionist_id: nutritionistId,
      recipe_version_id: version.id,
      assigned_at: new Date().toISOString(),
    };
    assignments.set(key, row);
    return {
      id: recipe.id,
      title: version.title,
      version: version.version,
      yield_portions: version.yield_portions,
      steps: version.steps,
      nutrient_source: version.nutrient_source,
      ...(version.nutrition ? { nutrition: version.nutrition } : {}),
      ingredients: versionItems(version.id),
      card: getRecipeCard(version.id, version.title),
      assigned_at: row.assigned_at,
      published_at: version.published_at,
    };
  }
  const catalog = await listProfessionalRecipes(nutritionistId, true);
  const owned = catalog.find((row) => row.id === recipeId);
  const assignedVersion = owned?.published?.version === expectedVersion ? owned.published : owned?.current.version === expectedVersion ? owned.current : null;
  if (!owned || !assignedVersion?.published_at) throw new CareError(400, 'Revisá el título, las porciones, los pasos, los ingredientes y la fuente nutricional.');
  const health = await loadEvalHealth(patientId, true);
  assertReadyToPublish(evaluateRecipeDraft({
    title: assignedVersion.title ?? owned.title,
    yield_portions: assignedVersion.yield_portions,
    steps: assignedVersion.steps,
    items: assignedVersion.ingredients,
  }, health, { requireHealth: true }));
  const { data, error } = await getRequestDb().rpc('assign_recipe', {
    target_recipe: recipeId,
    target_patient: patientId,
    expected_version: expectedVersion,
  });
  recipeDbError(error);
  return asPatient(data as Record<string, unknown>);
}

export async function listAssignedRecipes(patientId: string, persistent: boolean): Promise<PatientRecipe[]> {
  if (!persistent) {
    const listed: PatientRecipe[] = [];
    for (const row of assignments.values()) {
      if (row.patient_id !== patientId) continue;
      const recipe = recipes.get(row.recipe_id);
      const version = versions.get(row.recipe_version_id);
      if (!recipe || !version || !version.published_at) continue;
      listed.push({
        id: recipe.id,
        title: version.title,
        version: version.version,
        yield_portions: version.yield_portions,
        steps: version.steps,
        nutrient_source: version.nutrient_source,
        ...(version.nutrition ? { nutrition: version.nutrition } : {}),
        ingredients: versionItems(version.id),
        card: getRecipeCard(version.id, version.title),
        assigned_at: row.assigned_at,
        published_at: version.published_at,
      });
    }
    return listed.sort((a, b) => b.assigned_at.localeCompare(a.assigned_at));
  }
  const { data, error } = await getRequestDb().rpc('list_assigned_recipes', { target: patientId });
  recipeDbError(error);
  return parseList(data, asPatient);
}

export function readPublishedMemory(nutritionistId: string, recipeId: string, expectedVersion: number) {
  const recipe = recipes.get(recipeId);
  if (!recipe || recipe.nutritionist_id !== nutritionistId) return null;
  const version = recipeVersions(recipeId).find((row) => row.version === expectedVersion && row.published_at);
  if (!version) return null;
  return {
    title: version.title,
    version: version.version,
    versionId: version.id,
    nutrition: resolveRecipeNutrition(version.nutrition, getRecipeCard(version.id,version.title).macros, version.nutrient_source) ?? undefined,
    yield_portions: version.yield_portions,
    ingredients: versionItems(version.id),
    card: getRecipeCard(version.id, version.title),
  };
}

export async function listProfessionalRecipeFavorites(nutritionistId: string, persistent: boolean): Promise<string[]> {
  if (!persistent) return [...professionalFavorites.values()].filter(value => value.nutritionistId === nutritionistId).map(value => value.recipeId);
  const { data, error } = await getRequestDb().rpc('list_professional_recipe_favorites');
  recipeDbError(error);
  if (!Array.isArray(data) || data.some(id => typeof id !== 'string')) throw new CareError(503, 'No pudimos cargar tus favoritos. Reintentá.');
  return data as string[];
}

export async function setProfessionalRecipeFavorite(nutritionistId: string, recipeId: string, favorite: boolean, persistent: boolean) {
  if (!persistent) {
    if (recipes.get(recipeId)?.nutritionist_id !== nutritionistId) throw new CareError(403, 'No tenés permiso para guardar esta receta.');
    const key = `${nutritionistId}:${recipeId}`;
    if (favorite) professionalFavorites.set(key, { nutritionistId, recipeId }); else professionalFavorites.delete(key);
    return { recipe_id: recipeId, favorite };
  }
  const { data, error } = await getRequestDb().rpc('set_professional_recipe_favorite', { target_recipe: recipeId, is_favorite: favorite });
  recipeDbError(error);
  if (!data || data.recipe_id !== recipeId || data.favorite !== favorite) throw new CareError(503, 'No pudimos confirmar el favorito. Reintentá.');
  return { recipe_id: recipeId, favorite };
}

registerDemoState('recipes/repository', () => ({ ingredients, recipes, versions, lines, assignments, professionalFavorites }));
