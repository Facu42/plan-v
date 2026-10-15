import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ chat: vi.fn(), createOpenAI: vi.fn() }));
vi.mock('@ai-sdk/openai', () => ({ createOpenAI: mocks.createOpenAI }));

import { openRouterChatModel } from './openrouter.js';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('cliente de texto OpenRouter', () => {
  it('usa el endpoint compatible de chat y el modelo solicitado', () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'synthetic-only');
    mocks.createOpenAI.mockReturnValue({ chat: mocks.chat });

    const model = openRouterChatModel();

    expect(mocks.createOpenAI).toHaveBeenCalledWith({
      name: 'openrouter',
      apiKey: 'synthetic-only',
      baseURL: 'https://openrouter.ai/api/v1',
      headers: { 'X-Title': 'Plan V' },
    });
    expect(mocks.chat).toHaveBeenCalledWith('openai/gpt-4o-mini');
    expect(model).toBe(mocks.chat.mock.results[0].value);
  });

  it('no crea el proveedor cuando falta la clave', () => {
    vi.stubEnv('OPENROUTER_API_KEY', '');
    expect(() => openRouterChatModel()).toThrow('OpenRouter API key is not configured');
    expect(mocks.createOpenAI).not.toHaveBeenCalled();
  });
});
