/** Cobranzas: cuotas que la paciente le paga directo a su nutricionista. Montos en pesos enteros. */
export type PaymentMethod = 'efectivo' | 'transferencia' | 'mercado_pago' | 'otro';
export type PaymentStatus = 'confirmed' | 'reported' | 'rejected' | 'voided';
export type ChargeStatus = 'open' | 'waived';

export type PatientFee = { amount: number; first_due_on: string };
export type PatientCharge = { id: string; due_on: string; amount: number; status: ChargeStatus };
export type PatientPayment = {
  id: string;
  amount: number;
  paid_on: string;
  method: PaymentMethod;
  note: string;
  status: PaymentStatus;
  reported_by_patient: boolean;
  created_at: string;
};

export type PatientLedger = {
  patient_id: string;
  fee: PatientFee | null;
  charges: PatientCharge[];
  payments: PatientPayment[];
};

export type PaymentInfo = {
  nutritionist_name: string;
  alias: string;
  payment_link: string;
  instructions: string;
};

export type PaymentSettings = {
  default_fee: number | null;
  alias: string;
  payment_link: string;
  instructions: string;
};

export type PatientLedgerView = PatientLedger & { payment_info: PaymentInfo | null };
export type BillingBoardPatient = PatientLedger & { full_name: string };
export type BillingBoard = { settings: PaymentSettings; patients: BillingBoardPatient[] };

export type PaymentInput = { amount: number; paid_on: string; method: PaymentMethod; note?: string };
export type PaymentDecision = 'confirm' | 'reject' | 'void';
