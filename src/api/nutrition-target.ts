import { request } from './client';
import type { TargetInput, TargetResult } from '../lib/nutrition-target';

export type NutritionTarget = { patient_id: string; inputs: TargetInput; result: TargetResult; published_at: string | null; updated_at: string };
const path = (id: string) => `/api/patients/${encodeURIComponent(id)}/nutrition-target`;

export const nutritionTargetApi = {
  get: (patientId: string, professional: boolean, signal?: AbortSignal) => request<{ target: NutritionTarget | null }>(`${path(patientId)}?audience=${professional ? 'pro' : 'patient'}`, { signal }),
  save: (patientId: string, inputs: TargetInput, publish: boolean) => request<{ target: NutritionTarget }>(`${path(patientId)}?audience=pro`, { method: 'PUT', body: JSON.stringify({ inputs, publish }) }),
};
