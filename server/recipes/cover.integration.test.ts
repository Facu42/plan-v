import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), generate: vi.fn(), enabled: vi.fn(), actor: vi.fn(), upload: vi.fn() }));
vi.mock('../ai/recipe-cover.js', () => ({ generateRecipeCoverImage: mocks.generate, recipeCoverEnabled: mocks.enabled }));
vi.mock('../db/supabase-client.js', () => ({
  isSupabaseEnabled: () => true,
  getRequestDb: () => ({ rpc: mocks.rpc, storage: { from: () => ({ upload: mocks.upload,
    getPublicUrl: (path: string) => ({ data: { publicUrl: `https://synthetic.supabase.co/storage/v1/object/public/recipe-covers/${path}` } }),
  }) } }),
}));
vi.mock('../db/supabase-repo.js', () => ({ sbGetActor: mocks.actor }));
import { registerRecipeRoutes } from './routes.js';
import { unavailableCard } from '../../src/types/recipe-plate.js';

const id = '30000000-0000-4000-a000-000000000001';
const vid = '40000000-0000-4000-a000-000000000001';
const nid = '50000000-0000-4000-a000-000000000001';
let stored: Record<string, unknown>;
let claimed: boolean;
const app = new Hono();
app.use('*', async (c, next) => { c.set('auth', { userId: 'synthetic-user' }); await next(); });
app.onError((error, c) => c.json({ error: error.message }, (error as { status?: 400 }).status ?? 500));
registerRecipeRoutes(app);
const post = (route: string, version = 1) => app.request(`/api/recipes/${id}/${route}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expected_version: version }),
});

beforeEach(() => {
  vi.resetAllMocks(); claimed = false;
  const version = { id: vid, version: 1, yield_portions: 1, steps: ['Cocinar el arroz.'], nutrient_source: '',
    ingredients: [{ id: 'ingredient', name: 'Arroz', quantity: 80, unit: 'g' }], published_at: null, card: unavailableCard('Arroz') };
  stored = { id, title: 'Arroz', status: 'draft', created_at: '2026-10-02', current: version, published: null };
  mocks.actor.mockResolvedValue({ role: 'nutri', nutritionistId: nid });
  mocks.enabled.mockReturnValue(true); mocks.generate.mockResolvedValue({ status: 'failed' }); mocks.upload.mockResolvedValue({ error: null });
  mocks.rpc.mockImplementation(async (name: string, args: Record<string, unknown>) => {
    if (name === 'list_professional_recipes') return { data: [structuredClone(stored)], error: null };
    if (name === 'publish_recipe') {
      const current = { ...(stored.current as object), published_at: '2026-10-02T10:00:00Z' };
      stored = { ...stored, status: 'published', current, published: structuredClone(current) };
      return { data: structuredClone(stored), error: null };
    }
    if (name === 'claim_recipe_cover') { if (claimed) return { data: null, error: null }; claimed = true; return { data: 'synthetic-claim', error: null }; }
    if (name === 'finish_recipe_cover') {
      const result = { cover_status: args.cover_status, cover_url: args.cover_url, cover_alt: args.cover_alt };
      for (const key of ['current', 'published']) {
        const ver = stored[key] as { card: object }; ver.card = { ...ver.card, ...result };
      }
      return { data: result, error: null };
    }
    throw new Error(`Unexpected RPC ${name}`);
  });
});

describe('Publicación y reintento de fotos sin llamadas externas', () => {
  it('una foto fallida no transforma la publicación confirmada en un error', async () => {
    const response = await post('publish'); expect(response.status).toBe(200);
    expect((await response.json()).recipe).toMatchObject({ status: 'published', published: { card: { cover_status: 'none', cover_url: null } } });
    expect(mocks.generate).not.toHaveBeenCalled();
    expect((await post('cover')).status).toBe(200);
    expect(stored.published).toMatchObject({card:{cover_status:'failed'}});
    expect(mocks.generate).toHaveBeenCalledTimes(1);
  });
  it('falla sin bloquear la publicación incluso ante una excepción de portada', async () => {
    mocks.generate.mockRejectedValueOnce(new Error('synthetic failure'));
    expect((await post('publish')).status).toBe(200);
    expect(stored.status).toBe('published');
  });
  it('publicar biblioteca no genera; dos solicitudes explícitas reservan una sola foto', async () => {
    const responses = await Promise.all([post('publish'), post('publish')]);
    expect(responses.map(r => r.status)).toEqual([200, 200]);
    expect(mocks.generate).not.toHaveBeenCalled();
    await Promise.all([post('cover'),post('cover')]);
    expect(mocks.generate).toHaveBeenCalledTimes(1);
  });
  it('un reintento guarda la imagen y conserva la revisión publicada', async () => {
    await post('publish'); claimed = false;
    mocks.generate.mockResolvedValueOnce({ status: 'ready', bytes: Buffer.from('test'), mime: 'image/png', alt: 'Arroz' });
    const response = await post('cover'); expect(response.status).toBe(200);
    expect((await response.json()).recipe).toMatchObject({ current: { version: 1, card: { cover_status: 'ready' } }, published: { version: 1, card: { cover_status: 'ready' } } });
    expect(mocks.rpc).toHaveBeenCalledWith('finish_recipe_cover', expect.objectContaining({ claim_token: 'synthetic-claim', cover_status: 'ready' }));
  });
  it('rechaza paciente, ajeno, versión cambiada, borrador y reserva ocupada antes del proveedor', async () => {
    expect((await post('cover')).status).toBe(409);
    mocks.actor.mockResolvedValueOnce({ role: 'paciente' }); expect((await post('cover')).status).toBe(403);
    await post('publish'); mocks.generate.mockClear();
    expect((await post('cover', 2)).status).toBe(409);
    claimed = true;
    expect((await post('cover')).status).toBe(409);
    mocks.rpc.mockResolvedValueOnce({ data: [], error: null }); expect((await post('cover')).status).toBe(403);
    expect(mocks.generate).not.toHaveBeenCalled();
  });
  it('sin proveedor de fotos no reserva, no genera y explica el límite', async () => {
    mocks.enabled.mockReturnValue(false);
    expect((await post('publish')).status).toBe(200);
    const response = await post('cover'); expect(response.status).toBe(503);
    expect((await response.json()).error).toContain('todavía no está habilitada');
    expect(mocks.generate).not.toHaveBeenCalled();
    expect(mocks.rpc.mock.calls.some(([name]) => name === 'claim_recipe_cover')).toBe(false);
  });
});
