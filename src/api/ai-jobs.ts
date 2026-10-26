import { request } from './client';
import type { AiJobEnqueueInput, AiJobView, AiMonthlyUsage } from '../types/ai-jobs';

export const aiJobsApi = {
  enqueue: (input: AiJobEnqueueInput, signal?: AbortSignal) => request<{ job: AiJobView; source: string }>('/api/ai/jobs', {
    method: 'POST',
    signal,
    body: JSON.stringify(input),
  }),
  get: (id: string, signal?: AbortSignal) => request<{ job: AiJobView; source: string }>(`/api/ai/jobs/${id}`, { signal }),
  apply: (id: string, signal?: AbortSignal) => request<{ job: AiJobView; source: string }>(`/api/ai/jobs/${id}/apply`, { method: 'POST', signal }),
  reject: (id: string) => request<{ job: AiJobView; source: string }>(`/api/ai/jobs/${id}/reject`, { method: 'POST' }),
  list: (patientId: string, signal?: AbortSignal) => request<{ jobs: AiJobView[]; usage?: AiMonthlyUsage | null; source: string }>(
    `/api/patients/${encodeURIComponent(patientId)}/ai/jobs`,
    { signal },
  ),
};
