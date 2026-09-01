import { z } from 'zod';

export const foodItemSchema = z.object({
  name: z.string(),
  portion_est: z.number().nullable(),
  portion_unit: z.enum(['g', 'ml', 'u']),
  confidence: z.number().min(0).max(1),
});

export const macrosSchema = z.object({
  kcal: z.number().int(),
  protein_g: z.number().int(),
  carbs_g: z.number().int(),
  fat_g: z.number().int(),
});

export const mealAnalysisSchema = z.object({
  foods: z.array(foodItemSchema).max(8),
  macros: macrosSchema.nullable(),
  confidence: z.number().min(0).max(1),
  note_for_nutri: z.string(),
});

export const copilotBriefSchema = z.object({
  suggested_action: z.enum(['mensaje', 'ajuste_menu', 'turno']).nullable(),
  up_next_title: z.string().nullable(),
  up_next_body: z.string().nullable(),
  draft_message: z.string().nullable(),
  source_ids: z.array(z.string()),
  adherence_why: z.string(),
});

export type MealAnalysis = z.infer<typeof mealAnalysisSchema>;
export type CopilotBrief = z.infer<typeof copilotBriefSchema>;
