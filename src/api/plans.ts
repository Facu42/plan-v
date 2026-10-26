import { request } from './client';
import type { PlanHandover } from '../types/plan-handover';
import { planReviewSnapshot, type MealPlanDraftInput, type PatientMealPlan, type ProfessionalMealPlan, type PlanVersionView } from '../types/plans';

export const plansApi = {
  schedule: (planId: string, reviewed: PlanVersionView, scheduled_at: string) => request<{ plan: ProfessionalMealPlan; source: string }>(
    `/api/plans/${planId}/schedule`, { method: 'POST', body: JSON.stringify({ expected_version: reviewed.version, expected_snapshot: planReviewSnapshot(reviewed), scheduled_at }) },
  ),
  email: (planId: string, patientId: string, version: number) => request<{ status: 'accepted' | 'already_accepted' }>(
    `/api/plans/${planId}/email`, { method: 'POST', body: JSON.stringify({ patient_id: patientId, expected_version: version }) },
  ),
  history:(patientId:string,signal?:AbortSignal)=>request<{versions:PlanVersionView[]}>(`/api/patients/${encodeURIComponent(patientId)}/plans/history`,{signal}),
  professional: (patientId: string, signal?: AbortSignal) => request<{ plan: ProfessionalMealPlan | null; source: string; image_generation?: boolean }>(
    `/api/patients/${encodeURIComponent(patientId)}/plans?audience=pro`,
    { signal },
  ),
  published: (patientId: string, signal?: AbortSignal) => request<{ plan: PatientMealPlan | null; handover: PlanHandover | null; source: string }>(
    `/api/patients/${encodeURIComponent(patientId)}/plans`,
    { signal },
  ),
  seenHandover: (patientId: string) => request<{ plan: PatientMealPlan | null; handover: PlanHandover | null; source: string }>(
    `/api/patients/${encodeURIComponent(patientId)}/plans/handover-seen`,
    { method: 'POST' },
  ),
  save: (patientId: string, input: MealPlanDraftInput) => request<{ plan: ProfessionalMealPlan; source: string }>(
    `/api/patients/${encodeURIComponent(patientId)}/plans`,
    { method: 'POST', body: JSON.stringify(input) },
  ),
  publish: (planId: string, expected_version: number, reviewed: PlanVersionView) => request<{ plan: ProfessionalMealPlan; source: string }>(
    `/api/plans/${planId}/publish`,
    { method: 'POST', body: JSON.stringify({ expected_version, expected_snapshot: reviewed ? planReviewSnapshot(reviewed) : undefined }) },
  ),
  covers: (planId: string, expected_version: number) => request<{ plan: ProfessionalMealPlan; source: string }>(
    `/api/plans/${planId}/covers`, { method: 'POST', body: JSON.stringify({ expected_version }) },
  ),
};
