import type { MealPlanDraftInput, PlanItemView } from '../../src/types/plans.js';
import { eachIsoDate } from '../../src/types/plans.js';
import type { MenuNutritionSummary, MenuNutritionTarget, NutrientAmounts, RecipeNutrition } from '../../src/types/ai-nutrition.js';

type NutritionItem = Pick<PlanItemView, 'for_date' | 'recipe_proposal'> & { portions?: number | null; recipe_id?: string | null; recipe_version?: number | null };
export type CatalogNutrition = { id: string; version: number; nutrition: RecipeNutrition | null };
const round = (value: number) => Math.round(value * 10000) / 10000;

function itemNutrition(item: NutritionItem, catalog: CatalogNutrition[]) {
  if (item.recipe_proposal) return item.recipe_proposal.nutrition;
  return catalog.find((recipe) => recipe.id === item.recipe_id && recipe.version === item.recipe_version)?.nutrition ?? null;
}

export function summarizeMenuNutrition(items: NutritionItem[], target: MenuNutritionTarget | null, catalog: CatalogNutrition[] = [], period?: { period_start: string; period_end: string }): MenuNutritionSummary {
  const dates = period ? eachIsoDate(period.period_start, period.period_end) : [...new Set(items.map((item) => item.for_date))].sort();
  return {
    target,
    days: dates.map((for_date) => {
      const day = items.filter((item) => item.for_date === for_date);
      const evidence = day.map((item) => itemNutrition(item, catalog));
      const estimated = evidence.some((nutrition) => nutrition?.origin === 'ai_estimate');
      if (!day.length || evidence.some((nutrition) => !nutrition) || day.some((item) => !item.portions || item.portions > 50)) {
        return { for_date, totals: null, difference: null, estimated, status: 'missing_nutrients' as const };
      }
      const totals: NutrientAmounts = { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
      for (const [index, item] of day.entries()) {
        for (const key of Object.keys(totals) as Array<keyof NutrientAmounts>) totals[key] += evidence[index]!.per_portion[key] * item.portions!;
      }
      for (const key of Object.keys(totals) as Array<keyof NutrientAmounts>) totals[key] = round(totals[key]);
      const difference = target ? {
        kcal: round(totals.kcal - target.kcal), protein_g: round(totals.protein_g - target.protein_g),
        carbs_g: round(totals.carbs_g - target.carbs_g), fat_g: round(totals.fat_g - target.fat_g),
      } : null;
      return { for_date, totals, difference, estimated,
        status: !target ? 'no_target' as const : Math.abs(difference!.kcal) <= Math.max(1, target.kcal * 0.001) ? 'adjusted' as const : 'outside_target' as const };
    }),
  };
}

/** Only the server chooses the multiplier. Missing values never imply a complete day. */
export function adjustMenuPortions(plan: MealPlanDraftInput, target: MenuNutritionTarget | null, catalog: CatalogNutrition[] = []) {
  const items = plan.items.map((item) => ({ ...item }));
  const before = summarizeMenuNutrition(items, target, catalog, plan);
  const limited = new Set<string>();
  if (target) for (const day of before.days) {
    if (!day.totals || day.totals.kcal <= 0) continue;
    const factor = target.kcal / day.totals.kcal;
    const selected = items.filter((item) => item.for_date === day.for_date);
    const amounts = selected.map((item) => round((item.portions ?? 1) * factor));
    if (amounts.some((amount) => amount <= 0 || amount > 50 || !Number.isFinite(amount))) {
      limited.add(day.for_date);
      continue;
    }
    selected.forEach((item, index) => { item.portions = amounts[index]; });
  }
  const nutrition = summarizeMenuNutrition(items, target, catalog, plan);
  nutrition.days.forEach((day) => { if (limited.has(day.for_date)) day.status = 'portion_limit'; });
  return { plan: { ...plan, items, ...(target ? { nutrition_target: target } : {}) }, nutrition };
}
