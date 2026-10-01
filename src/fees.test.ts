import { describe, expect, it } from 'vitest';
import { formatPesos, reminderWhatsAppHref, summarizeLedger } from './fees';
import type { PatientLedger } from './types/fees';

const base: PatientLedger = {
  patient_id: 'p1',
  fee: { amount: 1000, first_due_on: '2026-07-10' },
  charges: [
    { id: 'c1', due_on: '2026-07-10', amount: 1000, status: 'open' },
    { id: 'c2', due_on: '2026-08-10', amount: 1000, status: 'open' },
    { id: 'c3', due_on: '2026-09-10', amount: 1000, status: 'open' },
    { id: 'c4', due_on: '2026-10-10', amount: 1000, status: 'open' },
  ],
  payments: [],
};

function pay(amount: number, status: 'confirmed' | 'reported' | 'voided' = 'confirmed', paid_on = '2026-09-15') {
  return { id: `${amount}-${status}`, amount, paid_on, method: 'efectivo' as const, note: '', status, reported_by_patient: status === 'reported', created_at: `${paid_on}T10:00:00Z` };
}

describe('resumen de la cuenta de una paciente', () => {
  it('suma lo vencido impago y marca desde cuándo debe', () => {
    const summary = summarizeLedger(base, '2026-09-20');
    expect(summary).toMatchObject({ state: 'debe', owed: 3000, debt_since: '2026-07-10', next_due: { due_on: '2026-10-10', amount: 1000 } });
  });

  it('aplica los pagos a las cuotas más viejas, también parciales', () => {
    const summary = summarizeLedger({ ...base, payments: [pay(1500)] }, '2026-09-20');
    expect(summary.owed).toBe(1500);
    expect(summary.debt_since).toBe('2026-08-10');
    expect(summary.charges.map((charge) => charge.paid)).toEqual([1000, 500, 0, 0]);
  });

  it('ignora avisos sin confirmar y pagos anulados, pero los cuenta como pendientes', () => {
    const summary = summarizeLedger({ ...base, payments: [pay(3000, 'reported'), pay(3000, 'voided')] }, '2026-09-20');
    expect(summary.owed).toBe(3000);
    expect(summary.pending_reports).toBe(1);
  });

  it('está al día o por vencer según la próxima cuota', () => {
    expect(summarizeLedger({ ...base, payments: [pay(3000)] }, '2026-09-20').state).toBe('al_dia');
    expect(summarizeLedger({ ...base, payments: [pay(3000)] }, '2026-10-05').state).toBe('por_vencer');
    expect(summarizeLedger({ ...base, payments: [pay(3500)] }, '2026-10-05')).toMatchObject({ state: 'por_vencer', next_due: { amount: 500 } });
  });

  it('una cuota perdonada no se cobra', () => {
    const waived = { ...base, charges: base.charges.map((charge) => charge.id === 'c1' ? { ...charge, status: 'waived' as const } : charge) };
    expect(summarizeLedger(waived, '2026-09-20')).toMatchObject({ owed: 2000, debt_since: '2026-08-10' });
  });

  it('sin cuota ni movimientos queda "sin cuota"; lo pagado de más es saldo a favor', () => {
    expect(summarizeLedger({ patient_id: 'p', fee: null, charges: [], payments: [] }, '2026-09-20').state).toBe('sin_cuota');
    expect(summarizeLedger({ patient_id: 'p', fee: null, charges: [], payments: [pay(500)] }, '2026-09-20').credit).toBe(500);
  });

  it('suma lo cobrado en el mes', () => {
    expect(summarizeLedger({ ...base, payments: [pay(1000, 'confirmed', '2026-09-01'), pay(700, 'confirmed', '2026-08-30')] }, '2026-09-20').paid_this_month).toBe(1000);
  });

  it('formatea pesos y arma el recordatorio', () => {
    expect(formatPesos(30000).replace(/\s/g, ' ')).toMatch(/\$ ?30\.000/);
    const href = reminderWhatsAppHref({ patientName: 'Marina López', owed: 28000, alias: 'vero.nutricion' });
    expect(href.startsWith('https://wa.me/?text=')).toBe(true);
    expect(decodeURIComponent(href)).toContain('Hola Marina');
    expect(decodeURIComponent(href)).toContain('vero.nutricion');
  });
});
