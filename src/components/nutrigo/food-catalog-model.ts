import { normalizeFoodSearch, type Food } from '../../types/foods';

export type CatalogOrder = 'name-asc' | 'name-desc' | 'kcal-asc' | 'kcal-desc';
export type CatalogFilters = {
  kind: Food['kind']; query: string; scope: 'all' | 'own' | 'platform';
  source: string; category: string; order: CatalogOrder;
};

export function selectCatalogFoods(items: Food[], filters: CatalogFilters): Food[] {
  const query = normalizeFoodSearch(filters.query);
  return items.filter(food => food.kind === filters.kind
    && (!filters.source || food.source === filters.source)
    && (!filters.category || food.category === filters.category)
    && (filters.scope === 'all' || (filters.scope === 'own' ? food.owner_id !== null : food.owner_id === null))
    && normalizeFoodSearch(`${food.name} ${food.brand} ${food.category} ${food.source}`).includes(query))
    .sort((a, b) => {
      const byName = a.name.localeCompare(b.name, 'es') || a.id.localeCompare(b.id);
      if (filters.order === 'name-asc') return byName;
      if (filters.order === 'name-desc') return -byName;
      const left = a.nutrients.kcal, right = b.nutrients.kcal;
      if (left === null && right === null) return byName;
      if (left === null) return 1;
      if (right === null) return -1;
      return (left - right) * (filters.order === 'kcal-asc' ? 1 : -1) || byName;
    });
}
