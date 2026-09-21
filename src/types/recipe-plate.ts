import { z } from 'zod';
import { PLAN_SLOTS } from './plans';
import { recipeDraftSchema, recipeItemInputSchema, type RecipeCard, type RecipeMacros } from './recipes';

const macroNumber = z.number().nonnegative().max(20000);

export const recipeWizardSchema = recipeDraftSchema.extend({
  items: z.array(recipeItemInputSchema.extend({
    line_kcal: macroNumber.optional(),
  }).strict()).min(1).max(20),
  category: z.enum(PLAN_SLOTS).default('Almuerzo'),
  prep_minutes: z.number().int().positive().max(240).nullable().optional(),
  protein_g: macroNumber.max(2000).nullable().optional(),
  carbs_g: macroNumber.max(2000).nullable().optional(),
  fat_g: macroNumber.max(2000).nullable().optional(),
  cover_status: z.enum(['none', 'failed']).optional(),
}).strict();

export type RecipeWizardInput = z.infer<typeof recipeWizardSchema>;

export const recipeDayAssignSchema = z.object({
  patient_id: z.string().trim().min(1).max(80),
  expected_version: z.number().int().min(1),
  for_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slot: z.enum(PLAN_SLOTS),
}).strict();

export const recipeRegisterSchema = z.object({
  client_id: z.uuid(),
}).strict();

export type RecipeDayAssignment = {
  id: string;
  patient_id: string;
  for_date: string;
  slot: (typeof PLAN_SLOTS)[number];
  recipe_id: string;
  recipe_version: number;
  title: string;
  yield_portions: number;
  ingredients: Array<{ id: string; name: string; quantity: number; unit: string }>;
  card: RecipeCard;
  registered_meal_id: string | null;
};

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

export function unavailableCard(title: string, category = 'Almuerzo'): RecipeCard {
  return {
    category,
    prep_minutes: null,
    macro_status: 'unavailable',
    macros: null,
    cover_status: 'none',
    cover_alt: title,
  };
}

export function buildRecipeCard(input: RecipeWizardInput): RecipeCard {
  const portions = input.yield_portions;
  const lineKcal = input.items.map((item) => item.line_kcal);
  const declaredLines = lineKcal.filter((value): value is number => value != null);
  if (declaredLines.length > 0 && declaredLines.length !== input.items.length) {
    throw new Error('recipe_line_kcal');
  }
  const kcal = declaredLines.length ? round1(declaredLines.reduce((sum, value) => sum + value, 0) / portions) : null;
  const protein = input.protein_g ?? null;
  const carbs = input.carbs_g ?? null;
  const fat = input.fat_g ?? null;
  const anyMacro = kcal != null || protein != null || carbs != null || fat != null;
  if (anyMacro && !input.nutrient_source.trim()) throw new Error('recipe_macro_source');
  const macros: RecipeMacros | null = anyMacro
    ? { kcal, protein_g: protein, carbs_g: carbs, fat_g: fat }
    : null;
  return {
    category: input.category,
    prep_minutes: input.prep_minutes ?? null,
    macro_status: anyMacro ? 'declared' : 'unavailable',
    macros,
    cover_status: input.cover_status ?? 'none',
    cover_alt: input.title.trim(),
  };
}

export function failedAiCard(title: string, category = 'Almuerzo'): RecipeCard {
  return {
    category,
    prep_minutes: null,
    macro_status: 'failed',
    macros: null,
    cover_status: 'failed',
    cover_alt: title,
  };
}
