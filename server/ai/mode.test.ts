import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveAiMode } from './mode.js';

afterEach(() => vi.unstubAllEnvs());
describe('IA con configuración persistente', () => {
  function production() {
    vi.stubEnv('APP_MODE', 'production');
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('AI_MODE', 'live');
    vi.stubEnv('OPENROUTER_API_KEY', 'synthetic-only');
    vi.stubEnv('SUPABASE_URL', 'https://synthetic.example.test');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'synthetic-only');
  }
  it('usa la clave pública que exige el validador de producción', () => {
    production(); vi.stubEnv('SUPABASE_ANON_KEY', 'synthetic-only');
    expect(resolveAiMode()).toBe('live');
  });
  it('acepta los aliases VITE ya admitidos por el runtime', () => {
    production(); vi.stubEnv('SUPABASE_URL', undefined); vi.stubEnv('SUPABASE_ANON_KEY', undefined);
    vi.stubEnv('VITE_SUPABASE_URL', 'https://synthetic.example.test'); vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'synthetic-only');
    expect(resolveAiMode()).toBe('live');
  });
  it('sigue cerrando cuando falta la clave pública', () => {
    production(); vi.stubEnv('SUPABASE_ANON_KEY', ''); vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    expect(() => resolveAiMode()).toThrow();
  });
});
