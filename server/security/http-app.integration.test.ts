import { afterEach, describe, expect, it, vi } from 'vitest';
import { app } from '../index.js';
import { resetRateLimits } from '../ops/rate-limit.js';

afterEach(() => { vi.unstubAllEnvs(); resetRateLimits(); });

describe('security on the real API', () => {
  it('includes security headers on an early origin rejection', async () => {
    const response = await app.request('/api/health', { headers: { Origin: 'https://unapproved.example' } });
    expect(response.status).toBe(403);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
  });

  it('includes no-store on early public rate-limit rejections', async () => {
    vi.stubEnv('RATE_LIMIT_ENABLED', '1');
    vi.stubEnv('RATE_LIMIT_OPS_MAX', '1');
    await app.request('/api/ops/probe');
    const response = await app.request('/api/ops/probe');
    expect(response.status).toBe(429);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('Retry-After')).toBeTruthy();
  });

  it('keeps the larger meal upload limit while bounding other API bodies', async () => {
    const body = 'x'.repeat(1024 * 1024 + 1);
    expect((await app.request('/api/patients', { method: 'POST', body })).status).toBe(413);
    expect((await app.request('/api/patients/synthetic/meals', { method: 'POST', body })).status).not.toBe(413);
    expect((await app.request('/api/patients/synthetic/meals', { method: 'POST', headers: { 'Content-Length': String(12 * 1024 * 1024 + 1) }, body: 'x' })).status).toBe(413);
  });

  it('limits the real AI job endpoint before parsing input or invoking a provider', async () => {
    vi.stubEnv('APP_MODE', 'demo');
    vi.stubEnv('AI_MODE', 'disabled');
    vi.stubEnv('RATE_LIMIT_ENABLED', '0');
    vi.stubEnv('SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    for (let i = 0; i < 10; i++) {
      expect((await app.request('/api/ai/jobs', { method: 'POST', body: '{}' })).status).toBe(400);
    }
    expect((await app.request('/api/ai/jobs', { method: 'POST', body: '{}' })).status).toBe(429);
  });
});
