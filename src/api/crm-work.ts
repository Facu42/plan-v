import { request } from './client';
import type { CrmWorkQuery, CrmWorkResponse } from '../types/crm-work';

export const crmWorkApi = {
  list: (query: CrmWorkQuery = {}, signal?: AbortSignal) => {
    const params = new URLSearchParams();
    if (query.patient_id) params.set('patient_id', query.patient_id);
    if (query.kind) params.set('kind', query.kind);
    if (query.cursor) params.set('cursor', query.cursor);
    if (query.limit != null) params.set('limit', String(query.limit));
    return request<CrmWorkResponse>(`/api/crm/work-queue${params.size ? `?${params}` : ''}`, { signal });
  },
};
