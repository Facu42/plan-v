import { describe, expect, it } from 'vitest';
import { calculateTarget, defaultsForGoal, mifflinStJeor, targetInputSchema, type TargetInput } from './nutrition-target';

const base: TargetInput = { sex: 'femenino', age: 30, weight_kg: 65, height_cm: 165, activity: 'ligera', ...defaultsForGoal('mantener') };

describe('Mifflin-St Jeor', () => {
  it('coincide con el ejemplo publicado (mujer, 30 años, 65 kg, 165 cm)', () => {
    expect(mifflinStJeor('femenino', 30, 65, 165)).toBeCloseTo(1370.25, 2);
    expect(mifflinStJeor('masculino', 30, 65, 165)).toBeCloseTo(1536.25, 2);
  });
  it('gasto total = GEB × factor de actividad', () => {
    const r = calculateTarget(base);
    expect(r.bmr).toBe(1370);
    expect(r.tdee).toBe(Math.round(1370.25 * 1.375));
    expect(r.kcal).toBe(r.tdee);
  });
  it('aplica el ajuste del objetivo y reparte macros que suman la meta', () => {
    const r = calculateTarget({ ...base, ...defaultsForGoal('bajar') });
    expect(r.kcal).toBe(Math.round(1370.25 * 1.375 * 0.85));
    expect(r.protein_g).toBe(Math.round(1.8 * 65));
    const total = r.protein_g * 4 + r.carbs_g * 4 + r.fat_g * 9;
    expect(Math.abs(total - r.kcal)).toBeLessThan(12);
    expect(r.warnings).toEqual([]);
  });
  it('no baja del mínimo y avisa', () => {
    const r = calculateTarget({ ...base, weight_kg: 45, height_cm: 150, activity: 'sedentaria', adjust_pct: -30 });
    expect(r.kcal).toBe(1200);
    expect(r.warnings[0]).toMatch(/mínimo/);
  });
  it('avisa con menores de 18 y rechaza datos absurdos', () => {
    expect(calculateTarget({ ...base, age: 16 }).warnings.join(' ')).toMatch(/menor de 18/);
    expect(targetInputSchema.safeParse({ ...base, weight_kg: 5 }).success).toBe(false);
    expect(targetInputSchema.safeParse({ ...base, extra: 1 }).success).toBe(false);
  });
});

import { ageFromBirthDate, bodyDataSchema } from './nutrition-target';
describe('datos corporales de la paciente', () => {
  it('calcula la edad exacta y rechaza fechas imposibles', () => {
    const today = new Date(Date.UTC(2026, 8, 30));
    expect(ageFromBirthDate('1996-09-30', today)).toBe(30);
    expect(ageFromBirthDate('1996-10-01', today)).toBe(29);
    expect(ageFromBirthDate('1996-02-31', today)).toBeNull();
  });
  it('valida el formulario', () => {
    const ok = { sex: 'femenino', birth_date: '1990-05-10', height_cm: 165, weight_kg: 64 };
    expect(bodyDataSchema.safeParse(ok).success).toBe(true);
    expect(bodyDataSchema.safeParse({ ...ok, birth_date: '2020-01-01' }).success).toBe(false);
    expect(bodyDataSchema.safeParse({ ...ok, height_cm: 20 }).success).toBe(false);
  });
});
