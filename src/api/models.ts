import { request } from './client';
import type { ModelSaveInput, ProfessionalModel } from '../types/models';
import type { ModelApplyInput } from '../types/models';
import type { ProfessionalMealPlan } from '../types/plans';
export const modelsApi = {
  apply: (model: ProfessionalModel, input: ModelApplyInput) =>
    request<{ plan: ProfessionalMealPlan }>(`/api/models/${model.id}/apply`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
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
