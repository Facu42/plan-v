import { beforeEach, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { app } from '../index.js';
import { resetFoodsMemory } from './repository.js';

const input = () => ({ id: randomUUID(), expected_revision: 0, name: 'Avena', brand: '', category: 'Cereales', kind: 'food', source: 'Etiqueta', reference: '', nutrients: { kcal: 380, fat: 0 }, portions: [{ name: 'Cucharada', grams: 10 }] });
const save = (data: unknown) => app.request('/api/foods', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
beforeEach(resetFoodsMemory);
it('crea, busca por nombre sin tildes y preserva fuente, medidas y datos desconocidos', async () => {
  const response = await save({ ...input(), name: 'Sémola' });
  expect(response.status).toBe(200);
  const { food } = await response.json();
  expect(food).toMatchObject({ revision: 1, nutrients: { fat: 0, protein: null }, source: 'Etiqueta' });
  const listed = await (await app.request('/api/foods?q=semola')).json();
  expect(listed.foods).toHaveLength(1);
  expect(listed.foods[0].portions[0].grams).toBe(10);
});
it('rechaza revisión desactualizada sin pisar datos y permite reintento idéntico de creación', async () => {
  const data = input();
  expect((await save(data)).status).toBe(200);
  expect((await save(data)).status).toBe(200);
  expect((await save({ ...data, name: 'Otra avena' })).status).toBe(409);
  expect((await save({ ...data, expected_revision: 1, name: 'Avena integral' })).status).toBe(200);
  expect((await save({ ...data, expected_revision: 1, name: 'Cambio viejo' })).status).toBe(409);
});
it('rechaza cuerpos inválidos, cantidades negativas y parámetros desconocidos', async () => {
  expect((await save({ ...input(), portions: [{ name: 'Taza', grams: -20 }] })).status).toBe(400);
  expect((await app.request('/api/foods?kind=invalid')).status).toBe(400);
  expect((await app.request('/api/foods', { method: 'POST', body: '{' })).status).toBe(400);
});
