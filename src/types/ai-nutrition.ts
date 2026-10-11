import { z } from 'zod';

export const nutrientAmountsSchema = z.object({
  kcal: z.number().positive().max(20000),
  protein_g: z.number().nonnegative().max(2000),
  carbs_g: z.number().nonnegative().max(2000),
  fat_g: z.number().nonnegative().max(2000),
}).strict();
export type NutrientAmounts = z.infer<typeof nutrientAmountsSchema>;

/** Reviewing an estimate does not turn it into a measured or verified value. */
export const recipeNutritionSchema = z.object({
  origin: z.enum(['ai_estimate', 'declared']),
  source: z.string().trim().min(1).max(200),
  per_portion: nutrientAmountsSchema,
}).strict();
export type RecipeNutrition = z.infer<typeof recipeNutritionSchema>;

export const proposedRecipeSchema = z.object({
  title: z.string().trim().min(2).max(150),
  yield_portions: z.number().positive().max(50),
  steps: z.array(z.string().trim().min(1).max(400)).min(1).max(12),
  ingredients: z.array(z.object({
    name: z.string().trim().min(1).max(80),
    quantity: z.number().positive().max(100000),
    unit: z.enum(['g', 'ml', 'u', 'cdita', 'cda', 'taza']),
  }).strict()).min(1).max(20),
  nutrition: recipeNutritionSchema.nullable(),
}).strict();
export type ProposedRecipe = z.infer<typeof proposedRecipeSchema>;

/** Inline proposals are estimates. Declared recipes use the versioned catalog. */
export function retainProposalEstimate(value: ProposedRecipe, prior?: ProposedRecipe): ProposedRecipe {
  const old = prior?.nutrition?.origin === 'ai_estimate' ? prior.nutrition : undefined;
  const nutrition = value.nutrition;
  return { ...value, nutrition: nutrition ? {
    ...nutrition, origin: 'ai_estimate',
    source: old?.source ?? (nutrition.origin === 'ai_estimate' ? nutrition.source : 'estimacion_ia.v2'),
  } : null };
}

export const menuTargetSchema = nutrientAmountsSchema.extend({
  revision: z.union([z.number().int().min(1), z.string().min(1).max(64)]),
  published_at: z.string().min(1).max(64),
}).strict();
export type MenuNutritionTarget = z.infer<typeof menuTargetSchema>;

export type MenuDayNutrition = {
  for_date: string;
  totals: NutrientAmounts | null;
  difference: NutrientAmounts | null;
  estimated: boolean;
  status: 'adjusted' | 'missing_nutrients' | 'no_target' | 'portion_limit' | 'outside_target';
};
export type MenuNutritionSummary = {
  target: MenuNutritionTarget | null;
  days: MenuDayNutrition[];
};
const signedAmountsSchema = z.object({ kcal: z.number().finite(), protein_g: z.number().finite(), carbs_g: z.number().finite(), fat_g: z.number().finite() }).strict();
export const menuNutritionSummarySchema = z.object({
  target: menuTargetSchema.nullable(),
  days: z.array(z.object({
    for_date: z.iso.date(), totals: signedAmountsSchema.nullable(), difference: signedAmountsSchema.nullable(), estimated: z.boolean(),
    status: z.enum(['adjusted', 'missing_nutrients', 'no_target', 'portion_limit', 'outside_target']),
  }).strict()).max(22),
}).strict();

export function recipeNutritionLabel(nutrition?: RecipeNutrition | null, source = '', declaredAmounts?: Partial<Record<keyof NutrientAmounts, number | null>> | null) {
  if (nutrition?.origin === 'ai_estimate' || source.startsWith('estimacion_ia.') || source.startsWith('propuesta_ia.')) return 'Nutrientes estimados por IA';
  return nutrition || Object.values(declaredAmounts ?? {}).some(value => typeof value === 'number' && Number.isFinite(value)) ? 'Nutrientes declarados' : 'Nutrientes no disponibles';
}

export function resolveRecipeNutrition(nutrition: RecipeNutrition | undefined, macros: unknown, source: string): RecipeNutrition | undefined {
  if (nutrition) return nutrition;
  const parsed = nutrientAmountsSchema.safeParse(macros);
  if (!parsed.success || !source.trim()) return undefined;
  return { origin: source.startsWith('estimacion_ia.') || source.startsWith('propuesta_ia.') ? 'ai_estimate' : 'declared', source, per_portion: parsed.data };
}
