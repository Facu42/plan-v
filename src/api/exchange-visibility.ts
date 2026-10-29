import { request } from './client';
import type { ExchangeVisibility, ExchangeVisibilityInput, PatientExchanges } from '../types/exchange-visibility';
export const exchangeVisibilityApi = {
  get: (signal?: AbortSignal) => request<ExchangeVisibility>('/api/nutrition/exchange-visibility', { signal }),
  save: (input: ExchangeVisibilityInput) => request<ExchangeVisibility>('/api/nutrition/exchange-visibility', { method: 'PUT', body: JSON.stringify(input) }),
  patient: (patientId: string, signal?: AbortSignal) => request<PatientExchanges>(`/api/patients/${encodeURIComponent(patientId)}/nutrition/exchanges`, { signal }),
};
