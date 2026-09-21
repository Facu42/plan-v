import { request } from './client';
import type { RecipeInput, RecipeView } from '../types/recipes';

const json = (method: string, data: unknown) => ({ method, body: JSON.stringify(data) });

export const recipesApi = {
  catalog: (signal?: AbortSignal) => request<{ recipes: RecipeView[]; source: 'memory' | 'supabase' }>('/api/recipes?audience=pro', { signal }),
  published: (patientId: string, signal?: AbortSignal) =>
    request<{ recipes: RecipeView[]; source: 'memory' | 'supabase' }>(`/api/patients/${encodeURIComponent(patientId)}/recipes`, { signal }),
  save: (input: RecipeInput) => request<{ recipe: RecipeView }>('/api/recipes?audience=pro', json('POST', input)),
  publish: (id: string) => request<{ recipe: RecipeView }>(`/api/recipes/${encodeURIComponent(id)}/publish?audience=pro`, { method: 'POST' }),
};
