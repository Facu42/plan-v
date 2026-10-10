import { request } from './client';
import type { ProgressPeriodDays } from '../types/progress';
import type { GlobalProgressResponse } from '../types/progress-global';

export const crmProgressApi = {
  global: (days: ProgressPeriodDays, signal?: AbortSignal) => request<GlobalProgressResponse>(`/api/crm/progress-global?days=${days}`, { signal }),
};
