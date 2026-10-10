import { beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { app } from '../index.js';
import { resetStore } from '../store.js';
import { CONSENT_CATALOG } from '../intake/consent.js';

const patient = 'pat-sofia';
const base = `/api/patients/${patient}/care`;
const post = (path: string, body: unknown) => app.request(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const consent = (decision = 'granted') => {
  const entry = CONSENT_CATALOG.find((item) => item.purpose === 'measurement')!;
  return post(`/api/patients/${patient}/consents`, { purpose: entry.purpose, text_version: entry.text_version, text_hash: entry.text_hash, decision });
};
const batch = (items: Array<Record<string, unknown>>, captured_on = '2026-10-01') => ({ captured_on, items });
const item = (kind: string, value: number, id = randomUUID()) => ({ id, kind, value });

describe('mediciones del cuerpo cargadas por la profesional', () => {
  beforeEach(() => { resetStore(); });

  it('sin el permiso de medidas no guarda nada', async () => {
    expect((await post(`${base}/body-metrics`, batch([item('body_fat_pct', 27.5)]))).status).toBe(403);
    await consent();
    expect((await (await app.request(`${base}?audience=pro`)).json()).measurements).toEqual([]);
  });

  it('guarda varias métricas de una fecha y las devuelve en la ficha con su origen profesional', async () => {
    await consent();
    const response = await post(`${base}/body-metrics`, batch([item('body_fat_pct', 27.5), item('thigh', 55.5), item('height', 168)]));
    expect(response.status).toBe(200);
    const saved = (await response.json()).measurements;
    expect(saved).toHaveLength(3);
    const snapshot = await (await app.request(`${base}?audience=pro`)).json();
    expect(snapshot.measurements).toHaveLength(3);
    expect(snapshot.measurements.find((row: any) => row.kind === 'body_fat_pct')).toMatchObject({ value_numeric: 27.5, unit: '%', source: 'professional', captured_on: '2026-10-01' });
    expect(snapshot.measurements.find((row: any) => row.kind === 'height')).toMatchObject({ unit: 'cm' });
  });

  it('reintentar la misma carga no duplica y cambiar el valor con el mismo identificador se rechaza', async () => {
    await consent();
    const body = batch([item('arm', 31)]);
    expect((await post(`${base}/body-metrics`, body)).status).toBe(200);
    expect((await post(`${base}/body-metrics`, body)).status).toBe(200);
    expect((await (await app.request(`${base}?audience=pro`)).json()).measurements).toHaveLength(1);
    const changed = batch([{ ...body.items[0], value: 32 }]);
    expect((await post(`${base}/body-metrics`, changed)).status).toBe(409);
  });

  it('rechaza peso, cintura y cadera, valores fuera de rango, fechas futuras y campos de más', async () => {
    await consent();
    for (const kind of ['weight', 'waist', 'hip']) expect((await post(`${base}/body-metrics`, batch([item(kind, 60)]))).status).toBe(400);
    expect((await post(`${base}/body-metrics`, batch([item('body_water_pct', 5)]))).status).toBe(400);
    expect((await post(`${base}/body-metrics`, batch([item('arm', 30)], '2999-01-01'))).status).toBe(400);
    expect((await post(`${base}/body-metrics`, batch([{ ...item('arm', 30), unit: 'in' }]))).status).toBe(400);
  });

  it('al retirar el permiso las medidas dejan de leerse y la carga se rechaza', async () => {
    await consent();
    await post(`${base}/body-metrics`, batch([item('chest', 98)]));
    await consent('withdrawn');
    expect((await (await app.request(`${base}?audience=pro`)).json()).measurements).toEqual([]);
    expect((await post(`${base}/body-metrics`, batch([item('arm', 30)]))).status).toBe(403);
  });
});
