import type { BioimpedanceValues } from '../../api/clinical-workspace';

export const MEDIDAS = [
  ['weight_kg', 'Peso', 'kg'],
  ['body_fat_pct', 'Grasa corporal', '%'],
  ['muscle_kg', 'Músculo', 'kg'],
  ['water_pct', 'Agua', '%'],
  ['visceral_fat', 'Grasa visceral', 'nivel'],
] as const;

export type MedidaClave = typeof MEDIDAS[number][0];

export const MEDIDAS_VACIAS: BioimpedanceValues = {
  weight_kg: null,
  body_fat_pct: null,
  muscle_kg: null,
  water_pct: null,
  visceral_fat: null,
};

export function medidaNumero(raw: string): number | null {
  const text = raw.trim().replace(',', '.');
  if (!text) return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

/** El guardado existe sólo con la revisión de la profesional y al menos una medida. */
export function pedidoBioimpedancia(input: {
  id: string;
  recordedOn: string;
  values: BioimpedanceValues;
  reviewed: boolean;
}) {
  if (input.reviewed !== true) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.recordedOn)) return null;
  if (!Object.values(input.values).some(value => value !== null)) return null;
  return { id: input.id, recorded_on: input.recordedOn, values: input.values, reviewed: true as const };
}
