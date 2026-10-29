import { request } from './client';
import type { NoticeSave, NoticeView, TemplateInput, TemplateView } from '../types/ajustes';

export const ajustesApi = {
  templates: (signal?: AbortSignal) => request<{ templates: TemplateView[] }>('/api/ajustes/templates', { signal }),
  saveTemplate: (input: TemplateInput) => request<{ template: TemplateView }>('/api/ajustes/templates', { method: 'PUT', body: JSON.stringify(input) }),
  deleteTemplate: (id: string) => request<{ ok: true }>(`/api/ajustes/templates/${id}`, { method: 'DELETE' }),
  notices: (signal?: AbortSignal) => request<{ notices: NoticeView[] }>('/api/ajustes/notices', { signal }),
  saveNotice: (input: NoticeSave) => request<{ notice: NoticeView }>('/api/ajustes/notices', { method: 'PUT', body: JSON.stringify(input) }),
};
