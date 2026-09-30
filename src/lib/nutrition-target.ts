import { z } from 'zod';

// Ecuación de Mifflin-St Jeor (la misma que usan Nutrium y la mayoría de las guías clínicas):
// GEB = 10 × peso(kg) + 6,25 × talla(cm) − 5 × edad + (5 varón | −161 mujer)
// Gasto total = GEB × factor de actividad. Todo es aritmética fija, no un modelo de lenguaje.

export const SEX_OPTIONS = ['femenino', 'masculino'] as const;
export const ACTIVITY_LEVELS = ['sedentaria', 'ligera', 'moderada', 'intensa', 'muy_intensa'] as const;
export const TARGET_GOALS = ['bajar', 'mantener', 'subir'] as const;

export type Sex = (typeof SEX_OPTIONS)[number];
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];
export type TargetGoal = (typeof TARGET_GOALS)[number];

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = { sedentaria: 1.2, ligera: 1.375, moderada: 1.55, intensa: 1.725, muy_intensa: 1.9 };
export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentaria: 'Sedentaria · poco o nada de ejercicio', ligera: 'Ligera · 1 a 3 días por semana', moderada: 'Moderada · 3 a 5 días por semana',
  intensa: 'Intensa · 6 a 7 días por semana', muy_intensa: 'Muy intensa · trabajo físico o doble entrenamiento',
};
export const GOAL_LABELS: Record<TargetGoal, string> = { bajar: 'Bajar de peso', mantener: 'Mantener el peso', subir: 'Subir de peso' };
export const SEX_LABELS: Record<Sex, string> = { femenino: 'Femenino', masculino: 'Masculino' };

// Ajuste calórico por objetivo (porcentaje sobre el gasto total) y proteína sugerida por kilo de peso.
export const GOAL_DEFAULTS: Record<TargetGoal, { adjust_pct: number; protein_g_per_kg: number; fat_pct: number }> = {
  bajar: { adjust_pct: -15, protein_g_per_kg: 1.8, fat_pct: 28 },
  mantener: { adjust_pct: 0, protein_g_per_kg: 1.4, fat_pct: 30 },
  subir: { adjust_pct: 10, protein_g_per_kg: 1.8, fat_pct: 28 },
};

export const targetInputSchema = z.object({
  sex: z.enum(SEX_OPTIONS),
  age: z.number().int().min(15).max(100),
  weight_kg: z.number().min(30).max(300),
  height_cm: z.number().min(120).max(230),
  activity: z.enum(ACTIVITY_LEVELS),
  goal: z.enum(TARGET_GOALS),
  adjust_pct: z.number().min(-30).max(25),
  protein_g_per_kg: z.number().min(0.8).max(3),
  fat_pct: z.number().min(15).max(45),
}).strict();
export type TargetInput = z.infer<typeof targetInputSchema>;

export type TargetResult = {
  bmr: number; tdee: number; kcal: number;
  protein_g: number; carbs_g: number; fat_g: number;
  protein_pct: number; carbs_pct: number; fat_pct: number;
  warnings: string[];
};

export function defaultsForGoal(goal: TargetGoal) { return { goal, ...GOAL_DEFAULTS[goal] }; }

export function mifflinStJeor(sex: Sex, age: number, weightKg: number, heightCm: number): number {
  return 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'masculino' ? 5 : -161);
}

export function calculateTarget(input: TargetInput): TargetResult {
  const warnings: string[] = [];
  const bmr = mifflinStJeor(input.sex, input.age, input.weight_kg, input.height_cm);
  const tdee = bmr * ACTIVITY_FACTORS[input.activity];
  let kcal = tdee * (1 + input.adjust_pct / 100);
  const floor = input.sex === 'masculino' ? 1500 : 1200;
  if (kcal < floor) { warnings.push(`La meta calculada quedaba por debajo de ${floor} kcal; se subió a ese mínimo. Revisala con criterio clínico.`); kcal = floor; }
  if (input.age < 18) warnings.push('Es menor de 18 años: esta ecuación es para adultos, usá otra referencia para crecimiento.');
  const protein_g = Math.round(input.protein_g_per_kg * input.weight_kg);
  const fat_g = Math.round((kcal * input.fat_pct / 100) / 9);
  const carbs_g = Math.max(0, Math.round((kcal - protein_g * 4 - fat_g * 9) / 4));
  if (carbs_g === 0) warnings.push('Proteínas y grasas ya cubren toda la meta: los hidratos quedaron en cero. Bajá la proteína por kilo o el porcentaje de grasa.');
  const rounded = Math.round(kcal);
  const pct = (grams: number, per: number) => Math.round((grams * per / kcal) * 100);
  return {
    bmr: Math.round(bmr), tdee: Math.round(tdee), kcal: rounded, protein_g, carbs_g, fat_g,
    protein_pct: pct(protein_g, 4), carbs_pct: pct(carbs_g, 4), fat_pct: pct(fat_g, 9), warnings,
  };
}
