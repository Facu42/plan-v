// Cuentas de la solapa Plan de la Ficha v29: sólo lo que el plan publicado trae; lo que no trae queda en blanco, nunca inventado.
import { componentNutrients, componentTitle } from '../../types/plan-components';
import { PLAN_SLOTS, mealSlotLabel, type PatientMealPlan, type PlanItemView, type PlanSlot } from '../../types/plans';
import type { ShoppingListView } from '../../types/shopping';

export type ComidaDelPlan = { id: string; slot: PlanSlot; etiqueta: string; hora: string | null; titulo: string; nota: string; kcal: number | null };

export function kcalDeItem(item: PlanItemView): number | null {
  if (item.components?.length) {
    const conDato = item.components.map(componentNutrients).filter(n => n?.kcal != null && Number.isFinite(n.kcal));
    return conDato.length ? Math.round(conDato.reduce((suma, n) => suma + (n!.kcal ?? 0), 0)) : null;
  }
  const porcion = item.recipe?.nutrition?.per_portion.kcal;
  return porcion == null ? null : Math.round(porcion * (item.portions ?? 1));
}

export function tituloDeItem(item: PlanItemView): string {
  if (item.components?.length) return item.components.map(componentTitle).join(' + ');
  return item.free_text || item.recipe?.title || item.recipe_title || 'Comida del plan';
}

export function comidasDelDia(plan: PatientMealPlan, fecha: string): ComidaDelPlan[] {
  return plan.items.filter(item => item.for_date === fecha)
    .sort((a, b) => PLAN_SLOTS.indexOf(a.slot) - PLAN_SLOTS.indexOf(b.slot))
    .map(item => ({ id: item.id, slot: item.slot, etiqueta: mealSlotLabel(item.slot, undefined, plan.meal_labels), hora: plan.meal_times?.[item.slot] ?? null, titulo: tituloDeItem(item), nota: item.public_note, kcal: kcalDeItem(item) }));
}

/** Suma lo que se conoce; si ninguna comida trae calorías no hay total. */
export function kcalDelDia(comidas: readonly ComidaDelPlan[]): number | null {
  const conDato = comidas.filter(comida => comida.kcal !== null);
  return conDato.length ? conDato.reduce((suma, comida) => suma + comida.kcal!, 0) : null;
}

/** Calorías por comida, juntando las que comparten momento (dos ítems de almuerzo, por ejemplo). */
export function kcalPorMomento(comidas: readonly ComidaDelPlan[]): Array<{ etiqueta: string; kcal: number }> {
  const porMomento = new Map<string, number>();
  for (const comida of comidas) if (comida.kcal !== null) porMomento.set(comida.etiqueta, (porMomento.get(comida.etiqueta) ?? 0) + comida.kcal);
  return [...porMomento].map(([etiqueta, kcal]) => ({ etiqueta, kcal }));
}

export function textoListaDeCompras(nombre: string, lista: ShoppingListView): string | null {
  const pendientes = lista.items.filter(linea => !linea.checked);
  if (!pendientes.length) return null;
  const linea = (item: ShoppingListView['items'][number]) => `• ${item.name}${item.quantity !== null ? ` · ${String(item.quantity).replace('.', ',')}${item.unit ? ` ${item.unit}` : ''}` : ''}`;
  return `Hola ${nombre}, esta es tu lista de compras${lista.plan_version ? ` del plan versión ${lista.plan_version}` : ''}:\n${pendientes.map(linea).join('\n')}`;
}
