import { request } from './client';
import type { PatientRecipe, ProfessionalRecipe, RecipeDraftInput } from '../types/recipes';

export const recipesApi = {
  list: (signal?: AbortSignal) => request<{ recipes: ProfessionalRecipe[]; source: string }>('/api/recipes', { signal }),
  save: (input: RecipeDraftInput) => request<{ recipe: ProfessionalRecipe; source: string }>('/api/recipes', {
    method: 'POST',
    body: JSON.stringify(input),
  }),
  version: (id: string, input: RecipeDraftInput) => request<{ recipe: ProfessionalRecipe; source: string }>(`/api/recipes/${id}/versions`, {
    method: 'POST',
    body: JSON.stringify(input),
  }),
  publish: (id: string, expected_version: number) => request<{ recipe: ProfessionalRecipe; source: string }>(`/api/recipes/${id}/publish`, {
    method: 'POST',
    body: JSON.stringify({ expected_version }),
  }),
  assign: (id: string, patient_id: string, expected_version: number) => request<{ recipe: PatientRecipe; source: string }>(`/api/recipes/${id}/assign`, {
    method: 'POST',
    body: JSON.stringify({ patient_id, expected_version }),
  }),
  assigned: (patientId: string, signal?: AbortSignal) => request<{ recipes: PatientRecipe[]; source: string }>(
    `/api/patients/${encodeURIComponent(patientId)}/recipes`,
    { signal },
  ),
};
