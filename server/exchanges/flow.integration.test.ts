import { beforeEach, expect, it } from 'vitest';
import { app } from '../index.js';
import { exchangeInputSchema } from '../../src/types/exchanges.js';
import { archiveExchange, listExchanges, resetExchangesMemory, saveExchange, seedSystemExchangesMemory } from './repository.js';

// Modo demostración: un solo consultorio ficticio. Un segundo propietario sólo existe en el repositorio.
const item = { food_id: null, name: 'Arroz cocido', measure: '1 taza', grams: 180 };
const list = (name = 'Cereales de prueba') => exchangeInputSchema.parse({ id: crypto.randomUUID(), kind: 'list', expected_revision: 0, name, justification: 'Hidratos similares', base: item, items: [{ ...item, name: 'Fideos cocidos', grams: 140 }] });
const post = (path: string, data: unknown) => app.request(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
beforeEach(() => resetExchangesMemory());

it('crea, lista, edita con revisión, duplica y archiva por la API en modo demostración', async () => {
  const input = list();
  const created = await post('/api/exchanges', input);
  expect(created.status).toBe(200);
  const { entry } = await created.json();
  expect(entry).toMatchObject({ id: input.id, kind: 'list', revision: 1, name: 'Cereales de prueba' });
  expect(entry.owner_id).not.toBeNull();
  // Recargar: lo guardado vuelve igual.
  const listed = await (await app.request('/api/exchanges')).json();
  expect(listed.entries).toHaveLength(1);
  expect(listed.entries[0]).toMatchObject({ id: input.id, revision: 1, justification: 'Hidratos similares' });
  // Edición con la revisión vigente; una revisión vieja se rechaza sin perder lo guardado.
  const edited = await post('/api/exchanges', { ...input, expected_revision: 1, name: 'Cereales editados' });
  expect((await edited.json()).entry).toMatchObject({ revision: 2, name: 'Cereales editados' });
  expect((await post('/api/exchanges', { ...input, expected_revision: 1, name: 'Vieja' })).status).toBe(409);
  // Duplicar es crear otra entrada con otro identificador; la original no cambia.
  const copy = { ...input, id: crypto.randomUUID(), expected_revision: 0, name: 'Cereales editados (copia)' };
  expect((await post('/api/exchanges', copy)).status).toBe(200);
  expect((await (await app.request('/api/exchanges')).json()).entries).toHaveLength(2);
  // Archivar exige la revisión y la retira del listado.
  expect((await post(`/api/exchanges/${input.id}/archive`, { expected_revision: 1 })).status).toBe(409);
  expect((await post(`/api/exchanges/${input.id}/archive`, { expected_revision: 2 })).status).toBe(200);
  expect((await (await app.request('/api/exchanges')).json()).entries.map((e: { id: string }) => e.id)).toEqual([copy.id]);
  expect((await post('/api/exchanges', { ...input, expected_revision: 3 })).status).toBe(409);
});
it('rechaza contenido inválido sin guardar nada', async () => {
  const bad = { ...list(), items: [] };
  expect((await post('/api/exchanges', bad)).status).toBe(400);
  expect((await post('/api/exchanges', { ...list(), base: { ...item, grams: 0 } })).status).toBe(400);
  expect((await (await app.request('/api/exchanges')).json()).entries).toEqual([]);
});
it('aísla consultorios: Sistema se comparte de sólo lectura y lo propio no cruza', async () => {
  const system = { ...list('Sistema'), id: crypto.randomUUID() };
  seedSystemExchangesMemory([system]);
  const a = list('Mía de A');
  await saveExchange('nutri-a', a, false);
  expect((await listExchanges('nutri-a', false)).map(e => e.name).sort()).toEqual(['Mía de A', 'Sistema']);
  expect((await listExchanges('nutri-b', false)).map(e => e.name)).toEqual(['Sistema']);
  await expect(saveExchange('nutri-b', { ...a, expected_revision: 1, name: 'Robada' }, false)).rejects.toMatchObject({ status: 403 });
  await expect(archiveExchange('nutri-b', a.id, 1, false)).rejects.toMatchObject({ status: 403 });
  await expect(saveExchange('nutri-a', { ...system, expected_revision: 1, name: 'Tocada' }, false)).rejects.toMatchObject({ status: 403 });
  await expect(archiveExchange('nutri-a', system.id, 1, false)).rejects.toMatchObject({ status: 403 });
  expect((await listExchanges('nutri-b', false)).find(e => e.id === system.id)?.name).toBe('Sistema');
});
