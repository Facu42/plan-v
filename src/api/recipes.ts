import { request } from './client';
import type { PatientRecipe, ProfessionalRecipe } from '../types/recipes';
import type { RecipeDayAssignment, RecipeWizardInput } from '../types/recipe-plate';

export const recipesApi = {
  favorites: (signal?: AbortSignal) => request<{ favorite_ids: string[] }>('/api/recipes/favorites', { signal }),
  setFavorite: (id: string, favorite: boolean) => request<{ recipe_id: string; favorite: boolean }>(`/api/recipes/${id}/favorite`, { method: 'POST', body: JSON.stringify({ favorite }) }),
  list: (signal?: AbortSignal) => request<{ recipes: ProfessionalRecipe[]; source: string; image_generation?: boolean }>('/api/recipes', { signal }),
  save: (input: RecipeWizardInput) => request<{ recipe: ProfessionalRecipe; source: string }>('/api/recipes', {
    method: 'POST',
    body: JSON.stringify(input),
  }),
  version: (id: string, input: RecipeWizardInput) => request<{ recipe: ProfessionalRecipe; source: string }>(`/api/recipes/${id}/versions`, {
    method: 'POST',
    body: JSON.stringify(input),
  }),
  publish: (id: string, expected_version: number, expected_revision?: string) => request<{ recipe: ProfessionalRecipe; source: string }>(`/api/recipes/${id}/publish`, {
    method: 'POST',
    body: JSON.stringify({ expected_version, expected_revision }),
  }),
  cover: (id: string, expected_version: number) => request<{ recipe: ProfessionalRecipe; source: string }>(`/api/recipes/${id}/cover`, {
    method: 'POST', body: JSON.stringify({ expected_version }),
  }),
  assign: (id: string, patient_id: string, expected_version: number) => request<{ recipe: PatientRecipe; source: string }>(`/api/recipes/${id}/assign`, {
    method: 'POST',
    body: JSON.stringify({ patient_id, expected_version }),
  }),
  assigned: (patientId: string, signal?: AbortSignal) => request<{ recipes: PatientRecipe[]; source: string }>(
    `/api/patients/${encodeURIComponent(patientId)}/recipes`,
    { signal },
  ),
  assignDay: (id: string, input: { patient_id: string; expected_version: number; for_date: string; slot: string }) => request<{ assignment: RecipeDayAssignment; source: string }>(`/api/recipes/${id}/day`, {
    method: 'POST',
    body: JSON.stringify(input),
  }),
  days: (patientId: string, date?: string, signal?: AbortSignal) => request<{ assignments: RecipeDayAssignment[]; source: string }>(
    `/api/patients/${encodeURIComponent(patientId)}/recipe-days${date ? `?date=${date}` : ''}`,
    { signal },
  ),
  registerDay: (patientId: string, assignmentId: string, client_id: string) => request<{ assignment: RecipeDayAssignment; duplicate: boolean }>(
    `/api/patients/${encodeURIComponent(patientId)}/recipe-days/${assignmentId}/register`,
    { method: 'POST', body: JSON.stringify({ client_id }) },
  ),
};
