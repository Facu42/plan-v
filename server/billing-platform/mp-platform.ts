import { MpCallError, parseMpErrorBody } from '../subscriptions/mp.js';
import { safePath } from '../ops/log.js';
import { pesosFromCents } from './pricing.js';
import type { RemoteFact } from './state.js';

type MpResult = Record<string, unknown>;

function token(): string {
  const value = process.env.MP_PLATFORM_ACCESS_TOKEN?.trim();
  if (!value) throw new MpCallError(501);
  return value;
}

async function mpFetch(url: string, init: RequestInit = {}): Promise<MpResult> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new MpCallError(503);
  }
  if (!response.ok) {
    let raw = '';
    try { raw = await response.text(); } catch { /* ignore */ }
    const details = parseMpErrorBody(raw);
    let path = url;
    try { path = new URL(url).pathname; } catch { /* keep */ }
    console.warn(`mp_platform_error path=${safePath(path)} http_status=${response.status}`);
    throw new MpCallError(response.status === 404 ? 404 : response.status >= 500 ? 503 : response.status, details);
  }
  try {
    return await response.json() as MpResult;
  } catch {
    throw new MpCallError(503);
  }
}

export function preapprovalBody(input: { id: string; planName: string; payerEmail: string; amountCents: number; cycle: 'monthly' | 'annual'; backUrl: string; notificationUrl: string | null }) {
  const amount = pesosFromCents(input.amountCents);
  if (!Number.isFinite(amount)) throw new MpCallError(400);
  return {
    reason: `Nutridash · ${input.planName}`.slice(0, 120),
    external_reference: input.id,
    payer_email: input.payerEmail,
    back_url: input.backUrl,
    status: 'pending',
    auto_recurring: {
      frequency: input.cycle === 'annual' ? 12 : 1,
      frequency_type: 'months',
      transaction_amount: amount,
      currency_id: 'ARS',
    },
    ...(input.notificationUrl ? { notification_url: input.notificationUrl } : {}),
  };
}

export const platformMercadoPago = {
  async createPreapproval(body: Record<string, unknown>, idempotencyKey: string) {
    return mpFetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'X-Idempotency-Key': idempotencyKey },
    });
  },
  async updatePreapproval(id: string, body: Record<string, unknown>) {
    return mpFetch(`https://api.mercadopago.com/preapproval/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(body) });
  },
  async getPreapproval(id: string) {
    return mpFetch(`https://api.mercadopago.com/preapproval/${encodeURIComponent(id)}`);
  },
  async getPayment(id: string) {
    return mpFetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(id)}`);
  },
  async getAuthorizedPayment(id: string) {
    return mpFetch(`https://api.mercadopago.com/authorized_payments/${encodeURIComponent(id)}`);
  },
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? value as Record<string, unknown> : null;
}

function centsFromAmount(amount: unknown): number | null {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) return null;
  const cents = Math.round(amount * 100);
  return Number.isSafeInteger(cents) ? cents : null;
}

export function paymentFact(row: MpResult): RemoteFact | null {
  const id = row.id == null ? '' : String(row.id);
  const amountCents = centsFromAmount(row.transaction_amount);
  if (!id || amountCents == null) return null;
  return {
    kind: 'payment',
    id,
    status: String(row.status ?? ''),
    amountCents,
    paidAt: typeof row.date_approved === 'string' ? row.date_approved : null,
    statusDetail: typeof row.status_detail === 'string' ? row.status_detail.slice(0, 80) : null,
    externalReference: typeof row.external_reference === 'string' ? row.external_reference : null,
  };
}

export function minimalRaw(row: MpResult) {
  return {
    id: row.id ?? null,
    status: row.status ?? null,
    status_detail: row.status_detail ?? null,
    transaction_amount: row.transaction_amount ?? null,
    date_approved: row.date_approved ?? null,
    external_reference: row.external_reference ?? null,
  };
}

/** Vuelve a leer Mercado Pago. El cuerpo del aviso no se usa como verdad. */
export async function loadRemote(topic: string, dataId: string): Promise<RemoteFact | null> {
  if (topic === 'subscription_preapproval' || topic === 'preapproval') {
    const row = await platformMercadoPago.getPreapproval(dataId);
    return { kind: 'preapproval', id: String(row.id ?? dataId), status: String(row.status ?? '') };
  }
  if (topic === 'subscription_authorized_payment') {
    const authorized = await platformMercadoPago.getAuthorizedPayment(dataId);
    const payment = asRecord(authorized.payment);
    const paymentId = payment?.id == null ? '' : String(payment.id);
    if (!paymentId) return null;
    return paymentFact(await platformMercadoPago.getPayment(paymentId));
  }
  return paymentFact(await platformMercadoPago.getPayment(dataId));
}
