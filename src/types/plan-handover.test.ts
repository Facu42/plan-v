import { describe, expect, it } from 'vitest';
import {
  planChangeLineText,
  planChangeSummary,
  planHandoverBanner,
  planHandoverNotice,
  planItemLabel,
  planTakesEffectNow,
  type PlanHandover,
} from './plan-handover';
import { planWeekIndex } from './plans';

const meal = (for_date: string, slot: string, label: string, extra: Partial<{ public_note: string; portions: number | null }> = {}) => ({
  for_date, slot, label, public_note: extra.public_note ?? '', portions: extra.portions ?? 1,
});

describe('vigencia del plan nuevo', () => {
  it('mantiene el plan anterior si el nuevo empieza después de hoy', () => {
    expect(planTakesEffectNow('2026-10-20', '2026-10-10', true)).toBe(false);
    expect(planTakesEffectNow('2026-10-10', '2026-10-10', true)).toBe(true);
    expect(planTakesEffectNow('2026-10-20', '2026-10-10', false)).toBe(true);
  });

  it('lista comidas agregadas, sacadas y modificadas', () => {
    const summary = planChangeSummary(
      [meal('2026-10-20', 'Almuerzo', 'Pollo', { public_note: 'Sin fritura' }), meal('2026-10-20', 'Cena', 'Sopa')],
      [meal('2026-10-20', 'Almuerzo', 'Pollo', { public_note: 'Al horno' }), meal('2026-10-21', 'Desayuno', 'Avena')],
    );
    expect(summary).toMatchObject({ added: 1, removed: 1, changed: 1 });
    expect(summary.lines.map(planChangeLineText)).toEqual([
      '20 oct · Almuerzo: Pollo (cambió la cantidad o la nota)',
      '20 oct · Cena: se saca Sopa',
      '21 oct · Desayuno: se agrega Avena',
    ]);
  });

  it('nombra la comida armada y la receta cuando no hay texto libre', () => {
    expect(planItemLabel({ free_text: '  ', recipe_title: 'Tortilla', components: [] })).toBe('Tortilla');
    expect(planItemLabel({ components: [{ id: 'c' }] })).toBe('Comida armada');
  });

  it('abre el plan en la semana que contiene hoy', () => {
    expect(planWeekIndex('2026-10-05', '2026-10-18', '2026-10-13')).toBe(1);
    expect(planWeekIndex('2026-10-05', '2026-10-18', '2026-10-04')).toBe(0);
    expect(planWeekIndex('2026-10-05', '2026-10-11', '2026-10-20')).toBe(0);
    expect(planWeekIndex('2026-10-01', '2026-10-21', '2026-10-22')).toBe(2);
  });

  it('avisa el plan que espera y deja de sonar cuando ya lo vio', () => {
    const waiting: PlanHandover = {
      version: 2, previous_version: 1, starts_on: '2026-10-20', waiting: true, seen: false,
      changes: { added: 1, removed: 0, changed: 0, lines: [] },
    };
    expect(planHandoverNotice(waiting)?.title).toBe('Tenés un plan nuevo');
    expect(planHandoverNotice({ ...waiting, seen: true })).toBeNull();
    expect(planHandoverBanner({ ...waiting, seen: true })).toContain('Seguís con este plan');
    expect(planHandoverNotice({ ...waiting, waiting: false, seen: false })?.title).toBe('Tu plan cambió');
    expect(planHandoverBanner(null)).toBeNull();
  });
});

it('la entrega con hora anuncia el momento efectivo en Argentina', () => {
  const handover: PlanHandover = { version:2,previous_version:1,starts_on:'2026-10-27',scheduled_at:'2026-10-28T02:00:00Z',waiting:true,seen:false,changes:{added:0,removed:0,changed:0,lines:[]} };
  expect(planHandoverNotice(handover)?.note).toContain('27 oct a las 23:00');
  expect(planHandoverBanner(handover)).toContain('27 oct a las 23:00');
});
