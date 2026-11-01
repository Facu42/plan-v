import { createHmac } from 'node:crypto';
import type { Notice } from './service.js';

const SANDBOX_ON = new Set(['1', 'true', 'on']);

export type PlatformTokenKind = 'missing' | 'test' | 'production' | 'other';

/** TEST- es sandbox. APP_USR- es cobro real. Cualquier otra cosa no se usa. */
export function platformMpTokenKind(token: string | undefined | null): PlatformTokenKind {
  const value = token?.trim() ?? '';
  if (!value) return 'missing';
  if (value.startsWith('TEST-')) return 'test';
  if (value.startsWith('APP_USR-')) return 'production';
  return 'other';
}

export function platformBillingSandboxForced(env: NodeJS.ProcessEnv = process.env): boolean {
  return SANDBOX_ON.has((env.PLATFORM_BILLING_SANDBOX ?? '').trim().toLowerCase());
}

/**
 * Fuera de producción, o con PLATFORM_BILLING_SANDBOX=1, solo vale un token TEST-.
 * Un token de producción nunca entra al modo sandbox.
 */
export function platformMpTokenAllowed(token: string, env: NodeJS.ProcessEnv = process.env): boolean {
  const kind = platformMpTokenKind(token);
  if (kind === 'test') return true;
  if (kind !== 'production') return false;
  const production = (env.APP_MODE ?? '').trim().toLowerCase() === 'production';
  return production && !platformBillingSandboxForced(env);
}

export function classifyPlatformMpEnv(env: NodeJS.ProcessEnv = process.env): {
  token: PlatformTokenKind;
  secret: 'missing' | 'present';
  billingEnabled: boolean;
  sandboxForced: boolean;
} {
  return {
    token: platformMpTokenKind(env.MP_PLATFORM_ACCESS_TOKEN),
    secret: env.MP_PLATFORM_WEBHOOK_SECRET?.trim() ? 'present' : 'missing',
    billingEnabled: SANDBOX_ON.has((env.PLATFORM_BILLING_ENABLED ?? '').trim().toLowerCase()),
    sandboxForced: platformBillingSandboxForced(env),
  };
}

export function normalizeBillingTopic(raw: string): string {
  const value = raw.trim().toLowerCase();
  if (!value) return 'payment';
  if (value.includes('authorized_payment')) return 'subscription_authorized_payment';
  if (value.includes('subscription_preapproval') || value === 'preapproval' || value.startsWith('preapproval.')) {
    return 'subscription_preapproval';
  }
  if (value.includes('payment')) return 'payment';
  return value;
}

export function parseBillingNotice(input: {
  query?: Record<string, string | undefined>;
  payload?: { type?: string; action?: string; data?: { id?: string } } | null;
  requestId: string;
  signature: string;
  now?: number;
}): Notice {
  const query = input.query ?? {};
  const payload = input.payload ?? {};
  return {
    dataId: String(payload.data?.id ?? query['data.id'] ?? query.id ?? ''),
    requestId: input.requestId,
    signature: input.signature,
    topic: normalizeBillingTopic(String(query.topic ?? query.type ?? payload.type ?? payload.action ?? 'payment')),
    now: input.now ?? Date.now(),
  };
}

/** Misma plantilla que `verifyMpSignature`: no imprime el secreto. */
export function signPlatformWebhook(id: string, requestId: string, secret: string, now = Date.now()): { ts: string; signature: string } {
  const ts = String(Math.floor(now / 1000));
  const mac = createHmac('sha256', secret).update(`id:${id.toLowerCase()};request-id:${requestId};ts:${ts};`).digest('hex');
  return { ts, signature: `ts=${ts},v1=${mac}` };
}
