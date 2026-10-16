import { z } from 'zod';

export const NUTRIENTS = [
  ['kcal', 'Energía', 'kcal', 1000], ['protein', 'Proteínas', 'g', 100], ['carbs', 'Carbohidratos', 'g', 100], ['fat', 'Grasas', 'g', 100], ['fiber', 'Fibra', 'g', 100],
  ['sodium', 'Sodio', 'mg', 100000], ['calcium', 'Calcio', 'mg', 100000], ['iron', 'Hierro', 'mg', 100000], ['potassium', 'Potasio', 'mg', 100000], ['magnesium', 'Magnesio', 'mg', 100000], ['vitamin_c', 'Vitamina C', 'mg', 100000],
] as const;
export type NutrientKey = typeof NUTRIENTS[number][0];
export type FoodNutrients = Record<NutrientKey, number | null>;
const nutrientShape = Object.fromEntries(NUTRIENTS.map(([key, , , max]) => [key, z.number().finite().min(0).max(max).nullable().default(null)])) as Record<NutrientKey, z.ZodDefault<z.ZodNullable<z.ZodNumber>>>;
export const foodNutrientsSchema = z.object(nutrientShape).strict();
export const foodPortionSchema = z.object({ name: z.string().trim().min(1).max(80), grams: z.number().finite().positive().max(100000) }).strict();
export const foodInputSchema = z.object({
  id: z.uuid(), expected_revision: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER - 1),
  name: z.string().trim().min(1, 'Ingresá el nombre del alimento.').max(160), brand: z.string().trim().max(120).default(''), category: z.string().trim().max(80).default(''),
  kind: z.enum(['food', 'supplement']), source: z.string().trim().min(1, 'Indicá la fuente de los valores.').max(240), reference: z.string().trim().max(500).default(''),
  nutrients: foodNutrientsSchema, portions: z.array(foodPortionSchema).max(30),
}).strict().superRefine((food, ctx) => {
  if(food.source==='SARA 2 · Ministerio de Salud · 2022')ctx.addIssue({code:'custom',path:['source'],message:'Esa fuente identifica el catálogo institucional de sólo lectura. Para una carga propia indicá su fuente y referencia como declaración personal.'});
  const names = food.portions.map(p => normalizeFoodSearch(p.name));
  if (new Set(names).size !== names.length) ctx.addIssue({ code: 'custom', path: ['portions'], message: 'Cada medida necesita un nombre distinto.' });
});
export type FoodInput = z.infer<typeof foodInputSchema>;
export const SARA2_SOURCE = 'SARA 2 · Ministerio de Salud · 2022';
export type FoodComposition = { dataset: 'sara2-2022-v1'; source_sha256: string; record_id: string; basis: { amount: 100; unit: 'g' | 'ml' }; carbohydrates: 'available'; source_page: number };
// Institutional metadata is returned by the server, never accepted by foodInputSchema.
export type Food = Omit<FoodInput, 'expected_revision'> & { revision: number; owner_id: string | null; updated_at: string; composition?: FoodComposition };
export function foodQuantityUnit(food: Pick<Food,'composition'>): 'g'|'ml' { return food.composition?.basis.unit ?? 'g'; }
export function foodNativeQuantity(food: Food, quantity: number, measure: string|null): number|null {
  if (foodQuantityUnit(food)==='ml' && measure!==null) return null;
  const amount=quantity*(measure===null?1:food.portions.find(p=>p.name===measure)?.grams??NaN);
  return Number.isFinite(amount)&&amount>0&&amount<=100000?amount:null;
}
export function normalizeFoodSearch(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim().replace(/\s+/g, ' '); }
export function scaleFoodNutrients(values: Partial<FoodNutrients>, grams: number): FoodNutrients {
  if (!Number.isFinite(grams) || grams < 0 || grams > 100000) throw new Error('Revisá la cantidad en gramos.');
  return Object.fromEntries(NUTRIENTS.map(([key]) => [key, values[key] == null ? null : Math.round(values[key]! * grams / 100 * 10000) / 10000])) as FoodNutrients;
}
