import { beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { app } from '../index.js';
import { resetStore } from '../store.js';
import { CONSENT_CATALOG } from '../intake/consent.js';
import { PATIENT_QUOTA } from './types.js';
import { privateAssetSnapshot, resetPrivateAssets } from './repository.js';

const patient = 'pat-sofia';
const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3uoAAAAASUVORK5CYII=';
const pdf = 'data:application/pdf;base64,' + Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF').toString('base64');
const evilPdf = 'data:application/pdf;base64,' + Buffer.from('%PDF-1.4\n1 0 obj<</S/JavaScript/JS(app.alert(1))>>endobj\n%%EOF').toString('base64');

const post = (path: string, body: unknown, method = 'POST') => app.request(path, {
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

async function consent(purpose: 'body_progress' | 'clinical_document' | 'meal_photo') {
  const entry = CONSENT_CATALOG.find((item) => item.purpose === purpose)!;
  return post(`/api/patients/${patient}/consents`, {
    purpose, text_version: entry.text_version, text_hash: entry.text_hash, decision: 'granted',
  });
}

describe('PV-15 circuito reserva / cuarentena / URL firmada', () => {
  beforeEach(() => {
    resetStore();
    resetPrivateAssets();
  });

  it('reserva, sube a cuarentena, finaliza, abre 60s y retira', async () => {
    expect((await post('/api/assets/upload-intents', { patient_id: patient, category: 'body_progress', mime_declared: 'image/png' })).status).toBe(403);
    await consent('body_progress');
    const reserved = await post('/api/assets/upload-intents', { patient_id: patient, category: 'body_progress', mime_declared: 'image/png' });
    expect(reserved.status).toBe(201);
    const created = await reserved.json() as { intent: { id: string; object_path: string; status: string } };
    expect(created.intent.status).toBe('reserved');
    expect(created.intent.object_path).toMatch(new RegExp(`^patients/${patient}/q/`));
    expect((await post(`/api/assets/${created.intent.id}/complete`, { patient_id: patient })).status).toBe(409);

    const uploaded = await post(`/api/assets/${created.intent.id}/content`, { patient_id: patient, file: png }, 'PUT');
    expect(uploaded.status).toBe(200);
    expect((await uploaded.json()).intent.status).toBe('quarantine');

    const completed = await post(`/api/assets/${created.intent.id}/complete`, { patient_id: patient });
    expect(completed.status).toBe(200);
    const asset = (await completed.json()).asset as { id: string; status: string; bucket: string; object_path: string };
    expect(asset.status).toBe('ready');
    expect(asset.bucket).toBe('care-photos');
    expect(asset.object_path.startsWith(`patients/${patient}/`)).toBe(true);

    const opened = await post(`/api/assets/${asset.id}/access`, { patient_id: patient });
    expect(opened.status).toBe(200);
    const access = await opened.json() as { url: string; expires_in: number };
    expect(access.expires_in).toBe(60);
    expect(access.url).toMatch(/^\/api\/assets\/blob\//);
    const blob = await app.request(access.url);
    expect(blob.status).toBe(200);
    expect(blob.headers.get('Cache-Control')).toBe('no-store');

    expect((await post(`/api/assets/${asset.id}/access`, { patient_id: 'pat-marina' })).status).toBe(403);
    expect((await post(`/api/assets/${asset.id}/withdraw`, { patient_id: patient })).status).toBe(200);
    expect((await post(`/api/assets/${asset.id}/access`, { patient_id: patient })).status).toBe(404);
  });

  it('estudios: PDF seguro pasa, PDF activo y Marina quedan afuera', async () => {
    await consent('clinical_document');
    const reserved = await (await post('/api/assets/upload-intents', { patient_id: patient, category: 'clinical_document', mime_declared: 'application/pdf' })).json();
    expect((await post(`/api/assets/${reserved.intent.id}/content`, { patient_id: patient, file: evilPdf }, 'PUT')).status).toBe(400);
    expect((await post(`/api/assets/${reserved.intent.id}/content`, { patient_id: patient, file: pdf }, 'PUT')).status).toBe(200);
    const ready = await (await post(`/api/assets/${reserved.intent.id}/complete`, { patient_id: patient })).json();
    expect(ready.asset.mime).toBe('application/pdf');
    expect((await post(`/api/assets/${ready.asset.id}/access`, { patient_id: 'pat-marina' })).status).toBe(403);
  });

  it('respeta la cuota de archivos listos', async () => {
    await consent('body_progress');
    const original = PATIENT_QUOTA.maxReadyFiles;
    Object.defineProperty(PATIENT_QUOTA, 'maxReadyFiles', { value: 1, configurable: true });
    try {
      const first = await (await post('/api/assets/upload-intents', { patient_id: patient, category: 'body_progress', mime_declared: 'image/png' })).json();
      await post(`/api/assets/${first.intent.id}/content`, { patient_id: patient, file: png }, 'PUT');
      await post(`/api/assets/${first.intent.id}/complete`, { patient_id: patient });
      expect((await post('/api/assets/upload-intents', { patient_id: patient, category: 'body_progress', mime_declared: 'image/png' })).status).toBe(413);
      expect(privateAssetSnapshot().assets).toHaveLength(1);
    } finally {
      Object.defineProperty(PATIENT_QUOTA, 'maxReadyFiles', { value: original, configurable: true });
    }
  });

  it('el visor de estudios sigue funcionando con el circuito inspeccionado', async () => {
    await consent('clinical_document');
    const id = randomUUID();
    const uploaded = await post(`/api/patients/${patient}/care/documents`, {
      id, recorded_on: '2026-09-10', file: pdf, note: '', filename: 'laboratorio.pdf', document_kind: 'laboratorio',
    });
    expect(uploaded.status).toBe(200);
    const opened = await app.request(`/api/patients/${patient}/care/documents/${id}`);
    expect(opened.status).toBe(200);
    expect((await opened.json()).mime).toBe('application/pdf');
    expect((await post(`/api/patients/${patient}/care/documents`, {
      id: randomUUID(), recorded_on: '2026-09-10', file: evilPdf, note: '', filename: 'malware.pdf', document_kind: 'otro',
    })).status).toBe(400);
  });
});
