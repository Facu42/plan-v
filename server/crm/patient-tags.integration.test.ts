import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../index.js';
import { resetStore } from '../store.js';
import { resetPatientTagsMemory } from './patient-tags.js';

const base = '/api/crm/patients/pat-sofia/tags';
const post = (label: unknown, tone?: string) => app.request(base, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ label, ...(tone ? { tone } : {}) }) });
const tags = async (response: Response) => (await response.json() as { tags: { id: string; label: string; tone: string }[] }).tags;

describe('Etiquetas de la paciente (demo en memoria)', () => {
  beforeEach(() => { resetStore(); resetPatientTagsMemory(); });

  it('empieza sin etiquetas, agrega y quita', async () => {
    expect(await tags(await app.request(base))).toEqual([]);
    const [uno] = await tags(await post('Deportista', 'a'));
    expect(uno).toMatchObject({ label: 'Deportista', tone: 'a' });
    expect(await tags(await app.request(base))).toHaveLength(1);
    expect(await tags(await app.request(`${base}/${uno!.id}`, { method: 'DELETE' }))).toEqual([]);
  });

  it('no repite una etiqueta aunque cambien mayúsculas o espacios', async () => {
    await post('Running');
    expect(await tags(await post('  running '))).toHaveLength(1);
  });

  it('rechaza etiquetas vacías o largas y pone un tope de ocho', async () => {
    expect((await post('   ')).status).toBe(400);
    expect((await post('x'.repeat(31))).status).toBe(400);
    for (let i = 0; i < 8; i++) expect((await post(`Etiqueta ${i}`)).status).toBe(200);
    expect((await post('Una más')).status).toBe(409);
  });

  it('no deja tocar a una paciente de otro consultorio', async () => {
    expect((await app.request('/api/crm/patients/no-existe/tags')).status).toBe(403);
    expect((await app.request('/api/crm/patients/no-existe/tags', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ label: 'X' }) })).status).toBe(403);
  });

  it('arma los grupos con las pacientes de cada etiqueta', async () => {
    expect(await (await app.request('/api/crm/tag-groups')).json()).toEqual({ groups: [] });
    await post('Running'); await post('celíacas');
    expect((await app.request('/api/crm/patients/pat-marina/tags', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ label: ' running' }) })).status).toBe(200);
    const { groups } = await (await app.request('/api/crm/tag-groups')).json() as { groups: { label: string; patient_ids: string[] }[] };
    expect(groups.map(g => g.label)).toEqual(['celíacas', 'Running']);
    expect(groups.find(g => g.label === 'Running')!.patient_ids).toEqual(['pat-sofia', 'pat-marina']);
  });
});
