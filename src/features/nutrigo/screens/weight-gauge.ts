export type WeightGauge = { from: number | null; to: number | null; pct: number };

const RULER_STEP = 5;
const RULER_HALF_SPAN = 10;
const clamp = (value: number) => Math.max(0, Math.min(100, value));

/** Los cinco números de la regla de la tarjeta Peso, de mayor a menor, centrados en el múltiplo de 5 más cercano. */
export function rulerFor(weight: number | null): number[] {
  if (weight == null || !Number.isFinite(weight)) return [];
  const center = Math.round(weight / RULER_STEP) * RULER_STEP;
  return [RULER_HALF_SPAN, RULER_STEP, 0, -RULER_STEP, -RULER_HALF_SPAN].map(step => center + step);
}

/**
 * Extremos y avance del medidor «Datos de peso». Con meta cargada va del peso inicial a la meta;
 * sin meta usa los extremos de la regla de la tarjeta Peso (misma escala, mismo valor).
 */
export function weightGauge(weight: number | null, goal: number | null, start: number | null): WeightGauge {
  if (weight == null || !Number.isFinite(weight)) return { from: null, to: null, pct: 0 };
  if (goal != null && start != null) {
    const reached = start === goal ? weight === goal : false;
    const pct = start === goal ? (reached ? 100 : 0) : clamp(((start - weight) / (start - goal)) * 100);
    return { from: Math.round(start), to: Math.round(goal), pct };
  }
  const ruler = rulerFor(weight);
  const from = ruler[0];
  const to = ruler[ruler.length - 1];
  return { from, to, pct: clamp(((from - weight) / (from - to)) * 100) };
}
