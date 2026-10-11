import { expect, it } from 'vitest';
import { matchesMenuForm } from './MealPlanVersions';
import type { ProfessionalMealPlan } from '../../types/plans';
const id = '11111111-1111-4111-8111-111111111111';
it('un plan compuesto recién guardado coincide con el formulario sin enviar sus copias', () => {
  const item = { for_date: '2026-10-07', slot: 'Almuerzo', public_note: '', components: [{ id, kind: 'text' as const, free_text: 'Agua', public_note: '' }] };
  const plan = { id, current: { period_start: '2026-10-07', period_end: '2026-10-07', items: [{ ...item, free_text: 'Comida compuesta', portions: null, recipe_id: null, recipe_version: null }] } } as unknown as ProfessionalMealPlan;
  expect(matchesMenuForm(plan, { id, timezone: 'America/Argentina/Buenos_Aires', period_start: '2026-10-07', period_end: '2026-10-07', items: [item] })).toBe(true);
});
