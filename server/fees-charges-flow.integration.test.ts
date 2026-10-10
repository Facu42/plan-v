import { beforeEach, describe, expect, it } from 'vitest';
import { app } from './index.js';
import { resetStore } from './store.js';
import { summarizeLedger } from '../src/fees.js';
import { localBillingDate } from '../src/billing.js';
import type { BillingBoard, PatientLedger } from '../src/types/fees.js';

function send(path: string, method: string, body?: unknown) {
  return app.request(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const inDays = (days: number) => {
  const date = new Date(`${localBillingDate()}T12:00:00`);
  date.setDate(date.getDate() + days);
  return localBillingDate(date);
};

describe('cobros por paciente en modo demo: nuevo cobro, programas y link', () => {
  beforeEach(() => resetStore());

  it('«Nuevo cobro» suma un cobro suelto con su concepto a la cuenta de la paciente', async () => {
    const response = await send('/api/patients/pat-lucia/charges', 'POST', { amount: 18000, due_on: inDays(-1), concept: 'Consulta de control' });
    expect(response.status).toBe(201);
    const { ledger } = await response.json() as { ledger: PatientLedger };
    expect(ledger.charges).toHaveLength(1);
    expect(ledger.charges[0]).toMatchObject({ amount: 18000, concept: 'Consulta de control', kind: 'extra', status: 'open' });
    expect(summarizeLedger(ledger).owed).toBe(18000);
  });

  it('dos cobros sueltos el mismo día conviven y el cobro suelto se puede perdonar', async () => {
    await send('/api/patients/pat-lucia/charges', 'POST', { amount: 5000, due_on: inDays(3), concept: 'Pesaje' });
    const second = await send('/api/patients/pat-lucia/charges', 'POST', { amount: 7000, due_on: inDays(3), concept: 'Plan de comidas' });
    const { ledger } = await second.json() as { ledger: PatientLedger };
    expect(ledger.charges.map((charge) => charge.concept).sort()).toEqual(['Pesaje', 'Plan de comidas']);
    const waived = await send(`/api/charges/${ledger.charges[0].id}`, 'PATCH', { waived: true });
    expect(waived.status).toBe(200);
  });

  it('cambiar la cuota mensual no borra un cobro suelto futuro', async () => {
    await send('/api/patients/pat-lucia/charges', 'POST', { amount: 9000, due_on: inDays(10), concept: 'Taller' });
    const response = await send('/api/patients/pat-lucia/fee', 'PUT', { fee: { amount: 25000, first_due_on: localBillingDate() } });
    const { ledger } = await response.json() as { ledger: PatientLedger };
    expect(ledger.charges.some((charge) => charge.kind === 'extra' && charge.concept === 'Taller')).toBe(true);
    expect(ledger.charges.filter((charge) => charge.kind !== 'extra').length).toBeGreaterThan(0);
  });

  it('la paciente no puede crear cobros ni programas', async () => {
    expect((await send('/api/patients/pat-lucia/charges?audience=patient', 'POST', { amount: 1, due_on: inDays(1), concept: 'x' })).status).toBe(403);
    expect((await send('/api/billing/programs?audience=patient', 'POST', { name: 'Plan', amount: 1 })).status).toBe(403);
    expect((await send('/api/patients/pat-lucia/program?audience=patient', 'PUT', { program_id: null })).status).toBe(403);
  });

  it('rechaza cobros inválidos', async () => {
    const bad = [
      { amount: 0, due_on: inDays(1), concept: 'x' },
      { amount: 100, due_on: 'ayer', concept: 'x' },
      { amount: 100, due_on: inDays(1), concept: '' },
      { amount: 100, due_on: inDays(1), concept: 'x'.repeat(81) },
      { amount: 100, due_on: inDays(5000), concept: 'x' },
    ];
    for (const body of bad) expect((await send('/api/patients/pat-lucia/charges', 'POST', body)).status).toBe(400);
    expect((await send('/api/patients/missing/charges', 'POST', { amount: 100, due_on: inDays(1), concept: 'x' })).status).toBe(404);
  });

  it('«Asignar programa»: se arma un programa y se asigna; la cuota toma su monto', async () => {
    const created = await send('/api/billing/programs', 'POST', { name: 'Plan trimestral', amount: 45000 });
    expect(created.status).toBe(201);
    const { programs } = await created.json() as { programs: Array<{ id: string; name: string; amount: number }> };
    expect(programs).toEqual([expect.objectContaining({ name: 'Plan trimestral', amount: 45000 })]);

    const assigned = await send('/api/patients/pat-lucia/program', 'PUT', { program_id: programs[0].id, first_due_on: localBillingDate() });
    expect(assigned.status).toBe(200);
    const { ledger } = await assigned.json() as { ledger: PatientLedger };
    expect(ledger.fee).toMatchObject({ amount: 45000, program_name: 'Plan trimestral' });

    const board = (await (await send('/api/billing', 'GET')).json() as { board: BillingBoard }).board;
    expect(board.programs).toHaveLength(1);
    expect(board.patients.find((patient) => patient.patient_id === 'pat-lucia')?.fee?.program_name).toBe('Plan trimestral');
  });

  it('borrar un programa no toca la cuota de quienes ya lo tienen; quitar el programa saca la cuota', async () => {
    const { programs } = await (await send('/api/billing/programs', 'POST', { name: 'Plan mensual', amount: 30000 })).json() as { programs: Array<{ id: string }> };
    await send('/api/patients/pat-lucia/program', 'PUT', { program_id: programs[0].id, first_due_on: localBillingDate() });
    const removed = await send(`/api/billing/programs/${programs[0].id}`, 'DELETE');
    expect(removed.status).toBe(200);
    expect(((await removed.json()) as { programs: unknown[] }).programs).toEqual([]);
    const ledger = (await (await send('/api/patients/pat-lucia/ledger', 'GET')).json() as { ledger: PatientLedger }).ledger;
    expect(ledger.fee?.amount).toBe(30000);

    const cleared = await send('/api/patients/pat-lucia/program', 'PUT', { program_id: null });
    expect(((await cleared.json()) as { ledger: PatientLedger }).ledger.fee).toBeNull();
  });

  it('rechaza programas inválidos y asignar uno que no existe', async () => {
    expect((await send('/api/billing/programs', 'POST', { name: '', amount: 10 })).status).toBe(400);
    expect((await send('/api/billing/programs', 'POST', { name: 'Plan', amount: -1 })).status).toBe(400);
    expect((await send('/api/patients/pat-lucia/program', 'PUT', { program_id: '00000000-0000-4000-8000-000000000000', first_due_on: localBillingDate() })).status).toBe(404);
  });

  it('un programa con el mismo nombre se actualiza en vez de duplicarse', async () => {
    await send('/api/billing/programs', 'POST', { name: 'Plan', amount: 10000 });
    const again = await send('/api/billing/programs', 'POST', { name: 'plan', amount: 12000 });
    const { programs } = await again.json() as { programs: Array<{ name: string; amount: number }> };
    expect(programs).toHaveLength(1);
    expect(programs[0].amount).toBe(12000);
  });
});
