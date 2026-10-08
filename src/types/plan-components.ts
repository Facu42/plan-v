import { z } from 'zod';
import { proposedRecipeSchema } from './ai-nutrition.js';
import { scaleFoodNutrients, type Food, type FoodNutrients } from './foods.js';
import type { PlanRecipeDetail } from './plans.js';
import { recipePortionNutrients } from './plan-recipe-selection.js';

const base = { id: z.uuid(), public_note: z.string().trim().max(200).default('') };
export const planComponentSchema = z.discriminatedUnion('kind', [
  z.object({ ...base, kind: z.literal('food'), food_id: z.uuid(), food_revision: z.number().int().min(1), quantity: z.number().finite().positive().max(100000), measure: z.string().min(1).max(80).nullable() }).strict(),
  z.object({ ...base, kind: z.literal('recipe'), recipe_id: z.string().min(1).max(80), recipe_version: z.number().int().min(1), portions: z.number().finite().positive().max(50) }).strict(),
  z.object({ ...base, kind: z.literal('text'), free_text: z.string().trim().min(1).max(150), recipe_proposal: proposedRecipeSchema.optional(), portions: z.number().finite().positive().max(50).optional() }).strict(),
]);
export const planComponentsSchema = z.array(planComponentSchema).min(1).max(12).superRefine((items, ctx) => {
  if (new Set(items.map(item => item.id)).size !== items.length) ctx.addIssue({ code: 'custom', message: 'Cada componente necesita su identificación.', path: [] });
  for (const [index, item] of items.entries()) if (item.kind === 'text' && item.recipe_proposal && (item.recipe_proposal.title !== item.free_text || !item.portions)) ctx.addIssue({ code: 'custom', message: 'Revisá la propuesta y sus porciones.', path: [index] });
});
export type PlanComponentInput = z.infer<typeof planComponentSchema>;
export type PlanComponentView = PlanComponentInput & { food_snapshot?: Food; recipe_snapshot?: PlanRecipeDetail };
export function componentInput(component: PlanComponentView): PlanComponentInput {
  const { food_snapshot: _food, recipe_snapshot: _recipe, ...input } = component;
  return input;
}
export function componentGrams(component: PlanComponentView) {
  if (component.kind !== 'food' || !component.food_snapshot) return null;
  const grams = component.quantity * (component.measure === null ? 1 : component.food_snapshot.portions.find(portion => portion.name === component.measure)?.grams ?? NaN);
  return Number.isFinite(grams) && grams > 0 && grams <= 100000 ? grams : null;
}
export function componentNutrients(component: PlanComponentView): Partial<FoodNutrients> | null {
  if (component.kind === 'recipe') return component.recipe_snapshot ? recipePortionNutrients(component.recipe_snapshot, component.portions) : null;
  if (component.kind === 'food') { const grams = componentGrams(component); return grams === null ? null : scaleFoodNutrients(component.food_snapshot!.nutrients, grams); }
  if (component.kind === 'text' && component.recipe_proposal?.nutrition && Number.isFinite(component.portions) && component.portions! > 0 && component.portions! <= 50) {
    const v = component.recipe_proposal.nutrition.per_portion, n = component.portions!;
    return { kcal: v.kcal * n, protein: v.protein_g * n, carbs: v.carbs_g * n, fat: v.fat_g * n };
  }
  return null;
}
export function componentTitle(component: PlanComponentView) {
  return component.kind === 'food' ? component.food_snapshot?.name ?? 'Alimento' : component.kind === 'recipe' ? component.recipe_snapshot?.title ?? 'Receta publicada' : component.free_text;
}
