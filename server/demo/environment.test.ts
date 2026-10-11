import { describe, expect, it } from 'vitest';
// @ts-expect-error Módulo del lanzador de Node, sin declaración TypeScript.
import { demoConsultorioEnv } from '../../scripts/demo-consultorio-env.mjs';

describe('conexiones de la simulación local', () => {
  it('bloquea también credenciales que Vite podría cargar desde archivos .env', () => {
    const env = demoConsultorioEnv({}, 'local-copy');
    expect(env.VITE_SUPABASE_URL).toBe('');
    expect(env.VITE_SUPABASE_ANON_KEY).toBe('');
    expect(env.VITE_API_URL).toBe('');
  });
  it('neutraliza conexiones remotas heredadas, aunque el shell tenga credenciales de producción', () => {
    const base = { SUPABASE_URL: 'https://remote.invalid', SUPABASE_SERVICE_ROLE_KEY: 'synthetic',
      SUPABASE_ANON_KEY: 'synthetic', VITE_SUPABASE_URL: 'https://remote.invalid',
      VITE_SUPABASE_ANON_KEY: 'synthetic', VITE_API_URL: 'https://api.remote.invalid',
      APP_MODE: 'production', AI_MODE: 'live', WORKER_SEPARATE: '1', PATH: 'preserved' };
    const env = demoConsultorioEnv(base, 'local-copy');
    expect(base.APP_MODE).toBe('production');
    for (const key of Object.keys(base).filter(key => key.includes('SUPABASE'))) expect(env[key]).toBe('');
    expect(env).toMatchObject({ APP_MODE: 'demo', AI_MODE: 'demo', WORKER_SEPARATE: '0',
      VITE_API_URL: '', VITE_API_PROXY: 'http://127.0.0.1:5607', DEMO_STATE_FILE: 'local-copy', PATH: 'preserved' });
  });
});
