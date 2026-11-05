import { request } from './client';
import type { AdminLicenseRow, DirectoryCard, DirectoryLicenseInput, DirectoryListingView } from '../types/directory';

const json = (method: string, data: unknown) => ({ method, body: JSON.stringify(data) });

export const directoryApi = {
  mine: (signal?: AbortSignal) => request<{ listing: DirectoryListingView | null }>('/api/directory/me', { signal }),
  submit: (input: DirectoryLicenseInput) => request<{ listing: DirectoryListingView }>('/api/directory/me/license', json('PUT', input)),
  setListed: (listed: boolean) => request<{ listing: DirectoryListingView }>('/api/directory/me/listed', json('PUT', { listed })),
  publicList: (signal?: AbortSignal) => request<{ nutris: DirectoryCard[] }>('/api/public/directory', { signal }),
  adminList: (signal?: AbortSignal) => request<{ licenses: AdminLicenseRow[] }>('/api/admin/licenses', { signal }),
  adminFile: (id: string) => request<{ url: string }>(`/api/admin/nutritionists/${encodeURIComponent(id)}/license/file`),
  adminReview: (id: string, decision: 'verify' | 'reject', reason = '') =>
    request<{ license: AdminLicenseRow }>(`/api/admin/nutritionists/${encodeURIComponent(id)}/license/review`, json('POST', { decision, reason })),
};
