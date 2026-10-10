import { ACTIVITY_FACTORS, mifflinStJeor, type ActivityLevel, type Sex } from './nutrition-target';

// Otras ecuaciones de metabolismo basal para comparar con la que usa la meta (Mifflin-St Jeor).
// Solo informan: la meta guardada sigue calculándose con Mifflin-St Jeor, igual que en la base.

/** Harris-Benedict revisada por Roza y Shizgal (1984). */
export function harrisBenedictRevised(sex: Sex, age: number, weightKg: number, heightCm: number): number {
  return sex === 'masculino'
    ? 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * age
    : 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * age;
}

// FAO/OMS/ONU 1985: solo peso, con coeficientes por sexo y tramo de edad.
const FAO_BANDS: Record<Sex, { upTo: number; slope: number; base: number }[]> = {
  femenino: [{ upTo: 18, slope: 12.2, base: 746 }, { upTo: 30, slope: 14.7, base: 496 }, { upTo: 60, slope: 8.7, base: 829 }, { upTo: Infinity, slope: 10.5, base: 596 }],
  masculino: [{ upTo: 18, slope: 17.5, base: 651 }, { upTo: 30, slope: 15.3, base: 679 }, { upTo: 60, slope: 11.6, base: 879 }, { upTo: Infinity, slope: 13.5, base: 487 }],
};

export function faoWhoUnu(sex: Sex, age: number, weightKg: number): number {
  const band = FAO_BANDS[sex].find((b) => age < b.upTo) ?? FAO_BANDS[sex][FAO_BANDS[sex].length - 1];
  return band.slope * weightKg + band.base;
}

/** Katch-McArdle: 370 + 21,6 × masa magra. Sin porcentaje de grasa no se puede calcular. */
export function katchMcArdle(weightKg: number, bodyFatPct: number | null): number | null {
  if (bodyFatPct === null) return null;
  return 370 + 21.6 * weightKg * (1 - bodyFatPct / 100);
}

export type EquationInput = { sex: Sex; age: number; weight_kg: number; height_cm: number; activity: ActivityLevel };
export type EquationRow = { id: 'mifflin' | 'harris' | 'fao' | 'katch' | 'scale'; label: string; bmr: number | null; tdee: number | null; used: boolean; missing?: string };

export function compareEquations(input: EquationInput, extra: { bodyFatPct?: number | null; scaleBmr?: number | null }): EquationRow[] {
  const factor = ACTIVITY_FACTORS[input.activity];
  const row = (id: EquationRow['id'], label: string, bmr: number | null, missing?: string): EquationRow => ({
    id, label, bmr: bmr === null ? null : Math.round(bmr), tdee: bmr === null ? null : Math.round(bmr * factor), used: id === 'mifflin', ...(bmr === null && missing ? { missing } : {}),
  });
  const rows = [
    row('mifflin', 'Mifflin-St Jeor', mifflinStJeor(input.sex, input.age, input.weight_kg, input.height_cm)),
    row('harris', 'Harris-Benedict revisada', harrisBenedictRevised(input.sex, input.age, input.weight_kg, input.height_cm)),
    row('fao', 'FAO/OMS/ONU', faoWhoUnu(input.sex, input.age, input.weight_kg)),
    row('katch', 'Katch-McArdle', katchMcArdle(input.weight_kg, extra.bodyFatPct ?? null), 'Falta la grasa corporal en Mediciones'),
  ];
  return extra.scaleBmr ? [...rows, row('scale', 'Medido por la balanza', extra.scaleBmr)] : rows;
}

type MetricLike = { kind: string; value_numeric: number; captured_on: string; created_at: string };

export function latestMetric(rows: readonly MetricLike[], kind: string): { value: number; date: string } | null {
  const latest = rows.filter((r) => r.kind === kind)
    .reduce<MetricLike | null>((best, r) => (!best || r.captured_on > best.captured_on || (r.captured_on === best.captured_on && r.created_at > best.created_at) ? r : best), null);
  return latest ? { value: latest.value_numeric, date: latest.captured_on } : null;
}
