import { describe, expect, it } from 'vitest';
import type { PatientLedger } from '../types/fees';
import { feeBookResult, feeMonthTitle, feePreferenceBody, monthIsCovered, payableFeeCharges } from './fee-checkout';

const checkout = { id: 'c1', due_on: '2026-10-10', amount: 28000, status: 'ready' as const };

describe('pago único de la cuota', () => {
  it('arma la preferencia sin comisión y con el aviso general', () => {
    const body = feePreferenceBody({
      id: '11111111-1111-4111-8111-111111111111',
      title: 'Cuota de octubre 2026',
      amountPesos: 28000,
      notificationUrl: 'https://plan.v/api/public/scheduling/mp/webhook/',
      patientId: '22222222-2222-4222-8222-222222222222',
    });
    expect(body.notification_url.endsWith('/api/public/scheduling/mp/webhook/')).toBe(true);
    expect(body.external_reference).toBe(body.items[0].id);
    expect(body.items[0]).toMatchObject({ currency_id: 'ARS', unit_price: 28000, title: 'Cuota de octubre 2026' });
    expect(JSON.stringify(body)).not.toContain('marketplace_fee');
    expect(JSON.stringify(body)).not.toContain('application_fee');
    expect(feeMonthTitle('2026-10-10')).toBe('Cuota de Octubre 2026');
  });

  it('anota el pago una sola vez, también si el enlace venció o el mes ya está cubierto', () => {
    const payment = { status: 'approved', transaction_amount: 28000, currency_id: 'ARS', collector_id: 'acc-1' };
    expect(feeBookResult({ checkout, payment, accountId: 'acc-1', existing: null, monthPaid: false })).toBe('confirm');
    expect(feeBookResult({ checkout: { ...checkout, status: 'expired' }, payment, accountId: 'acc-1', existing: null, monthPaid: false })).toBe('confirm');
    expect(feeBookResult({ checkout, payment, accountId: 'acc-1', existing: { status: 'confirmed' }, monthPaid: false })).toBe('duplicate');
    expect(feeBookResult({ checkout: { ...checkout, status: 'paid' }, payment: { ...payment }, accountId: 'acc-1', existing: null, monthPaid: false })).toBe('duplicate');
    expect(feeBookResult({ checkout, payment, accountId: 'acc-1', existing: null, monthPaid: true })).toBe('duplicate');
    expect(feeBookResult({ checkout, payment: { ...payment, status: 'refunded' }, accountId: 'acc-1', existing: { status: 'confirmed' }, monthPaid: true })).toBe('void');
    expect(feeBookResult({ checkout, payment: { ...payment, transaction_amount: 1 }, accountId: 'acc-1', existing: null, monthPaid: false })).toBe('skip');
    expect(feeBookResult({ checkout, payment: { ...payment, collector_id: 'otra' }, accountId: 'acc-1', existing: null, monthPaid: false })).toBe('skip');
    expect(feeBookResult({ checkout: null, payment, accountId: 'acc-1', existing: null, monthPaid: false })).toBe('ignore');
  });

  it('ofrece los meses abiertos y no un cobro suelto', () => {
    const ledger: PatientLedger = {
      patient_id: 'p',
      fee: { amount: 28000, first_due_on: '2026-09-10' },
      charges: [
        { id: 'a', due_on: '2026-09-10', amount: 28000, status: 'open' },
        { id: 'b', due_on: '2026-10-10', amount: 28000, status: 'open' },
        { id: 'c', due_on: '2026-10-20', amount: 5000, status: 'open', kind: 'extra', concept: 'Taller' },
      ],
      payments: [],
    };
    expect(payableFeeCharges(ledger, '2026-10-21').map(item => item.due_on)).toEqual(['2026-09-10', '2026-10-10']);
    expect(monthIsCovered(ledger, '2026-10-10', '2026-10-21')).toBe(false);
  });
});
