import { request } from './client';
import type { EditorialResource, FavoriteKind, PatientLibraryView } from '../types/resources';

export const resourcesApi = {
  catalog: (signal?: AbortSignal) => request<{resources: EditorialResource[]; source: string}>('/api/resources?audience=pro', {signal}),
  save: (input: Pick<EditorialResource, 'slug' | 'title' | 'summary' | 'category' | 'sections'>) =>
    request<{resource: EditorialResource}>('/api/resources?audience=pro', {method:'POST', body:JSON.stringify(input)}),
  publish: (id: string) => request<{resource: EditorialResource}>(`/api/resources/${encodeURIComponent(id)}/publish?audience=pro`, {method:'POST'}),
  library: (patientId: string, query = '', professional = false, signal?: AbortSignal) =>
    request<{ library: PatientLibraryView; source: string }>(
      `/api/patients/${encodeURIComponent(patientId)}/library?q=${encodeURIComponent(query)}${professional ? '&audience=pro' : ''}`,
      { signal },
    ),
  favorite: (patientId: string, item_kind: FavoriteKind, item_id: string) =>
    request<{ library: PatientLibraryView; source: string }>(
      `/api/patients/${encodeURIComponent(patientId)}/favorites`,
      { method: 'POST', body: JSON.stringify({ item_kind, item_id }) },
    ),
};
