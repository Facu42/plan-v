import { request } from './client';
import type { CrmWorkQuery, CrmWorkResponse } from '../types/crm-work';
import type { CrmFeedQuery, CrmFeedResponse } from '../types/crm-feed';

export const crmWorkApi = {
  list: (query: CrmWorkQuery = {}, signal?: AbortSignal) => {
    const params = new URLSearchParams();
    if (query.patient_id) params.set('patient_id', query.patient_id);
    if (query.kind) params.set('kind', query.kind);
    if (query.cursor) params.set('cursor', query.cursor);
    if (query.limit != null) params.set('limit', String(query.limit));
    return request<CrmWorkResponse>(`/api/crm/work-queue${params.size ? `?${params}` : ''}`, { signal });
  },
  feed: (query: CrmFeedQuery = {}, signal?: AbortSignal) => {
    const params = new URLSearchParams();
    if (query.days) params.set('days', String(query.days));
    if (query.status && query.status !== 'all') params.set('status', query.status);
    if (query.patient_id) params.set('patient_id', query.patient_id);
    return request<CrmFeedResponse>(`/api/crm/feed${params.size ? `?${params}` : ''}`, { signal });
  },
};
