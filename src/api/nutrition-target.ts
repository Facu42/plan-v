import { request } from './client';
import type { BodyData, TargetInput, TargetResult } from '../lib/nutrition-target';

export type NutritionTarget = { patient_id: string; inputs: TargetInput; result: TargetResult; published_at: string | null; updated_at: string };
export type NutritionTargetWorkspace = { target: NutritionTarget | null; draft: NutritionTarget | null; published: NutritionTarget | null; revision: number };
const path = (id: string) => `/api/patients/${encodeURIComponent(id)}/nutrition-target`;

export const nutritionTargetApi = {
  get: (patientId: string, professional: boolean, signal?: AbortSignal) => request<{ target: NutritionTarget | null; draft?: NutritionTarget | null; published?: NutritionTarget | null; revision?: number }>(`${path(patientId)}?audience=${professional ? 'pro' : 'patient'}`, { signal }),
  save: (patientId: string, inputs: TargetInput, publish: boolean, expectedRevision: number) => request<NutritionTargetWorkspace>(`${path(patientId)}?audience=pro`, { method: 'PUT', body: JSON.stringify({ inputs, publish, expected_revision: expectedRevision }) }),
};

export type BodyDataView = { data: (BodyData & { updated_at: string }) | null; requested_at: string | null };
const bodyPath = (id: string) => `/api/patients/${encodeURIComponent(id)}/body-data`;

export const bodyDataApi = {
  get: (patientId: string, professional: boolean, signal?: AbortSignal) => request<BodyDataView>(`${bodyPath(patientId)}?audience=${professional ? 'pro' : 'patient'}`, { signal }),
  save: (patientId: string, body: BodyData) => request<BodyDataView>(`${bodyPath(patientId)}?audience=patient`, { method: 'PUT', body: JSON.stringify(body) }),
  request: (patientId: string) => request<BodyDataView>(`${bodyPath(patientId)}/request?audience=pro`, { method: 'POST' }),
};
