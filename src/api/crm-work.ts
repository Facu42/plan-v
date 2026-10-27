import { request } from './client';
import type { CrmWorkQuery, CrmWorkResponse } from '../types/crm-work';
import type { CrmFeedQuery, CrmFeedResponse } from '../types/crm-feed';
import type { PatientQuickPreview, PatientRowPreview } from '../types/patient-preview';
import type { PatientMealPage,PatientMealQuery } from '../types/patient-meals';

export type PatientTag = { id: string; label: string; tone: 'a' | 'n' };

export const crmWorkApi = {
  patientTags: (patientId: string, signal?: AbortSignal) => request<{ tags: PatientTag[] }>(`/api/crm/patients/${encodeURIComponent(patientId)}/tags`, { signal }),
  addPatientTag: (patientId: string, label: string, tone: 'a' | 'n' = 'n') => request<{ tags: PatientTag[] }>(`/api/crm/patients/${encodeURIComponent(patientId)}/tags`, { method: 'POST', body: JSON.stringify({ label, tone }) }),
  removePatientTag: (patientId: string, tagId: string) => request<{ tags: PatientTag[] }>(`/api/crm/patients/${encodeURIComponent(patientId)}/tags/${encodeURIComponent(tagId)}`, { method: 'DELETE' }),
  patientMeals:(patientId:string,query:PatientMealQuery={},signal?:AbortSignal)=>{const params=new URLSearchParams(Object.entries(query).filter(([,value])=>value!=null).map(([key,value])=>[key,String(value)]));return request<PatientMealPage>(`/api/crm/patients/${encodeURIComponent(patientId)}/meals${params.size?`?${params}`:''}`,{signal});},
  patientRows: (patientIds: string[], signal?: AbortSignal) => request<{ patients: PatientRowPreview[] }>('/api/crm/patients/directory-summary', { method: 'POST', body: JSON.stringify({ patient_ids: patientIds }), signal }),
  patientPreview: (patientId: string, signal?: AbortSignal) => request<PatientQuickPreview>(`/api/crm/patients/${encodeURIComponent(patientId)}/preview`, { signal }),
  list: (query: CrmWorkQuery = {}, signal?: AbortSignal) => {
    const params = new URLSearchParams();
    if (query.include_home) params.set('include_home', query.include_home);
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
