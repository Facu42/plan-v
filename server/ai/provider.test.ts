import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_OPENAI_MODEL,
  DEFAULT_OPENROUTER_MODEL,
  getAiModel,
  resolveAiProvider,
} from './provider.js';
import { AIUnavailableError } from './errors.js';

afterEach(() => {
  vi.unstubAllEnvs();
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
      OPENROUTER_MODEL: 'anthropic/claude-3.5-sonnet',
    })).toMatchObject({
      provider: 'openrouter',
      model: 'anthropic/claude-3.5-sonnet',
    });
  });

  it('falls back to OpenAI when OpenRouter is not configured', () => {
    expect(resolveAiProvider({ OPENAI_API_KEY: 'openai-test-only' })).toMatchObject({
      provider: 'openai',
      model: DEFAULT_OPENAI_MODEL,
    });
  });

  it('honors OPENAI_MODEL when using the OpenAI provider', () => {
    expect(resolveAiProvider({
      OPENAI_API_KEY: 'openai-test-only',
      OPENAI_MODEL: 'gpt-4o',
    })).toMatchObject({
      provider: 'openai',
      model: 'gpt-4o',
    });
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
    vi.stubEnv('OPENROUTER_MODEL', 'openai/gpt-4o-mini');
    vi.stubEnv('OPENAI_API_KEY', '');
    const model = getAiModel();
    expect(model).toBeTruthy();
    expect(model.modelId).toBe('openai/gpt-4o-mini');
  });
});
