import type { MenuNutritionTarget } from '../types/ai-nutrition.js';

/** A calculator draft cannot become the target of a meal plan. */
export function confirmedPlanTarget(target: { published_at: string | null; updated_at: string; result: { kcal: number; protein_g: number; carbs_g: number; fat_g: number } } | null): MenuNutritionTarget | undefined {
  if (!target?.published_at) return undefined;
  const { kcal, protein_g, carbs_g, fat_g } = target.result;
  return { kcal, protein_g, carbs_g, fat_g, revision: target.updated_at, published_at: target.published_at };
}
