import { CareError } from '../care/errors.js';
import { accessToken } from '../scheduling/providers.js';

export class MpCallError extends Error {
  constructor(readonly httpStatus: number) {
    super('Mercado Pago no confirmó la operación.');
  }
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
  if (response.status === 404) throw new MpCallError(404);
  if (!response.ok) throw new MpCallError(response.status >= 500 ? 503 : response.status);
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
