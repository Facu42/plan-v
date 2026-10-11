import { beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { app } from '../index.js';
import { getPatient, resetStore } from '../store.js';
import { CONSENT_CATALOG, type ConsentPurpose } from '../intake/consent.js';

const patient = 'pat-sofia';
const post = (path: string, body: unknown, method = 'POST') => app.request(path, {
  method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});
const base = `/api/patients/${patient}/care`;

async function consent(purpose: ConsentPurpose) {
  const item = CONSENT_CATALOG.find((entry) => entry.purpose === purpose)!;
  return post(`/api/patients/${patient}/consents`, {
    purpose, text_version: item.text_version, text_hash: item.text_hash, decision: 'granted',
  });
}

describe('corregir una medida propia', () => {
  beforeEach(() => { resetStore(); });

  it('corrige o borra la medida sin revisar y, si ya fue revisada, sólo pide la corrección', async () => {
    await consent('measurement');
    const id = randomUUID();
    expect((await post(`${base}/records`, { id, recorded_on: '2026-09-10', data: { kind: 'weight', value: 64.5, note: '' } })).status).toBe(200);
    expect((await post(`${base}/records/${id}/correct`, { value: 63.2 })).status).toBe(200);
    const open = await (await app.request(base)).json() as { measurements: Array<{ id: string; value_numeric: number }> };
    expect(open.measurements.find((row) => row.id === id)?.value_numeric).toBe(63.2);

    const extra = randomUUID();
    await post(`${base}/records`, { id: extra, recorded_on: '2026-09-11', data: { kind: 'waist', value: 80, note: '' } });
    expect((await app.request(`${base}/records/${extra}`, { method: 'DELETE' })).status).toBe(200);
    const afterDelete = await (await app.request(base)).json() as { records: Array<{ id: string }> };
    expect(afterDelete.records.some((row) => row.id === extra)).toBe(false);

    expect((await post(`${base}/records/${id}/review`, {}, 'PATCH')).status).toBe(200);
    expect((await post(`${base}/records/${id}/correct`, { value: 70 })).status).toBe(409);
    expect((await app.request(`${base}/records/${id}`, { method: 'DELETE' })).status).toBe(409);
    const clientId = '44444444-4444-4444-8444-444444444444';
    expect((await post(`${base}/records/${id}/correction-request`, { note: 'La balanza estaba mal', client_id: clientId })).status).toBe(200);
    expect((await post(`${base}/records/${id}/correction-request`, { note: 'La balanza estaba mal', client_id: clientId })).status).toBe(200);
    const messages = getPatient(patient)!.messages.filter((row) => row.text.includes('Quiero corregir una medida ya revisada'));
    expect(messages).toHaveLength(1);
    expect(messages[0].text).toContain('Peso');
    expect(messages[0].text).toContain('La balanza estaba mal');
    const kept = await (await app.request(base)).json() as { measurements: Array<{ id: string; value_numeric: number }> };
    expect(kept.measurements.find((row) => row.id === id)?.value_numeric).toBe(63.2);
  });

  it('no corrige una medida cargada por la nutricionista', async () => {
    await consent('measurement');
    const id = randomUUID();
    expect((await post(`${base}/records`, {
      id, recorded_on: '2026-09-10', data: { kind: 'weight', value: 70, source: 'professional', note: '' },
    })).status).toBe(200);
    expect((await post(`${base}/records/${id}/correct`, { value: 60 })).status).toBe(403);
    expect((await app.request(`${base}/records/${id}`, { method: 'DELETE' })).status).toBe(403);
  });
});
