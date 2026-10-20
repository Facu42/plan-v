import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CareError } from '../care/errors.js';

const mem = vi.hoisted(() => ({
  live: false,
  ledger: {
    patient_id: '22222222-2222-4222-8222-222222222222',
    fee: { amount: 28000, first_due_on: '2026-10-10' },
    charges: [{ id: 'charge-1', due_on: '2026-10-10', amount: 28000, status: 'open' as const }],
    payments: [] as Array<Record<string, unknown>>,
  },
  checkouts: [] as Array<Record<string, unknown>>,
  payments: [] as Array<Record<string, unknown>>,
  preferences: [] as Array<Record<string, unknown>>,
}));

vi.mock('../subscriptions/flag.js', () => ({ subscriptionsAllowed: () => true, subscriptionsEnabled: () => true }));
vi.mock('../scheduling/providers.js', () => ({
  createFeePreference: async (_nid: string, intent: Record<string, unknown>) => {
    mem.preferences.push(intent);
    return { url: 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=uno', id: 'pref-1', accountId: 'acc-1' };
  },
}));
vi.mock('../subscriptions/mp.js', () => ({
  nutriToken: async () => ({ token: 'token-oauth', accountId: 'acc-1' }),
  mercadoPago: { searchPayments: async () => [] },
}));
vi.mock('../subscriptions/repository.js', () => ({
  patientOwned: async () => ({ id: '22222222-2222-4222-8222-222222222222', nutritionist_id: 'nutri-1', full_name: 'Marina', anonymized_at: null }),
  nutritionistCard: async () => ({ id: 'nutri-1', user_id: 'user-1', display_name: 'Ana' }),
  nutritionistBySlug: async () => 'nutri-1',
  findLedger: async (id: string) => mem.payments.find(row => row.provider_payment_id === id) ?? null,
  voidLedger: async (id: string) => {
    const row = mem.payments.find(item => item.id === id);
    if (row) row.status = 'voided';
  },
}));
vi.mock('./checkout-repository.js', () => ({
  patientRow: async () => ({ id: '22222222-2222-4222-8222-222222222222', nutritionist_id: 'nutri-1', anonymized_at: null }),
  liveDebit: async () => mem.live,
  loadLedger: async () => mem.ledger,
  findCheckout: async (_nid: string, id: string) => mem.checkouts.find(row => row.id === id) ?? null,
  findOpen: async (_patient: string, dueOn: string) => mem.checkouts.find(row => row.due_on === dueOn && (row.status === 'creating' || row.status === 'ready')) ?? null,
  findByRequest: async (_nid: string, id: string) => mem.checkouts.find(row => row.client_request_id === id) ?? null,
  insertCheckout: async (values: Record<string, unknown>) => {
    if (mem.checkouts.some(row => row.patient_id === values.patient_id && row.due_on === values.due_on && (row.status === 'creating' || row.status === 'ready'))) return null;
    mem.checkouts.push({ checkout_url: null, provider_preference_id: null, provider_payment_id: null, ...values });
    return mem.checkouts[mem.checkouts.length - 1];
  },
  patchCheckout: async (id: string, patch: Record<string, unknown>) => {
    const row = mem.checkouts.find(item => item.id === id);
    if (!row) return null;
    Object.assign(row, patch);
    return row;
  },
  expireStale: async () => undefined,
  expireOthers: async () => undefined,
  listReady: async () => mem.checkouts.filter(row => row.status === 'ready'),
  patientsByEmail: async () => ['22222222-2222-4222-8222-222222222222'],
  insertCheckoutPayment: async (values: Record<string, unknown>) => {
    if (mem.payments.some(row => row.provider_payment_id === values.provider_payment_id)) return { created: false };
    if (mem.payments.some(row => row.covers_due_on === values.covers_due_on && row.status === 'confirmed' && row.source === 'checkout')) return { created: false };
    mem.payments.push({ id: `pay-${mem.payments.length + 1}`, status: 'confirmed', ...values });
    const saved = mem.payments[mem.payments.length - 1];
    mem.ledger.payments.push(saved);
    return { created: true, id: saved?.id };
  },
}));

const PATIENT = '22222222-2222-4222-8222-222222222222';
const REQUEST = '33333333-3333-4333-8333-333333333333';

describe('enlace de la cuota del mes', () => {
  beforeEach(() => {
    mem.live = false;
    mem.ledger = {
      patient_id: PATIENT,
      fee: { amount: 28000, first_due_on: '2026-10-10' },
      charges: [{ id: 'charge-1', due_on: '2026-10-10', amount: 28000, status: 'open' }],
      payments: [],
    };
    mem.checkouts = [];
    mem.payments = [];
    mem.preferences = [];
  });

  it('genera el enlace con el token de la nutri y lo reutiliza', async () => {
    const { createForNutritionist } = await import('./monthly-checkout.js');
    const first = await createForNutritionist('nutri-1', { patient_id: PATIENT, due_on: '2026-10-10', client_request_id: REQUEST });
    const second = await createForNutritionist('nutri-1', { patient_id: PATIENT, due_on: '2026-10-10', client_request_id: '44444444-4444-4444-8444-444444444444' });
    expect(first.init_point).toMatch(/^https:\/\//);
    expect(second.id).toBe(first.id);
    expect(mem.preferences).toHaveLength(1);
    expect(mem.preferences[0]).toMatchObject({ amountPesos: 28000, title: 'Cuota de Octubre 2026' });
  });

  it('no ofrece el enlace si hay débito activo', async () => {
    mem.live = true;
    const { createForNutritionist } = await import('./monthly-checkout.js');
    await expect(createForNutritionist('nutri-1', { patient_id: PATIENT, due_on: '2026-10-10', client_request_id: REQUEST }))
      .rejects.toBeInstanceOf(CareError);
    expect(mem.preferences).toHaveLength(0);
  });

  it('anota el cobro una sola vez y un segundo pago del mes no se duplica', async () => {
    const { bookMonthlyCheckout } = await import('./monthly-checkout.js');
    mem.checkouts.push({
      id: '55555555-5555-4555-8555-555555555555', nutritionist_id: 'nutri-1', patient_id: PATIENT, charge_id: 'charge-1',
      due_on: '2026-10-10', amount: 28000, status: 'expired', checkout_url: 'https://www.mercadopago.com.ar/checkout',
      provider_preference_id: 'pref-1', provider_payment_id: null, client_request_id: REQUEST, expires_at: '2020-01-01T00:00:00.000Z',
    });
    const payment = { id: '88', status: 'approved', transaction_amount: 28000, currency_id: 'ARS', collector_id: 'acc-1', external_reference: '55555555-5555-4555-8555-555555555555', date_approved: '2026-10-21T15:00:00.000Z' };
    expect(await bookMonthlyCheckout('nutri-1', 'acc-1', payment)).toBe(true);
    expect(await bookMonthlyCheckout('nutri-1', 'acc-1', payment)).toBe(true);
    expect(await bookMonthlyCheckout('nutri-1', 'acc-1', { ...payment, id: '89' })).toBe(true);
    expect(mem.payments).toHaveLength(1);
    expect(mem.payments[0]).toMatchObject({ source: 'checkout', provider_payment_id: '88', covers_due_on: '2026-10-10', method: 'mercado_pago' });
  });
});
