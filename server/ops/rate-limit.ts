import type { Context, Next } from 'hono';
import { clientAddress } from '../security/client-address.js';
import { emitOpsAlert } from './alerts.js';
import { safePath } from './log.js';

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function resetRateLimits() {
  buckets.clear();
}

export function rateLimitsEnabled(env: Record<string, string | undefined> = process.env) {
  if (env.RATE_LIMIT_ENABLED === '0') return false;
  if (env.RATE_LIMIT_ENABLED === '1') return true;
  return env.APP_MODE === 'staging' || env.APP_MODE === 'production';
}

export function classifyRateLimitPath(path: string) {
  if (path === '/api/health' || path === '/api/ready') return 'public' as const;
  if (path.startsWith('/api/auth/')) return 'auth' as const;
  if (path.startsWith('/api/ops/')) return 'ops' as const;
  return 'api' as const;
}

function limitFor(kind: ReturnType<typeof classifyRateLimitPath>, env: Record<string, string | undefined>) {
  if (kind === 'auth') return Number(env.RATE_LIMIT_AUTH_MAX) || 5;
  if (kind === 'ops') return Number(env.RATE_LIMIT_OPS_MAX) || 10;
  return Number(env.RATE_LIMIT_API_MAX) || 120;
}

export function consumeRateLimit(key: string, limit: number, windowMs = 60_000, now = Date.now()) {
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    if (buckets.size >= 10_000) {
      for (const [id, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(id);
      if (!buckets.has(key) && buckets.size >= 10_000) return { ok: false, remaining: 0, resetAt: now + windowMs };
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: Math.max(0, limit - 1), resetAt: now + windowMs };
  }
  current.count += 1;
  const ok = current.count <= limit;
  return { ok, remaining: Math.max(0, limit - current.count), resetAt: current.resetAt };
}

export function createRateLimitMiddleware(env: Record<string, string | undefined> = process.env) {
  return async function rateLimitMiddleware(c: Context, next: Next) {
    if (!rateLimitsEnabled(env)) return next();
    const kind = classifyRateLimitPath(c.req.path);
    if (kind === 'public') return next();
    const ip = clientAddress(c, env);
    const limit = limitFor(kind, env);
    const result = consumeRateLimit(`${ip}:${kind}`, limit);
    c.header('X-RateLimit-Remaining', String(result.remaining));
    if (!result.ok) {
      c.header('Retry-After', String(Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000))));
      emitOpsAlert({ kind: 'rate_limit', path: safePath(c.req.path), status: 429 });
      return c.json({ error: 'Demasiados intentos' }, 429);
    }
    return next();
  };
}
