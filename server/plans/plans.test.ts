import { describe, expect, it } from 'vitest';
import { buildPublishedPlanDays, mealPlanDraftSchema, toPublishedPatientPlan } from '../../src/types/plans.js';
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

  it('arma la semana con días vacíos reales y el mismo snapshot para el paciente', () => {
    const items = [{
      id: 'i1',
      for_date: '2026-09-21',
      slot: 'Almuerzo' as const,
      recipe_id: null,
      recipe_version: null,
      recipe_title: null,
      recipe: null,
      free_text: 'Pollo con vegetales',
      portions: 1,
      public_note: '',
    }];
    const days = buildPublishedPlanDays({ period_start: '2026-09-21', period_end: '2026-09-27', items });
    expect(days).toHaveLength(7);
    expect(days[0]).toMatchObject({ isoDate: '2026-09-21', weekday: 'Lunes', items });
    expect(days.slice(1).every((day) => day.items.length === 0)).toBe(true);
    expect(days.map((day) => day.isoDate)).not.toContain('2026-09-28');
    const patient = toPublishedPatientPlan({
      id: 'p1',
      patient_id: 'pat-sofia',
      timezone: 'America/Argentina/Buenos_Aires',
      created_at: '2026-09-21T12:00:00.000Z',
      current: {
        id: 'v2', version: 2, status: 'draft', period_start: '2026-09-21', period_end: '2026-09-27', published_at: null, items: [],
      },
      published: {
        id: 'v1', version: 1, status: 'published', period_start: '2026-09-21', period_end: '2026-09-27', published_at: '2026-09-21T12:00:00.000Z', items,
      },
    });
    expect(patient?.items).toEqual(items);
    expect(patient?.version).toBe(1);
  });
});
