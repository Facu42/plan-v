import { afterEach, describe, expect, it, vi } from 'vitest';
import { assertNoProviderKeys, CareError } from './repository.js';

afterEach(() => vi.unstubAllEnvs());

describe('organization RPC response secret guard', () => {
  it.each([
    ['OpenRouter key name', { OPENROUTER_API_KEY: 'synthetic-only' }],
    ['OpenRouter key format', { note: 'sk-or-v1-synthetic-only' }],
    ['OpenAI key name', { OPENAI_API_KEY: 'synthetic-only' }],
  ] as const)('rejects %s', (_label, response) => {
    expect(() => assertNoProviderKeys(response)).toThrow(CareError);
  });

  it('rejects the configured OpenRouter key even under an unrelated field name', () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'synthetic-openrouter-key');
    expect(() => assertNoProviderKeys({ note: 'synthetic-openrouter-key' })).toThrow(CareError);
  });

  it('accepts an ordinary organization response', () => {
    expect(() => assertNoProviderKeys({ id: 'org-1', name: 'Consultorio Sur' })).not.toThrow();
  });
});
