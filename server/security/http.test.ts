import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';
import { apiHeaders, createBodyGuard, createOriginGuard, createRateLimits, readCorsOrigins } from './http.js';

describe('HTTP security', () => {
  it('bounds concurrent buffered uploads and releases capacity after completion or overflow', async () => {
    const app = new Hono();
    app.use('/api/*', createBodyGuard(8, { maxReservedBytes: 8 }));
    let entered!: () => void;
    let release!: () => void;
    const started = new Promise<void>(resolve => { entered = resolve; });
    const held = new Promise<void>(resolve => { release = resolve; });
    let calls = 0;
    app.post('/api/write', async c => {
      calls++;
      const text = await c.req.text();
      if (calls === 1) { entered(); await held; }
      return c.text(text);
    });
    const first = app.request('/api/write', { method: 'POST', body: 'first' });
    await started;
    const busy = await app.request('/api/write', { method: 'POST', body: 'second' });
    expect(busy.status).toBe(503);
    expect(busy.headers.get('Retry-After')).toBe('5');
    expect(calls).toBe(1);
    release();
    expect(await (await first).text()).toBe('first');
    expect((await app.request('/api/write', { method: 'POST', body: 'overflow!' })).status).toBe(413);
    expect(await (await app.request('/api/write', { method: 'POST', body: 'retry' })).text()).toBe('retry');
    expect(calls).toBe(2);
  });

  it('requires explicit HTTPS origins for a persistent deployment', () => {
    expect(() => readCorsOrigins({ APP_MODE: 'production' }, true)).toThrow('CORS_ALLOWED_ORIGINS');
    for (const origin of ['*', 'null', 'https://app.example/path', 'https://user:pass@app.example', 'http://app.example']) {
      expect(() => readCorsOrigins({ APP_MODE: 'production', CORS_ALLOWED_ORIGINS: origin })).toThrow();
    }
    expect(readCorsOrigins({ APP_MODE: 'production', CORS_ALLOWED_ORIGINS: 'https://app.example' })).toEqual(['https://app.example']);
  });

  it('permite HTTP sólo en la pila firmada descartable y mantiene HTTPS obligatorio en producción',async()=>{
    const temporary={APP_MODE:'staging',PLANV_LOCAL_SIGNED_AUTH:'1',SUPABASE_URL:'http://127.0.0.1:55441',PLANV_LOCAL_AUTH_DB_URL:'postgres://postgres@127.0.0.1:55442/postgres',CORS_ALLOWED_ORIGINS:'http://127.0.0.1:5596'};
    expect(readCorsOrigins(temporary,true)).toEqual(['http://127.0.0.1:5596']);
    for(const invalid of [{APP_MODE:'production'},{PLANV_LOCAL_SIGNED_AUTH:'0'},{SUPABASE_URL:'https://project.supabase.co'},{PLANV_LOCAL_AUTH_DB_URL:'postgres://postgres@remote.example/db'},{CORS_ALLOWED_ORIGINS:'http://app.example'}]) {
      expect(()=>readCorsOrigins({...temporary,...invalid},true)).toThrow();
    }
    const app=new Hono();app.use('/api/*',createOriginGuard(()=>temporary));app.get('/api/check',c=>c.json({ok:true}));
    expect((await app.request('/api/check',{headers:{Origin:'http://127.0.0.1:5596'}})).status).toBe(200);
    expect((await app.request('/api/check',{headers:{Origin:'http://attacker.example'}})).status).toBe(403);
  });

  it('rejects an unapproved origin before the route executes, including preflights', async () => {
    const route = vi.fn();
    const app = new Hono();
    app.use('/api/*', apiHeaders());
    app.use('/api/*', createOriginGuard(() => ({ APP_MODE: 'test' })));
    app.post('/api/write', c => { route(); return c.json({ ok: true }); });
    for (const method of ['POST', 'OPTIONS']) {
      const response = await app.request('/api/write', { method, headers: { Origin: 'https://attacker.example' } });
      expect(response.status).toBe(403);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('Cache-Control')).toBe('no-store');
    }
    expect(route).not.toHaveBeenCalled();
  });

  it('allows approved local preflights and same-origin requests without wildcard access', async () => {
    const app = new Hono();
    app.use('/api/*', createOriginGuard(() => ({ APP_MODE: 'demo', CORS_ALLOWED_ORIGINS: 'http://localhost:5173,https://app.example' })));
    app.get('/api/check', c => c.json({ ok: true }));
    const preflight = await app.request('/api/check', { method: 'OPTIONS', headers: { Origin: 'http://localhost:5173', 'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'Authorization,X-Request-Id' } });
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173');
    expect(preflight.headers.get('Access-Control-Allow-Headers')).not.toContain('X-PlanV-Provision');
    expect(preflight.headers.get('Access-Control-Allow-Headers')).toContain('X-Request-Id');
    expect((await app.request('/api/check')).status).toBe(200);
    expect((await app.request('https://app.example/api/check', { headers: { Origin: 'https://app.example' } })).status).toBe(200);
    expect((await app.request('/api/check', { headers: { Origin: 'null' } })).status).toBe(403);
    expect((await app.request('https://attacker.example/api/check', { headers: { Origin: 'https://attacker.example' } })).status).toBe(403);
  });

  it('applies safe API headers even to failed requests', async () => {
    const app = new Hono();
    app.use('/api/*', apiHeaders());
    app.get('/api/check', c => c.json({ error: 'No autorizado' }, 401));
    const response = await app.request('https://api.example/api/check');
    expect(response.headers.get('Content-Security-Policy')).toContain("default-src 'none'");
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    expect(response.headers.get('Referrer-Policy')).toBe('no-referrer');
    expect(response.headers.get('Strict-Transport-Security')).toContain('max-age=');
    expect((await app.request('/api/check')).headers.get('Strict-Transport-Security')).toBeNull();
  });

  it('limits recovery attempts before the handler and does not trust forwarded IP headers', async () => {
    let now = 1000;
    const route = vi.fn();
    const limits = createRateLimits({ enabled: () => true, clock: () => now, clientAddress: () => '192.0.2.1', sensitiveLimit: 2, windowMs: 60_000 });
    const app = new Hono();
    app.use('/api/*', limits.public);
    app.post('/api/auth/recover', c => { route(); return c.json({ ok: true }); });
    for (let attempt = 0; attempt < 2; attempt++) {
      expect((await app.request('/api/auth/recover', { method: 'POST' })).status).toBe(200);
    }
    const blocked = await app.request('/api/auth/recover', { method: 'POST', headers: { 'X-Forwarded-For': '192.0.2.2' } });
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('Retry-After')).toBe('60');
    expect(route).toHaveBeenCalledTimes(2);
    now += 60_000;
    expect((await app.request('/api/auth/recover', { method: 'POST' })).status).toBe(200);
  });

  it('shares the generation budget per verified user across routes and addresses', async () => {
    const limits = createRateLimits({ enabled: () => true, aiLimit: 1, clientAddress: c => c.req.header('Test-Address') ?? 'unknown' });
    const app = new Hono();
    app.use('/api/*', async (c, next) => { c.set('auth', { userId: 'verified-user' }); await next(); });
    app.use('/api/*', limits.protected);
    app.post('/api/patients/:id/copilot', c => c.json({ ok: true }));
    app.post('/api/ai/jobs', c => c.json({ ok: true }));
    expect((await app.request('/api/patients/a/copilot', { method: 'POST' })).status).toBe(200);
    expect((await app.request('/api/ai/jobs', { method: 'POST', headers: { 'Test-Address': 'another-ip' } })).status).toBe(429);
  });

  it('fails closed when the rate-limit key capacity is exhausted', async () => {
    const limits = createRateLimits({ enabled: () => true, maxKeys: 1, clientAddress: c => c.req.header('Test-Address') ?? 'first' });
    const app = new Hono();
    app.use('/api/*', limits.public);
    app.get('/api/check', c => c.json({ ok: true }));
    expect((await app.request('/api/check')).status).toBe(200);
    expect((await app.request('/api/check', { headers: { 'Test-Address': 'second' } })).status).toBe(429);
  });

  it('rejects oversized bodies even with a misleading Content-Length', async () => {
    const handler = vi.fn();
    const app = new Hono();
    app.use('/api/*', createBodyGuard(8));
    app.post('/api/write', async c => { handler(); return c.text(await c.req.text()); });
    for (const headers of [new Headers(), new Headers({ 'Content-Length': '1' })]) {
      expect((await app.request('/api/write', { method: 'POST', headers, body: '0123456789' })).status).toBe(413);
    }
    expect(handler).not.toHaveBeenCalled();
    const accepted = await app.request('/api/write', { method: 'POST', body: 'small' });
    expect(await accepted.text()).toBe('small');
  });

  it('blocks browser-originated professional provisioning even from an approved origin', async () => {
    const app = new Hono();
    app.use('/api/*', createOriginGuard(() => ({ APP_MODE: 'demo' })));
    app.post('/api/ops/nutritionists', c => c.json({ ok: true }));
    expect((await app.request('/api/ops/nutritionists', { method: 'POST', headers: { Origin: 'http://localhost:5173' } })).status).toBe(403);
  });

  it('counts streamed chunks, cancels overflow, and preserves an accepted stream', async () => {
    const app = new Hono();
    const handler = vi.fn();
    const cancelled = vi.fn();
    app.use('/api/*', createBodyGuard(8));
    app.post('/api/write', async c => { handler(); return c.text(await c.req.text()); });
    const stream = (chunks: string[], cancel = vi.fn()) => new ReadableStream({
      pull(controller) {
        const next = chunks.shift();
        if (next === undefined) controller.close();
        else controller.enqueue(new TextEncoder().encode(next));
      }, cancel,
    });
    const oversized = new Request('http://localhost/api/write', { method: 'POST', body: stream(['1234', '5678', '9', 'unread'], cancelled), duplex: 'half' } as RequestInit);
    expect((await app.request(oversized)).status).toBe(413);
    expect(cancelled).toHaveBeenCalledOnce();
    expect(handler).not.toHaveBeenCalled();
    const small = new Request('http://localhost/api/write', { method: 'POST', body: stream(['12', '34']), duplex: 'half' } as RequestInit);
    expect(await (await app.request(small)).text()).toBe('1234');
  });
});
