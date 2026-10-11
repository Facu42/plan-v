import { NUTRIENTS, normalizeFoodSearch, type FoodNutrients } from './foods';
import type { ProfessionalRecipe } from './recipes';
import type { PlanItemView, PlanRecipeDetail } from './plans';

export function publishedRecipeDetail(recipe: ProfessionalRecipe): PlanRecipeDetail | null {
  const version = recipe.published;
  return version ? { ...version, title: version.title ?? recipe.title } : null;
}

export function filterPlanRecipes(recipes: readonly ProfessionalRecipe[], query: string, culinaryCategory: string) {
  const term = normalizeFoodSearch(query);
  return recipes.filter(recipe => {
    const version = publishedRecipeDetail(recipe);
    return version && (!term || normalizeFoodSearch(`${version.title} ${version.ingredients.map(item => item.name).join(' ')}`).includes(term)) &&
      (!culinaryCategory || version.card?.culinary_categories?.some(category => normalizeFoodSearch(category) === normalizeFoodSearch(culinaryCategory)));
  });
}

export function resolvePlanRecipeSelection(item: { recipe_id: string; recipe_version?: number; recipePreview?: PlanRecipeDetail }, recipes: readonly ProfessionalRecipe[], savedItems: readonly PlanItemView[]) {
  if (!item.recipe_id || item.recipe_version == null) return null;
  if (item.recipePreview?.version === item.recipe_version) return item.recipePreview;
  const saved = savedItems.find(saved => saved.recipe_id === item.recipe_id && saved.recipe_version === item.recipe_version)?.recipe;
  if (saved) return saved;
  const recipe = recipes.find(recipe => recipe.id === item.recipe_id);
  return recipe?.published?.version === item.recipe_version ? publishedRecipeDetail(recipe) : null;
}

export function recipePortionNutrients(recipe: PlanRecipeDetail, portions: number): FoodNutrients | null {
  if (!Number.isFinite(portions) || portions < 0.0001 || portions > 50) return null;
  const macros = recipe.nutrition?.per_portion ?? recipe.card?.macros;
  const perPortion = recipe.catalog_recipe?.per_portion ?? {
    kcal: macros?.kcal ?? null, protein: macros?.protein_g ?? null, carbs: macros?.carbs_g ?? null, fat: macros?.fat_g ?? null,
  };
  return Object.fromEntries(NUTRIENTS.map(([key]) => [key, perPortion[key as keyof typeof perPortion] == null ? null : Math.round(perPortion[key as keyof typeof perPortion]! * portions * 10000) / 10000])) as FoodNutrients;
}
