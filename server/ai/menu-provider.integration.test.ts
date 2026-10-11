import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateMenuDraft } from './menu-draft.js';
import { buildMenuJobContext } from './context.js';
import { emptyIntakePayload } from '../intake/payload.js';
import { AI_JOB_LEASE_MS, AI_JOB_TIMEOUT_MS } from '../../src/types/ai-jobs.js';

const proposal = { title: 'Arroz de prueba', yield_portions: 1, steps: ['Cocinar y servir.'],
  ingredients: [{ name: 'Arroz', quantity: 100, unit: 'g' as const }],
  nutrition: { origin: 'declared', source: 'Dato devuelto por el proveedor', per_portion: { kcal: 500, protein_g: 20, carbs_g: 60, fat_g: 20 } } };
const context = (slots = ['Almuerzo']) => buildMenuJobContext({
  intake: { ...emptyIntakePayload(), allergies: { state: 'none', items: [] }, restrictions: { state: 'none', items: [] } },
  periodStart: '2026-10-05', periodEnd: '2026-10-05', slots,
  catalog: [{ ...proposal, id: 'catalogo-ficticio', version: 1, nutrition: null }],
  confirmedTarget: { kcal: 1857, protein_g: 88, carbs_g: 237, fat_g: 62, revision: 1, published_at: '2026-10-05T12:00:00Z' },
});
const item = (slot = 'Almuerzo') => ({ for_date: '2026-10-05', slot, recipe_id: null, recipe_proposal: proposal, portions: 1, public_note: '' });
function reply(items: unknown[]) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
    id: 'ficticio', object: 'chat.completion', created: 1, model: 'synthetic/model:free',
    choices: [{ index: 0, message: { role: 'assistant', content: JSON.stringify({ items }) }, finish_reason: 'stop' }],
    usage: { prompt_tokens: 5, completion_tokens: 5, total_tokens: 10 },
  }), { headers: { 'content-type': 'application/json' } }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
beforeEach(() => { vi.stubEnv('APP_MODE', 'test'); vi.stubEnv('AI_MODE', 'live'); vi.stubEnv('OPENROUTER_API_KEY', 'synthetic-only'); vi.stubEnv('OPENROUTER_MODEL', 'openrouter/free'); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('menú con el SDK real y un transporte sintético sin red', () => {
  it('pide la cobertura exacta y procesa una receta estimada sin perder el techo gratuito', async () => {
    const transport = reply([item()]);
    const result = await generateMenuDraft(context());
    expect(result.plan.items[0].recipe_proposal?.nutrition).toMatchObject({ origin: 'ai_estimate', source: 'estimacion_ia.v2' });
    expect(result.nutrition.days[0]).toMatchObject({ status: 'adjusted', estimated: true, totals: { kcal: 1857 } });
    const body = JSON.parse(transport.mock.calls[0][1].body);
    expect(body.provider.max_price).toEqual({ prompt: 0, completion: 0, request: 0, image: 0 });
    const itemsSchema = body.response_format.json_schema.schema.properties.items;
    expect(itemsSchema).toMatchObject({ minItems: 1, maxItems: 1 });
    expect(itemsSchema.items.properties.for_date.enum ?? [itemsSchema.items.properties.for_date.const]).toEqual(['2026-10-05']);
    expect(itemsSchema.items.properties.slot.enum ?? [itemsSchema.items.properties.slot.const]).toEqual(['Almuerzo']);
    expect(itemsSchema.items.properties.recipe_id.anyOf[0].enum ?? [itemsSchema.items.properties.recipe_id.anyOf[0].const]).toEqual(['catalogo-ficticio']);
  });
  it('rechaza un menú duplicado aunque tenga la cantidad de ítems solicitada', async () => {
    reply([item(), item()]);
    const logger = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(generateMenuDraft(context(['Almuerzo', 'Cena']))).rejects.toMatchObject({ code: 'AI_UNAVAILABLE', reason: 'incomplete_menu' });
    expect(logger).toHaveBeenCalledWith('[ai:menu-draft] provider failed', { name: 'AIUnavailableError', code: 'AI_UNAVAILABLE', reason: 'incomplete_menu' });
  });
  it('una fecha fuera del pedido no pasa la validación del SDK ni se convierte en una propuesta', async () => {
    reply([{ ...item(), for_date: '2026-10-06' }]);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(generateMenuDraft(context())).rejects.toMatchObject({ code: 'AI_UNAVAILABLE' });
  });
  it('conserva margen de cierre dentro de la reserva para descartar resultados vencidos', () => {
    expect(AI_JOB_TIMEOUT_MS + 30_000).toBeLessThanOrEqual(AI_JOB_LEASE_MS);
  });
});
