import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import {
  DEFAULT_OPENROUTER_MODEL,
  getAiModel,
  resolveAiProvider,
  createFreeOpenRouterFetch,
  OPENROUTER_BASE_URL,
} from './provider.js';
import { AIUnavailableError } from './errors.js';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('AI provider selection', () => {
  it('prefers OpenRouter when both provider keys are configured', () => {
    expect(resolveAiProvider({
      OPENROUTER_API_KEY: 'openrouter-test-only',
      OPENAI_API_KEY: 'openai-test-only',
    })).toEqual({
      provider: 'openrouter',
      apiKey: 'openrouter-test-only',
      model: DEFAULT_OPENROUTER_MODEL,
    });
  });

  it('uses the configured OpenRouter model without contacting the network', () => {
    expect(resolveAiProvider({
      OPENROUTER_API_KEY: 'openrouter-test-only',
      OPENROUTER_MODEL: 'qwen/qwen3.8-27b:free',
    })).toMatchObject({
      provider: 'openrouter',
      model: 'qwen/qwen3.8-27b:free',
    });
  });

  it('blocks direct OpenAI even with legacy paid configuration', () => {
    expect(resolveAiProvider({ AI_COST_MODE: 'paid', OPENAI_API_KEY: 'openai-test-only' })).toBeNull();
  });

  it('cannot enable a direct paid model through environment configuration', () => {
    expect(resolveAiProvider({
      OPENAI_API_KEY: 'openai-test-only',
      OPENAI_MODEL: 'gpt-4o',
      AI_COST_MODE: 'paid',
    })).toBeNull();
  });

  it('fails provider resolution closed when no key is configured', () => {
    expect(resolveAiProvider({})).toBeNull();
  });

  it('throws AIUnavailableError from getAiModel when no key is configured', () => {
    vi.stubEnv('OPENROUTER_API_KEY', '');
    vi.stubEnv('OPENAI_API_KEY', '');
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.OPENAI_API_KEY;
    expect(() => getAiModel()).toThrow(AIUnavailableError);
  });

  it('builds an OpenRouter chat model without networking', () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'openrouter-test-only');
    vi.stubEnv('OPENROUTER_MODEL', 'openrouter/free');
    vi.stubEnv('OPENAI_API_KEY', '');
    const model = getAiModel();
    expect(model).toBeTruthy();
    expect(model.modelId).toBe('openrouter/free');
  });

  it.each([undefined, 'free', 'paid', 'PAID', 'unknown'])('blocks paid overrides and direct OpenAI with cost mode %s', (costMode) => {
    expect(resolveAiProvider({ AI_COST_MODE: costMode, OPENAI_API_KEY: 'synthetic-only' })).toBeNull();
    expect(resolveAiProvider({ AI_COST_MODE: costMode, OPENROUTER_API_KEY: 'synthetic-only', OPENROUTER_MODEL: 'openai/gpt-4o-mini', OPENAI_API_KEY: 'synthetic-only' })).toBeNull();
  });

  it('blocks a paid OpenRouter override even with legacy paid opt-in', () => {
    expect(resolveAiProvider({ AI_COST_MODE: 'paid', OPENROUTER_API_KEY: 'synthetic-only', OPENROUTER_MODEL: 'openai/gpt-4o-mini' })).toBeNull();
  });
});

describe('free request boundary', () => {
  const url = `${OPENROUTER_BASE_URL}/chat/completions`;
  it('overwrites price preferences and preserves authorization and cancellation', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}'));
    const signal = new AbortController().signal;
    await createFreeOpenRouterFetch(fetchMock)(url, {
      method: 'POST', headers: { Authorization: 'Bearer synthetic-only' }, signal,
      body: JSON.stringify({ model: 'openrouter/free', messages: [], provider: { max_price: { prompt: 9 } } }),
    });
    const init = fetchMock.mock.calls[0][1];
    expect(init.signal).toBe(signal);
    expect(init.headers).toEqual({ Authorization: 'Bearer synthetic-only' });
    expect(init.redirect).toBe('error');
    expect(JSON.parse(init.body).provider).toEqual({ max_price: { prompt: 0, completion: 0, request: 0, image: 0 }, require_parameters: true });
  });

  it.each([
    { model: 'openai/gpt-4o-mini' },
    { model: 'openrouter/auto' },
    { model: 'openrouter/free', models: ['openai/gpt-4o-mini'] },
    { model: 'openrouter/free', plugins: [{ id: 'web' }] },
    { model: 'openrouter/free', tools: [{ type: 'web_search' }] },
    { model: 'openrouter/free', web_search_options: {} },
    { model: 'openrouter/free', preset: 'unexpected-preset' },
    { model: 'openrouter/free', route: 'fallback' },
    { model: 'openrouter/free', service_tier: 'priority' },
  ])('blocks billable routes/add-ons before networking: %j', async (body) => {
    const fetchMock = vi.fn();
    await expect(createFreeOpenRouterFetch(fetchMock)(url, { method: 'POST', body: JSON.stringify(body) })).rejects.toThrow(AIUnavailableError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends a structured SDK request with zero prices and parses its answer', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'synthetic-only');
    vi.stubEnv('OPENROUTER_MODEL', 'openrouter/free');
    vi.stubEnv('AI_COST_MODE', 'free');
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      id: 'synthetic', object: 'chat.completion', created: 1, model: 'qwen/qwen3.8-27b:free',
      choices: [{ index: 0, message: { role: 'assistant', content: '{"title":"Receta de prueba"}' }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 5, completion_tokens: 5, total_tokens: 10 },
    }), { headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    const result = await generateText({ model: getAiModel(), prompt: 'Datos ficticios', output: Output.object({ schema: z.object({ title: z.string() }) }), maxRetries: 0 });
    expect(result.output).toEqual({ title: 'Receta de prueba' });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.model).toBe('openrouter/free');
    expect(body.response_format.type).toBe('json_schema');
    expect(body.provider.max_price).toEqual({ prompt: 0, completion: 0, request: 0, image: 0 });
  });

  it('does not fall back to a paid provider after the free quota is exhausted', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'synthetic-only'); vi.stubEnv('OPENROUTER_MODEL', 'openrouter/free');
    vi.stubEnv('OPENAI_API_KEY', 'synthetic-only'); vi.stubEnv('AI_COST_MODE', 'free');
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"error":{"message":"Free quota exhausted"}}', { status: 429, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(generateText({ model: getAiModel(), prompt: 'Prueba', maxRetries: 0 })).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(url);
  });
});
