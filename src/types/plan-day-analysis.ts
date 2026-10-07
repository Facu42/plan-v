import { NUTRIENTS, type FoodNutrients } from './foods';
import type { ProposedRecipe } from './ai-nutrition';
import type { PlanRecipeDetail } from './plans';
import { recipePortionNutrients } from './plan-recipe-selection';

export function editorPlanDates(start: string, end: string, itemDates: readonly string[]) {
  const valid = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T12:00:00Z`)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
  const days: string[] = [];
  if (valid(start) && valid(end) && end >= start) {
    const count = Math.round((Date.parse(`${end}T12:00:00Z`) - Date.parse(`${start}T12:00:00Z`)) / 86400000);
    if (count <= 21) for (let index = 0; index <= count; index++) days.push(new Date(Date.parse(`${start}T12:00:00Z`) + index * 86400000).toISOString().slice(0, 10));
  }
  // Keep out-of-period rows reachable so changing dates cannot silently hide work.
  return Array.from(new Set([...days, ...itemDates.filter(valid)])).sort();
}

export type DayAnalysisLine = { portions: string; recipe?: PlanRecipeDetail | null; proposal?: ProposedRecipe };
export function analyzePlanDay(lines: readonly DayAnalysisLine[]) {
  let estimated = false;
  const amounts = lines.map(line => {
    const portions = line.portions.trim() ? Number(line.portions) : NaN;
    if (line.recipe) {
      estimated ||= line.recipe.nutrition?.origin === 'ai_estimate' || Boolean(line.recipe.catalog_recipe?.estimate_origin) || /^(estimacion_ia|propuesta_ia)\./.test(line.recipe.nutrient_source);
      return recipePortionNutrients(line.recipe, portions);
    }
    const nutrition = line.proposal?.nutrition;
    if (!nutrition || !Number.isFinite(portions) || portions < 0.0001 || portions > 50) return null;
    estimated ||= nutrition.origin === 'ai_estimate';
    return { kcal: nutrition.per_portion.kcal * portions, protein: nutrition.per_portion.protein_g * portions, carbs: nutrition.per_portion.carbs_g * portions, fat: nutrition.per_portion.fat_g * portions } as Partial<FoodNutrients>;
  });
  const nutrients = NUTRIENTS.map(([key, label, unit]) => {
    const known = amounts.filter(amount => amount?.[key] != null);
    const subtotal = Math.round(known.reduce((sum, amount) => sum + amount![key]!, 0) * 10000) / 10000;
    return { key, label, unit, known: known.length, missing: lines.length - known.length, total: lines.length && known.length === lines.length ? subtotal : null, subtotal: known.length ? subtotal : null };
  });
  return { count: lines.length, estimated, nutrients };
}
