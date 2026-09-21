import { request } from './client';
import type { RecipeUnit } from '../types/recipes';
import type { ShoppingListView } from '../types/shopping';

const json = (method: string, data: unknown) => ({ method, body: JSON.stringify(data) });

export const shoppingApi = {
  get: (patientId: string, signal?: AbortSignal) => request<{ list: ShoppingListView; source: string }>(
    `/api/patients/${encodeURIComponent(patientId)}/shopping`,
    { signal },
  ),
  add: (patientId: string, input: { name: string; quantity: number; unit: RecipeUnit; client_id: string }) =>
    request<{ list: ShoppingListView; source: string }>(
      `/api/patients/${encodeURIComponent(patientId)}/shopping/items`,
      json('POST', input),
    ),
  check: (patientId: string, input: { source_key: string; checked: boolean }) =>
    request<{ list: ShoppingListView; source: string }>(
      `/api/patients/${encodeURIComponent(patientId)}/shopping/check`,
      json('POST', input),
    ),
  remove: (patientId: string, itemId: string) => request<{ list: ShoppingListView; source: string }>(
    `/api/patients/${encodeURIComponent(patientId)}/shopping/items/${encodeURIComponent(itemId)}`,
    { method: 'DELETE' },
  ),
};
