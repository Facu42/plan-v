import { z } from 'zod';
import { recipeNutritionSchema, type RecipeNutrition } from './ai-nutrition.js';
import type { RecipeCatalogSnapshot } from './recipe-catalog-nutrition.js';

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
  catalog_ref: z.object({ id: z.uuid(), revision: z.number().int().positive().max(Number.MAX_SAFE_INTEGER), measure: z.string().min(1).max(80).nullable() }).strict().optional(),
}).strict();
export const recipeDraftSchema = z.object({
  id: z.uuid(),
  expected_revision: z.uuid().nullable().optional(),
  title: z.string().trim().min(2).max(150),
  yield_portions: z.number().positive().max(50),
  steps: z.array(step).min(1).max(12),
  nutrient_source: z.string().trim().max(200).default(''),
  items: z.array(recipeItemInputSchema).min(1).max(20),
  nutrition: recipeNutritionSchema.optional(),
  final_weight_g: z.number().finite().positive().max(100000).nullable().optional(),
  cooking_minutes: z.number().int().min(0).max(1440).nullable().optional(),
}).strict();
export const recipePublishSchema = z.object({ expected_version: z.number().int().min(1), expected_revision: z.uuid().optional() }).strict();
export const recipeAssignSchema = z.object({
  patient_id: z.string().trim().min(1).max(80),
  expected_version: z.number().int().min(1),
}).strict();
export const ingredientInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  base_unit: recipeUnitSchema,
}).strict();

export type RecipeDraftInput = z.infer<typeof recipeDraftSchema>;
/** Foto del ingrediente del catálogo compartido. Sólo viene en lo que lee la paciente y solo si existe y es segura. */
export type IngredientPhoto = { ingredient_cover_url?: string | null; ingredient_cover_alt?: string };
export type RecipeItem = { id: string; name: string; quantity: number; unit: RecipeUnit } & IngredientPhoto;
export type RecipeMacros = {
  kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
};

export type RecipeCard = {
  culinary_categories?: string[];
  category: string;
  prep_minutes: number | null;
  macro_status: 'declared' | 'unavailable' | 'failed';
  macros: RecipeMacros | null;
  cover_status: 'none' | 'failed' | 'ready';
  cover_alt: string;
  /** Sólo presente cuando cover_status === 'ready'. Nunca inventada. */
  cover_url: string | null;
  cover_generation?: 'queued' | 'leased' | 'ready' | 'failed';
};

export type RecipeVersionView = {
  id: string;
  title?: string;
  revision?: string;
  version: number;
  yield_portions: number;
  steps: string[];
  nutrient_source: string;
  published_at: string | null;
  ingredients: RecipeItem[];
  card?: RecipeCard;
  nutrition?: RecipeNutrition;
  catalog_recipe?: RecipeCatalogSnapshot;
  final_weight_g?: number | null;
  cooking_minutes?: number | null;
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
  nutrition?: RecipeNutrition;
};
export type IngredientRecord = { id: string; name: string; base_unit: RecipeUnit; created_at: string };
