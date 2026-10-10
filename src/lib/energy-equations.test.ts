import { describe, expect, it } from 'vitest';
import { compareEquations, faoWhoUnu, harrisBenedictRevised, katchMcArdle, latestMetric } from './energy-equations';

describe('fórmulas de metabolismo basal para comparar', () => {
  it('Harris-Benedict revisada (Roza y Shizgal) para mujer y varón', () => {
    expect(harrisBenedictRevised('femenino', 30, 65, 165)).toBeCloseTo(447.593 + 9.247 * 65 + 3.098 * 165 - 4.33 * 30, 3);
    expect(harrisBenedictRevised('masculino', 40, 80, 178)).toBeCloseTo(88.362 + 13.397 * 80 + 4.799 * 178 - 5.677 * 40, 3);
  });
  it('FAO/OMS/ONU usa solo el peso y cambia según el tramo de edad', () => {
    expect(faoWhoUnu('femenino', 25, 60)).toBeCloseTo(14.7 * 60 + 496, 3);
    expect(faoWhoUnu('femenino', 45, 60)).toBeCloseTo(8.7 * 60 + 829, 3);
    expect(faoWhoUnu('femenino', 70, 60)).toBeCloseTo(10.5 * 60 + 596, 3);
    expect(faoWhoUnu('masculino', 16, 60)).toBeCloseTo(17.5 * 60 + 651, 3);
    expect(faoWhoUnu('masculino', 30, 80)).toBeCloseTo(11.6 * 80 + 879, 3);
  });
  it('Katch-McArdle usa la masa magra y necesita el porcentaje de grasa', () => {
    expect(katchMcArdle(70, 30)).toBeCloseTo(370 + 21.6 * 49, 3);
    expect(katchMcArdle(70, null)).toBeNull();
  });
  it('compara todas con el mismo factor de actividad y marca la que usa la meta', () => {
    const rows = compareEquations({ sex: 'femenino', age: 30, weight_kg: 65, height_cm: 165, activity: 'ligera' }, { bodyFatPct: 28, scaleBmr: 1390 });
    expect(rows.map((r) => r.id)).toEqual(['mifflin', 'harris', 'fao', 'katch', 'scale']);
    expect(rows[0]).toMatchObject({ label: 'Mifflin-St Jeor', bmr: 1370, tdee: Math.round(1370.25 * 1.375), used: true });
    expect(rows.find((r) => r.id === 'katch')).toMatchObject({ bmr: Math.round(370 + 21.6 * 65 * 0.72), used: false });
    expect(rows.find((r) => r.id === 'scale')).toMatchObject({ label: 'Medido por la balanza', bmr: 1390 });
  });
  it('sin grasa corporal ni dato de balanza, avisa en lugar de inventar', () => {
    const rows = compareEquations({ sex: 'femenino', age: 30, weight_kg: 65, height_cm: 165, activity: 'ligera' }, {});
    expect(rows.find((r) => r.id === 'katch')).toMatchObject({ bmr: null, tdee: null, missing: 'Falta la grasa corporal en Mediciones' });
    expect(rows.some((r) => r.id === 'scale')).toBe(false);
  });
  it('toma la medición más reciente de un tipo', () => {
    const rows = [
      { kind: 'body_fat_pct', value_numeric: 30, captured_on: '2026-09-01', created_at: '2026-09-01T10:00:00Z' },
      { kind: 'body_fat_pct', value_numeric: 28, captured_on: '2026-10-01', created_at: '2026-10-01T10:00:00Z' },
      { kind: 'weight', value_numeric: 64, captured_on: '2026-10-05', created_at: '2026-10-05T10:00:00Z' },
    ];
    expect(latestMetric(rows, 'body_fat_pct')).toEqual({ value: 28, date: '2026-10-01' });
    expect(latestMetric(rows, 'bmr')).toBeNull();
  });
});
