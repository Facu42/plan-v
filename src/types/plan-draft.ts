import { DEFAULT_MENU_SLOTS } from './ai-jobs.js';
import { componentInput } from './plan-components.js';
import { mealPlanDraftSchema, planSlotKey, type MealPlanDraftInput, type PlanItemView, type ProfessionalMealPlan } from './plans.js';

export function paraGuardar(item: PlanItemView) {
  const conPartes = Boolean(item.components?.length);
  return {
    ...(conPartes ? { components: item.components!.map(componentInput) } : {}),
    for_date: item.for_date,
    slot: item.slot,
    ...(conPartes || !item.recipe_id ? {} : { recipe_id: item.recipe_id, recipe_version: item.recipe_version ?? undefined }),
    ...(conPartes || item.recipe_id || !item.free_text ? {} : { free_text: item.free_text }),
    ...(conPartes || item.portions == null ? {} : { portions: item.portions }),
    public_note: item.public_note,
    ...(conPartes || item.recipe_id || !item.recipe_proposal ? {} : { recipe_proposal: item.recipe_proposal }),
  };
}


/** Copia editable sin estado publicado ni resumen nutricional calculado. */
export function snapshotBorrador(plan: ProfessionalMealPlan): MealPlanDraftInput {
  const v = plan.current;
  return mealPlanDraftSchema.parse({
    id: plan.id, expected_revision: v.revision ?? null,
    period_start: v.period_start, period_end: v.period_end, timezone: plan.timezone,
    guidance: v.guidance, meal_times: v.meal_times, meal_labels: v.meal_labels,
    nutrition_target: v.nutrition_target, items: v.items.map(paraGuardar),
  });
}

/** El artefacto completo se aplica en una sola escritura con la revisión del job. */
export function integrarPropuesta(propuesta: MealPlanDraftInput, actual: ProfessionalMealPlan | null, pedido: { period_start: string | null; period_end: string | null; slots: string[] }) {
  const slots = pedido.slots.length ? pedido.slots : DEFAULT_MENU_SLOTS;
  const dentro = (i: { for_date: string; slot: string }) => i.for_date >= (pedido.period_start ?? propuesta.period_start)
    && i.for_date <= (pedido.period_end ?? propuesta.period_end)
    && slots.some(s => planSlotKey(s) === planSlotKey(i.slot));
  const nuevos = propuesta.items.filter(dentro);
  if (!nuevos.length) throw new Error('La propuesta no tiene comidas dentro del alcance pedido.');
  if (!actual) return mealPlanDraftSchema.parse({ ...propuesta, items: nuevos });
  const previo = snapshotBorrador(actual);
  const items = [...previo.items.filter(i => !dentro(i)), ...nuevos];
  if (items.length > 42) throw new Error('El borrador completo supera las 42 comidas. Reducí el alcance antes de aplicar.');
  return mealPlanDraftSchema.parse({
    ...previo, expected_revision: propuesta.expected_revision,
    period_start: previo.period_start < propuesta.period_start ? previo.period_start : propuesta.period_start,
    period_end: previo.period_end > propuesta.period_end ? previo.period_end : propuesta.period_end,
    items,
  });
}
