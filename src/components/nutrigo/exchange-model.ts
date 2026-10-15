import { NUTRIENTS, normalizeFoodSearch, scaleFoodNutrients, type Food, type FoodNutrients } from '../../types/foods';
import type { ExchangeEntry, ExchangeGroup, ExchangeItem, ExchangeKind } from '../../types/exchanges';

export type ExchangeFilters = { tab: ExchangeKind; query: string; scope: 'all' | 'system' | 'own' };

/** Filtra por pestaña, texto (sin tildes ni mayúsculas) y origen; ordena por nombre. */
export function selectExchanges(entries: ExchangeEntry[], filters: ExchangeFilters): ExchangeEntry[] {
  const needle = normalizeFoodSearch(filters.query);
  return entries
    .filter(entry => entry.kind === filters.tab
      && (filters.scope === 'all' || (filters.scope === 'own' ? entry.owner_id !== null : entry.owner_id === null))
      && normalizeFoodSearch(`${entry.name} ${entry.description} ${entry.kind === 'list' ? `${entry.base.name} ${entry.items.map(i => i.name).join(' ')}` : entry.foods.map(f => f.name).join(' ')}`).includes(needle))
    .sort((a, b) => a.name.localeCompare(b.name, 'es') || a.id.localeCompare(b.id));
}

/** Aporte de la cantidad indicada; nulo si el alimento no está vinculado o no es visible en el catálogo. */
export function itemNutrition(item: Pick<ExchangeItem, 'food_id' | 'grams'> & Partial<ExchangeItem>, foods: Map<string, Food>): FoodNutrients | null {
  const food = item.food_id ? foods.get(item.food_id) : undefined;
  return food ? scaleFoodNutrients(food.nutrients, item.grams) : null;
}

/** Promedio por nutriente de los alimentos vinculados con dato, aplicado a la porción de referencia. */
export function groupContribution(group: Pick<ExchangeGroup, 'portion' | 'foods'>, foods: Map<string, Food>) {
  if (!group.portion) return null;
  const linked = group.foods.map(f => (f.food_id ? foods.get(f.food_id) : undefined)).filter((f): f is Food => Boolean(f));
  if (!linked.length) return null;
  const nutrients = Object.fromEntries(NUTRIENTS.map(([key]) => {
    const values = linked.map(f => f.nutrients[key]).filter((v): v is number => v !== null);
    const mean = values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : null;
    return [key, mean === null ? null : Math.round(mean * group.portion!.grams / 100 * 10000) / 10000];
  })) as FoodNutrients;
  return { nutrients, counted: linked.length, total: group.foods.length };
}
