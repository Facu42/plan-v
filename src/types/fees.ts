/** Cobranzas: cuotas que la paciente le paga directo a su nutricionista. Montos en pesos enteros. */
export type PaymentMethod = 'efectivo' | 'transferencia' | 'mercado_pago' | 'otro';
export type PaymentStatus = 'confirmed' | 'reported' | 'rejected' | 'voided';
export type ChargeStatus = 'open' | 'waived';

export type ChargeKind = 'fee' | 'extra';

/** `program_name` viene del programa asignado; vacío si la cuota se fijó a mano. */
export type PatientFee = { amount: number; first_due_on: string; program_name?: string };
/** `kind` 'extra' es un cobro suelto (Nuevo cobro); `concept` dice de qué es. Ausentes en cuotas mensuales. */
export type PatientCharge = { id: string; due_on: string; amount: number; status: ChargeStatus; kind?: ChargeKind; concept?: string };
export type BillingProgram = { id: string; name: string; amount: number };
export type ChargeInput = { amount: number; due_on: string; concept: string };
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
export type BillingBoard = { settings: PaymentSettings; patients: BillingBoardPatient[]; programs?: BillingProgram[] };

export type PaymentInput = { client_id?: string; amount: number; paid_on: string; method: PaymentMethod; note?: string };
export type PaymentDecision = 'confirm' | 'reject' | 'void';
