import { request } from './client';

export const HISTORY_TOPICS = ['motivo', 'diag', 'med', 'alerg', 'fam', 'halim', 'r24', 'hab', 'act', 'sue', 'dig', 'ciclo', 'emb', 'pref'] as const;
export type HistoryTopic = (typeof HISTORY_TOPICS)[number];
export type HistorySource = 'professional' | 'patient' | 'import' | 'recording' | 'form';
export type HistoryEntry = {
  id: string;
  topic: HistoryTopic;
  text: string;
  since: string;
  source: HistorySource;
  recorded_on: string;
  edited_on: string | null;
  ended_on: string | null;
  ended_reason: string;
};

const base = (patientId: string) => `/api/crm/patients/${encodeURIComponent(patientId)}/history`;
const send = (method: string, body?: unknown) => ({ method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });

export const patientHistoryApi = {
  list: (patientId: string, signal?: AbortSignal) => request<{ entries: HistoryEntry[] }>(base(patientId), { signal }),
  add: (patientId: string, input: { topic: HistoryTopic; text: string; since?: string }) => request<{ entries: HistoryEntry[] }>(base(patientId), send('POST', input)),
  edit: (patientId: string, entryId: string, input: { text: string; since?: string }) => request<{ entries: HistoryEntry[] }>(`${base(patientId)}/${encodeURIComponent(entryId)}`, send('PATCH', input)),
  end: (patientId: string, entryId: string, reason = '') => request<{ entries: HistoryEntry[] }>(`${base(patientId)}/${encodeURIComponent(entryId)}/end`, send('POST', { reason })),
};
