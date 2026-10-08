import { beforeEach, expect, it, vi } from 'vitest';
import { listFoods } from './repository.js';

const mock = vi.hoisted(() => ({ range: vi.fn(), select: vi.fn() }));
vi.mock('../db/supabase-client.js', () => ({ getRequestDb: () => ({ from: () => ({ select: mock.select }) }) }));
beforeEach(() => {
  mock.range.mockReset();
  mock.select.mockReset().mockReturnValue({ order: () => ({ range: mock.range }) });
});
const row = (id: string) => ({ id, owner_id: 'owner', revision: 1, updated_at: '2026-10-07T00:00:00Z', payload: { name: 'Avena', kind: 'food', source: 'Prueba', nutrients: { kcal: 380 }, portions: [] } });

it('recupera todas las páginas aunque el servidor limite cada respuesta', async () => {
  mock.range.mockResolvedValueOnce({ data: [row('a0000000-0000-4000-8000-000000000001')], count: 2, error: null });
  mock.range.mockResolvedValueOnce({ data: [row('a0000000-0000-4000-8000-000000000002')], count: 2, error: null });
  expect(await listFoods('owner', true)).toHaveLength(2);
  expect(mock.select).toHaveBeenCalledWith('id,owner_id,revision,payload,updated_at', { count: 'exact' });
  expect(mock.range).toHaveBeenNthCalledWith(2, 1, 1000);
});

it('rechaza una respuesta incompleta o un catálogo que cambió durante la lectura', async () => {
  mock.range.mockResolvedValueOnce({ data: [], count: 1, error: null });
  await expect(listFoods('owner', true)).rejects.toThrow('No pudimos cargar el catálogo completo. Reintentá.');
  mock.range.mockResolvedValueOnce({ data: [row('a0000000-0000-4000-8000-000000000001')], count: 2, error: null });
  mock.range.mockResolvedValueOnce({ data: [], count: 1, error: null });
  await expect(listFoods('owner', true)).rejects.toThrow('El catálogo cambió mientras se cargaba. Reintentá.');
});
