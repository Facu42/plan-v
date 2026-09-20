import { readRuntimeConfig } from '../config/runtime.js';

const SERVER_SECRET_NAMES = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
  'PROVISION_SECRET',
  'ALERT_WEBHOOK_URL',
  'DISPOSABLE_DATABASE_URL',
] as const;

export const PUBLIC_ENV_NAMES = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_ALLOW_DEMO',
] as const;

export function assertSecretBoundary(env: Record<string, string | undefined> = process.env) {
  for (const [key, value] of Object.entries(env)) {
    if (!value) continue;
    if (!key.startsWith('VITE_')) continue;
    if (/SERVICE_ROLE|SECRET|PASSWORD|PRIVATE_KEY/i.test(key)) {
      throw new Error(`Refusing to expose a server secret via ${key}`);
    }
  }
}

export function inspectSecrets(env: Record<string, string | undefined> = process.env) {
  try {
    assertSecretBoundary(env);
  } catch {
    return { ok: false as const, leaked: true as const, missing: [] as string[] };
  }

  const missing: string[] = [];
  try {
    readRuntimeConfig(env);
  } catch {
    missing.push('runtime');
  }

  const persistent = env.APP_MODE === 'staging' || env.APP_MODE === 'production';
  if (persistent) {
    if (!env.CORS_ORIGINS?.trim()) missing.push('CORS_ORIGINS');
    if (!env.PROVISION_SECRET?.trim()) missing.push('PROVISION_SECRET');
  }

  return { ok: missing.length === 0, leaked: false as const, missing };
}

export function secretNamesPresent(env: Record<string, string | undefined> = process.env) {
  return SERVER_SECRET_NAMES.filter((name) => Boolean(env[name]?.trim()));
}

export function publicNamesPresent(env: Record<string, string | undefined> = process.env) {
  return PUBLIC_ENV_NAMES.filter((name) => Boolean(env[name]?.trim()));
}
