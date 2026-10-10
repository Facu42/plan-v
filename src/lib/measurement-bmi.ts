import type { Measurement } from '../types/care';
import { bodyMassReference } from './body-mass-reference';

const latest = (rows: readonly Measurement[], kind: string, unit: string) =>
  rows.filter((row) => row.kind === kind && row.unit === unit)
    .sort((a, b) => b.captured_on.localeCompare(a.captured_on) || b.created_at.localeCompare(a.created_at))[0];

/** IMC con el último peso (kg) y la última altura (cm). La categoría es una referencia general, sólo desde los 20 años. */
export function latestBmi(measurements: readonly Measurement[], age: number | null) {
  const weight = latest(measurements, 'weight', 'kg');
  const height = latest(measurements, 'height', 'cm');
  if (!weight || !height) return null;
  const reference = bodyMassReference(weight.value_numeric, height.value_numeric, age ?? 0);
  const raw = weight.value_numeric / (height.value_numeric / 100) ** 2;
  if (!Number.isFinite(raw)) return null;
  return { bmi: raw, category: reference?.category ?? null, weightDate: weight.captured_on, weightKg: weight.value_numeric, heightCm: height.value_numeric };
}
