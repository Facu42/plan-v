import { request } from './client';
import type { ModelSaveInput, ProfessionalModel } from '../types/models';
export const modelsApi = {
  list: (signal?: AbortSignal) =>
    request<{ models: ProfessionalModel[] }>('/api/models', { signal }),
  save: (input: ModelSaveInput) =>
    request<{ model: ProfessionalModel }>('/api/models', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  action: (model: ProfessionalModel, action: 'publish' | 'archive') =>
    request<{ model: ProfessionalModel }>(`/api/models/${model.id}/${action}`, {
      method: 'POST',
      body: JSON.stringify({
        expected_revision: model.revision,
        reviewed: true,
      }),
    }),
};
