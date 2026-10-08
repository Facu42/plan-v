import { describe, expect, it } from 'vitest';
import { analyzePlanDay, analyzePlanWeek, copyPlanDay, editorPlanDates } from './plan-day-analysis';
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

describe('promedio semanal', () => {
  it('promedia totales diarios y no cantidades de recetas', () => {
    const week = analyzePlanWeek([{ date: '2026-10-07', lines: [{ portions: '1', recipe }] }, { date: '2026-10-08', lines: [{ portions: '3', recipe }] }]);
    expect(week.nutrients[0]).toMatchObject({ total: 200, missing: 0, known: 2 });
  });
  it('no convierte días vacíos o incompletos en cero ni cumplimiento', () => {
    const week = analyzePlanWeek([{ date: '2026-10-07', lines: [{ portions: '1', recipe }] }, { date: '2026-10-08', lines: [] }, { date: '2026-10-09', lines: [{ portions: '1' }] }]);
    expect(week.nutrients[0]).toMatchObject({ total: null, subtotal: 100, known: 1, missing: 2 });
    expect(week.emptyDays).toBe(1);
    expect(analyzePlanWeek([]).nutrients[0].total).toBeNull();
  });
});

describe('copia de día del borrador', () => {
  const dates = ['2026-10-07', '2026-10-08', '2026-10-09'];
  const original = { for_date: dates[0], slot: 'Almuerzo', recipe_id: 'r1', recipe_version: 1, portions: '0.5', public_note: 'Nota', recipePreview: recipe };
  it('conserva referencia histórica, cantidad y nota en copias independientes', () => {
    const copied = copyPlanDay([original], dates[0], [dates[1], dates[2]], dates);
    expect(copied).toHaveLength(3);
    expect(copied[1]).toMatchObject({ for_date: dates[1], recipe_version: 1, portions: '0.5', public_note: 'Nota' });
    expect(copied[1].recipePreview).not.toBe(original.recipePreview);
    expect(original.for_date).toBe(dates[0]);
  });
  it('rechaza destinos ocupados, repetidos, fuera de período y sin origen', () => {
    const occupied = [original, { ...original, for_date: dates[1] }];
    expect(() => copyPlanDay(occupied, dates[0], [dates[1]], dates)).toThrow('tienen indicaciones');
    expect(() => copyPlanDay([original], dates[0], [dates[1], dates[1]], dates)).toThrow();
    expect(() => copyPlanDay([original], dates[0], ['2026-11-01'], dates)).toThrow();
    expect(() => copyPlanDay([original], dates[2], [dates[1]], dates)).toThrow();
    expect(() => copyPlanDay([original], dates[0], [], dates)).toThrow();
  });
  it('no aplica una copia parcial cuando supera el límite', () => {
    const many = Array.from({ length: 42 }, (_, index) => ({ ...original, slot: String(index) }));
    expect(() => copyPlanDay(many, dates[0], [dates[1]], dates)).toThrow('42');
    expect(many).toHaveLength(42);
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
