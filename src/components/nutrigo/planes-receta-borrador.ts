import { mealPlanDraftSchema, type ProfessionalMealPlan, type PlanSlot } from '../../types/plans';
import type { ProfessionalRecipe } from '../../types/recipes';
import { paraGuardar } from '../../types/plan-draft';

export function recetaEnBorrador(plan: ProfessionalMealPlan | null, receta: ProfessionalRecipe, fecha: string, slot: PlanSlot, porciones: number, reemplazar: boolean) {
  if (!receta.published) throw new Error('La receta debe tener una versión publicada y revisada.');
  const version = plan?.current;
  const ocupada = version?.items.some(x => x.for_date === fecha && x.slot === slot);
  if (ocupada && !reemplazar) throw new Error('Confirmá Reemplazar la comida existente o elegí otra fecha y comida.');
  return mealPlanDraftSchema.parse({
    id: plan?.id ?? crypto.randomUUID(), expected_revision: version?.revision ?? null,
    period_start: version && version.period_start < fecha ? version.period_start : fecha,
    period_end: version && version.period_end > fecha ? version.period_end : fecha,
    timezone: 'America/Argentina/Buenos_Aires',
    ...(version?.guidance ? { guidance: version.guidance } : {}),
    ...(version?.meal_times ? { meal_times: version.meal_times } : {}),
    ...(version?.meal_labels ? { meal_labels: version.meal_labels } : {}),
    ...(version?.nutrition_target ? { nutrition_target: version.nutrition_target } : {}),
    items: [...(version?.items ?? []).filter(x => x.for_date !== fecha || x.slot !== slot).map(paraGuardar), { for_date:fecha, slot, recipe_id:receta.id, recipe_version:receta.published.version, portions:porciones, public_note:'' }],
  });
}
