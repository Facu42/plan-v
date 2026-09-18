import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../index.js';
import { resetStore } from '../store.js';
import { CONSENT_CATALOG } from '../intake/consent.js';
import { crc32 } from 'node:zlib';

function chunk(type: string, data: Buffer) {
  const body = Buffer.concat([Buffer.from(type), data]);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([len, body, crc]);
}

function png() {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(1, 0);
  ihdr.writeUInt32BE(1, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const idat = Buffer.from('08d763f8cfc0000000020001e221bc33', 'hex');
  return Buffer.concat([signature, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

function json(path: string, body: unknown, method = 'POST') {
  return app.request(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function grant(purpose: 'meal_photo' | 'clinical_document' | 'body_progress') {
  const text = CONSENT_CATALOG.find(entry => entry.purpose === purpose)!;
  const response = await json(`/api/patients/pat-sofia/consents`, {
    purpose: text.purpose,
    text_version: text.text_version,
    text_hash: text.text_hash,
    decision: 'granted',
  });
  expect(response.status).toBe(201);
}

describe('PV-15 reserva y retiro de archivos en memoria', () => {
  beforeEach(() => resetStore());

  it('reserva, verifica, firma 60s y retira sin dejar lectura', async () => {
    await grant('meal_photo');
    const reserved = await json('/api/patients/pat-sofia/assets/intents', { category: 'meal_photo' });
    expect(reserved.status).toBe(201);
    const { asset } = await reserved.json();
    expect(asset.status).toBe('reserved');
    expect(asset.object_path).toMatch(/^patients\/pat-sofia\//);

    const image = `data:image/png;base64,${png().toString('base64')}`;
    const completed = await json(`/api/patients/pat-sofia/assets/${asset.id}/complete`, { image });
    expect(completed.status).toBe(200);
    expect((await completed.json()).asset.status).toBe('ready');

    const access = await json(`/api/patients/pat-sofia/assets/${asset.id}/access`, {});
    expect(access.status).toBe(200);
    const opened = await access.json();
    expect(opened.expires_in).toBe(60);
    expect(opened.url.startsWith('data:image/png;base64,')).toBe(true);

    expect((await json(`/api/patients/pat-sofia/assets/${asset.id}/withdraw`, {})).status).toBe(200);
    expect((await json(`/api/patients/pat-sofia/assets/${asset.id}/access`, {})).status).toBe(404);
  });

  it('lista estudios listos y los oculta al retirar el permiso de lectura', async () => {
    await grant('clinical_document');
    const reserved = await json('/api/patients/pat-sofia/assets/intents', { category: 'clinical_document' });
    const { asset } = await reserved.json();
    const pdf = `data:application/pdf;base64,${Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF').toString('base64')}`;
    expect((await json(`/api/patients/pat-sofia/assets/${asset.id}/complete`, { image: pdf })).status).toBe(200);
    const listed = await app.request('/api/patients/pat-sofia/assets?category=clinical_document');
    expect(listed.status).toBe(200);
    const body = await listed.json();
    expect(body.assets).toEqual([expect.objectContaining({ id: asset.id, category: 'clinical_document', mime: 'application/pdf' })]);
    expect(body.assets[0].object_path).toBeUndefined();
    expect((await json(`/api/patients/pat-sofia/assets/${asset.id}/withdraw`, {})).status).toBe(200);
    expect((await (await app.request('/api/patients/pat-sofia/assets?category=clinical_document')).json()).assets).toEqual([]);
  });

  it('exige consentimiento y aísla pacientes', async () => {
    const denied = await json('/api/patients/pat-sofia/assets/intents', { category: 'meal_photo' });
    expect(denied.status).toBe(403);
    await grant('meal_photo');
    const reserved = await json('/api/patients/pat-sofia/assets/intents', { category: 'meal_photo' });
    const { asset } = await reserved.json();
    const image = `data:image/png;base64,${png().toString('base64')}`;
    expect((await json(`/api/patients/pat-lucia/assets/${asset.id}/complete`, { image })).status).toBe(404);
  });

  it('rechaza HTML disfrazado de imagen', async () => {
    await grant('meal_photo');
    const reserved = await json('/api/patients/pat-sofia/assets/intents', { category: 'meal_photo' });
    const { asset } = await reserved.json();
    const fake = `data:image/png;base64,${Buffer.from('<html>no</html>').toString('base64')}`;
    const completed = await json(`/api/patients/pat-sofia/assets/${asset.id}/complete`, { image: fake });
    expect(completed.status).toBe(415);
  });
});
