// Lo que el plan publicado indica para cada comida (calorías y proteína). Lo usan la solapa Plan y «Contra el plan» del Registro alimentario.
import { componentNutrients } from '../../types/plan-components';
import type { PatientMealPlan, PlanItemView } from '../../types/plans';

export function kcalDeItem(item: PlanItemView): number | null {
  if (item.components?.length) {
    const conDato = item.components.map(componentNutrients).filter(n => n?.kcal != null && Number.isFinite(n.kcal));
    return conDato.length ? Math.round(conDato.reduce((suma, n) => suma + (n!.kcal ?? 0), 0)) : null;
  }
  const porcion = item.recipe?.nutrition?.per_portion.kcal;
  return porcion == null ? null : Math.round(porcion * (item.portions ?? 1));
}

/** Calorías y proteína que el plan indica para una comida de un día; sin dato, null. */
export function nutrientesDelPlan(plan: PatientMealPlan, fecha: string, momento: string): { kcal: number; protein: number | null } | null {
  const items = plan.items.filter(item => item.for_date === fecha && item.slot.toLowerCase() === momento.toLowerCase());
  const kcal = items.map(kcalDeItem).filter((valor): valor is number => valor !== null);
  if (!kcal.length) return null;
  const proteinas = items.flatMap(item => (item.components ?? []).map(componentNutrients)).map(n => n?.protein).filter((valor): valor is number => typeof valor === 'number' && Number.isFinite(valor));
  return { kcal: kcal.reduce((suma, valor) => suma + valor, 0), protein: proteinas.length ? proteinas.reduce((suma, valor) => suma + valor, 0) : null };
}
