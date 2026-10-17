import { z } from 'zod';

/** Una alternativa del mismo grupo de intercambios, con la cantidad que equivale a lo indicado en el plan. */
export type PlanAlternativeOption = {
  group_id: string;
  group_name: string;
  group_revision: number;
  food_id: string;
  food_revision: number;
  name: string;
  quantity: number;
  unit: 'g' | 'ml';
  kcal: number | null;
};
/** Un alimento del plan aprobado que tiene alternativas elegibles. */
export type PlanAlternativeSlot = { item_id: string; component_id: string; base_food_id: string; options: PlanAlternativeOption[] };
export type PlanChoice = {
  item_id: string;
  component_id: string;
  group_id: string;
  base_food_id: string;
  food_id: string;
  name: string;
  quantity: number;
  unit: 'g' | 'ml';
  chosen_at: string;
};
/** `health_unknown`: la nutri aún no cargó alergias y restricciones, así que no se ofrece ninguna alternativa. */
export type PlanAlternativesView = { status: 'ok' | 'health_unknown'; slots: PlanAlternativeSlot[]; choices: PlanChoice[] };

export const planChoiceSaveSchema = z.object({
  item_id: z.uuid(),
  component_id: z.uuid(),
  food_id: z.uuid().nullable(),
}).strict();
export type PlanChoiceSave = z.infer<typeof planChoiceSaveSchema>;
