import { z } from 'zod';

const line = (max: number) => z.string().trim().min(1).max(max);
export const recipeBodySchema = z.object({
  title: z.string().trim().min(2).max(150),
  ingredients: z.array(line(150)).min(1).max(20),
  steps: z.array(line(400)).min(1).max(12),
  explanation: z.string().trim().min(2).max(800),
  servings: z.number().int().min(1).max(20),
  nutrient_source: z.string().trim().min(2).max(200),
}).strict();
export const recipeInputSchema = recipeBodySchema.extend({ id: z.uuid() }).strict();
export type RecipeBody = z.infer<typeof recipeBodySchema>;
export type RecipeInput = z.infer<typeof recipeInputSchema>;
export type Recipe = RecipeInput & {
  nutritionist_id: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};
export type RecipeView = Omit<Recipe, 'nutritionist_id'>;
