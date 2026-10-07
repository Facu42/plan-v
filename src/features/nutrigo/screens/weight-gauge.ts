export type WeightGauge = { from: number | null; to: number | null; pct: number };

const RULER_STEP = 5;
const RULER_HALF_SPAN = 10;
const clamp = (value: number) => Math.max(0, Math.min(100, value));

/**
 * Extremos y avance del medidor «Datos de peso». Con meta cargada va del peso inicial a la meta;
 * sin meta usa los mismos extremos que la regla de la tarjeta Peso, como el archivo (85 → 65 con 78 kg).
 */
export function weightGauge(weight: number | null, goal: number | null, start: number | null): WeightGauge {
  if (weight == null) return { from: null, to: null, pct: 0 };
  if (goal != null && start != null) {
    if (start === goal) return { from: Math.round(start), to: Math.round(goal), pct: 100 };
    return { from: Math.round(start), to: Math.round(goal), pct: clamp(((start - weight) / (start - goal)) * 100) };
  }
  const center = Math.round(weight / RULER_STEP) * RULER_STEP;
  const from = center + RULER_HALF_SPAN;
  const to = center - RULER_HALF_SPAN;
  return { from, to, pct: clamp(((from - weight) / (from - to)) * 100) };
}
