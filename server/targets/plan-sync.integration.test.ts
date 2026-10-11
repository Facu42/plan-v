import { beforeEach, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { app } from '../index.js';
import { resetStore } from '../store.js';
import { resetTargetMemory } from './repository.js';
import { declareKnownHealth } from '../test/declare-health.js';
import { defaultsForGoal } from '../../src/lib/nutrition-target.js';
import { planReviewSnapshot } from '../../src/types/plans.js';

const patient = 'pat-sofia';
const inputs = { sex: 'femenino', age: 30, weight_kg: 65, height_cm: 165, activity: 'ligera', ...defaultsForGoal('mantener') };
const post = (path: string, body: unknown) => app.request(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const read = async () => (await (await app.request(`/api/patients/${patient}/plans?audience=pro`)).json()).plan;
const confirm = async (publish = true, weight = 65) => {
  const workspace = await (await app.request(`/api/patients/${patient}/nutrition-target?audience=pro`)).json();
  const response = await app.request(`/api/patients/${patient}/nutrition-target?audience=pro`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ inputs: { ...inputs, weight_kg: weight }, publish, expected_revision: workspace.revision }) });
  expect(response.status).toBe(200);
  return response.json();
};
async function fixture() {
  const id = randomUUID();
  const response = await post(`/api/patients/${patient}/plans`, { id, period_start: '2026-10-08', period_end: '2026-10-14', guidance: { recommendations: ['Comer con tranquilidad'], avoid: [] }, items: [{ for_date: '2026-10-08', slot: 'Almuerzo', free_text: 'Pollo con verduras', public_note: 'Preparación al horno' }] });
  expect(response.status).toBe(200);
  return id;
}
beforeEach(async () => { resetStore(); resetTargetMemory(); await declareKnownHealth(patient); });
it('confirmar una meta actualiza automáticamente el objetivo del borrador sin cambiar sus comidas', async () => {
  await fixture(); const before = await read();
  await confirm(false); expect(await read()).toEqual(before);
  const result = await confirm(); const after = await read();
  expect(after.current.version).toBe(before.current.version);
  expect(after.current.revision).not.toBe(before.current.revision);
  expect(after.current.nutrition_target).toMatchObject({ ...Object.fromEntries(['kcal', 'protein_g', 'carbs_g', 'fat_g'].map(key => [key, result.published.result[key]])), revision: result.published.updated_at, published_at: result.published.published_at });
  expect(after.current.items).toEqual(before.current.items);
  expect(after.current.guidance).toEqual(before.current.guidance);
});
it('confirmar con un plan publicado crea un borrador y conserva la copia publicada y sus indicaciones', async () => {
  const id = await fixture(); await confirm(); const first = await read();
  expect((await post(`/api/plans/${id}/publish`, { expected_version: first.current.version, expected_snapshot: planReviewSnapshot(first.current) })).status).toBe(200);
  const published = (await read()).published;
  await confirm(true, 72); const after = await read();
  expect(after.current.status).toBe('draft'); expect(after.current.version).toBe(published.version + 1);
  expect(after.current.nutrition_target.kcal).not.toBe(published.nutrition_target.kcal);
  expect(after.published).toEqual(published);
  expect(after.current.guidance).toEqual(published.guidance);
  expect(after.current.items.map((item: { free_text: string; public_note: string }) => [item.free_text, item.public_note])).toEqual(published.items.map((item: { free_text: string; public_note: string }) => [item.free_text, item.public_note]));
  const visible = (await (await app.request(`/api/patients/${patient}/plans`)).json()).plan;
  expect(visible.nutrition_target).toEqual(published.nutrition_target);
});
it('confirmar sin plan no inventa un menú vacío', async () => { await confirm(); expect(await read()).toBeNull(); });
it('un plan creado después de confirmar incorpora esa meta sin requerir otra confirmación', async () => {
  const target = await confirm(); await fixture();
  expect((await read()).current.nutrition_target).toMatchObject({ kcal: target.published.result.kcal, revision: target.published.updated_at });
});
