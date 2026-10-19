/** Contratos del débito automático. La bandera arranca apagada; las pantallas llegan en otra rama. */

export type SubscriptionPlanStatus = 'active' | 'archived';
export type SubscriptionStatus =
  | 'creating'
  | 'uncertain'
  | 'pending'
  | 'authorized'
  | 'paused'
  | 'cancelled'
  | 'expired'
  | 'failed';
export type SubscriptionPaymentState = 'ok' | 'retrying' | 'rejected';
export type SubscriptionCancelledBy = 'nutritionist' | 'patient' | 'mercado_pago' | 'system';
export type SubscriptionSource = 'panel' | 'chat' | 'public_page' | 'patient_app';

export type SubscriptionPlan = {
  id: string;
  name: string;
  description: string | null;
  amount_cents: number;
  currency: 'ARS';
  frequency: 1;
  frequency_type: 'months';
  public_visible: boolean;
  status: SubscriptionPlanStatus;
  revision: number;
};

export type SubscriptionSummary = {
  active: number;
  pending: number;
  problems: number;
  unlinked: number;
};

export type PatientSubscription = {
  id: string;
  plan_id: string;
  plan_name: string;
  patient_id: string | null;
  contact_name: string | null;
  payer_email_masked: string;
  source: SubscriptionSource;
  status: SubscriptionStatus;
  payment_state: SubscriptionPaymentState | null;
  cancelled_by: SubscriptionCancelledBy | null;
  amount_cents: number;
  pending_amount_cents: number | null;
  pending_amount_on: string | null;
  next_payment_date: string | null;
  init_point: string | null;
  revision: number;
  review_required: boolean;
  account_mismatch: boolean;
  expires_at: string | null;
  created_at: string;
};

export type SubscriptionList = {
  subscriptions: PatientSubscription[];
  summary: SubscriptionSummary;
};

export type PatientSubscriptionSelf = {
  id: string;
  status: SubscriptionStatus;
  payment_state: SubscriptionPaymentState | null;
  cancelled_by: SubscriptionCancelledBy | null;
  amount_cents: number;
  currency: 'ARS';
  next_payment_date: string | null;
  pending_amount_cents: number | null;
  pending_amount_on: string | null;
  plan_name: string;
  init_point: string | null;
};
