import { z } from 'zod';

export const RECIPE_UNITS = ['g', 'ml', 'u', 'cdita', 'cda', 'taza'] as const;
export type RecipeUnit = (typeof RECIPE_UNITS)[number];
export const recipeUnitSchema = z.enum(RECIPE_UNITS);

export function normalizeIngredientName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-AR');
}

const step = z.string().trim().min(1).max(400);
export const recipeItemInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  quantity: z.number().positive().max(100000),
  unit: recipeUnitSchema,
}).strict();
export const recipeDraftSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().min(2).max(150),
  yield_portions: z.number().positive().max(50),
  steps: z.array(step).min(1).max(12),
  nutrient_source: z.string().trim().max(200).default(''),
  items: z.array(recipeItemInputSchema).min(1).max(20),
}).strict();
export const recipePublishSchema = z.object({ expected_version: z.number().int().min(1) }).strict();
export const recipeAssignSchema = z.object({
  patient_id: z.string().trim().min(1).max(80),
  expected_version: z.number().int().min(1),
}).strict();
export const ingredientInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  base_unit: recipeUnitSchema,
}).strict();

export type RecipeDraftInput = z.infer<typeof recipeDraftSchema>;
export type RecipeItem = { id: string; name: string; quantity: number; unit: RecipeUnit };
export type RecipeMacros = {
  kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
};

export type RecipeCard = {
  category: string;
  prep_minutes: number | null;
  macro_status: 'declared' | 'unavailable' | 'failed';
  macros: RecipeMacros | null;
  cover_status: 'none' | 'failed' | 'ready';
  cover_alt: string;
};

export type RecipeVersionView = {
  id: string;
  version: number;
  yield_portions: number;
  steps: string[];
  nutrient_source: string;
  published_at: string | null;
  ingredients: RecipeItem[];
  card?: RecipeCard;
};
export type ProfessionalRecipe = {
  id: string;
  title: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  current: RecipeVersionView;
  published: RecipeVersionView | null;
};
export type PatientRecipe = {
  id: string;
  title: string;
  version: number;
  yield_portions: number;
  steps: string[];
  nutrient_source: string;
  ingredients: RecipeItem[];
  assigned_at: string;
  published_at: string;
  card?: RecipeCard;
};
export type IngredientRecord = { id: string; name: string; base_unit: RecipeUnit; created_at: string };
