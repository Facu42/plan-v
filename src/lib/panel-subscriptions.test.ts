import { describe, expect, it } from 'vitest';
import { formatFeeDate, formatPesos } from '../fees';
import type { PatientSubscription, SubscriptionPlan } from '../types/subscriptions';
import { debitPerson, debitState, debitSummary, debitTone, extraProgramNames, filterDebits, monthlyLabel, nextChargeLabel, payerEmailError, planDraftError, subscriptionConcept } from './panel-subscriptions';

function sub(patch: Partial<PatientSubscription> = {}): PatientSubscription {
  return {
    id: 'sub-1', plan_id: 'plan-1', plan_name: 'Seguimiento mensual', patient_id: 'camila', contact_name: null,
    payer_email_masked: 'ca•••@correo.com', source: 'panel', status: 'authorized', payment_state: 'ok', cancelled_by: null,
    amount_cents: 5_400_000, pending_amount_cents: null, pending_amount_on: null, next_payment_date: '2026-11-10',
    init_point: 'https://pago.example/camila', revision: 1, review_required: false, account_mismatch: false,
    expires_at: null, created_at: '2026-10-10T12:00:00Z', ...patch,
  };
}

const plan = (patch: Partial<SubscriptionPlan> = {}): SubscriptionPlan => ({
  id: 'plan-1', name: 'Seguimiento mensual', description: null, amount_cents: 5_400_000, currency: 'ARS',
  frequency: 1, frequency_type: 'months', public_visible: false, status: 'active', revision: 1, ...patch,
});

const draft = { name: 'Seguimiento mensual', pesos: '54000', description: 'Dos consultas', visible: true };

describe('débitos del panel', () => {
  it('muestra el precio mensual en pesos enteros', () => {
    expect(monthlyLabel(5_400_000)).toBe(`${formatPesos(54000)} por mes`);
  });

  it('resume activas, pendientes y rechazados', () => {
    expect(debitSummary({ active: 1, pending: 1, problems: 2, unlinked: 0 })).toBe('1 activa · 1 esperando el primer pago · 2 con pago rechazado');
  });

  it('separa al día de los problemas y de las que no tienen ficha', () => {
    const ok = sub();
    const rejected = sub({ id: 'sub-2', patient_id: 'brenda', payment_state: 'rejected' });
    const retrying = sub({ id: 'sub-3', payment_state: 'retrying' });
    const loose = sub({ id: 'sub-4', patient_id: null, contact_name: 'Ana Paz', status: 'pending', payment_state: null });
    const closed = sub({ id: 'sub-5', patient_id: null, status: 'cancelled', payment_state: null });
    const rows = [ok, rejected, retrying, loose, closed];
    expect(filterDebits(rows, 'al_dia').map(row => row.id)).toEqual(['sub-1']);
    expect(filterDebits(rows, 'problemas').map(row => row.id)).toEqual(['sub-2', 'sub-3']);
    expect(filterDebits(rows, 'sin_ficha').map(row => row.id)).toEqual(['sub-4']);
    expect(debitTone(rejected)).toBe('problema');
    expect(debitState(ok)).toBe('Al día');
    expect(debitState(sub({ payment_state: 'retrying' }))).toBe('Pago rechazado · Mercado Pago reintenta');
    expect(debitState(sub({ status: 'paused', payment_state: null }))).toBe('En pausa');
    expect(debitState(sub({ status: 'cancelled', cancelled_by: 'patient', payment_state: null }))).toBe('Cancelada por la paciente');
    expect(debitPerson(loose, [])).toBe('Ana Paz');
    expect(nextChargeLabel('2026-11-10')).toBe(`Próximo cobro ${formatFeeDate('2026-11-10')}`);
    expect(nextChargeLabel(null)).toBe('Sin fecha de cobro');
  });

  it('incluye en problemas un débito que hay que revisar', () => {
    const uncertain = sub({ id: 'sub-6', status: 'uncertain', payment_state: null, review_required: true });
    expect(filterDebits([uncertain], 'problemas')).toHaveLength(1);
    expect(filterDebits([uncertain], 'al_dia')).toHaveLength(0);
  });

  it('valida el plan y el correo antes de mandarlos', () => {
    expect(planDraftError(draft)).toBe('');
    expect(planDraftError({ ...draft, name: 'A' })).toContain('2 y 60');
    expect(planDraftError({ ...draft, pesos: '54.000' })).toContain('sin centavos');
    expect(planDraftError({ ...draft, pesos: '999' })).toContain('1.000');
    expect(planDraftError({ ...draft, description: 'x'.repeat(281) })).toContain('demasiado largo');
    expect(payerEmailError('camila@correo.com')).toBe('');
    expect(payerEmailError('camila')).toContain('correo');
  });

  it('marca el cobro del débito y suma los planes que todavía no son una cuota', () => {
    expect(subscriptionConcept('Seguimiento mensual', 'subscription')).toBe('Débito automático · Seguimiento mensual');
    expect(subscriptionConcept('Débito automático · octubre', 'subscription')).toBe('Débito automático · octubre');
    expect(subscriptionConcept('Septiembre')).toBe('Septiembre');
    expect(subscriptionConcept('')).toBe('Pago registrado');
    expect(extraProgramNames([{ name: 'Mensual' }], [plan(), plan({ id: 'plan-2', name: 'Mensual', status: 'active' }), plan({ id: 'plan-3', name: 'Archivado', status: 'archived' })])).toEqual(['Seguimiento mensual']);
  });
});
