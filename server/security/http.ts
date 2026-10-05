import type { Context, MiddlewareHandler } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import type { AuthContext } from '../middleware/auth.js';
import { clientAddress } from './client-address.js';

type Environment = Record<string, string | undefined>;
const LOCAL_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];
function localSignedAuthOrigin(env: Environment, url: URL): boolean {
  if(env.APP_MODE!=='staging'||env.PLANV_LOCAL_SIGNED_AUTH!=='1'||!['127.0.0.1','localhost','[::1]'].includes(url.hostname))return false;
  try {
    const supabase=new URL(env.SUPABASE_URL??''),database=new URL(env.PLANV_LOCAL_AUTH_DB_URL??'');
    return supabase.protocol==='http:'&&['postgres:','postgresql:'].includes(database.protocol)
      &&[supabase,database].every(value=>['127.0.0.1','localhost','[::1]'].includes(value.hostname));
  } catch {return false;}
}

export function readCorsOrigins(env: Environment, requireConfigured = false): string[] {
  const persistent = env.APP_MODE === 'production' || env.APP_MODE === 'staging';
  const configured = env.CORS_ALLOWED_ORIGINS?.trim();
  if (!configured) {
    if (persistent && requireConfigured) throw new Error('CORS_ALLOWED_ORIGINS is required');
    return persistent ? [] : [...LOCAL_ORIGINS];
  }
  return [...new Set(configured.split(',').map(value => {
    const origin = value.trim();
    const url = new URL(origin);
    if (url.origin !== origin || url.username || url.password || !['http:', 'https:'].includes(url.protocol)
      || (persistent && url.protocol !== 'https:' && !localSignedAuthOrigin(env,url))) {
      throw new Error('CORS_ALLOWED_ORIGINS must contain exact approved origins');
    }
    return origin;
  }))];
}

export function apiHeaders(): MiddlewareHandler {
  return async (c, next) => {
    c.header('Cache-Control', 'no-store');
    return secureHeaders({
      xFrameOptions: 'DENY',
      strictTransportSecurity: new URL(c.req.url).protocol === 'https:' ? 'max-age=31536000' : false,
      contentSecurityPolicy: { defaultSrc: ["'none'"], baseUri: ["'none'"], formAction: ["'none'"], frameAncestors: ["'none'"] },
    })(c, next);
  };
}

export function createOriginGuard(environment: () => Environment = () => process.env): MiddlewareHandler {
  return async (c, next) => {
    const origin = c.req.header('Origin');
    let allowed: string[];
    try { allowed = readCorsOrigins(environment()); }
    catch { return c.json({ error: 'Configuración de seguridad no disponible' }, 503); }
    if (origin && c.req.path === '/api/ops/nutritionists') return c.json({ error: 'Origen no autorizado' }, 403);
    if (origin && !allowed.includes(origin)) {
      c.header('Vary', 'Origin');
      return c.json({ error: 'Origen no autorizado' }, 403);
    }
    // Provisioning is a server/CLI operation, never an allowed browser header.
    return cors({
      origin: origin ?? '',
      allowMethods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      exposeHeaders: ['Retry-After', 'X-Request-Id', 'X-RateLimit-Remaining'],
      credentials: false,
      maxAge: 600,
    })(c, next);
  };
}

// Limit the bytes actually received, including requests without an honest length header.
export function createBodyGuard(maxBytes: number | ((c: Context) => number) = 7_100_000, options: { maxReservedBytes?: number } = {}): MiddlewareHandler {
  // Reserve the route maximum until its handler finishes: at most 64 MiB of
  // original body chunks can be live across requests, even with concurrent uploads.
  // Buffering rejects overflow before a handler can cause side effects.
  const capacity = options.maxReservedBytes ?? 64 * 1024 * 1024;
  let reserved = 0;
  return async (c, next) => {
    const request = c.req.raw;
    if (!request.body) return next();
    const limit = typeof maxBytes === 'function' ? maxBytes(c) : maxBytes;
    if (Number(request.headers.get('Content-Length')) > limit) return c.json({ error: 'El archivo es demasiado grande.' }, 413);
    if (reserved + limit > capacity) {
      c.header('Retry-After', '5');
      return c.json({ error: 'Hay varias cargas en curso. Volvé a intentar en unos segundos.' }, 503);
    }
    reserved += limit;
    try {
      const reader = request.body.getReader();
      const chunks: Uint8Array[] = [];
      let bytes = 0;
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          bytes += value.byteLength;
          if (bytes > limit) {
            await reader.cancel();
            return c.json({ error: 'El archivo es demasiado grande.' }, 413);
          }
          chunks.push(value);
        }
      } catch { return c.json({ error: 'Datos inválidos' }, 400); }
      // Reuse the same chunks; do not concatenate another full-body buffer here.
      const body = new ReadableStream<Uint8Array>({ start(controller) { chunks.forEach(chunk => controller.enqueue(chunk)); controller.close(); } });
      c.req.raw = new Request(request, { body, duplex: 'half' } as RequestInit);
      return await next();
    } finally { reserved -= limit; }
  };
}

function fixedWindow(limit: number, windowMs: number, maxKeys: number, clock: () => number) {
  const buckets = new Map<string, { count: number; expires: number }>();
  return (key: string): number => {
    const now = clock();
    let bucket = buckets.get(key);
    if (!bucket || bucket.expires <= now) {
      if (buckets.size >= maxKeys) {
        for (const [id, entry] of buckets) if (entry.expires <= now) buckets.delete(id);
        // Do not evict active limits: new identities must not reset somebody else's budget.
        if (!buckets.has(key) && buckets.size >= maxKeys) return Math.max(1, Math.ceil(windowMs / 1000));
      }
      bucket = { count: 0, expires: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count++;
    return bucket.count > limit ? Math.max(1, Math.ceil((bucket.expires - now) / 1000)) : 0;
  };
}

export function createRateLimits(options: {
  enabled?: () => boolean;
  clock?: () => number;
  clientAddress?: (c: Context) => string;
  sensitiveLimit?: number;
  aiLimit?: number;
  windowMs?: number;
  maxKeys?: number;
} = {}): { public: MiddlewareHandler; protected: MiddlewareHandler } {
  const enabled = options.enabled ?? (() => process.env.APP_MODE !== 'test');
  const clock = options.clock ?? Date.now;
  const address = options.clientAddress ?? clientAddress;
  const capacity = options.maxKeys ?? 10_000;
  const general = fixedWindow(300, 60_000, capacity, clock);
  const sensitive = fixedWindow(options.sensitiveLimit ?? 5, options.windowMs ?? 900_000, capacity, clock);
  const ai = fixedWindow(options.aiLimit ?? 10, options.windowMs ?? 60_000, capacity, clock);
  const reject = (c: Context, seconds: number) => {
    c.header('Retry-After', String(seconds));
    return c.json({ error: 'Demasiadas solicitudes. Esperá antes de volver a intentar.' }, 429);
  };
  return {
    public: async (c, next) => {
      if (!enabled() || c.req.method === 'OPTIONS') return next();
      const ip = address(c);
      const generalWait = general(ip);
      if (generalWait) return reject(c, generalWait);
      if (c.req.path === '/api/auth/recover' || c.req.path === '/api/ops/nutritionists') {
        const wait = sensitive(`${c.req.path}:${ip}`);
        if (wait) return reject(c, wait);
      }
      return next();
    },
    protected: async (c, next) => {
      if (!enabled() || c.req.method !== 'POST'
        || !/\/(copilot|meals\/analyze|ai\/jobs(?:\/[^/]+\/image)?|care\/replacements\/[^/]+\/generate)$/.test(c.req.path)) return next();
      const auth = c.get('auth') as AuthContext | undefined;
      const identity = auth && 'userId' in auth ? `user:${auth.userId}` : `ip:${address(c)}`;
      const wait = ai(identity);
      return wait ? reject(c, wait) : next();
    },
  };
}
