import { describe, expect, it } from 'vitest';
import { planAlternativeSlots, planAlternativesView, type AlternativesHealth } from './compute.js';
import type { ExchangeGroup } from '../../src/types/nutrition-capabilities.js';
import type { PatientMealPlan } from '../../src/types/plans.js';

const food = (id: string, name: string) => ({ id, name, revision: 1, kind: 'food', source: 'Etiqueta', nutrients: { kcal: 100 }, portions: [] }) as unknown as ExchangeGroup['items'][number]['food'];
const group = { id: 'g1', owner_id: 'o', name: 'Frutas', reference: 'r', revision: 2, updated_at: '', items: [
  { grams: 100, food: food('a', 'Manzana') }, { grams: 50, food: food('b', 'Pera') }, { grams: 0, food: food('c', 'Roto') }] } as ExchangeGroup;
const plan = { items: [{ id: 'i1', components: [{ id: 'c1', kind: 'food', food_id: 'a', food_revision: 1, quantity: 150, measure: null, public_note: '', food_snapshot: food('a', 'Manzana') }, { id: 'c2', kind: 'text', free_text: 'Té' }] }] } as unknown as PatientMealPlan;
const known = (allergies: string[] = [], restrictions: string[] = []): AlternativesHealth => ({
  allergies: { state: allergies.length ? 'reported' : 'none', items: allergies }, restrictions: { state: restrictions.length ? 'reported' : 'none', items: restrictions } });

describe('alternativas del plan', () => {
  it('escala la cantidad por intercambios y descarta cantidades inválidas', () => {
    const { slots } = planAlternativeSlots(plan, [group], known());
    expect(slots).toHaveLength(1);
    expect(slots[0].options).toMatchObject([{ food_id: 'b', quantity: 75, group_revision: 2 }]);
  });
  it('sin alergias o restricciones declaradas no ofrece nada', () => {
    const unknown: AlternativesHealth = { allergies: { state: 'unknown', items: [] }, restrictions: { state: 'none', items: [] } };
    expect(planAlternativeSlots(plan, [group], unknown)).toEqual({ status: 'health_unknown', slots: [] });
  });
  it('excluye alergias y restricciones, y sin opciones no hay ranura', () => {
    expect(planAlternativeSlots(plan, [group], known(['pera'])).slots).toEqual([]);
    expect(planAlternativeSlots(plan, [group], known([], ['Pera'])).slots).toEqual([]);
  });
  it('no cuenta una elección cuyo grupo ya no existe', () => {
    const stored = [{ item_id: 'i1', component_id: 'c1', group_id: 'viejo', base_food_id: 'a', food_id: 'b', name: 'Pera', quantity: 75, unit: 'g' as const, chosen_at: '', group_revision: 1, food_revision: 1 }];
    expect(planAlternativesView(plan, [group], known(), stored).choices).toEqual([]);
    expect(planAlternativesView(plan, [group], known(), [{ ...stored[0], group_id: 'g1' }]).choices).toHaveLength(1);
  });
});
