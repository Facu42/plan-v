import { describe, expect, it } from 'vitest';
import type { Patient } from '../../types';
import { resolveNextStepTarget } from './next-step-target';

const patient = { todayPlan: [{ slot: 'Merienda', title: 'Yogur' }], weekPlan: [{ day: 'Miércoles', meals: [{ slot: 'Merienda', title: 'Yogur' }] }] } as Patient;

describe('resolveNextStepTarget', () => {
  it('opens the weekly menu editor on the most relevant available day', () => {
    expect(resolveNextStepTarget(patient, 'ajuste_menu')).toEqual({
      kind: 'menu',
      day: 'Miércoles',
      slot: 'Merienda',
    });
  });

  it('opens appointment preparation in edit mode', () => {
    expect(resolveNextStepTarget(patient, 'turno')).toEqual({
      kind: 'appointment',
      editing: true,
    });
  });

  it('falls back to the first available weekly day for menu edits', () => {
    expect(resolveNextStepTarget({ ...patient, weekPlan: [] }, 'ajuste_menu')).toEqual({
      kind: 'menu',
      day: 'Lunes',
      slot: null,
    });
  });
});
