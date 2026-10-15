import { getRequestDb } from '../db/supabase-client.js';
import type { Recipe, RecipeInput, RecipeView } from '../../src/types/recipes.js';

export class RecipeError extends Error {
  constructor(public status: 400 | 403 | 404 | 409 | 501 | 503, message: string) { super(message); }
}

const catalog = new Map<string, Recipe>();
export function resetRecipeMemory() { catalog.clear(); }
export function toRecipeView(recipe: Recipe): RecipeView {
  const { nutritionist_id: _owner, ...view } = recipe;
  return view;
}
function recipeDbError(error: { code?: string } | null) {
  if (!error) return;
  if (['42P01', '42883', 'PGRST202', 'PGRST205'].includes(error.code ?? '')) throw new RecipeError(501, 'El catálogo de recetas requiere instalar la migración de este módulo.');
  if (error.code === '42501') throw new RecipeError(403, 'No tenés permiso para esta receta.');
  if (error.code === 'PT404') throw new RecipeError(404, 'Receta no encontrada.');
  if (error.code === '23505' || error.code === 'PT409') throw new RecipeError(409, 'Esta receta ya está publicada. Creá una nueva para cambiarla.');
  if (['22023', '23514', '22P02'].includes(error.code ?? '')) throw new RecipeError(400, 'Revisá título, porciones, ingredientes y fuente.');
  throw new RecipeError(503, 'No se pudo confirmar el guardado. Reintentá sin cerrar el formulario.');
}
export async function listRecipes(persistent: boolean, publishedOnly: boolean, nutritionistId = 'nutri-demo'): Promise<Recipe[]> {
  if (!persistent) {
    return [...catalog.values()]
      .filter(recipe => recipe.nutritionist_id === nutritionistId && (!publishedOnly || recipe.published_at))
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }
  let query = getRequestDb().from('recipes').select('id,nutritionist_id,title,ingredients,steps,explanation,servings,nutrient_source,created_at,updated_at,published_at').order('updated_at', { ascending: false }).limit(200);
  if (publishedOnly) query = query.not('published_at', 'is', null);
  const { data, error } = await query;
  recipeDbError(error);
  return (data ?? []) as Recipe[];
}
export async function saveRecipe(input: RecipeInput, persistent: boolean, nutritionistId = 'nutri-demo'): Promise<Recipe> {
  if (persistent) {
    const { data, error } = await getRequestDb().rpc('save_recipe', {
      recipe_id: input.id,
      title_value: input.title,
      ingredients_value: input.ingredients,
      steps_value: input.steps,
      explanation_value: input.explanation,
      servings_value: input.servings,
      nutrient_source_value: input.nutrient_source,
    });
    recipeDbError(error);
    return data as Recipe;
  }
  const old = catalog.get(input.id);
  if (old && old.nutritionist_id !== nutritionistId) throw new RecipeError(403, 'No tenés permiso para esta receta.');
  if (old?.published_at) {
    const same = old.title === input.title && old.explanation === input.explanation && old.servings === input.servings && old.nutrient_source === input.nutrient_source
      && JSON.stringify(old.ingredients) === JSON.stringify(input.ingredients) && JSON.stringify(old.steps) === JSON.stringify(input.steps);
    if (!same) throw new RecipeError(409, 'Esta receta ya está publicada. Creá una nueva para cambiarla.');
    return old;
  }
  const now = new Date().toISOString();
  const recipe: Recipe = { ...input, nutritionist_id: nutritionistId, created_at: old?.created_at ?? now, updated_at: now, published_at: null };
  catalog.set(recipe.id, recipe);
  return recipe;
}
export async function publishRecipe(id: string, persistent: boolean, nutritionistId = 'nutri-demo'): Promise<Recipe> {
  if (persistent) {
    const { data, error } = await getRequestDb().rpc('publish_recipe', { recipe_id: id });
    recipeDbError(error);
    if (!data) throw new RecipeError(404, 'Receta no encontrada.');
    return data as Recipe;
  }
  const recipe = catalog.get(id);
  if (!recipe || recipe.nutritionist_id !== nutritionistId) throw new RecipeError(404, 'Receta no encontrada.');
  recipe.published_at ??= new Date().toISOString();
  recipe.updated_at = recipe.published_at;
  return recipe;
}
