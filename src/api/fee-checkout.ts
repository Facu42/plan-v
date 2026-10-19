import { request } from './client';

const json = (method: string, data: unknown) => ({ method, body: JSON.stringify(data) });

export type FeeLink = { id: string; status: string; init_point: string | null; due_on: string; amount: number; title: string; expires_at: string };
export type FeeOffer = { available: false; reason: 'debito' | 'sin_cuota' | 'al_dia' } | { available: true; due_on: string; amount: number; title: string };
export type PublicFeeResult = { found: false; message: string } | ({ found: true } & FeeLink);

export const feeCheckoutApi = {
  create: (input: { patient_id: string; due_on: string; client_request_id: string }) =>
    request<FeeLink>('/api/scheduling/fee-checkouts', json('POST', input)),
  offer: () => request<FeeOffer>('/api/patient/fee-checkout'),
  pay: (input: { client_request_id: string; due_on?: string }) =>
    request<FeeLink>('/api/patient/fee-checkout', json('POST', input)),
  publicEnabled: (slug: string, signal?: AbortSignal) =>
    request<{ enabled: boolean }>(`/api/public/scheduling/${encodeURIComponent(slug)}/cuota`, { signal }, ''),
  publicPay: (slug: string, input: { email: string; client_request_id: string }) =>
    request<PublicFeeResult>(`/api/public/scheduling/${encodeURIComponent(slug)}/cuota`, json('POST', input), ''),
};
