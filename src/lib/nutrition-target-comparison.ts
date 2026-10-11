import type { Macros } from '../types';
const measures = [
  ['kcal', 'Energía', 'kcal'], ['protein_g', 'Proteínas', 'g'],
  ['carbs_g', 'Hidratos', 'g'], ['fat_g', 'Grasas', 'g'],
] as const;

export function compareNutritionTargets(proposed: Macros, confirmed: Macros | null) {
  return measures.map(([key, label, unit]) => ({ key, label, unit, proposed: proposed[key], confirmed: confirmed?.[key] ?? null, change: confirmed ? proposed[key] - confirmed[key] : null }));
}
