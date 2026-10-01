import { beforeEach, describe, expect, it } from 'vitest';
import { app } from './index.js';
import { resetStore } from './store.js';
import { summarizeLedger } from '../src/fees.js';
import { localBillingDate } from '../src/billing.js';
import type { BillingBoard, PatientLedger, PatientLedgerView } from '../src/types/fees.js';

function send(path: string, method: string, body?: unknown) {
  return app.request(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe('cobranzas en modo demo', () => {
  beforeEach(() => resetStore());

  it('el tablero trae los ejemplos: Sofía al día, Marina debe, Lucía sin cuota', async () => {
    const response = await send('/api/billing', 'GET');
    expect(response.status).toBe(200);
    const { board } = await response.json() as { board: BillingBoard };
    const byId = new Map(board.patients.map((patient) => [patient.patient_id, summarizeLedger(patient)]));
    expect(byId.get('pat-sofia')?.state).not.toBe('debe');
    expect(byId.get('pat-marina')?.state).toBe('debe');
    expect(byId.get('pat-lucia')?.state).toBe('sin_cuota');
    expect(board.settings.alias).toBe('vero.nutricion');
  });

  it('registrar un pago salda la deuda de Marina', async () => {
    const { board } = await (await send('/api/billing', 'GET')).json() as { board: BillingBoard };
    const owed = summarizeLedger(board.patients.find((patient) => patient.patient_id === 'pat-marina')!).owed;
    const response = await send('/api/patients/pat-marina/payments', 'POST', { amount: owed, paid_on: localBillingDate(), method: 'efectivo' });
    expect(response.status).toBe(201);
    const { ledger } = await response.json() as { ledger: PatientLedger };
    expect(summarizeLedger(ledger).owed).toBe(0);
  });

  it('la paciente avisa que pagó y la nutricionista lo confirma', async () => {
    const reported = await send('/api/patients/pat-marina/payments?audience=patient', 'POST', { amount: 28000, paid_on: localBillingDate(), method: 'transferencia', note: 'Comprobante por WhatsApp' });
    expect(reported.status).toBe(201);
    const { ledger } = await reported.json() as { ledger: PatientLedgerView };
    const report = ledger.payments.find((payment) => payment.status === 'reported')!;
    expect(report.reported_by_patient).toBe(true);
    expect(ledger.payment_info?.alias).toBe('vero.nutricion');

    expect((await send(`/api/payments/${report.id}?audience=patient`, 'PATCH', { decision: 'confirm' })).status).toBe(403);
    const confirmed = await send(`/api/payments/${report.id}`, 'PATCH', { decision: 'confirm' });
    const after = (await confirmed.json() as { ledger: PatientLedger }).ledger;
    expect(after.payments.find((payment) => payment.id === report.id)?.status).toBe('confirmed');
    expect((await send(`/api/payments/${report.id}`, 'PATCH', { decision: 'confirm' })).status).toBe(400);
  });

  it('fija y quita la cuota de una paciente', async () => {
    const set = await send('/api/patients/pat-lucia/fee', 'PUT', { fee: { amount: 25000, first_due_on: localBillingDate() } });
    expect(set.status).toBe(200);
    const { ledger } = await set.json() as { ledger: PatientLedger };
    expect(ledger.fee?.amount).toBe(25000);
    expect(ledger.charges).toHaveLength(2);
    expect(summarizeLedger(ledger).state).toBe('debe');

    const removed = await send('/api/patients/pat-lucia/fee', 'PUT', { fee: null });
    expect((await removed.json() as { ledger: PatientLedger }).ledger.fee).toBeNull();
  });

  it('la paciente no ve el tablero ni cambia la cuota', async () => {
    expect((await send('/api/billing?audience=patient', 'GET')).status).toBe(403);
    expect((await send('/api/patients/pat-lucia/fee?audience=patient', 'PUT', { fee: null })).status).toBe(403);
    expect((await send('/api/billing/settings?audience=patient', 'PUT', { default_fee: 1, alias: '', payment_link: '', instructions: '' })).status).toBe(403);
  });

  it('rechaza datos inválidos', async () => {
    expect((await send('/api/patients/pat-marina/payments', 'POST', { amount: -5, paid_on: localBillingDate(), method: 'efectivo' })).status).toBe(400);
    expect((await send('/api/patients/pat-marina/payments', 'POST', { amount: 5, paid_on: 'ayer', method: 'efectivo' })).status).toBe(400);
    expect((await send('/api/billing/settings', 'PUT', { default_fee: null, alias: '', payment_link: 'http://x.test', instructions: '' })).status).toBe(400);
    expect((await send('/api/patients/missing/ledger', 'GET')).status).toBe(404);
  });
});
