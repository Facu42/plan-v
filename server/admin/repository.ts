import { randomUUID } from 'node:crypto';
import { getRequestDb } from '../db/supabase-client.js';
import { CareError } from '../care/errors.js';
import { localBillingDate } from '../../src/billing.js';
import { addDays, addMonths, servicePaidUntil } from '../../src/service.js';
import type {
  ServiceBoard,
  ServiceEvent,
  ServiceNutritionist,
  ServiceOverride,
  ServicePayment,
  ServicePaymentInput,
  ServiceSettings,
} from '../../src/types/service.js';

export { CareError } from '../care/errors.js';

export function serviceDbError(error: { code?: string; message?: string } | null): void {
  if (!error) return;
  if (['42P01', '42883', 'PGRST202', 'PGRST205'].includes(error.code ?? '')) {
    throw new CareError(501, 'El panel del servicio requiere instalar la migración de este módulo.');
  }
  if (error.code === '42501') throw new CareError(403, 'No tenés permiso para esta acción.');
  if (['22023', '23514', '22P02'].includes(error.code ?? '')) throw new CareError(400, 'Revisá los datos cargados.');
  throw new CareError(503, 'No se pudo guardar. Reintentá en un momento.');
}

async function call(name: string, args?: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await getRequestDb().rpc(name, args);
  serviceDbError(error);
  return data;
}

// ---------- Modo demo (memoria) ----------

const settings: ServiceSettings = { monthly_price: null, trial_days: 30 };
let nutritionists: ServiceNutritionist[] = [];
let events: ServiceEvent[] = [];

function demoPayment(amount: number, months: number, paid_on: string): ServicePayment {
  return { id: randomUUID(), amount, months, paid_on, method: 'transferencia', note: '', status: 'confirmed', created_at: `${paid_on}T15:00:00.000Z` };
}

function demoNutritionist(id: string, name: string, email: string, createdDaysAgo: number, patients: number, payments: ServicePayment[]): ServiceNutritionist {
  const today = localBillingDate();
  const created = addDays(today, -createdDaysAgo);
  const trial = addDays(created, 30);
  return {
    id, display_name: name, email, created_at: `${created}T12:00:00.000Z`, last_sign_in_at: `${today}T11:00:00.000Z`,
    patients_active: patients, patients_total: patients,
    subscription: { trial_ends_on: trial, paid_until: servicePaidUntil(trial, payments), override: 'none', note: '' },
    payments,
  };
}

/** Ejemplos: Verónica al día, una en prueba y una vencida. */
function seedDemo(): void {
  const today = localBillingDate();
  const veroTrial = addDays(today, -60);
  nutritionists = [
    demoNutritionist('nutri-vero', 'Verónica Trenti', 'vero@example.test', 90, 3, [
      demoPayment(15000, 1, veroTrial),
      demoPayment(15000, 1, addMonths(veroTrial, 1)),
      demoPayment(15000, 1, addMonths(veroTrial, 2)),
    ]),
    demoNutritionist('nutri-camila', 'Camila Ruiz', 'camila@example.test', 10, 1, []),
    demoNutritionist('nutri-julieta', 'Julieta Paz', 'julieta@example.test', 50, 4, []),
  ];
  events = [];
}

export function resetServiceMemory(): void {
  Object.assign(settings, { monthly_price: null, trial_days: 30 });
  seedDemo();
}
seedDemo();

function memoryFind(id: string): ServiceNutritionist {
  const found = nutritionists.find((row) => row.id === id);
  if (!found) throw new CareError(400, 'Revisá los datos cargados.');
  return found;
}

function memoryAudit(action: string, nutritionistId: string | null, metadata: Record<string, unknown>): void {
  events.unshift({ id: randomUUID(), occurred_at: new Date().toISOString(), action, nutritionist_id: nutritionistId, metadata });
  events = events.slice(0, 30);
}

function recompute(row: ServiceNutritionist): ServiceNutritionist {
  row.subscription.paid_until = servicePaidUntil(row.subscription.trial_ends_on, row.payments);
  return structuredClone(row);
}

// ---------- Lectura de la base ----------

function asNutritionist(raw: unknown): ServiceNutritionist {
  const row = raw as Record<string, unknown>;
  const sub = (row.subscription ?? {}) as Record<string, unknown>;
  return {
    id: String(row.id),
    display_name: String(row.display_name ?? ''),
    email: String(row.email ?? ''),
    created_at: String(row.created_at ?? ''),
    last_sign_in_at: row.last_sign_in_at ? String(row.last_sign_in_at) : null,
    patients_active: Number(row.patients_active ?? 0),
    patients_total: Number(row.patients_total ?? 0),
    subscription: {
      trial_ends_on: String(sub.trial_ends_on ?? ''),
      paid_until: sub.paid_until ? String(sub.paid_until) : null,
      override: (sub.override as ServiceOverride) ?? 'none',
      note: String(sub.note ?? ''),
    },
    payments: ((row.payments as unknown[]) ?? []).map((entry) => {
      const payment = entry as Record<string, unknown>;
      return {
        id: String(payment.id),
        amount: Number(payment.amount),
        months: Number(payment.months),
        paid_on: String(payment.paid_on),
        method: payment.method as ServicePayment['method'],
        note: String(payment.note ?? ''),
        status: payment.status as ServicePayment['status'],
        created_at: String(payment.created_at ?? ''),
      };
    }),
  };
}

function asSettings(raw: unknown): ServiceSettings {
  const row = (raw ?? {}) as Record<string, unknown>;
  return {
    monthly_price: row.monthly_price == null ? null : Number(row.monthly_price),
    trial_days: Number(row.trial_days ?? 30),
  };
}

// ---------- Operaciones ----------

export async function isAdmin(persistent: boolean): Promise<boolean> {
  if (!persistent) return true;
  try {
    return (await call('is_platform_admin')) === true;
  } catch (error) {
    if (error instanceof CareError && error.status === 501) return false;
    throw error;
  }
}

export async function getBoard(persistent: boolean): Promise<ServiceBoard> {
  if (persistent) {
    const data = await call('admin_get_service_board') as Record<string, unknown>;
    return {
      settings: asSettings(data.settings),
      nutritionists: ((data.nutritionists as unknown[]) ?? []).map(asNutritionist),
      events: ((data.events as unknown[]) ?? []).map((entry) => {
        const event = entry as Record<string, unknown>;
        return {
          id: String(event.id),
          occurred_at: String(event.occurred_at ?? ''),
          action: String(event.action ?? ''),
          nutritionist_id: event.nutritionist_id ? String(event.nutritionist_id) : null,
          metadata: (event.metadata as Record<string, unknown>) ?? {},
        };
      }),
    };
  }
  return {
    settings: { ...settings },
    nutritionists: structuredClone(nutritionists).sort((a, b) => a.display_name.localeCompare(b.display_name, 'es')),
    events: structuredClone(events),
  };
}

export async function saveSettings(input: ServiceSettings, persistent: boolean): Promise<ServiceSettings> {
  if (persistent) return asSettings(await call('admin_set_service_settings', { monthly_price: input.monthly_price, trial_days: input.trial_days }));
  Object.assign(settings, input);
  memoryAudit('service.settings', null, { ...input });
  return { ...settings };
}

export async function recordPayment(id: string, input: ServicePaymentInput, persistent: boolean): Promise<ServiceNutritionist> {
  if (persistent) {
    return asNutritionist(await call('admin_record_service_payment', {
      target: id, amount: input.amount, months: input.months, paid_on: input.paid_on, method: input.method, note: input.note ?? '',
    }));
  }
  const row = memoryFind(id);
  const today = localBillingDate();
  if (input.paid_on > addDays(today, 1) || input.paid_on < addDays(today, -366)) throw new CareError(400, 'Revisá los datos cargados.');
  row.payments.unshift({ id: randomUUID(), amount: input.amount, months: input.months, paid_on: input.paid_on, method: input.method, note: (input.note ?? '').trim(), status: 'confirmed', created_at: new Date().toISOString() });
  memoryAudit('service.payment', id, { amount: input.amount, months: input.months, paid_on: input.paid_on, method: input.method });
  return recompute(row);
}

export async function voidPayment(paymentId: string, persistent: boolean): Promise<ServiceNutritionist> {
  if (persistent) return asNutritionist(await call('admin_void_service_payment', { payment_id: paymentId }));
  const row = nutritionists.find((entry) => entry.payments.some((payment) => payment.id === paymentId));
  const payment = row?.payments.find((entry) => entry.id === paymentId);
  if (!row || !payment || payment.status !== 'confirmed') throw new CareError(400, 'Ese pago ya fue anulado.');
  payment.status = 'voided';
  memoryAudit('service.payment_voided', row.id, { payment_id: paymentId });
  return recompute(row);
}

export async function extendTrial(id: string, days: number, persistent: boolean): Promise<ServiceNutritionist> {
  if (persistent) return asNutritionist(await call('admin_extend_trial', { target: id, days }));
  const row = memoryFind(id);
  const today = localBillingDate();
  const base = row.subscription.trial_ends_on > today ? row.subscription.trial_ends_on : today;
  row.subscription.trial_ends_on = addDays(base, days);
  memoryAudit('service.trial_extended', id, { days });
  return recompute(row);
}

export async function setOverride(id: string, override: ServiceOverride, note: string, persistent: boolean): Promise<ServiceNutritionist> {
  if (persistent) return asNutritionist(await call('admin_set_service_override', { target: id, input_override: override, note }));
  const row = memoryFind(id);
  row.subscription.override = override;
  row.subscription.note = note.trim();
  memoryAudit('service.override', id, { override });
  return structuredClone(row);
}
