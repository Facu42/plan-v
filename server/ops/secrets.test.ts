import { describe, expect, it } from 'vitest';
import { assertSecretBoundary } from './secrets.js';

describe('public environment secret boundary', () => {
  it.each(['VITE_OPENROUTER_API_KEY', 'VITE_OPENAI_API_KEY'])('rejects %s', (name) => {
    expect(() => assertSecretBoundary({ [name]: 'synthetic-only' })).toThrow(name);
  });

  it('permits the public Supabase anonymous key', () => {
    expect(() => assertSecretBoundary({ VITE_SUPABASE_ANON_KEY: 'synthetic-only' })).not.toThrow();
  });
});
