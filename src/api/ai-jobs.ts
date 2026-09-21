import { request } from './client';
import type { AiJobEnqueue, AiJobView, MenuProposal, RecipeProposal } from '../types/ai-jobs';
import type { RecipeView } from '../types/recipes';
import type { MealPlanView } from '../types/plans';

const json = (method: string, data: unknown) => ({ method, body: JSON.stringify(data) });
const base = (patientId: string) => `/api/patients/${encodeURIComponent(patientId)}/ai-jobs`;

export const aiJobsApi = {
  list: (patientId: string, signal?: AbortSignal) =>
    request<{ jobs: AiJobView[]; source: 'memory' | 'supabase' }>(`${base(patientId)}?audience=pro`, { signal }),
  create: (patientId: string, input: AiJobEnqueue) =>
    request<{ job: AiJobView; source: 'memory' | 'supabase' }>(`${base(patientId)}?audience=pro`, json('POST', input)),
  get: (patientId: string, jobId: string, signal?: AbortSignal) =>
    request<{ job: AiJobView }>(`${base(patientId)}/${encodeURIComponent(jobId)}?audience=pro`, { signal }),
  cancel: (patientId: string, jobId: string) =>
    request<{ job: AiJobView }>(`${base(patientId)}/${encodeURIComponent(jobId)}/cancel?audience=pro`, { method: 'POST' }),
  apply: (patientId: string, jobId: string) =>
    request<{ kind: 'recipe'; recipe: RecipeView } | { kind: 'menu'; plan: MealPlanView }>(
      `${base(patientId)}/${encodeURIComponent(jobId)}/apply?audience=pro`,
      { method: 'POST' },
    ),
};

export function recipeProposalText(payload: RecipeProposal) {
  return { ingredients: payload.ingredients.join('\n'), steps: payload.steps.join('\n') };
}

export function menuProposalSummary(payload: MenuProposal) {
  return payload.slots.map((item) => `${item.day} · ${item.slot}: ${item.title}`);
}
