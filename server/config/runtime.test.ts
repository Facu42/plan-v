import { describe, expect, it } from 'vitest';
import { readRuntimeConfig } from './runtime.js';

const db = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'synthetic-key',
  SUPABASE_ANON_KEY: 'synthetic-anon',
};

describe('runtime modes', () => {
  it('requires an explicit application mode', () => {
    expect(() => readRuntimeConfig({})).toThrow('APP_MODE');
  });
  it('does not allow demo in a production process', () => {
    expect(() => readRuntimeConfig({ APP_MODE: 'demo', NODE_ENV: 'production' })).toThrow();
  });
  it('rejects incomplete production database settings', () => {
    expect(() => readRuntimeConfig({ APP_MODE: 'production', AI_MODE: 'disabled' })).toThrow('Supabase');
  });
  it('rejects production without an anon key for JWT-bound queries', () => {
    expect(() => readRuntimeConfig({
      APP_MODE: 'production',
      AI_MODE: 'disabled',
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'synthetic-key',
    })).toThrow('Supabase');
  });
  it('supports local synthetic demo without provider keys', () => {
    expect(readRuntimeConfig({ APP_MODE: 'demo', AI_MODE: 'demo' })).toEqual({ mode: 'demo', dataMode: 'memory', aiMode: 'demo' });
  });
  it('rejects simulated AI with persistent patient data', () => {
    expect(() => readRuntimeConfig({ ...db, APP_MODE: 'staging', AI_MODE: 'demo' })).toThrow();
  });
  it('allows manual operation with AI disabled', () => {
    expect(readRuntimeConfig({ ...db, APP_MODE: 'production', AI_MODE: 'disabled' }).aiMode).toBe('disabled');
  });
  it('allows live AI with an OpenRouter key', () => {
    expect(readRuntimeConfig({
      ...db,
      APP_MODE: 'staging',
      AI_MODE: 'live',
      OPENROUTER_API_KEY: 'test-only',
    }).aiMode).toBe('live');
  });
  it('rejects live AI without either provider key', () => {
    expect(() => readRuntimeConfig({
      ...db,
      APP_MODE: 'staging',
      AI_MODE: 'live',
    })).toThrow('AI provider');
  });
});
