import { NUTRIENTS, type Food, type FoodNutrients } from './foods.js';

export type RecipeCatalogItem = {
  name: string;
  quantity: number;
  unit: string;
  catalog_ref?: { id: string; revision: number; measure: string | null };
};
export type RecipeCatalogSnapshot = {
  lines: Array<RecipeCatalogItem & { grams: number | null; food: Food | null }>;
  totals: FoodNutrients;
  per_portion: FoodNutrients;
  per_100g: FoodNutrients | null;
  ingredient_weight_g: number | null;
  estimate_origin?: boolean;
  estimate_source?: string | null;
};

const round = (value: number) => Math.round(value * 10000) / 10000;

/** Prior snapshots must come from the saved recipe, never from untrusted client input. */
export function calculateRecipeCatalog(
  draft: { yield_portions: number; final_weight_g?: number | null; items: RecipeCatalogItem[] },
  foods: readonly Food[],
  prior?: RecipeCatalogSnapshot,
): RecipeCatalogSnapshot {
  if (!Number.isFinite(draft.yield_portions) || draft.yield_portions <= 0 || draft.yield_portions > 50) throw new Error('Revisá el rinde de la receta.');
  if (draft.final_weight_g != null && (!Number.isFinite(draft.final_weight_g) || draft.final_weight_g <= 0 || draft.final_weight_g > 100000)) throw new Error('Revisá el peso final en gramos.');
  if (!draft.items.length || draft.items.length > 20) throw new Error('La receta necesita entre 1 y 20 ingredientes.');
  const names = new Set<string>();
  const lines = draft.items.map(item => {
    const name = item.name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es');
    if (!name || names.has(name)) throw new Error('Hay un ingrediente repetido o sin nombre.');
    names.add(name);
    if (!Number.isFinite(item.quantity) || item.quantity <= 0 || item.quantity > 100000) throw new Error('Revisá la cantidad del ingrediente.');
    const ref = item.catalog_ref;
    if (!ref) return { ...item, grams: item.unit === 'g' ? item.quantity : null, food: null };
    const frozen = prior?.lines.find(line => line.food?.id === ref.id && line.food.revision === ref.revision)?.food;
    const food = frozen ?? foods.find(candidate => candidate.id === ref.id);
    if (!food) throw new Error('El alimento no está disponible en tu catálogo.');
    if (food.revision !== ref.revision) throw new Error('El alimento cambió. Elegí su versión actual.');
    const portion = ref.measure == null ? null : food.portions.find(candidate => candidate.name === ref.measure);
    if (ref.measure != null && !portion) throw new Error('La medida elegida no está disponible.');
    const grams = item.quantity * (portion?.grams ?? 1);
    if (!Number.isFinite(grams) || grams <= 0 || grams > 100000) throw new Error('Revisá la cantidad en gramos.');
    return { ...item, catalog_ref: { ...ref }, grams, food: structuredClone(food) };
  });
  const totals = Object.fromEntries(NUTRIENTS.map(([key]) => {
    if (lines.some(line => line.food?.nutrients[key] == null || line.grams == null)) return [key, null];
    return [key, lines.reduce((sum, line) => sum + line.food!.nutrients[key]! * line.grams! / 100, 0)];
  })) as FoodNutrients;
  const scaled = (divisor: number): FoodNutrients => Object.fromEntries(NUTRIENTS.map(([key]) => [key, totals[key] == null ? null : round(totals[key]! / divisor)])) as FoodNutrients;
  return {
    lines,
    totals: scaled(1),
    per_portion: scaled(draft.yield_portions),
    per_100g: draft.final_weight_g == null ? null : scaled(draft.final_weight_g / 100),
    ingredient_weight_g: lines.some(line => line.grams == null) ? null : round(lines.reduce((sum, line) => sum + line.grams!, 0)),
  };
}
