// Lo que el plan publicado indica para cada comida (calorías y proteína). Lo usan la solapa Plan y «Contra el plan» del Registro alimentario.
import { componentNutrients } from '../../types/plan-components';
import type { PatientMealPlan } from '../../types/plans';
import { kcalDeItem } from './ficha-plan';

/** Calorías y proteína que el plan indica para una comida de un día; sin dato, null. */
export function nutrientesDelPlan(plan: PatientMealPlan, fecha: string, momento: string): { kcal: number; protein: number | null } | null {
  const items = plan.items.filter(item => item.for_date === fecha && item.slot.toLowerCase() === momento.toLowerCase());
  const kcal = items.map(kcalDeItem).filter((valor): valor is number => valor !== null);
  if (!kcal.length) return null;
  const proteinas = items.flatMap(item => (item.components ?? []).map(componentNutrients)).map(n => n?.protein).filter((valor): valor is number => typeof valor === 'number' && Number.isFinite(valor));
  return { kcal: kcal.reduce((suma, valor) => suma + valor, 0), protein: proteinas.length ? proteinas.reduce((suma, valor) => suma + valor, 0) : null };
}
