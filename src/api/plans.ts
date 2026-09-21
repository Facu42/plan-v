import { request } from './client';
import type { MealPlanView, PlanInput } from '../types/plans';

const json = (method: string, data: unknown) => ({ method, body: JSON.stringify(data) });
const board = (patientId: string) => `/api/patients/${encodeURIComponent(patientId)}/plans`;

export const plansApi = {
  board: (patientId: string, professional = false, signal?: AbortSignal) =>
    request<{ open: MealPlanView | null; published: MealPlanView | null; source: 'memory' | 'supabase' }>(
      `${board(patientId)}${professional ? '?audience=pro' : ''}`,
      { signal },
    ),
  save: (patientId: string, input: PlanInput) =>
    request<{ plan: MealPlanView }>(`${board(patientId)}?audience=pro`, json('PUT', input)),
  publish: (patientId: string, planId: string, expected_version: number) =>
    request<{ plan: MealPlanView }>(`${board(patientId)}/${encodeURIComponent(planId)}/publish?audience=pro`, json('POST', { expected_version })),
};
