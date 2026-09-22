import { request } from './client';
import type { MealPlanDraftInput, PatientMealPlan, ProfessionalMealPlan } from '../types/plans';

export const plansApi = {
  professional: (patientId: string, signal?: AbortSignal) => request<{ plan: ProfessionalMealPlan | null; source: string }>(
    `/api/patients/${encodeURIComponent(patientId)}/plans?audience=pro`,
    { signal },
  ),
  published: (patientId: string, signal?: AbortSignal) => request<{ plan: PatientMealPlan | null; source: string }>(
    `/api/patients/${encodeURIComponent(patientId)}/plans`,
    { signal },
  ),
  save: (patientId: string, input: MealPlanDraftInput) => request<{ plan: ProfessionalMealPlan; source: string }>(
    `/api/patients/${encodeURIComponent(patientId)}/plans`,
    { method: 'POST', body: JSON.stringify(input) },
  ),
  publish: (planId: string, expected_version: number) => request<{ plan: ProfessionalMealPlan; source: string }>(
    `/api/plans/${planId}/publish`,
    { method: 'POST', body: JSON.stringify({ expected_version }) },
  ),
};
