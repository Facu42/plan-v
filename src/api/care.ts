import { request } from './client';
import type { CareSnapshot, CareInput, CareRecord, CarePreferences, CareAlert, ReplacementRecipe } from '../types/care';
const base = (id: string) => `/api/patients/${encodeURIComponent(id)}/care`;
const json = (method: string, data: unknown) => ({ method, body: JSON.stringify(data) });
export const careApi = {
  snapshot: (id: string, professional = false, signal?: AbortSignal) => request<CareSnapshot>(`${base(id)}?audience=${professional ? 'pro' : 'patient'}`, { signal }),
  save: (id: string, input: CareInput, professional = false) => request<{record: CareRecord}>(`${base(id)}/records${professional ? '?audience=pro' : ''}`, json('POST', input)),
  preferences: (id: string, settings: CarePreferences) => request(`${base(id)}/preferences`, json('PUT', settings)),
  photo: (id: string, input: {id:string;recorded_on:string;image:string;note:string}) => request(`${base(id)}/photos`, json('POST', input)),
  openPhoto: (id: string, recordId: string) => request<{url:string;expires_in:number}>(`${base(id)}/photos/${recordId}`),
  deletePhoto: (id:string,recordId:string)=>request(`${base(id)}/photos/${recordId}`,{method:'DELETE'}),
  review: (id: string, recordId: string) => request(`${base(id)}/records/${recordId}/review`, { method:'PATCH' }),
  generate: (id: string, recordId: string) => request(`${base(id)}/replacements/${recordId}/generate`, { method:'POST' }),
  publish: (id: string, replacementId: string, expected_recipe:ReplacementRecipe, recipe:ReplacementRecipe) => request(`${base(id)}/replacements/${replacementId}/publish`, json('POST',{expected_recipe,recipe})),
  alerts: (signal?: AbortSignal) => request<{alerts:CareAlert[]}>('/api/care/alerts', { signal }),
};
export function careErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : 'No se pudo completar la operación.';
  try { const json = JSON.parse(message); return String(json.error ?? json.message ?? message); } catch { return message; }
}
export function notifyCareChanged() { window.dispatchEvent(new Event('plan-v:care-changed')); }
