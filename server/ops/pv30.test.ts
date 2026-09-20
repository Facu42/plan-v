import { afterEach, describe, expect, it, vi } from 'vitest';
import { spawnSync } from 'node:child_process';
import { inspectSecrets, assertSecretBoundary, publicNamesPresent, secretNamesPresent } from './secrets.js';
import { redactText, safePath, writeOpsLog } from './log.js';
import { deliverOpsAlert, emitOpsAlert, recentOpsAlerts, resetOpsAlerts } from './alerts.js';
import { classifyRateLimitPath, consumeRateLimit, createRateLimitMiddleware, resetRateLimits } from './rate-limit.js';
import { resolveCorsOrigin } from './cors.js';
import { evaluateReadiness, maxBodyBytes, releaseSha, workerLabel } from './readiness.js';
import { Hono } from 'hono';
import { readFileSync } from 'node:fs';

const staging = {
  APP_MODE: 'staging',
  AI_MODE: 'disabled',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'anon',
  SUPABASE_SERVICE_ROLE_KEY: 'service',
  CORS_ORIGINS: 'https://planv.example',
  PROVISION_SECRET: 'ops-secret',
};

afterEach(() => {
  resetOpsAlerts();
  resetRateLimits();
  vi.unstubAllGlobals();
});

describe('secret boundary', () => {
  it('refuses a service role on a VITE_ key', () => {
    expect(() => assertSecretBoundary({ VITE_SUPABASE_SERVICE_ROLE_KEY: 'leak' })).toThrow(/VITE_SUPABASE_SERVICE_ROLE_KEY/);
    expect(inspectSecrets({ ...staging, VITE_OPENAI_SECRET: 'x' })).toMatchObject({ ok: false, leaked: true });
  });

  it('requires CORS and provision secret in staging without listing values', () => {
    const incomplete = inspectSecrets({
      APP_MODE: 'staging',
      AI_MODE: 'disabled',
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_ANON_KEY: 'anon',
      SUPABASE_SERVICE_ROLE_KEY: 'service',
    });
    expect(incomplete.ok).toBe(false);
    expect(incomplete.missing.sort()).toEqual(['CORS_ORIGINS', 'PROVISION_SECRET']);
    expect(inspectSecrets(staging).ok).toBe(true);
    expect(secretNamesPresent(staging)).toEqual(['SUPABASE_SERVICE_ROLE_KEY', 'PROVISION_SECRET']);
    expect(publicNamesPresent({ VITE_SUPABASE_URL: 'https://example.supabase.co' })).toEqual(['VITE_SUPABASE_URL']);
  });
});

describe('logs without PII', () => {
  it('redacts email, JWT, bearer, signed tokens and UUIDs', () => {
    const raw = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.aaa.bbb ana@example.com token=abc123 https://x.supabase.co/storage/v1/object/sign/a.jpg?token=zz patients/00000000-0000-4000-a000-0000000000a1';
    const redacted = redactText(raw);
    expect(redacted).not.toContain('ana@example.com');
    expect(redacted).not.toContain('eyJ');
    expect(redacted).not.toContain('abc123');
    expect(redacted).not.toContain('00000000-0000-4000-a000-0000000000a1');
    expect(safePath('/api/patients/00000000-0000-4000-a000-0000000000a1/meals')).toBe('/api/patients/[id-redacted]/meals');
  });

  it('does not print authorization or body fields', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    writeOpsLog('error', 'http_unhandled', {
      authorization: 'Bearer secret-token',
      body: { note: 'Nota clínica' },
      path: '/api/patients/11111111-1111-4111-a111-111111111111',
    });
    const line = String(error.mock.calls[0]?.[0]);
    expect(line).toContain('[redacted]');
    expect(line).not.toContain('secret-token');
    expect(line).not.toContain('Nota clínica');
    error.mockRestore();
  });
});

describe('ops alerts', () => {
  it('posts a PII-free payload only to https webhooks', async () => {
    const fetchMock = vi.fn(async () => new Response('ok', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const alert = emitOpsAlert({
      kind: 'http_5xx',
      path: '/api/patients/22222222-2222-4222-a222-222222222222',
      status: 500,
      detail: 'ana@example.com fallo',
    });
    expect(alert.path).toBe('/api/patients/[id-redacted]');
    expect(recentOpsAlerts()).toHaveLength(1);
    await deliverOpsAlert(alert, { ALERT_WEBHOOK_URL: 'https://alerts.example/hook' });
    expect(fetchMock).toHaveBeenCalledOnce();
    const posted = fetchMock.mock.calls[0] as unknown as [string, { body?: string }];
    const body = JSON.parse(String(posted[1]?.body));
    expect(body).toMatchObject({ source: 'plan-v', kind: 'http_5xx', status: 500 });
    expect(JSON.stringify(body)).not.toContain('ana@');
    expect(await deliverOpsAlert(alert, { ALERT_WEBHOOK_URL: 'http://insecure.example' })).toEqual({ delivered: false });
  });
});

describe('rate limits', () => {
  it('classifies recover and ops tighter than ordinary API', () => {
    expect(classifyRateLimitPath('/api/health')).toBe('public');
    expect(classifyRateLimitPath('/api/auth/recover')).toBe('auth');
    expect(classifyRateLimitPath('/api/ops/nutritionists')).toBe('ops');
    expect(classifyRateLimitPath('/api/patients')).toBe('api');
  });

  it('returns 429 with Retry-After when the auth bucket is exhausted', async () => {
    const app = new Hono();
    app.use('/api/*', createRateLimitMiddleware({ RATE_LIMIT_ENABLED: '1', RATE_LIMIT_AUTH_MAX: '2' }));
    app.post('/api/auth/recover', (c) => c.json({ ok: true }));
    app.get('/api/health', (c) => c.json({ ok: true }));
    expect((await app.request('/api/auth/recover', { method: 'POST' })).status).toBe(200);
    expect((await app.request('/api/auth/recover', { method: 'POST' })).status).toBe(200);
    const blocked = await app.request('/api/auth/recover', { method: 'POST' });
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('Retry-After')).toBeTruthy();
    expect((await blocked.json())).toEqual({ error: 'Demasiados intentos' });
    expect((await app.request('/api/health')).status).toBe(200);
    expect(consumeRateLimit('window', 1, 1_000, 0).ok).toBe(true);
    expect(consumeRateLimit('window', 1, 1_000, 0).ok).toBe(false);
    expect(consumeRateLimit('window', 1, 1_000, 1_001).ok).toBe(true);
  });
});

describe('cors and readiness', () => {
  it('allows any origin in demo and an allowlist in staging', () => {
    expect(resolveCorsOrigin('http://localhost:5173', { APP_MODE: 'demo' })).toBe('http://localhost:5173');
    expect(resolveCorsOrigin('https://evil.example', staging)).toBe('');
    expect(resolveCorsOrigin('https://planv.example', staging)).toBe('https://planv.example');
  });

  it('marks staging not ready without CORS and reports worker/sha without secrets', () => {
    expect(evaluateReadiness({ APP_MODE: 'test', AI_MODE: 'demo' }).status).toBe('ready');
    expect(evaluateReadiness({ APP_MODE: 'staging', AI_MODE: 'disabled' }).status).toBe('not_ready');
    expect(evaluateReadiness(staging).status).toBe('ready');
    expect(workerLabel({ WORKER_SEPARATE: '1' })).toBe('external');
    expect(releaseSha({ GIT_SHA: 'abc1234' })).toBe('abc1234');
    expect(maxBodyBytes('/api/patients/x/meals')).toBeGreaterThan(maxBodyBytes('/api/patients'));
  });
});

describe('deploy contract', () => {
  it('keeps the Vercel artifact as the Vite frontend, not the Node API', () => {
    const vercel = JSON.parse(readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8')) as {
      outputDirectory: string;
      rewrites?: unknown[];
    };
    expect(vercel.outputDirectory).toBe('dist');
    expect(JSON.stringify(vercel)).not.toMatch(/server\/index/);
    expect(vercel.rewrites ?? []).toEqual([]);
  });

  it('check:secrets refuses a leaked VITE_ service role and passes in test mode', () => {
    const ok = spawnSync('node', ['scripts/check-secrets.mjs'], {
      encoding: 'utf8',
      env: { ...process.env, APP_MODE: 'test', AI_MODE: 'demo' },
    });
    expect(ok.status).toBe(0);
    const leaked = spawnSync('node', ['scripts/check-secrets.mjs'], {
      encoding: 'utf8',
      env: { ...process.env, APP_MODE: 'test', VITE_SUPABASE_SERVICE_ROLE_KEY: 'nope' },
    });
    expect(leaked.status).not.toBe(0);
    expect(`${leaked.stderr}${leaked.stdout}`).toMatch(/VITE_SUPABASE_SERVICE_ROLE_KEY/);
    const staging = spawnSync('node', ['scripts/check-secrets.mjs'], {
      encoding: 'utf8',
      env: { PATH: process.env.PATH, APP_MODE: 'staging', AI_MODE: 'disabled' },
    });
    expect(staging.status).not.toBe(0);
    expect(`${staging.stderr}${staging.stdout}`).toMatch(/Incomplete staging/);
  });
});
