import type { PlanItemView, PatientMealPlan } from '../../types/plans';
import type { PatientRecipe } from '../../types/recipes';
import { unavailableCard } from '../../types/recipe-plate';

/** Adapt component copies to the existing recipe viewer without consulting mutable catalogs. */
export function planComponentItems(item: PlanItemView): PlanItemView[] {
  if (!item.components) return [item];
  return item.components.map(component => ({ ...item, id: `${item.id}:${component.id}`, components: undefined,
    recipe: component.kind === 'recipe' ? component.recipe_snapshot ?? null : null,
    recipe_id: component.kind === 'recipe' ? component.recipe_id : null,
    recipe_version: component.kind === 'recipe' ? component.recipe_version : null,
    recipe_title: component.kind === 'recipe' ? component.recipe_snapshot?.title ?? null : null,
    recipe_proposal: component.kind === 'text' ? component.recipe_proposal : undefined,
    portions: component.kind === 'food' ? null : component.portions ?? null,
    free_text: component.kind === 'text' ? component.free_text : null,
    public_note: component.public_note,
    dish_card: undefined,
  }));
}
export function planRecipe(item: PlanItemView) {
  if (item.components) {
    for (const entry of planComponentItems(item)) { const recipe = singlePlanRecipe(entry); if (recipe) return recipe; }
    return null;
  }
  return singlePlanRecipe(item);
}
function singlePlanRecipe(item: PlanItemView) {
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
  for (const item of (plan?.items ?? []).flatMap(planComponentItems)) {
    const recipe = planRecipe(item); if (!recipe) continue;
    const identity = item.recipe_id ? `${item.recipe_id}:${recipe.version}` : JSON.stringify([recipe.title, recipe.steps, recipe.ingredients.map(({ name, quantity, unit }) => ({ name, quantity, unit }))]);
    if (seen.has(identity)) continue; seen.add(identity);
    result.push({ ...recipe, published_at: plan!.published_at, assigned_at: plan!.published_at });
  }
  for (const recipe of assigned) if (!result.some(existing => existing.id === recipe.id)) result.push(recipe);
  return result;
}
