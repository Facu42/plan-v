import { request } from './client';
import type { AiJobEnqueueInput, AiJobView } from '../types/ai-jobs';

export const aiJobsApi = {
  enqueue: (input: AiJobEnqueueInput) => request<{ job: AiJobView; source: string }>('/api/ai/jobs', {
    method: 'POST',
    body: JSON.stringify(input),
  }),
  get: (id: string, signal?: AbortSignal) => request<{ job: AiJobView; source: string }>(`/api/ai/jobs/${id}`, { signal }),
  apply: (id: string) => request<{ job: AiJobView; source: string }>(`/api/ai/jobs/${id}/apply`, { method: 'POST' }),
  reject: (id: string) => request<{ job: AiJobView; source: string }>(`/api/ai/jobs/${id}/reject`, { method: 'POST' }),
  list: (patientId: string, signal?: AbortSignal) => request<{ jobs: AiJobView[]; source: string }>(
    `/api/patients/${encodeURIComponent(patientId)}/ai/jobs`,
    { signal },
  ),
};
