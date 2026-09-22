import { describe, expect, it } from 'vitest';
import {
  buildShoppingExport,
  buildShoppingList,
  formatShoppingQty,
  shoppingCategoryFor,
  shoppingChecklistKey,
  type ShoppingMeal,
} from './shopping-list';

const meals: ShoppingMeal[] = [
  { title: 'Pollo al horno con verduras' },
  { title: 'Tostada con palta y huevo' },
  { title: 'Tortilla de verduras + ensalada' },
  { title: 'Pollo con vegetales' },
  { title: 'Sorpresa de Verónica' },
];

describe('buildShoppingList', () => {
  it('derives grocery ingredients, groups them and deduplicates repeated meals', () => {
    const groups = buildShoppingList(meals);

    expect(groups.map((group) => group.category)).toEqual([
      'Verdulería',
      'Proteínas',
      'Panadería y cereales',
      'Otros',
    ]);
    expect(groups.flatMap((group) => group.items)).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'pollo', label: 'Pollo', occurrences: 2 }),
      expect.objectContaining({ id: 'verduras-variadas', label: 'Verduras variadas', occurrences: 3 }),
      expect.objectContaining({ id: 'huevos', label: 'Huevos', occurrences: 2 }),
      expect.objectContaining({ id: 'pan-integral', label: 'Pan integral', occurrences: 1 }),
      expect.objectContaining({ id: 'ingredientes-sorpresa-de-veronica', label: 'Ingredientes para: Sorpresa de Verónica', occurrences: 1 }),
    ]));
  });

  it('returns an empty list for a week without meals', () => {
    expect(buildShoppingList([])).toEqual([]);
  });

  it('clasifica ingredientes conocidos y formatea cantidad+unidad', () => {
    expect(shoppingCategoryFor('Quinoa')).toBe('Panadería y cereales');
    expect(formatShoppingQty(90, 'g')).toBe('90 g');
    expect(formatShoppingQty(null, null)).toBe('');
  });
});

describe('shopping checklist persistence and export', () => {
  it('uses an isolated storage key per patient and week', () => {
    expect(shoppingChecklistKey('pat-sofia', 'current')).toBe('plan-v:pat-sofia:shopping:current');
  });

  it('exports every item with its check state and meal frequency', () => {
    const groups = buildShoppingList(meals);
    const text = buildShoppingExport({
      label: 'Esta semana',
      range: 'Del 31 de agosto al 6 de septiembre',
      groups,
      checkedIds: new Set(['pollo']),
    });

    expect(text).toContain('Lista de compras · Esta semana');
    expect(text).toContain('Del 31 de agosto al 6 de septiembre');
    expect(text).toContain('[x] Pollo · aparece en 2 comidas');
    expect(text).toContain('[ ] Huevos · aparece en 2 comidas');
    expect(text).toContain('VERDULERÍA');
  });
});
