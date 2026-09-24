import { request } from './client';
import type { FavoriteKind, PatientLibraryView } from '../types/resources';

export const resourcesApi = {
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
