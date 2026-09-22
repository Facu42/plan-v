import { request } from './client';
import type { PatientProgressView, ProgressPeriodDays } from '../types/progress';

export const progressApi = {
  get: (patientId: string, days: ProgressPeriodDays = 7, signal?: AbortSignal) =>
    request<{ progress: PatientProgressView; source: string }>(
      `/api/patients/${encodeURIComponent(patientId)}/progress?days=${days}`,
      { signal },
    ),
};
