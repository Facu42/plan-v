import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../index.js';
import { resetStore } from '../store.js';
import { appendConsent } from '../intake/memory.js';
import { CONSENT_CATALOG } from '../intake/consent.js';
import { resetPatientHistoryMemory } from './patient-history.js';

const base = '/api/crm/patients/pat-sofia/history';
const json = { 'content-type': 'application/json' };
const consent = CONSENT_CATALOG.find(c => c.purpose === 'care_relationship')!;
const conceder = (decision: 'granted' | 'withdrawn') => appendConsent('pat-sofia', { purpose: consent.purpose, text_version: consent.text_version, text_hash: consent.text_hash, decision, actor_id: 'patient-demo' });
type Entry = { id: string; topic: string; text: string; since: string; source: string; recorded_on: string; edited_on: string | null; ended_on: string | null; ended_reason: string };
const entries = async (response: Response) => (await response.json() as { entries: Entry[] }).entries;
const post = (body: unknown) => app.request(base, { method: 'POST', headers: json, body: JSON.stringify(body) });

describe('Historia clínica por temas (demo en memoria)', () => {
  beforeEach(() => { resetStore(); resetPatientHistoryMemory(); conceder('granted'); });

  it('empieza vacía, agrega un dato con fecha de hoy y origen «profesional»', async () => {
    expect(await entries(await app.request(base))).toEqual([]);
    const [uno] = await entries(await post({ topic: 'diag', text: ' Celiaquía, con biopsia ', since: 'desde 2019' }));
    expect(uno).toMatchObject({ topic: 'diag', text: 'Celiaquía, con biopsia', since: 'desde 2019', source: 'professional', edited_on: null, ended_on: null });
    expect(uno!.recorded_on).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('edita un dato y deja la fecha de la edición', async () => {
    const [dato] = await entries(await post({ topic: 'sue', text: 'Duerme 6 h' }));
    const [editado] = await entries(await app.request(`${base}/${dato!.id}`, { method: 'PATCH', headers: json, body: JSON.stringify({ text: 'Duerme 7 h' }) }));
    expect(editado).toMatchObject({ text: 'Duerme 7 h' });
    expect(editado!.edited_on).not.toBeNull();
  });

  it('dar de baja no borra: el dato queda con fecha y motivo, y ya no se puede cambiar', async () => {
    const [dato] = await entries(await post({ topic: 'med', text: 'Sin suplementos' }));
    const [baja] = await entries(await app.request(`${base}/${dato!.id}/end`, { method: 'POST', headers: json, body: JSON.stringify({ reason: 'empezó hierro' }) }));
    expect(baja).toMatchObject({ text: 'Sin suplementos', ended_reason: 'empezó hierro' });
    expect(baja!.ended_on).not.toBeNull();
    expect((await app.request(`${base}/${dato!.id}`, { method: 'PATCH', headers: json, body: JSON.stringify({ text: 'otra cosa' }) })).status).toBe(409);
  });

  it('rechaza temas inventados, textos vacíos o largos y campos de más', async () => {
    expect((await post({ topic: 'inventado', text: 'x' })).status).toBe(400);
    expect((await post({ topic: 'diag', text: '   ' })).status).toBe(400);
    expect((await post({ topic: 'diag', text: 'x'.repeat(601) })).status).toBe(400);
    expect((await post({ topic: 'diag', text: 'x', source: 'recording' })).status).toBe(400);
  });

  it('sin el permiso de atención de la paciente no lee ni escribe', async () => {
    conceder('withdrawn');
    expect((await app.request(base)).status).toBe(403);
    expect((await post({ topic: 'diag', text: 'x' })).status).toBe(403);
  });

  it('no deja tocar a una paciente de otro consultorio ni un dato que no existe', async () => {
    expect((await app.request('/api/crm/patients/no-existe/history')).status).toBe(403);
    expect((await app.request(`${base}/no-existe`, { method: 'PATCH', headers: json, body: JSON.stringify({ text: 'x' }) })).status).toBe(404);
  });
});
