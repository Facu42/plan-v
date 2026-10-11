import { beforeEach, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { app } from '../index.js';
import { resetStore } from '../store.js';
import { resetFoodsMemory, saveFood } from '../foods/repository.js';
import { declareKnownHealth } from '../test/declare-health.js';
import { foodInputSchema } from '../../src/types/foods.js';
import { componentInput, componentNutrients } from '../../src/types/plan-components.js';
import { planReviewSnapshot } from '../../src/types/plans.js';
import { analyzePlanDay } from '../../src/types/plan-day-analysis.js';
import { deriveShoppingFromPlan } from '../shopping/derive.js';

const post = (path: string, body: unknown) => app.request(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
beforeEach(async () => { resetStore(); resetFoodsMemory(); await declareKnownHealth('pat-sofia'); });
async function fixture() {
  const input = foodInputSchema.parse({ id: randomUUID(), expected_revision: 0, name: 'Avena', kind: 'food', source: 'Etiqueta', nutrients: { kcal: 380, protein: 10, carbs: 60, fat: 5 }, portions: [{ name: 'Cucharada', grams: 10 }] });
  const response = await post('/api/foods', input); expect(response.status).toBe(200);
  const { food } = await response.json();
  const component = { id: randomUUID(), kind: 'food', food_id: food.id, food_revision: 1, quantity: 2, measure: 'Cucharada', public_note: 'Medida revisada' };
  const plan = { id: randomUUID(), period_start: '2026-10-07', period_end: '2026-10-13', items: [{ for_date: '2026-10-07', slot: 'Desayuno', public_note: 'Nota general', components: [component] }] };
  return { input, food, component, plan };
}
it('conserva composición, cantidades y notas al editar catálogo, copiar y publicar', async () => {
  const { input, component, plan } = await fixture();
  const saved = await post('/api/patients/pat-sofia/plans', plan); expect(saved.status).toBe(200);
  const first = (await saved.json()).plan;
  expect(first.current.items[0].components[0].food_snapshot.revision).toBe(1);
  expect(first.current.nutrition.days[0].totals.kcal).toBe(76);
  expect((await post('/api/foods', { ...input, expected_revision: 1, name: 'Avena nueva', nutrients: { kcal: 900 } })).status).toBe(200);
  const copied = await post('/api/patients/pat-sofia/plans', { ...plan, expected_revision: first.current.revision, items: [...plan.items, { ...plan.items[0], for_date: '2026-10-08' }] }); expect(copied.status).toBe(200);
  const current = (await copied.json()).plan.current;
  expect(current.items[1].components[0].food_snapshot.name).toBe('Avena');
  expect(componentNutrients(current.items[1].components[0])?.kcal).toBe(76);
  expect(current.items[0].public_note).toBe('Nota general');
  expect((await post(`/api/plans/${plan.id}/publish`, { expected_version: current.version, expected_snapshot: planReviewSnapshot(current) })).status).toBe(200);
  const visible = (await (await app.request('/api/patients/pat-sofia/plans')).json()).plan;
  expect(visible.items[0].components[0]).toEqual(current.items[0].components[0]);
  expect(deriveShoppingFromPlan(visible).items[0]).toMatchObject({ name: 'Avena', quantity: 40, unit: 'g', occurrences: 2 });
  expect(componentInput(current.items[0].components[0])).toEqual(component);
  const analysis = analyzePlanDay([{ portions: '', component: current.items[0].components[0] }]);
  expect(analysis.nutrients.find(n => n.key === 'fiber')?.total).toBeNull();
});
it('rechaza composición inventada, alimento ajeno, medida inexistente e identificaciones repetidas', async () => {
  const { component, plan } = await fixture();
  const submit = (components: unknown[]) => post('/api/patients/pat-sofia/plans', { ...plan, items: [{ ...plan.items[0], components }] });
  expect((await submit([{ ...component, food_snapshot: { nutrients: { kcal: 1 } } }])).status).toBe(400);
  expect((await submit([component, component])).status).toBe(400);
  expect((await submit([{ ...component, measure: 'Taza sin conversión' }])).status).toBe(400);
  const foreign = await saveFood('otro-profesional', foodInputSchema.parse({ id: randomUUID(), expected_revision: 0, name: 'Ajeno', kind: 'food', source: 'Etiqueta', nutrients: {}, portions: [] }), false);
  expect((await submit([{ ...component, food_id: foreign.id }])).status).toBe(409);
});
it('bloquea alergias dentro de los componentes aunque la comida use un texto genérico', async () => {
  const { plan } = await fixture();
  await declareKnownHealth('pat-sofia', { state: 'reported', items: ['avena'] });
  const saved = await post('/api/patients/pat-sofia/plans', plan); expect(saved.status).toBe(200);
  const current = (await saved.json()).plan.current;
  expect((await post(`/api/plans/${plan.id}/publish`, { expected_version: current.version, expected_snapshot: planReviewSnapshot(current) })).status).toBe(409);
  expect((await (await app.request('/api/patients/pat-sofia/plans')).json()).plan).toBeNull();
});
