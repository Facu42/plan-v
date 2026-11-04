import { request } from './client';
import type { CampaignBroadcast, CampaignConfig, CampaignContact, CampaignDraft, CampaignImport, ResendPage, TransactionalMail } from '../types/admin-campaigns';
const base = '/api/admin/campaigns';
const afterQuery = (after?: string) => after ? `?after=${encodeURIComponent(after)}` : '';
export const campaignApi = {
  config: () => request<CampaignConfig>(`${base}/config`),
  contacts: (after?: string) => request<ResendPage<CampaignContact>>(`${base}/contacts${afterQuery(after)}`),
  addContact: (input: { email: string; first_name: string; last_name: string }) => request<{ id: string }>(`${base}/contacts`, { method: 'POST', body: JSON.stringify(input) }),
  importCsv: (csv: string) => request<CampaignImport>(`${base}/import`, { method: 'POST', body: JSON.stringify({ csv }) }),
  broadcasts: (after?: string) => request<ResendPage<CampaignBroadcast>>(`${base}/broadcasts${afterQuery(after)}`),
  createDraft: (input: CampaignDraft) => request<{ id: string }>(`${base}/broadcasts`, { method: 'POST', body: JSON.stringify(input) }),
  broadcast: (id: string) => request<CampaignBroadcast>(`${base}/broadcasts/${encodeURIComponent(id)}`),
  opened: (id: string) => request<{ opened: { count: number; has_more: boolean } | null }>(`${base}/broadcasts/${encodeURIComponent(id)}/opened`),
  send: (id: string) => request<{ id: string }>(`${base}/broadcasts/${encodeURIComponent(id)}/send`, { method: 'POST', body: JSON.stringify({ confirm: true }) }),
  emails: (after?: string) => request<ResendPage<TransactionalMail>>(`${base}/emails${afterQuery(after)}`),
  email: (id: string) => request<TransactionalMail>(`${base}/emails/${encodeURIComponent(id)}`),
};
