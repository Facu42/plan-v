import { describe, expect, it } from 'vitest';
import { foodInputSchema, type Food } from '../../types/foods';
import { selectCatalogFoods, type CatalogFilters } from './food-catalog-model';

function food(name: string, kcal: number | null, overrides: Partial<Food> = {}): Food {
  const { expected_revision: _, ...input } = foodInputSchema.parse({ id: 'a0000000-0000-4000-8000-000000000001', expected_revision: 0, name, kind: 'food', source: 'Etiqueta', nutrients: { kcal }, portions: [] });
  return { ...input, owner_id: 'nutri-a', revision: 1, updated_at: '2026-10-07T00:00:00Z', ...overrides };
}
const filters: CatalogFilters = { kind: 'food', query: '', scope: 'all', source: '', category: '', order: 'name-asc' };
const items = [food('Sémola', 350, { category: 'Cereales' }), food('Avena', 380), food('Aceite', null), food('Batido', 200, { kind: 'supplement', source: 'Fabricante' }), food('Arroz', 300, { owner_id: null })];
describe('herramientas del catálogo profesional', () => {
  it('combina pestaña, búsqueda sin tildes, fuente, origen y categoría', () => {
    expect(selectCatalogFoods(items, { ...filters, query: 'semola', source: 'Etiqueta', scope: 'own', category: 'Cereales' }).map(f => f.name)).toEqual(['Sémola']);
    expect(selectCatalogFoods(items, { ...filters, scope: 'platform' }).map(f => f.name)).toEqual(['Arroz']);
    expect(selectCatalogFoods(items, { ...filters, kind: 'supplement' }).map(f => f.name)).toEqual(['Batido']);
  });
  it('ordena por nombre o energía y conserva los desconocidos al final', () => {
    expect(selectCatalogFoods(items, { ...filters, order: 'name-desc' }).map(f => f.name)).toEqual(['Sémola', 'Avena', 'Arroz', 'Aceite']);
    expect(selectCatalogFoods(items, { ...filters, order: 'kcal-asc' }).map(f => f.name)).toEqual(['Arroz', 'Sémola', 'Avena', 'Aceite']);
    expect(selectCatalogFoods(items, { ...filters, order: 'kcal-desc' }).map(f => f.name)).toEqual(['Avena', 'Sémola', 'Arroz', 'Aceite']);
    expect(items.map(f => f.name)).toEqual(['Sémola', 'Avena', 'Aceite', 'Batido', 'Arroz']);
  });
});
