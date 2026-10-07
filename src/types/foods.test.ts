import { describe, expect, it } from 'vitest';
import { foodInputSchema, scaleFoodNutrients } from './foods';

const input = { id: 'a0000000-0000-4000-8000-000000000001', expected_revision: 0, name: 'Avena', brand: '', category: 'Cereales', kind: 'food', source: 'Etiqueta del fabricante', reference: '', nutrients: { kcal: 380, protein: 13, carbs: 60, fat: 7, fiber: null }, portions: [{ name: 'Cucharada', grams: 10 }] };
describe('alimentos y medidas', () => {
  it('explica cuál dato de identificación falta antes de guardar', () => {
    const result = foodInputSchema.safeParse({ ...input, source: '   ' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe('Indicá la fuente de los valores.');
    const unnamed = foodInputSchema.safeParse({ ...input, name: '   ' });
    if (!unnamed.success) expect(unnamed.error.issues[0].message).toBe('Ingresá el nombre del alimento.');
  });
  it('calcula gramos sin transformar nutrientes desconocidos en cero', () => {
    const food = foodInputSchema.parse(input);
    expect(scaleFoodNutrients(food.nutrients, 25)).toMatchObject({ kcal: 95, protein: 3.25, fiber: null });
    expect(scaleFoodNutrients(food.nutrients, 0).kcal).toBe(0);
  });
  it('rechaza cantidades negativas, no finitas, fuentes vacías y medidas ambiguas', () => {
    for (const override of [{ source: '' }, { nutrients: { kcal: -1 } }, { portions: [{ name: 'Taza', grams: 0 }] }, { portions: [{ name: 'Taza', grams: 10 }, { name: ' taza ', grams: 20 }] }]) {
      expect(foodInputSchema.safeParse({ ...input, ...override }).success).toBe(false);
    }
    expect(() => scaleFoodNutrients(input.nutrients, NaN)).toThrow();
  });
  it('conserva un cero declarado y admite nutrientes parciales', () => {
    const parsed = foodInputSchema.parse({ ...input, nutrients: { fat: 0 } });
    expect(parsed.nutrients.fat).toBe(0);
    expect(parsed.nutrients.kcal).toBeNull();
  });
});
