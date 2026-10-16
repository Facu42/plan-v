import type { PlanComponentView } from '../../src/types/plan-components.js';
import { analyzePlanDay, type CarbohydrateDefinition, type DayAnalysisLine } from '../../src/types/plan-day-analysis.js';
import type { MealPlanDraftInput, PlanItemView, PlanRecipeDetail } from '../../src/types/plans.js';
import { eachIsoDate } from '../../src/types/plans.js';
import type { MenuNutritionSummary, MenuNutritionTarget, NutrientAmounts, RecipeNutrition } from '../../src/types/ai-nutrition.js';

type NutritionItem = { components?: PlanComponentView[] } & Pick<PlanItemView, 'for_date' | 'recipe_proposal'> & { portions?: number | null; recipe_id?: string | null; recipe_version?: number | null };
export type CatalogNutrition = { id: string; version: number; nutrition: RecipeNutrition | null; carbohydrates?: CarbohydrateDefinition };
const round = (value: number) => Math.round(value * 10000) / 10000;

function itemLines(item: NutritionItem, catalog: CatalogNutrition[]): DayAnalysisLine[] {
  if (item.components) return item.components.map(component => ({ portions: '', component }));
  if (item.recipe_proposal) return [{ portions: String(item.portions ?? ''), proposal: item.recipe_proposal }];
  const saved=catalog.find(recipe=>recipe.id===item.recipe_id&&recipe.version===item.recipe_version);
  const recipe:PlanRecipeDetail|null=item.recipe_id?{title:'',version:item.recipe_version??1,yield_portions:1,nutrition:saved?.nutrition??undefined,nutrient_source:'',ingredients:[],steps:[]}:null;
  return [{portions:String(item.portions??''),recipe,carbohydrates:saved?.carbohydrates}];
}

export function summarizeMenuNutrition(items: NutritionItem[], target: MenuNutritionTarget | null, catalog: CatalogNutrition[] = [], period?: { period_start: string; period_end: string }): MenuNutritionSummary {
  const dates = period ? eachIsoDate(period.period_start, period.period_end) : [...new Set(items.map(item => item.for_date))].sort();
  return {target,days:dates.map(for_date=>{
    const analysis=analyzePlanDay(items.filter(item=>item.for_date===for_date).flatMap(item=>itemLines(item,catalog)));
    const values=analysis.nutrients.slice(0,4).map(value=>value.total);
    if(values.some(value=>value==null))return {for_date,totals:null,difference:null,estimated:analysis.estimated,status:'missing_nutrients' as const};
    const totals:NutrientAmounts={kcal:values[0]!,protein_g:values[1]!,carbs_g:values[2]!,fat_g:values[3]!};
    const difference=target?{kcal:round(totals.kcal-target.kcal),protein_g:round(totals.protein_g-target.protein_g),carbs_g:round(totals.carbs_g-target.carbs_g),fat_g:round(totals.fat_g-target.fat_g)}:null;
    return {for_date,totals,difference,estimated:analysis.estimated,status:!target?'no_target' as const:Math.abs(difference!.kcal)<=Math.max(1,target.kcal*0.001)?'adjusted' as const:'outside_target' as const};
  })};
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
    if (selected.some(item => item.components)) continue;
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
