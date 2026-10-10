import { request } from './client';
import type { WorkspaceSearchResponse } from '../types/search';

export const searchApi = {
  workspace: (q: string, signal?: AbortSignal) =>
    request<WorkspaceSearchResponse>(`/api/search?q=${encodeURIComponent(q)}`, { signal }),
};
