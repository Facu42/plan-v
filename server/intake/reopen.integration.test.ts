import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../index.js';
import { CONSENT_CATALOG } from './consent.js';
import { listIntakeRevisionHistory, resetIntakeMemory } from './memory.js';
import { resetStore } from '../store.js';
const path = '/api/patients/pat-sofia/intake';
const call = (url: string, data?: unknown, method = data === undefined ? 'GET' : 'POST') => app.request(url, { method, headers: { 'Content-Type': 'application/json' }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
async function reviewed() {
  await call(path, { expected_revision: 1, step: 'allergies', payload: { preferred_name: 'Sofi', allergies: { state: 'reported', items: ['Maní'] }, patient_intent: 'Mi pedido' } }, 'PATCH');
  const care = CONSENT_CATALOG.find(c => c.purpose === 'care_relationship')!;
  await call('/api/patients/pat-sofia/consents', { purpose: care.purpose, text_version: care.text_version, text_hash: care.text_hash, decision: 'granted' });
  expect((await call(`${path}/submit`, { expected_revision: 2 })).status).toBe(200);
  expect((await call(`${path}/review`, { expected_revision: 3 })).status).toBe(200);
  return (await call(path)).json();
}
describe('reapertura explícita de ficha enviada', () => {
  beforeEach(() => { resetStore(); resetIntakeMemory(); });
  it('conserva datos, consentimiento e historial privado revisado y permite corregir y volver a enviar', async () => {
    const before = await reviewed();
    const response = await call(`${path}/reopen`, { expected_revision: before.intake.revision }); expect(response.status).toBe(200);
    const opened = await response.json();
    expect(opened.intake).toMatchObject({ status: 'draft', step: 'profile', revision: 5, payload: before.intake.payload }); expect(opened.consents).toEqual(before.consents);
    expect(opened).not.toHaveProperty('history'); expect(opened.intake).not.toHaveProperty('reviewed_by');
    expect(listIntakeRevisionHistory('pat-sofia')[0]).toMatchObject({ status: 'reviewed', revision: 4, payload: before.intake.payload, reviewed_by: 'demo-nutri' });
    expect((await call(`${path}/submit`, { expected_revision: 2 })).status).toBe(409);
    expect((await call(path, { expected_revision: 5, payload: { ...opened.intake.payload, preferred_name: 'Sofía corregida' } }, 'PATCH')).status).toBe(200);
    expect((await call(`${path}/submit`, { expected_revision: 6 })).status).toBe(200);
    const persisted = await (await call(path)).json(); expect(persisted.intake).toMatchObject({ status: 'submitted', revision: 7, payload: { preferred_name: 'Sofía corregida', allergies: { items: ['Maní'] } } });
    expect(listIntakeRevisionHistory('pat-sofia')[0].payload.preferred_name).toBe('Sofi');
  });
  it('sólo una sesión abre una revisión cerrada y las otras deben recuperar el estado actual', async () => {
    await reviewed();
    const results = await Promise.all([call(`${path}/reopen`, { expected_revision: 4 }), call(`${path}/reopen`, { expected_revision: 4 })]);
    expect(results.map(r => r.status).sort()).toEqual([200, 409]); expect(listIntakeRevisionHistory('pat-sofia')).toHaveLength(1);
    expect((await call(`${path}/reopen`, { expected_revision: 5 })).status).toBe(200); expect(listIntakeRevisionHistory('pat-sofia')).toHaveLength(1);
  });
  it('requiere revisión y no inventa historial al abrir un borrador inicial', async () => {
    expect((await call(`${path}/reopen`, {})).status).toBe(400);
    expect((await call(`${path}/reopen`, { expected_revision: 1 })).status).toBe(200);
    expect(listIntakeRevisionHistory('pat-sofia')).toEqual([]);
  });
});
