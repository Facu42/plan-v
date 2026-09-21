import { describe, expect, it } from 'vitest';
import { mealPlanDraftSchema } from '../../src/types/plans.js';
import { CareError, mealPlanDbError } from './repository.js';

const draft = {
  id: '11111111-1111-4111-8111-111111111111',
  period_start: '2026-09-21',
  period_end: '2026-09-27',
  items: [{ for_date: '2026-09-21', slot: 'Almuerzo', free_text: 'Pollo con vegetales' }],
};

describe('PV-19 planes fechados', () => {
  it('exige receta XOR texto, zona horaria local y un ítem por fecha y momento', () => {
    const parsed = mealPlanDraftSchema.parse(draft);
    expect(parsed.timezone).toBe('America/Argentina/Buenos_Aires');
    expect(mealPlanDraftSchema.safeParse({ ...draft, timezone: 'UTC' }).success).toBe(false);
    expect(mealPlanDraftSchema.safeParse({
      ...draft,
      items: [{ for_date: '2026-09-21', slot: 'Almuerzo', recipe_id: 'r1', free_text: 'también texto' }],
    }).success).toBe(false);
    expect(mealPlanDraftSchema.safeParse({
      ...draft,
      items: [
        { for_date: '2026-09-21', slot: 'Almuerzo', free_text: 'A' },
        { for_date: '2026-09-21', slot: 'almuerzo', free_text: 'B' },
      ],
    }).success).toBe(false);
    expect(mealPlanDraftSchema.safeParse({ ...draft, period_end: '2026-10-20' }).success).toBe(false);
    expect(mealPlanDraftSchema.safeParse({ ...draft, kcal: 320 }).success).toBe(false);
  });

  it('cierra en 501 si falta el schema persistente', () => {
    expect(() => mealPlanDbError({ code: '42P01' })).toThrow(CareError);
    try {
      mealPlanDbError({ code: 'PGRST205' });
      throw new Error('expected CareError');
    } catch (error) {
      expect(error).toMatchObject({ status: 501, message: 'Los planes fechados requieren instalar la migración de este módulo.' });
    }
    try {
      mealPlanDbError({ code: '42883' });
      throw new Error('expected CareError');
    } catch (error) {
      expect(error).toMatchObject({ status: 501 });
    }
    try {
      mealPlanDbError({ code: 'PT409' });
      throw new Error('expected CareError');
    } catch (error) {
      expect(error).toMatchObject({ status: 409 });
    }
  });
});
