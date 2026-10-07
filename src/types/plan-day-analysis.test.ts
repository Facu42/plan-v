import { describe, expect, it } from 'vitest';
import { analyzePlanDay, editorPlanDates } from './plan-day-analysis';
import type { PlanRecipeDetail } from './plans';

const recipe = { title: 'Prueba', version: 1, yield_portions: 2, ingredients: [], steps: [], nutrient_source: 'fuente de prueba', card: { macros: { kcal: 100, protein_g: 2, carbs_g: 3, fat_g: 4 } } } as unknown as PlanRecipeDetail;
describe('análisis diario del borrador', () => {
  it('suma porciones entre recetas sin volver a dividir por rinde', () => {
    const day = analyzePlanDay([{ portions: '0.5', recipe }, { portions: '2', recipe }]);
    expect(day.nutrients[0].total).toBe(250);
    expect(day.nutrients.find(n => n.key === 'fiber')?.total).toBeNull();
  });
  it('separa subtotal de total cuando una indicación no tiene composición', () => {
    const day = analyzePlanDay([{ portions: '1', recipe }, { portions: '1' }]);
    expect(day.nutrients[0]).toMatchObject({ total: null, subtotal: 100, missing: 1 });
    expect(analyzePlanDay([]).nutrients[0]).toMatchObject({ total: null, subtotal: null });
    expect(analyzePlanDay([{ portions: '', recipe }]).nutrients[0].total).toBeNull();
  });
  it('conserva el carácter estimado y ceros reales', () => {
    const estimated = { ...recipe, nutrient_source: 'estimacion_ia.v2', card: { macros: { kcal: 100, protein_g: 0, carbs_g: 0, fat_g: 0 } } } as PlanRecipeDetail;
    const day = analyzePlanDay([{ portions: '1', recipe: estimated }]);
    expect(day.estimated).toBe(true);
    expect(day.nutrients.find(n => n.key === 'protein')?.total).toBe(0);
  });
});
describe('días accesibles del editor', () => {
  it('incluye días vacíos y conserva indicaciones fuera de período', () => {
    expect(editorPlanDates('2026-10-07', '2026-10-09', ['2026-10-12'])).toEqual(['2026-10-07', '2026-10-08', '2026-10-09', '2026-10-12']);
  });
  it('no itera períodos inválidos o ilimitados', () => {
    expect(editorPlanDates('2026-02-30', '2026-03-01', [])).toEqual([]);
    expect(editorPlanDates('2026-10-09', '2026-10-07', ['2026-10-07'])).toEqual(['2026-10-07']);
    expect(editorPlanDates('2026-01-01', '2099-01-01', [])).toEqual([]);
  });
});
