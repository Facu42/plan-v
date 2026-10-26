import { mealPlanDraftSchema, type PlanItemView, type ProfessionalMealPlan } from '../../types/plans';
import { paraGuardar } from './planes-editor';

/** Sólo las comidas: nunca trasladar metas ni indicaciones de la ficha. */
export function borradorReutilizable(items: readonly PlanItemView[], inicio: string, fin: string, destino: ProfessionalMealPlan | null) {
  return mealPlanDraftSchema.parse({
    id: destino?.id ?? crypto.randomUUID(),
    expected_revision: destino?.current.revision ?? null,
    period_start: inicio,
    period_end: fin,
    timezone: 'America/Argentina/Buenos_Aires',
    items: items.map(paraGuardar),
  });
}
