import { describe, expect, it } from 'vitest';
import { deriveShoppingFromPlan } from './derive.js';
import type { PatientMealPlan } from '../../src/types/plans.js';

function plan(items: PatientMealPlan['items']): PatientMealPlan {
  return {
    id: '40000000-0000-4000-a000-0000000000a1',
    timezone: 'America/Argentina/Buenos_Aires',
    version: 1,
    period_start: '2026-09-21',
    period_end: '2026-09-27',
    published_at: '2026-09-21T12:00:00.000Z',
    items,
  };
}

describe('PV-21 derivación de compras', () => {
  it('escala porciones, suma la misma unidad y no mezcla g con taza', () => {
    const list = deriveShoppingFromPlan(plan([
      {
        id: 'i1', for_date: '2026-09-21', slot: 'Almuerzo', recipe_id: 'r1', recipe_version: 1, recipe_title: 'Quinoa',
        recipe: {
          title: 'Quinoa', version: 1, yield_portions: 2, steps: ['Cocinar.'], nutrient_source: '',
          ingredients: [
            { id: 'q', name: 'Quinoa', quantity: 60, unit: 'g' },
            { id: 't', name: 'Tomate', quantity: 1, unit: 'u' },
          ],
        },
        free_text: null, portions: 2, public_note: '',
      },
      {
        id: 'i2', for_date: '2026-09-22', slot: 'Cena', recipe_id: 'r1', recipe_version: 1, recipe_title: 'Quinoa',
        recipe: {
          title: 'Quinoa', version: 1, yield_portions: 2, steps: ['Cocinar.'], nutrient_source: '',
          ingredients: [{ id: 'q', name: 'Quinoa', quantity: 60, unit: 'g' }],
        },
        free_text: null, portions: 1, public_note: '',
      },
      {
        id: 'i3', for_date: '2026-09-23', slot: 'Merienda', recipe_id: 'r2', recipe_version: 1, recipe_title: 'Otra',
        recipe: {
          title: 'Otra', version: 1, yield_portions: 1, steps: ['Servir.'], nutrient_source: '',
          ingredients: [{ id: 'q2', name: 'Quinoa', quantity: 1, unit: 'taza' }],
        },
        free_text: null, portions: 1, public_note: '',
      },
    ]));
    const quinoa = list.items.filter((item) => item.name === 'Quinoa');
    expect(quinoa).toEqual([
      expect.objectContaining({ unit: 'g', quantity: 90, occurrences: 2, kind: 'derived' }),
      expect.objectContaining({ unit: 'taza', quantity: 1, occurrences: 1, kind: 'derived' }),
    ]);
    expect(list.items.find((item) => item.name === 'Tomate')).toMatchObject({ quantity: 1, unit: 'u' });
  });

  it('no inventa cantidades para texto libre y conserva el check por clave', () => {
    const key = 'text:pollo con vegetales';
    const list = deriveShoppingFromPlan(plan([{
      id: 'i4', for_date: '2026-09-21', slot: 'Cena', recipe_id: null, recipe_version: null, recipe_title: null,
      recipe: null, free_text: 'Pollo con vegetales', portions: 1, public_note: '',
    }]), new Map([[key, true]]));
    expect(list.items).toEqual([
      expect.objectContaining({ kind: 'text', name: 'Pollo con vegetales', quantity: null, unit: null, checked: true, source_key: key }),
    ]);
  });

  it('devuelve vacío si no hay plan publicado', () => {
    expect(deriveShoppingFromPlan(null).items).toEqual([]);
  });
});
