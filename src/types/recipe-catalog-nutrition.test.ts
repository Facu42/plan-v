import { describe, expect, it } from 'vitest';
import { calculateRecipeCatalog } from './recipe-catalog-nutrition';
import type { Food } from './foods';

const food = { id: '11111111-1111-4111-8111-111111111111', name: 'Avena', brand: '', category: 'Cereal', kind: 'food', source: 'Fuente de prueba', reference: '', revision: 1, owner_id: 'nutri', updated_at: '2026-10-07',
  nutrients: { kcal: 380, protein: 13, carbs: 60, fat: 7, fiber: null, sodium: 0, calcium: 20, iron: 2, potassium: 50, magnesium: 10, vitamin_c: null }, portions: [{ name: 'Cucharada', grams: 10 }],
} as Food;
const item = { name: 'Avena', quantity: 2, unit: 'g' as const, catalog_ref: { id: food.id, revision: 1, measure: 'Cucharada' } };

describe('Composición de recetas desde el catálogo', () => {
  it('convierte medidas y conserva desconocidos y ceros por receta, porción y 100 g finales', () => {
    const result = calculateRecipeCatalog({ yield_portions: 2, final_weight_g: 40, items: [item] }, [food]);
    expect(result.lines[0].grams).toBe(20);
    expect(result.totals.kcal).toBe(76);
    expect(result.per_portion.kcal).toBe(38);
    expect(result.per_100g?.kcal).toBe(190);
    expect(result.per_portion.fiber).toBeNull();
    expect(result.per_portion.sodium).toBe(0);
    expect(result.lines[0].food?.revision).toBe(1);
  });
  it('no inventa peso cocido ni composición para ingredientes de texto', () => {
    const result = calculateRecipeCatalog({ yield_portions: 2, items: [item, { name: 'Aceite sin composición', quantity: 1, unit: 'cda' as const }] }, [food]);
    expect(result.totals.kcal).toBeNull();
    expect(result.per_100g).toBeNull();
    expect(result.ingredient_weight_g).toBeNull();
  });
  it('conserva la versión usada aunque cambie el alimento; solo elegir otra revisión actualiza valores', () => {
    const prior = calculateRecipeCatalog({ yield_portions: 2, items: [item] }, [food]);
    const changed = { ...food, revision: 2, nutrients: { ...food.nutrients, kcal: 500 } };
    const same = calculateRecipeCatalog({ yield_portions: 4, items: [item] }, [changed], prior);
    expect(same.per_portion.kcal).toBe(19);
    const refreshed = calculateRecipeCatalog({ yield_portions: 2, items: [{ ...item, catalog_ref: { ...item.catalog_ref, revision: 2 } }] }, [changed], prior);
    expect(refreshed.per_portion.kcal).toBe(50);
    expect(prior.per_portion.kcal).toBe(38);
  });
  it('rechaza alimento no autorizado, revisión obsoleta nueva, medida inexistente y gramos excesivos', () => {
    expect(() => calculateRecipeCatalog({ yield_portions: 1, items: [item] }, [])).toThrow('disponible');
    expect(() => calculateRecipeCatalog({ yield_portions: 1, items: [item] }, [{ ...food, revision: 2 }])).toThrow('cambió');
    expect(() => calculateRecipeCatalog({ yield_portions: 1, items: [{ ...item, catalog_ref: { ...item.catalog_ref, measure: 'Vaso' } }] }, [food])).toThrow('medida');
    expect(() => calculateRecipeCatalog({ yield_portions: 1, items: [{ ...item, quantity: 100000 }] }, [food])).toThrow('gramos');
  });
  it('un rinde inválido y etiquetas duplicadas no producen un análisis engañoso', () => {
    expect(() => calculateRecipeCatalog({ yield_portions: 0, items: [item] }, [food])).toThrow();
    expect(() => calculateRecipeCatalog({ yield_portions: 2, items: [item, item] }, [food])).toThrow('repetido');
  });
});
