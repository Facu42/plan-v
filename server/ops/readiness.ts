import type { Context, Next } from 'hono';
import { inspectSecrets } from './secrets.js';

export function releaseSha(env: Record<string, string | undefined> = process.env) {
  return env.GIT_SHA
    || env.RAILWAY_GIT_COMMIT_SHA
    || env.VERCEL_GIT_COMMIT_SHA
    || env.GITHUB_SHA
    || null;
}

export function workerLabel(env: Record<string, string | undefined> = process.env) {
  if (env.VITEST === 'true') return 'test';
  if (env.WORKER_SEPARATE === '1') return 'external';
  return 'inline';
}

export function evaluateReadiness(
  env: Record<string, string | undefined> = process.env,
  jobs: { dead: number } = { dead: 0 },
) {
  const worker = workerLabel(env);
  const secrets = inspectSecrets(env);
  if (!secrets.ok) {
    return { status: 'not_ready' as const, worker, reasons: secrets.leaked ? ['secret_boundary'] : secrets.missing };
  }
  return { status: 'ready' as const, worker, reasons: [] as string[], jobsDead: jobs.dead };
}

export function maxBodyBytes(path: string) {
  if (path.includes('/assets') || path.includes('/documents')) {
    return 22 * 1024 * 1024;
  }
  if (path.includes('/meals') || path.includes('/care') || path.includes('/photos')) {
    return 12 * 1024 * 1024;
  }
  return 1 * 1024 * 1024;
}

export function createBodyLimitMiddleware() {
  return async function bodyLimitMiddleware(c: Context, next: Next) {
    const length = Number(c.req.header('content-length') || 0);
    if (Number.isFinite(length) && length > maxBodyBytes(c.req.path)) {
      return c.json({ error: 'Cuerpo demasiado grande' }, 413);
    }
    return next();
  };
}
