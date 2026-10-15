import { request } from './client';
import type { ExchangeEntry, ExchangeInput } from '../types/exchanges';
export const exchangeApi = {
  list: (signal?: AbortSignal) => request<{ entries: ExchangeEntry[]; source: string }>('/api/exchanges', { signal }),
  save: (input: ExchangeInput) => request<{ entry: ExchangeEntry; source: string }>('/api/exchanges', { method: 'POST', body: JSON.stringify(input) }),
  archive: (id: string, expectedRevision: number) => request<{ archived: { id: string; revision: number } }>(`/api/exchanges/${id}/archive`, { method: 'POST', body: JSON.stringify({ expected_revision: expectedRevision }) }),
};
