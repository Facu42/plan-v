import { request } from './client';
import type { SubscriptionList, SubscriptionPlan } from '../types/subscriptions';

const json = (method: string, data: unknown) => ({ method, body: JSON.stringify(data) });
const slugPath = (slug: string) => `/api/public/scheduling/${encodeURIComponent(slug)}`;

export type PlanInput = { name: string; description: string | null; amount_cents: number; public_visible: boolean };
export type PlanPatch = Partial<PlanInput> & { expected_revision: number; apply_to_active?: boolean };
export type CreatedSubscription = { id: string; status: string; init_point: string | null; guest_token?: string };
export type PublicSubscriptionStatus = { id: string; status: string; message: string };

export const subscriptionsApi = {
  plans: () => request<{ plans: SubscriptionPlan[] }>('/api/scheduling/subscription-plans'),
  createPlan: (input: PlanInput) => request<{ plan: SubscriptionPlan }>('/api/scheduling/subscription-plans', json('POST', input)),
  updatePlan: (id: string, input: PlanPatch) => request<{ plan: SubscriptionPlan }>(`/api/scheduling/subscription-plans/${encodeURIComponent(id)}`, json('PATCH', input)),
  list: () => request<SubscriptionList>('/api/scheduling/subscriptions'),
  create: (input: { plan_id: string; patient_id: string; payer_email: string; source: 'panel'; client_request_id: string }) =>
    request<CreatedSubscription>('/api/scheduling/subscriptions', json('POST', input)),
  change: (id: string, action: 'pause' | 'resume' | 'cancel', expected: number) =>
    request(`/api/scheduling/subscriptions/${encodeURIComponent(id)}/${action}`, json('POST', { expected_revision: expected })),
  reconcile: (id?: string) => request<{ checked: number; actions: string[] }>(id ? `/api/scheduling/subscriptions/${encodeURIComponent(id)}/reconcile` : '/api/scheduling/subscriptions/reconcile', { method: 'POST' }),
  publicPlans: (slug: string, signal?: AbortSignal) => request<{ plans: SubscriptionPlan[] }>(`${slugPath(slug)}/subscription-plans`, { signal }, ''),
  publicCreate: (slug: string, input: { plan_id: string; payer_email: string; name: string; phone: string; contact_ok: true; client_request_id: string }) =>
    request<CreatedSubscription>(`${slugPath(slug)}/subscriptions`, json('POST', input), ''),
  publicStatus: (slug: string, id: string, token: string, signal?: AbortSignal) =>
    request<PublicSubscriptionStatus>(`${slugPath(slug)}/subscriptions/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}`, { signal }, ''),
};
