import { beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { app } from '../index.js';
import { resetStore } from '../store.js';
import { resetFoodsMemory } from '../foods/repository.js';
import { resetNutritionCapabilities } from '../nutrition-capabilities/repository.js';
import { resetPlanAlternatives } from './repository.js';
import { declareKnownHealth } from '../test/declare-health.js';
import { foodInputSchema } from '../../src/types/foods.js';
import { planReviewSnapshot } from '../../src/types/plans.js';
import type { PlanAlternativesView } from '../../src/types/plan-alternatives.js';

const patient = 'pat-sofia';
const send = (path: string, body: unknown, method = 'POST') => app.request(path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const alternatives = async () => await (await app.request(`/api/patients/${patient}/plan-alternatives`)).json() as PlanAlternativesView;

async function fixture() {
  const ids = { manzana: randomUUID(), pera: randomUUID(), banana: randomUUID() };
  for (const [key, name] of [['manzana', 'Manzana'], ['pera', 'Pera'], ['banana', 'Banana']] as const) {
    expect((await send('/api/foods', foodInputSchema.parse({ id: ids[key], expected_revision: 0, name, kind: 'food', source: 'Etiqueta', nutrients: { kcal: 50 }, portions: [] }))).status).toBe(200);
  }
  const group = await send('/api/nutrition/exchanges', { id: randomUUID(), expected_revision: 0, name: 'Frutas', reference: 'Porciones revisadas', reviewed: true, items: [
    { food_id: ids.manzana, food_revision: 1, grams: 120 }, { food_id: ids.pera, food_revision: 1, grams: 150 }, { food_id: ids.banana, food_revision: 1, grams: 100 }] });
  expect(group.status).toBe(200);
  const component = { id: randomUUID(), kind: 'food', food_id: ids.manzana, food_revision: 1, quantity: 240, measure: null, public_note: '' };
  const planId = randomUUID();
  const saved = await send(`/api/patients/${patient}/plans`, { id: planId, period_start: '2026-10-19', period_end: '2026-10-25', items: [{ for_date: '2026-10-19', slot: 'Desayuno', components: [component] }] });
  expect(saved.status).toBe(200);
  const current = (await saved.json()).plan.current;
  expect((await send(`/api/plans/${planId}/publish`, { expected_version: current.version, expected_snapshot: planReviewSnapshot(current) })).status).toBe(200);
  const published = (await (await app.request(`/api/patients/${patient}/plans`)).json()).plan;
  return { ids, itemId: published.items[0].id as string, componentId: component.id };
}

beforeEach(async () => { resetStore(); resetFoodsMemory(); resetNutritionCapabilities(); resetPlanAlternatives(); await declareKnownHealth(patient); });

describe('alternativas del plan que elige la paciente', () => {
  it('ofrece las del mismo grupo con la cantidad equivalente y guarda la elección', async () => {
    const { ids, itemId, componentId } = await fixture();
    const view = await alternatives();
    expect(view.status).toBe('ok');
    expect(view.slots).toHaveLength(1);
    expect(view.slots[0].options.map(o => [o.name, o.quantity, o.unit])).toEqual([['Pera', 300, 'g'], ['Banana', 200, 'g']]);

    const chosen = await send(`/api/patients/${patient}/plan-alternatives`, { item_id: itemId, component_id: componentId, food_id: ids.pera }, 'PUT');
    expect(chosen.status).toBe(200);
    expect((await chosen.json() as PlanAlternativesView).choices).toMatchObject([{ food_id: ids.pera, name: 'Pera', quantity: 300 }]);
    expect((await alternatives()).choices).toHaveLength(1);

    const back = await send(`/api/patients/${patient}/plan-alternatives`, { item_id: itemId, component_id: componentId, food_id: null }, 'PUT');
    expect((await back.json() as PlanAlternativesView).choices).toEqual([]);
  });

  it('no ofrece un alimento declarado como alergia y suelta la elección si después se declara', async () => {
    const { ids, itemId, componentId } = await fixture();
    await send(`/api/patients/${patient}/plan-alternatives`, { item_id: itemId, component_id: componentId, food_id: ids.pera }, 'PUT');
    await declareKnownHealth(patient, { state: 'reported', items: ['pera'] });
    const view = await alternatives();
    expect(view.slots[0].options.map(o => o.name)).toEqual(['Banana']);
    expect(view.choices).toEqual([]);
    expect((await send(`/api/patients/${patient}/plan-alternatives`, { item_id: itemId, component_id: componentId, food_id: ids.pera }, 'PUT')).status).toBe(409);
  });

  it('rechaza una alternativa que no es del grupo, un pedido inválido y a la nutri', async () => {
    const { itemId, componentId } = await fixture();
    expect((await send(`/api/patients/${patient}/plan-alternatives`, { item_id: itemId, component_id: componentId, food_id: randomUUID() }, 'PUT')).status).toBe(409);
    expect((await send(`/api/patients/${patient}/plan-alternatives`, { item_id: 'no', component_id: componentId, food_id: null }, 'PUT')).status).toBe(400);
    expect((await send(`/api/patients/${patient}/plan-alternatives?audience=pro`, { item_id: itemId, component_id: componentId, food_id: null }, 'PUT')).status).toBe(403);
  });
});
