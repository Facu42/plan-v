/** Síntomas que la paciente puede marcar en el día. Las claves son las que guarda la base (ver la migración 20261015100000). */
export const SYMPTOMS = [
  { key: 'hinchazon', label: 'Hinchazón' },
  { key: 'acidez', label: 'Acidez' },
  { key: 'estrenimiento', label: 'Estreñimiento' },
  { key: 'diarrea', label: 'Diarrea' },
  { key: 'nauseas', label: 'Náuseas' },
  { key: 'dolor_cabeza', label: 'Dolor de cabeza' },
  { key: 'cansancio', label: 'Cansancio' },
  { key: 'ansiedad_comer', label: 'Ganas de picar' },
] as const;

export type SymptomKey = (typeof SYMPTOMS)[number]['key'];
export const SYMPTOM_KEYS = SYMPTOMS.map((symptom) => symptom.key) as [SymptomKey, ...SymptomKey[]];

/** Ánimo del día: mismos valores que ya usan la ficha de ingreso y el gráfico de descanso. */
export const ENERGY_LEVELS = [
  { value: 'Alta', label: 'Con energía' },
  { value: 'Media', label: 'Normal' },
  { value: 'Baja', label: 'Sin energía' },
] as const;

const SYMPTOM_LABEL = new Map<string, string>(SYMPTOMS.map((symptom) => [symptom.key, symptom.label]));
export const symptomLabel = (key: string): string => SYMPTOM_LABEL.get(key) ?? key;

/** Sólo claves conocidas, sin repetir y en el orden de la lista. */
export function normalizeSymptoms(value: unknown): SymptomKey[] {
  if (!Array.isArray(value)) return [];
  const chosen = new Set(value.filter((item): item is string => typeof item === 'string'));
  return SYMPTOM_KEYS.filter((key) => chosen.has(key));
}

/** Cuántos días aparece cada síntoma en una lista de días, de más a menos frecuente. */
export function symptomFrequency(days: readonly { symptoms?: readonly string[] }[]): { key: SymptomKey; label: string; days: number }[] {
  return SYMPTOMS
    .map(({ key, label }) => ({ key, label, days: days.filter((day) => day.symptoms?.includes(key)).length }))
    .filter((entry) => entry.days > 0)
    .sort((a, b) => b.days - a.days);
}
