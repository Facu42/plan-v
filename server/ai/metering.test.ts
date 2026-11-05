import { generateText } from 'ai';
import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CareError } from '../care/errors.js';
import { createPaidOpenRouterFetch, getAiModel, OPENROUTER_BASE_URL } from './provider.js';
import {
  adminUsageView, allowanceFor, FEATURE_CREDITS, levelFor, nutritionistUsageView, resetMeteringMemory, withAiAction,
} from './metering.js';
import {
  clearModelSetting, refreshModelSettings, resetModelSettingsMemory, saveModelSetting, validateModelSetting,
} from './model-settings.js';
import { registerAiUsageRoutes } from './usage-routes.js';
import { registerAiAdminRoutes } from '../admin/ai-admin-routes.js';

const NUTRI = '11111111-1111-4111-8111-111111111111';
const LUNA = { model: 'openai/gpt-5.6-luna', input_usd_per_mtok: 0.2, output_usd_per_mtok: 1.2 };

function completion(promptTokens: number, completionTokens: number) {
  return new Response(JSON.stringify({
    id: 'gen-1', object: 'chat.completion', created: 1, model: LUNA.model,
    choices: [{ index: 0, message: { role: 'assistant', content: 'OK' }, finish_reason: 'stop' }],
    usage: { prompt_tokens: promptTokens, completion_tokens: completionTokens, total_tokens: promptTokens + completionTokens },
  }), { status: 200, headers: { 'content-type': 'application/json' } });
}

beforeEach(() => {
  resetMeteringMemory();
  resetModelSettingsMemory();
  vi.stubEnv('OPENROUTER_API_KEY', 'test-only');
  vi.stubEnv('AI_MODE', 'live');
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('elección de modelo por función', () => {
  it('acepta un modelo con precio y uno gratuito sin precio', () => {
    expect(validateModelSetting(LUNA)).toEqual(LUNA);
    expect(validateModelSetting({ model: 'openrouter/free', input_usd_per_mtok: 0, output_usd_per_mtok: 0 }).model).toBe('openrouter/free');
  });

  it('rechaza ids raros, precios fuera de rango y mezclas gratis/pago', () => {
    for (const bad of [
      { ...LUNA, model: 'No Es Un Id' },
      { ...LUNA, input_usd_per_mtok: -1 },
      { ...LUNA, output_usd_per_mtok: 101 },
      { ...LUNA, input_usd_per_mtok: Number.NaN },
      { model: 'openai/gpt-5.6-luna', input_usd_per_mtok: 0, output_usd_per_mtok: 0 },
      { model: 'meta/llama:free', input_usd_per_mtok: 1, output_usd_per_mtok: 1 },
    ]) expect(() => validateModelSetting(bad)).toThrow(CareError);
  });
});

describe('candado del modelo pago', () => {
  it('solo deja salir el modelo elegido y fija el precio máximo y la privacidad', async () => {
    const send = vi.fn(async () => completion(1, 1));
    const paidFetch = createPaidOpenRouterFetch(LUNA, send as unknown as typeof fetch);
    const body = { model: LUNA.model, messages: [], provider: { max_price: { prompt: 999 } } };
    await paidFetch(`${OPENROUTER_BASE_URL}/chat/completions`, { method: 'POST', body: JSON.stringify(body) });
    const sent = JSON.parse((send.mock.calls[0] as unknown as [string, { body: string }])[1].body);
    expect(sent.provider).toEqual({ max_price: { prompt: 0.2, completion: 1.2 }, require_parameters: true, data_collection: 'deny' });
  });

  it('rechaza otro modelo, complementos y otras direcciones', async () => {
    const send = vi.fn(async () => completion(1, 1));
    const paidFetch = createPaidOpenRouterFetch(LUNA, send as unknown as typeof fetch);
    const call = (extra: object, url = `${OPENROUTER_BASE_URL}/chat/completions`) =>
      paidFetch(url, { method: 'POST', body: JSON.stringify({ model: LUNA.model, ...extra }) });
    await expect(call({ model: 'anthropic/otro' })).rejects.toThrow();
    await expect(call({ plugins: [{ id: 'web' }] })).rejects.toThrow();
    await expect(call({ route: 'fallback' })).rejects.toThrow();
    await expect(call({}, 'https://example.com/chat/completions')).rejects.toThrow();
    expect(send).not.toHaveBeenCalled();
  });
});

describe('medidor de uso', () => {
  it('mide tokens y costo de un modelo pago y suma los créditos de la acción', async () => {
    await saveModelSetting('recipe_draft', LUNA, 'admin@local');
    vi.stubGlobal('fetch', vi.fn(async () => completion(1000, 500)));
    await withAiAction({ nutritionistId: NUTRI, feature: 'recipe_draft' }, async () => {
      await generateText({ model: getAiModel('recipe_draft'), prompt: 'hola' });
      await generateText({ model: getAiModel('recipe_draft'), prompt: 'hola de nuevo' });
    });
    const admin = await adminUsageView();
    expect(admin.nutris).toHaveLength(1);
    const row = admin.nutris[0]!;
    expect(row).toMatchObject({ nutritionist_id: NUTRI, credits: FEATURE_CREDITS.recipe_draft, calls: 1 });
    // 2 respuestas × (1000 × 0,2 + 500 × 1,2) millonésimas de dólar
    expect(row.cost_usd_micros).toBe(2 * (1000 * 0.2 + 500 * 1.2));
    expect(admin.totals.cost_usd_micros).toBe(row.cost_usd_micros);
  });

  it('un modelo gratis queda medido con costo cero', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => completion(300, 100)));
    await withAiAction({ nutritionistId: NUTRI, feature: 'menu_draft' }, () => generateText({ model: getAiModel('menu_draft'), prompt: 'hola' }));
    const admin = await adminUsageView();
    expect(admin.nutris[0]).toMatchObject({ credits: FEATURE_CREDITS.menu_draft, cost_usd_micros: 0 });
  });

  it('si la acción falla, el costo se guarda pero no cuenta créditos', async () => {
    await saveModelSetting('recipe_draft', LUNA, 'admin@local');
    vi.stubGlobal('fetch', vi.fn(async () => completion(1000, 500)));
    await expect(withAiAction({ nutritionistId: NUTRI, feature: 'recipe_draft' }, async () => {
      await generateText({ model: getAiModel('recipe_draft'), prompt: 'hola' });
      throw new Error('receta vacía');
    })).rejects.toThrow('receta vacía');
    const row = (await adminUsageView()).nutris[0]!;
    expect(row.credits).toBe(0);
    expect(row.cost_usd_micros).toBe(1000 * 0.2 + 500 * 1.2);
  });

  it('sin llamadas al modelo (modo demo) no registra nada', async () => {
    await withAiAction({ nutritionistId: NUTRI, feature: 'menu_draft' }, async () => 'demo');
    expect((await adminUsageView()).totals.calls).toBe(0);
  });

  it('una llamada fuera de toda acción se guarda sin nutri', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => completion(10, 10)));
    await saveModelSetting('admin_assistant', LUNA, 'admin@local');
    await generateText({ model: getAiModel('admin_assistant'), prompt: 'hola' });
    const admin = await adminUsageView();
    expect(admin.nutris).toHaveLength(0);
    expect(admin.totals.unassigned_cost_usd_micros).toBe(10 * 0.2 + 10 * 1.2);
  });

  it('volver al modelo gratuito deja de usar el pago', async () => {
    await saveModelSetting('recipe_draft', LUNA, 'admin@local');
    await clearModelSetting('recipe_draft');
    await refreshModelSettings(true);
    const fetchMock = vi.fn(async () => completion(1, 1));
    vi.stubGlobal('fetch', fetchMock);
    await generateText({ model: getAiModel('recipe_draft'), prompt: 'hola' });
    const sent = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, { body: string }])[1].body);
    expect(sent.provider.max_price).toEqual({ prompt: 0, completion: 0, request: 0, image: 0 });
  });
});

describe('barra de uso de la nutri', () => {
  it('convierte los créditos del mes en porcentaje y nivel, sin mostrar cantidades', async () => {
    for (let i = 0; i < 100; i += 1) await withAiAction({ nutritionistId: NUTRI, feature: 'recipe_draft' }, async () => {
      vi.stubGlobal('fetch', vi.fn(async () => completion(1, 1)));
      await generateText({ model: getAiModel('recipe_draft'), prompt: 'x' });
    });
    const view = await nutritionistUsageView(NUTRI);
    expect(view.percent).toBe(25); // 100 créditos de 400 (plan base)
    expect(view.level).toBe('ok');
    expect(Object.keys(view).sort()).toEqual(['level', 'month', 'percent', 'renews_on']);
  });

  it('los niveles cambian a partir del 80% y del 100%', () => {
    expect([levelFor(0), levelFor(79), levelFor(80), levelFor(99), levelFor(100), levelFor(250)]).toEqual(['ok', 'ok', 'near', 'near', 'over', 'over']);
  });

  it('un plan desconocido usa el cupo del base y el Pro tiene más', () => {
    expect(allowanceFor(null)).toBe(allowanceFor('arranque'));
    expect(allowanceFor('pro')).toBeGreaterThan(allowanceFor('arranque'));
    expect(allowanceFor('consultorio')).toBeGreaterThan(allowanceFor('pro'));
  });

  it('el endpoint de la nutri no devuelve créditos ni modelos', async () => {
    const app = new Hono();
    app.use('*', async (c, next) => { c.set('auth' as never, {} as never); await next(); });
    registerAiUsageRoutes(app);
    const response = await app.request('/api/ai/uso');
    expect(response.status).toBe(200);
    const body = await response.json() as { usage: Record<string, unknown> };
    expect(Object.keys(body.usage).sort()).toEqual(['level', 'month', 'percent', 'renews_on']);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
});

describe('rutas del administrador', () => {
  function adminApp(allowed: boolean) {
    const app = new Hono();
    app.use('*', async (c, next) => { c.set('auth' as never, {} as never); await next(); });
    app.onError((error, c) => c.json({ error: error.message }, error instanceof CareError ? error.status : 500));
    registerAiAdminRoutes(app, async () => { if (!allowed) throw new CareError(403, 'No tenés permiso para esta acción.'); return false; });
    return app;
  }

  it('sin permiso de administrador no deja ver ni cambiar nada', async () => {
    const app = adminApp(false);
    expect((await app.request('/api/admin/ai/uso')).status).toBe(403);
    expect((await app.request('/api/admin/ai/modelos')).status).toBe(403);
    const put = await app.request('/api/admin/ai/modelos/recipe_draft', { method: 'PUT', body: JSON.stringify(LUNA) });
    expect(put.status).toBe(403);
  });

  it('guarda el modelo de una función y lo devuelve en el tablero', async () => {
    const app = adminApp(true);
    const put = await app.request('/api/admin/ai/modelos/recipe_draft', { method: 'PUT', body: JSON.stringify(LUNA) });
    expect(put.status).toBe(200);
    const board = await put.json() as { features: Array<{ feature: string; current: { model: string } | null }>; options: unknown[] };
    expect(board.features.find((row) => row.feature === 'recipe_draft')?.current?.model).toBe(LUNA.model);
    expect(board.features.find((row) => row.feature === 'menu_draft')?.current).toBeNull();
    expect(board.options.length).toBeGreaterThan(2);
  });

  it('rechaza funciones inexistentes, campos de más y precios inválidos', async () => {
    const app = adminApp(true);
    expect((await app.request('/api/admin/ai/modelos/inventada', { method: 'PUT', body: JSON.stringify(LUNA) })).status).toBe(404);
    expect((await app.request('/api/admin/ai/modelos/recipe_draft', { method: 'PUT', body: JSON.stringify({ ...LUNA, extra: 1 }) })).status).toBe(400);
    expect((await app.request('/api/admin/ai/modelos/recipe_draft', { method: 'PUT', body: JSON.stringify({ ...LUNA, input_usd_per_mtok: 500 }) })).status).toBe(400);
    expect((await app.request('/api/admin/ai/modelos/recipe_draft', { method: 'PUT', body: JSON.stringify({ model: 'openai/x', input_usd_per_mtok: 0, output_usd_per_mtok: 0 }) })).status).toBe(422);
  });
});
