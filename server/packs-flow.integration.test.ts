import { beforeEach, describe, expect, it } from 'vitest';
import { app } from './index.js';
import { resetStore } from './store.js';
import { localBillingDate } from '../src/billing.js';
import type { PatientPack } from '../src/types/packs.js';
import type { PatientLedger } from '../src/types/fees.js';

function send(path: string, method: string, body?: unknown) {
  return app.request(path, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
}
const today = () => localBillingDate();

describe('paquetes de consultas en modo demo', () => {
  beforeEach(() => resetStore());

  it('Sofía arranca con su paquete de 3 seguimientos y una consulta usada', async () => {
    const response = await send('/api/patients/pat-sofia/packs', 'GET');
    expect(response.status).toBe(200);
    const { packs } = await response.json() as { packs: PatientPack[] };
    expect(packs[0]).toMatchObject({ name: 'Paquete de 3 seguimientos', sessions: 3 });
    expect(packs[0].uses).toHaveLength(1);
  });

  it('vender con cobro suma el cobro en Cobranzas y descontar llega hasta el total', async () => {
    const sold = await send('/api/patients/pat-lucia/packs', 'POST', { name: 'Pack x2', sessions: 2, amount: 50000, starts_on: today(), valid_days: 60, charge: true });
    expect(sold.status).toBe(201);
    const ledger = await (await send('/api/patients/pat-lucia/ledger', 'GET')).json() as { ledger: PatientLedger };
    expect(ledger.ledger.charges).toEqual(expect.arrayContaining([expect.objectContaining({ amount: 50000, concept: 'Paquete: Pack x2', kind: 'extra' })]));
    expect((await send('/api/patients/pat-lucia/packs/uses', 'POST', { used_on: today() })).status).toBe(201);
    const second = await send('/api/patients/pat-lucia/packs/uses', 'POST', { used_on: today(), note: 'Control' });
    const { packs } = await second.json() as { packs: PatientPack[] };
    expect(packs[0].uses).toHaveLength(2);
    expect((await send('/api/patients/pat-lucia/packs/uses', 'POST', { used_on: today() })).status).toBe(409);
    const undone = await send(`/api/patients/pat-lucia/packs/uses/${packs[0].uses[0].id}/void`, 'POST');
    expect(((await undone.json()) as { packs: PatientPack[] }).packs[0].uses).toHaveLength(1);
  });

  it('dar de baja deja de descontar', async () => {
    const { packs } = await (await send('/api/patients/pat-sofia/packs', 'GET')).json() as { packs: PatientPack[] };
    expect((await send(`/api/patients/pat-sofia/packs/${packs[0].id}/close`, 'POST')).status).toBe(200);
    expect((await send('/api/patients/pat-sofia/packs/uses', 'POST', { used_on: today() })).status).toBe(409);
  });

  it('no deja tocar el paquete desde otra ficha ni desde la vista de paciente', async () => {
    const { packs } = await (await send('/api/patients/pat-sofia/packs', 'GET')).json() as { packs: PatientPack[] };
    expect((await send(`/api/patients/pat-lucia/packs/${packs[0].id}/close`, 'POST')).status).toBe(404);
    expect((await send(`/api/patients/pat-lucia/packs/uses/${packs[0].uses[0].id}/void`, 'POST')).status).toBe(404);
    expect((await send('/api/patients/pat-sofia/packs?audience=patient', 'GET')).status).toBe(403);
  });

  it('la paciente ve su saldo en su app sin precio ni notas', async () => {
    const response = await send('/api/patients/pat-sofia/packs/own?audience=patient', 'GET');
    expect(response.status).toBe(200);
    const { packs } = await response.json() as { packs: Array<Record<string, unknown>> };
    expect(packs[0]).toMatchObject({ name: 'Paquete de 3 seguimientos', sessions: 3, used: 1, closed: false });
    expect(packs[0]).not.toHaveProperty('amount');
    expect(packs[0]).not.toHaveProperty('uses');
  });

  it('rechaza datos inválidos', async () => {
    for (const bad of [
      { name: '', sessions: 3, amount: 1000, starts_on: today(), valid_days: null, charge: false },
      { name: 'x', sessions: 0, amount: 1000, starts_on: today(), valid_days: null, charge: false },
      { name: 'x', sessions: 3, amount: 0, starts_on: today(), valid_days: null, charge: true },
      { name: 'x', sessions: 3, amount: 1000, starts_on: '2020-01-01', valid_days: null, charge: false },
      { name: 'x', sessions: 3, amount: 1000, starts_on: today(), valid_days: null, charge: false, extra: 1 },
    ]) expect((await send('/api/patients/pat-lucia/packs', 'POST', bad)).status).toBe(400);
  });
});
