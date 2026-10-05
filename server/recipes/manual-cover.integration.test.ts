import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProfessionalRecipe } from '../../src/types/recipes.js';

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), actor: vi.fn(), upload: vi.fn(), remove: vi.fn(), references: vi.fn() }));
vi.mock('../db/supabase-client.js', () => ({
  isSupabaseEnabled: () => true,
  getRequestDb: () => ({ rpc: mocks.rpc, storage: { from: () => ({ upload: mocks.upload,
    getPublicUrl: (path: string) => ({ data: { publicUrl: `https://synthetic.supabase.co/storage/v1/object/public/recipe-covers/${path}` } }),
  }) } }),
  privilegedDb: () => ({ from: () => ({ select: () => ({ eq: mocks.references }) }), storage: { from: () => ({ remove: mocks.remove }) } }),
}));
vi.mock('../db/supabase-repo.js', () => ({ sbGetActor: mocks.actor }));
import { registerRecipeRoutes } from './routes.js';
import { unavailableCard } from '../../src/types/recipe-plate.js';

const id = '30000000-0000-4000-a000-000000000011';
const vid = '40000000-0000-4000-a000-000000000011';
const nid = '50000000-0000-4000-a000-000000000011';
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3uoAAAAASUVORK5CYII=', 'base64');
const dataUrl = `data:image/png;base64,${PNG.toString('base64')}`;
let stored: ProfessionalRecipe;
const app = new Hono();
app.use('*', async (c, next) => { c.set('auth', { userId: 'synthetic-user' }); await next(); });
app.onError((error, c) => c.json({ error: error.message }, (error as { status?: 400 }).status ?? 500));
registerRecipeRoutes(app);
const post = (changes: Record<string, unknown> = {}) => app.request(`/api/recipes/${id}/cover/manual`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ expected_version: 1, expected_cover_url: null, data_url: dataUrl, ...changes }),
});

beforeEach(() => {
  vi.resetAllMocks();
  const version = { id: vid, version: 1, yield_portions: 1, steps: ['Cocinar el arroz.'], nutrient_source: '',
    ingredients: [{ id: 'ingredient', name: 'Arroz', quantity: 80, unit: 'g' as const }], published_at: '2026-10-03T10:00:00Z', card: unavailableCard('Arroz') };
  stored = { id, title: 'Arroz', status: 'published', created_at: '2026-10-03', current: version, published: structuredClone(version) };
  mocks.actor.mockResolvedValue({ role: 'nutri', nutritionistId: nid });
  mocks.upload.mockResolvedValue({ error: null }); mocks.remove.mockResolvedValue({ error: null });
  mocks.references.mockResolvedValue({ data: [], error: null });
  mocks.rpc.mockImplementation(async (name: string, args: Record<string, unknown>) => {
    if (name === 'list_professional_recipes') return { data: [structuredClone(stored)], error: null };
    if (name === 'save_manual_recipe_cover') {
      const cover = { cover_status: 'ready' as const, cover_url: String(args.cover_url), cover_alt: stored.title };
      stored.current.card = { ...stored.current.card!, ...cover };
      stored.published!.card = { ...stored.published!.card!, ...cover };
      return { data: cover, error: null };
    }
    throw new Error(`Unexpected RPC ${name}`);
  });
});

describe('foto manual de receta publicada', () => {
  it('guarda bytes inspeccionados en el bucket existente y la lectura posterior conserva la foto', async () => {
    const response = await post();
    expect(response.status).toBe(200);
    const result = await response.json() as { recipe: ProfessionalRecipe };
    expect(result.recipe.published!.card).toMatchObject({ cover_status: 'ready', cover_alt: 'Arroz' });
    expect(mocks.upload).toHaveBeenCalledWith(expect.stringMatching(new RegExp(`^${nid}/${vid}/[0-9a-f-]{36}\\.png$`)), PNG, { contentType: 'image/png', upsert: false });
    expect(mocks.rpc).toHaveBeenCalledWith('save_manual_recipe_cover', expect.objectContaining({ target_recipe: id, expected_version: 1, expected_cover_url: null }));
    const reload = await (await app.request('/api/recipes')).json() as { recipes: ProfessionalRecipe[] };
    expect(reload.recipes[0].published!.card!.cover_url).toBe(result.recipe.published!.card!.cover_url);
  });

  it('rechaza tipo falso, archivo incompleto y más de 5MB antes de guardar', async () => {
    expect((await post({ data_url: dataUrl.replace('image/png', 'image/jpeg') })).status).toBe(415);
    expect((await post({ data_url: 'data:image/png;base64,QUFBQQ==' })).status).toBe(400);
    const oversized = Buffer.alloc(5 * 1024 * 1024 + 1); PNG.copy(oversized);
    expect((await post({ data_url: `data:image/png;base64,${oversized.toString('base64')}` })).status).toBe(413);
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it('rechaza paciente, administrador, receta ajena, borrador y revisión cambiada', async () => {
    for (const role of ['paciente', 'admin']) {
      mocks.actor.mockResolvedValueOnce({ role }); expect((await post()).status).toBe(403);
    }
    mocks.rpc.mockResolvedValueOnce({ data: [], error: null }); expect((await post()).status).toBe(403);
    expect((await post({ expected_version: 2 })).status).toBe(409);
    stored.published = null; expect((await post()).status).toBe(409);
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it('un fallo de Storage conserva la portada previa y no escribe la fila', async () => {
    const old = 'https://synthetic.supabase.co/storage/v1/object/public/recipe-covers/old.png';
    stored.current.card = { ...stored.current.card!, cover_status: 'ready', cover_url: old };
    stored.published!.card = { ...stored.published!.card!, cover_status: 'ready', cover_url: old };
    mocks.upload.mockResolvedValueOnce({ error: { message: 'synthetic failure' } });
    expect((await post({ expected_cover_url: old })).status).toBe(503);
    expect(stored.published!.card!.cover_url).toBe(old);
    expect(mocks.rpc.mock.calls.some(([name]) => name === 'save_manual_recipe_cover')).toBe(false);
  });

  it('conflicto al persistir elimina sólo el candidato si no tiene referencias', async () => {
    mocks.rpc.mockImplementationOnce(async () => ({ data: [stored], error: null }));
    mocks.rpc.mockImplementationOnce(async () => ({ data: null, error: { code: 'PT409' } }));
    expect((await post()).status).toBe(409);
    const path = mocks.upload.mock.calls[0][0];
    expect(mocks.remove).toHaveBeenCalledWith([path]);
    expect(stored.published!.card!.cover_url).toBeNull();
  });

  it('respuesta RPC incierta se verifica y jamás elimina una foto ya referenciada', async () => {
    const usual = mocks.rpc.getMockImplementation()!;
    mocks.rpc.mockImplementation(async (name: string, args: Record<string, unknown>) => {
      const saved = await usual(name, args);
      if (name === 'save_manual_recipe_cover') {
        mocks.references.mockResolvedValueOnce({ data: [{ recipe_version_id: vid, status: 'ready' }], error: null });
        return { data: null, error: { code: '08006' } };
      }
      return saved;
    });
    expect((await post()).status).toBe(200);
    expect(mocks.remove).not.toHaveBeenCalled();
  });
});
