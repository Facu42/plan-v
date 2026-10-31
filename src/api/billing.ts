import { request } from './client';

export type BillingCycle = 'monthly' | 'annual';
export type PlanCode = 'arranque' | 'pro' | 'consultorio';

export type PlatformPlanCard = {
  code: PlanCode;
  name: string;
  monthly_amount_cents: number;
  annual_amount_cents: number;
  founder_monthly_amount_cents: number;
  founder_annual_amount_cents: number;
  max_active_patients: number | null;
  max_nutritionists: number;
  max_ai_meal_photos_month: number | null;
};

export type PlatformBillingView = {
  enabled: boolean;
  founder_seats_left: number | null;
  plans: PlatformPlanCard[];
  subscription: null | {
    id: string;
    plan_code: string;
    plan_name: string;
    billing_cycle: BillingCycle;
    status: string;
    founder: boolean;
    founder_until: string | null;
    current_amount_cents: number;
    current_period_end: string | null;
    past_due_since: string | null;
    read_only: boolean;
    grace_until: string | null;
    init_point: string | null;
    attention: string | null;
  };
  usage: null | { active_patients: number; nutritionists: number; ai_photos: number };
  payments: Array<{ id: string; amount_cents: number; status: string; paid_at: string | null }>;
};

export const billingApi = {
  plan: (signal?: AbortSignal) => request<PlatformBillingView>('/api/billing/plan', { signal }),
  checkout: (input: { plan_code: PlanCode; billing_cycle: BillingCycle; client_request_id: string }) =>
    request<{ init_point: string }>('/api/billing/checkout', { method: 'POST', body: JSON.stringify(input) }),
  change: (input: { plan_code: PlanCode; billing_cycle: BillingCycle }) =>
    request<PlatformBillingView>('/api/billing/change-plan', { method: 'POST', body: JSON.stringify(input) }),
  cancel: (reason: string) => request<PlatformBillingView>('/api/billing/cancel', { method: 'POST', body: JSON.stringify({ reason }) }),
};

export function mpCheckoutUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return null;
    if (!url.hostname.endsWith('mercadopago.com') && !url.hostname.endsWith('mercadopago.com.ar')) return null;
    return url.toString();
  } catch {
    return null;
  }
}
