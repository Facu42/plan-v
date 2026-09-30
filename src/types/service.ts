// Panel del servicio: suscripción de cada nutricionista a Plan V. Sin datos de salud.
export type ServiceOverride = 'none' | 'waived' | 'suspended';
export type ServicePaymentMethod = 'transferencia' | 'mercado_pago' | 'efectivo' | 'otro';
export type ServicePaymentStatus = 'confirmed' | 'voided';

export interface ServiceSettings {
  monthly_price: number | null;
  trial_days: number;
}

export interface ServiceSubscription {
  trial_ends_on: string;
  paid_until: string | null;
  override: ServiceOverride;
  note: string;
}

export interface ServicePayment {
  id: string;
  amount: number;
  months: number;
  paid_on: string;
  method: ServicePaymentMethod;
  note: string;
  status: ServicePaymentStatus;
  created_at: string;
}

export interface ServiceNutritionist {
  id: string;
  display_name: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  patients_active: number;
  patients_total: number;
  subscription: ServiceSubscription;
  payments: ServicePayment[];
}

export interface ServiceEvent {
  id: string;
  occurred_at: string;
  action: string;
  nutritionist_id: string | null;
  metadata: Record<string, unknown>;
}

export interface ServiceBoard {
  settings: ServiceSettings;
  nutritionists: ServiceNutritionist[];
  events: ServiceEvent[];
}

export interface ServicePaymentInput {
  amount: number;
  months: number;
  paid_on: string;
  method: ServicePaymentMethod;
  note?: string;
}
