import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ requestRpc: vi.fn(), adminRpc: vi.fn() }));
vi.mock('../ai/recipe-cover.js', async importOriginal => ({ ...await importOriginal<typeof import('../ai/recipe-cover.js')>(), recipeCoverEnabled: () => true }));
vi.mock('../db/supabase-client.js', () => ({
  getRequestDb: () => ({ rpc: mocks.requestRpc }),
  getSupabaseAdmin: () => ({ rpc: mocks.adminRpc }),
}));
import { publishMealPlan, retryMealPlanCovers } from './repository.js';

const item = (extra: Record<string, unknown>) => ({ id: 'i1', for_date: '2026-10-06', slot: 'Almuerzo', portions: 1, public_note: '', free_text: null, ...extra });
const recipe = (ingredients: unknown) => ({ title: 'Ensalada', version: 1, yield_portions: 1, steps: ['Servir.'], nutrient_source: '', ingredients });
const row = (items: unknown[]) => {
  const version = { id: 'v1', version: 1, status: 'published', period_start: '2026-10-05', period_end: '2026-10-11', published_at: '2026-10-05T10:00:00Z', items };
  return { id: 'p1', patient_id: 'pat', timezone: 'America/Argentina/Buenos_Aires', created_at: '2026-10-05', current: version, published: version };
};
const ok = { id: 'x', ingredients: [{ id: 'a', name: 'Tomate', quantity: 1, unit: 'g' }] };

beforeEach(() => { vi.resetAllMocks(); vi.spyOn(console, 'error').mockImplementation(() => undefined); });

describe('publicación persistente: las fotos de ingredientes nunca cambian el resultado', () => {
  it('con el encolado caído devuelve el plan publicado', async () => {
    mocks.requestRpc.mockResolvedValue({ data: row([item({ recipe: recipe(ok.ingredients) })]), error: null });
    mocks.adminRpc.mockRejectedValue(new Error('caído'));
    const plan = await publishMealPlan('n', 'p1', 1, true, { any: 1 });
    expect(plan.published?.items).toHaveLength(1);
    expect(mocks.adminRpc).toHaveBeenCalledWith('enqueue_ingredient_covers', { keys: ['tomate'], retry_failed: false });
  });

  it('con un plan de forma rara (sin recetas, con ingredientes vacíos) devuelve el plan y no encola nada', async () => {
    mocks.requestRpc.mockResolvedValue({ data: row([item({}), item({ id: 'i2', recipe: recipe([]) }), item({ id: 'i3', recipe: { title: 'x', yield_portions: 1, ingredients: 'no-es-lista' } })]), error: null });
    const plan = await publishMealPlan('n', 'p1', 1, true, { any: 1 });
    expect(plan.published?.items).toHaveLength(3);
    expect(mocks.adminRpc).not.toHaveBeenCalled();
  });

  it('con un encolado colgado no espera más de un instante', async () => {
    mocks.requestRpc.mockResolvedValue({ data: row([item({ recipe: recipe(ok.ingredients) })]), error: null });
    mocks.adminRpc.mockImplementation(() => new Promise(() => undefined));
    vi.useFakeTimers();
    const pending = publishMealPlan('n', 'p1', 1, true, { any: 1 });
    await vi.advanceTimersByTimeAsync(2_000);
    expect((await pending).published?.items).toHaveLength(1);
    vi.useRealTimers();
  });

  it('«Preparar fotos pendientes» también devuelve el plan si el encolado falla', async () => {
    mocks.requestRpc.mockResolvedValue({ data: row([item({ recipe: recipe(ok.ingredients) })]), error: null });
    mocks.adminRpc.mockResolvedValue({ data: null, error: { code: '42883' } });
    const plan = await retryMealPlanCovers('n', 'p1', 1, true);
    expect(plan.published?.items).toHaveLength(1);
    expect(mocks.adminRpc).toHaveBeenCalledWith('enqueue_ingredient_covers', { keys: ['tomate'], retry_failed: true });
  });
});
