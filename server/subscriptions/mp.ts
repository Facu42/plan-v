import { CareError } from '../care/errors.js';
import { accessToken } from '../scheduling/providers.js';
import { redactText, safePath } from '../ops/log.js';

export type MpErrorCause = { code: string | null; description: string | null };
export type MpErrorDetails = {
  status: number | null;
  message: string | null;
  error: string | null;
  cause: MpErrorCause[];
};

export class MpCallError extends Error {
  constructor(readonly httpStatus: number, readonly details: MpErrorDetails | null = null) {
    super('Mercado Pago no confirmó la operación.');
  }
}

const str = (value: unknown, max = 300) =>
  value == null || value === '' ? null : redactText(String(value)).slice(0, max);

export function parseMpErrorBody(raw: string): MpErrorDetails {
  let body: Record<string, unknown> | null = null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') body = parsed as Record<string, unknown>;
  } catch { /* not JSON */ }
  if (!body) return { status: null, message: str(raw), error: null, cause: [] };
  const causes = Array.isArray(body.cause) ? body.cause : body.cause && typeof body.cause === 'object' ? [body.cause] : [];
  return {
    status: typeof body.status === 'number' ? body.status : Number(body.status) || null,
    message: str(body.message),
    error: str(body.error),
    cause: causes.slice(0, 10).map((c) => {
      const item = (c ?? {}) as Record<string, unknown>;
      return { code: str(item.code, 60), description: str(item.description ?? item.message) };
    }),
  };
}

function logMpCallError(method: string, url: string, httpStatus: number, d: MpErrorDetails) {
  let path = url;
  try { path = new URL(url).pathname; } catch { /* keep */ }
  const q = (v: string | null) => JSON.stringify(v ?? '');
  const causes = d.cause.map((c) => `${c.code ?? '?'}:${c.description ?? ''}`).join(' | ');
  console.warn(
    `mp_call_error method=${method} path=${safePath(path)} http_status=${httpStatus} mp_status=${d.status ?? ''} ` +
    `message=${q(d.message)} error=${q(d.error)} cause=${q(causes)}`,
  );
}

type MpResult = Record<string, unknown>;

async function mpFetch(url: string, token: string, init: RequestInit = {}): Promise<MpResult> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new MpCallError(503);
  }
  if (!response.ok) {
    let raw = '';
    try { raw = await response.text(); } catch { /* ignore */ }
    const details = parseMpErrorBody(raw);
    logMpCallError((init.method ?? 'GET').toUpperCase(), url, response.status, details);
    const status = response.status === 404 ? 404 : response.status >= 500 ? 503 : response.status;
    throw new MpCallError(status, details);
  }
  try {
    return await response.json() as MpResult;
  } catch {
    throw new MpCallError(503);
  }
}

export async function nutriToken(nutritionistId: string): Promise<{ token: string; accountId: string }> {
  try {
    return await accessToken(nutritionistId, 'mercadopago', true);
  } catch (error) {
    if (error instanceof CareError) throw new MpCallError(error.status === 501 ? 401 : 503);
    throw new MpCallError(503);
  }
}

export const mercadoPago = {
  async createPreapproval(token: string, idempotencyKey: string, body: Record<string, unknown>) {
    return mpFetch('https://api.mercadopago.com/preapproval', token, {
      method: 'POST',
      headers: { 'X-Idempotency-Key': idempotencyKey },
      body: JSON.stringify(body),
    });
  },
  async updatePreapproval(token: string, id: string, body: Record<string, unknown>) {
    return mpFetch(`https://api.mercadopago.com/preapproval/${encodeURIComponent(id)}`, token, { method: 'PUT', body: JSON.stringify(body) });
  },
  async getPreapproval(token: string, id: string) {
    return mpFetch(`https://api.mercadopago.com/preapproval/${encodeURIComponent(id)}`, token);
  },
  async searchPreapproval(token: string, externalReference: string) {
    const query = new URLSearchParams({ external_reference: externalReference });
    const result = await mpFetch(`https://api.mercadopago.com/preapproval/search?${query}`, token);
    return Array.isArray(result.results) ? result.results as MpResult[] : [];
  },
  async getAuthorizedPayment(token: string, id: string) {
    return mpFetch(`https://api.mercadopago.com/authorized_payments/${encodeURIComponent(id)}`, token);
  },
  async searchAuthorizedPayments(token: string, preapprovalId: string): Promise<MpResult[] | null> {
    const query = new URLSearchParams({ preapproval_id: preapprovalId });
    try {
      const result = await mpFetch(`https://api.mercadopago.com/authorized_payments/search?${query}`, token);
      return Array.isArray(result.results) ? result.results as MpResult[] : [];
    } catch (error) {
      if (error instanceof MpCallError && error.httpStatus === 404) return null;
      throw error;
    }
  },
  async getPayment(token: string, id: string) {
    return mpFetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(id)}`, token);
  },
  async searchPayments(token: string, externalReference: string) {
    const query = new URLSearchParams({ external_reference: externalReference, limit: '50' });
    const result = await mpFetch(`https://api.mercadopago.com/v1/payments/search?${query}`, token);
    return Array.isArray(result.results) ? result.results as MpResult[] : [];
  },
};
