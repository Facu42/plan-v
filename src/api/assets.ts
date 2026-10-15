import { request } from './client';
import type { PatientAssetView } from '../types/assets';

const base = (id: string) => `/api/patients/${encodeURIComponent(id)}/assets`;
const json = (method: string, data: unknown) => ({ method, body: JSON.stringify(data) });

export const assetsApi = {
  list: (id: string, category?: PatientAssetView['category'], signal?: AbortSignal) =>
    request<{ assets: PatientAssetView[] }>(`${base(id)}${category ? `?category=${category}` : ''}`, { signal }),
  reserve: (id: string, category: PatientAssetView['category']) =>
    request<{ asset: { id: string; status: string }; expires_in: number }>(`${base(id)}/intents`, json('POST', { category })),
  complete: (id: string, assetId: string, image: string) =>
    request<{ asset: { id: string; status: string } }>(`${base(id)}/${assetId}/complete`, json('POST', { image })),
  access: (id: string, assetId: string) =>
    request<{ url: string; expires_in: number }>(`${base(id)}/${assetId}/access`, json('POST', {})),
  withdraw: (id: string, assetId: string) =>
    request<{ ok: true }>(`${base(id)}/${assetId}/withdraw`, json('POST', {})),
};
