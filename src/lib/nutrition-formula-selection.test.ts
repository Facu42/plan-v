import { describe, expect, it } from 'vitest';
import { calculateTarget, defaultsForGoal, targetInputSchema, type TargetInput } from './nutrition-target';
import { harrisBenedictRevised, faoWhoUnu, katchMcArdle } from './energy-equations';
const base: TargetInput = { sex: 'femenino', age: 35, weight_kg: 70, height_cm: 165, activity: 'moderada', ...defaultsForGoal('mantener') };
describe('Selección efectiva de fórmula de la meta', () => {
  it('conserva cálculo y contrato anteriores sin fórmula explícita', () => {
    expect(calculateTarget(base).bmr).toBe(1395);
    expect(targetInputSchema.parse(base)).toEqual(base);
  });
  it('Harris y FAO cambian realmente el basal y la meta', () => {
    for (const [formula, bmr] of [['harris', harrisBenedictRevised(base.sex,base.age,base.weight_kg,base.height_cm)], ['fao', faoWhoUnu(base.sex,base.age,base.weight_kg)]] as const) {
      const parsed = targetInputSchema.parse({ ...base, formula });
      expect(calculateTarget(parsed).bmr).toBe(Math.round(bmr));
      expect(calculateTarget(parsed).kcal).toBe(Math.round(bmr * 1.55));
    }
  });
  it('Katch exige grasa corporal real y balanza exige basal medido', () => {
    expect(targetInputSchema.safeParse({ ...base, formula: 'katch' }).success).toBe(false);
    expect(targetInputSchema.safeParse({ ...base, formula: 'scale' }).success).toBe(false);
    expect(calculateTarget(targetInputSchema.parse({ ...base, formula:'katch', body_fat_pct:30 })).bmr).toBe(Math.round(katchMcArdle(70,30)!));
    expect(calculateTarget(targetInputSchema.parse({ ...base, formula:'scale', scale_bmr:1600 })).bmr).toBe(1600);
  });
  it('rechaza parámetros no finitos, fuera de rango y fórmulas desconocidas', () => {
    for (const extra of [{formula:'kerr'}, {formula:'scale',scale_bmr:Infinity}, {formula:'scale',scale_bmr:100}, {formula:'katch',body_fat_pct:100}]) expect(targetInputSchema.safeParse({...base,...extra}).success).toBe(false);
  });
});
