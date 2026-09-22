import { allowsSyntheticDemo } from '../config/runtime.js';

export function resolveCorsOrigin(origin: string, env: Record<string, string | undefined> = process.env) {
  if (allowsSyntheticDemo(env)) return origin || '*';
  const allowed = (env.CORS_ORIGINS ?? '').split(',').map((item) => item.trim()).filter(Boolean);
  if (!origin) return allowed[0] ?? '';
  return allowed.includes(origin) ? origin : '';
}
