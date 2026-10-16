/** Meta de agua de siempre, en vasos por día, cuando la nutri no eligió otra. */
export const DEFAULT_WATER_GOAL = 8;
/** La nutri elige entre 4 y 16 vasos; la paciente puede anotar hasta 16 por día. */
export const MIN_WATER_GOAL = 4;
export const MAX_WATER_GLASSES = 16;
/** Opciones de la meta para la nutri, de a un vaso. */
export const WATER_GOAL_OPTIONS = Array.from({ length: MAX_WATER_GLASSES - MIN_WATER_GOAL + 1 }, (_, index) => MIN_WATER_GOAL + index);

/** Meta de la paciente: la que eligió la nutri o la de siempre si no eligió (o el dato no es válido). */
export function waterGoalOf(patient: { water_goal_glasses?: number | null }): number {
  const goal = patient.water_goal_glasses;
  return typeof goal === 'number' && Number.isInteger(goal) && goal >= MIN_WATER_GOAL && goal <= MAX_WATER_GLASSES ? goal : DEFAULT_WATER_GOAL;
}
