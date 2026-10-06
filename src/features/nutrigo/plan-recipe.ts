import type { PlanItemView, PatientMealPlan } from '../../types/plans';
import type { PatientRecipe } from '../../types/recipes';
import { unavailableCard } from '../../types/recipe-plate';

export function planRecipe(item: PlanItemView) {
  const recipe = item.recipe ?? item.recipe_proposal;
  if (!recipe) return null;
  const originalCard = 'card' in recipe ? recipe.card : undefined;
  const photo = item.dish_card;
  const card = { ...(originalCard ?? unavailableCard(recipe.title, item.slot)), ...(photo ? {
    cover_status: originalCard?.cover_status === 'ready' ? originalCard.cover_status : photo.cover_status,
    cover_url: originalCard?.cover_status === 'ready' ? originalCard.cover_url : photo.cover_url,
    cover_alt: originalCard?.cover_status === 'ready' ? originalCard.cover_alt : photo.cover_alt,
    cover_generation: originalCard?.cover_status === 'ready' ? 'ready' as const : photo.cover_generation,
  } : {}) };
  return { id: item.recipe_id ?? `plan:${item.id}`, title: recipe.title, version: item.recipe_version ?? 1,
    yield_portions: recipe.yield_portions, ingredients: recipe.ingredients.map((ingredient, index) => ({ ...ingredient, id: 'id' in ingredient ? ingredient.id : `${item.id}:${index}` })),
    steps: recipe.steps, nutrient_source: 'nutrient_source' in recipe ? recipe.nutrient_source : recipe.nutrition?.source ?? '', nutrition: recipe.nutrition ?? undefined, card };
}
export function recipePresentationKey(recipe: { id: string; version: number }) { return `${recipe.id}:${recipe.version}`; }
/** Published plan versions take precedence over separately assigned library versions. */
export function patientMenuRecipes(plan: PatientMealPlan | null, assigned: PatientRecipe[]) {
  const result: Array<Omit<PatientRecipe, 'ingredients'> & { ingredients: Array<{ id: string; name: string; quantity: number; unit: string }> }> = [], seen = new Set<string>();
  for (const item of plan?.items ?? []) {
    const recipe = planRecipe(item); if (!recipe) continue;
    const identity = item.recipe_id ? `${item.recipe_id}:${recipe.version}` : JSON.stringify([recipe.title, recipe.steps, recipe.ingredients.map(({ name, quantity, unit }) => ({ name, quantity, unit }))]);
    if (seen.has(identity)) continue; seen.add(identity);
    result.push({ ...recipe, published_at: plan!.published_at, assigned_at: plan!.published_at });
  }
  for (const recipe of assigned) if (!result.some(existing => existing.id === recipe.id)) result.push(recipe);
  return result;
}
