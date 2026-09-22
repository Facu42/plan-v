import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../index.js';
import { getPatient, resetStore } from '../store.js';
import { resetPrivateAssets } from '../assets/repository.js';
import { CONSENT_CATALOG } from '../intake/consent.js';
import { CareError, messageDbError } from './repository.js';

const patient = 'pat-sofia';
const other = 'pat-marina';
const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3uoAAAAASUVORK5CYII=';
const pdf = 'data:application/pdf;base64,' + Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF').toString('base64');
const evilPdf = 'data:application/pdf;base64,' + Buffer.from('%PDF-1.4\n1 0 obj<</S/JavaScript/JS(app.alert(1))>>endobj\n%%EOF').toString('base64');

const post = (path: string, body: unknown, method = 'POST') => app.request(path, {
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

async function uploadChat(owner = patient, professional = false, file = png, mime = 'image/png') {
  const suffix = professional ? '?audience=pro' : '';
  const reserved = await post(`/api/assets/upload-intents${suffix}`, {
    patient_id: owner, category: 'chat_attachment', mime_declared: mime,
  });
  expect(reserved.status).toBe(201);
  const created = await reserved.json() as { intent: { id: string } };
  const uploaded = await post(`/api/assets/${created.intent.id}/content${suffix}`, { patient_id: owner, file }, 'PUT');
  expect(uploaded.status).toBe(200);
  const completed = await post(`/api/assets/${created.intent.id}/complete${suffix}`, { patient_id: owner });
  expect(completed.status).toBe(200);
  return (await completed.json() as { asset: { id: string; mime: string; bucket: string } }).asset;
}

describe('PV-24 adjuntos de chat', () => {
  beforeEach(() => {
    resetStore();
    resetPrivateAssets();
  });

  it('adjunta un PNG autorizado, previsualiza 60s y no duplica con el mismo client_id', async () => {
    const asset = await uploadChat();
    expect(asset.bucket).toBe('care-documents');
    const clientId = '11111111-1111-4111-8111-111111111111';
    const logs: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((line: unknown) => { logs.push(String(line)); });
    const sent = await post(`/api/patients/${patient}/messages`, {
      text: 'Merienda de hoy',
      from: 'patient',
      client_id: clientId,
      asset_id: asset.id,
      filename: 'merienda.png',
    });
    expect(sent.status).toBe(200);
    const stored = getPatient(patient)!.messages.filter((message) => message.attachment?.asset_id === asset.id);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      text: 'Merienda de hoy',
      attachment: { filename: 'merienda.png', kind: 'image', mime: 'image/png', available: true },
    });
    expect(JSON.stringify(stored[0])).not.toMatch(/https?:\/\//);

    const replay = await post(`/api/patients/${patient}/messages`, {
      text: 'otro',
      from: 'patient',
      client_id: clientId,
      asset_id: asset.id,
      filename: 'merienda.png',
    });
    expect(replay.status).toBe(200);
    expect(getPatient(patient)!.messages.filter((message) => message.attachment?.asset_id === asset.id)).toHaveLength(1);

    const opened = await post(`/api/patients/${patient}/messages/${stored[0].id}/attachment`, {});
    expect(opened.status).toBe(200);
    const grant = await opened.json() as { url: string; expires_in: number };
    expect(grant.expires_in).toBe(60);
    expect(grant.url).toMatch(/^\/api\/assets\/blob\//);
    const blob = await app.request(grant.url);
    expect(blob.status).toBe(200);
    expect(blob.headers.get('Cache-Control')).toBe('no-store');
    expect(logs.some((line) => line.includes('chat_attachment_access'))).toBe(true);
    spy.mockRestore();

    expect((await post(`/api/patients/${other}/messages/${stored[0].id}/attachment`, {})).status).toBe(404);
  });

  it('permite adjuntar a la profesional y rechaza un asset que no es de chat', async () => {
    const proAsset = await uploadChat(patient, true);
    const sent = await post(`/api/patients/${patient}/messages`, {
      text: '',
      from: 'vero',
      client_id: '22222222-2222-4222-8222-222222222222',
      asset_id: proAsset.id,
      filename: 'indicacion.png',
    });
    expect(sent.status).toBe(200);
    const last = getPatient(patient)!.messages.slice(-1)[0];
    expect(last?.attachment?.filename).toBe('indicacion.png');

    const mealPhoto = CONSENT_CATALOG.find((item) => item.purpose === 'meal_photo')!;
    await post(`/api/patients/${patient}/consents`, {
      purpose: 'meal_photo',
      text_version: mealPhoto.text_version,
      text_hash: mealPhoto.text_hash,
      decision: 'granted',
    });
    const meal = await post('/api/assets/upload-intents', {
      patient_id: patient, category: 'meal_photo', mime_declared: 'image/png',
    });
    const mealIntent = await meal.json() as { intent: { id: string } };
    await post(`/api/assets/${mealIntent.intent.id}/content`, { patient_id: patient, file: png }, 'PUT');
    const ready = await (await post(`/api/assets/${mealIntent.intent.id}/complete`, { patient_id: patient })).json() as { asset: { id: string } };
    expect((await post(`/api/patients/${patient}/messages`, {
      text: 'foto de comida',
      from: 'patient',
      client_id: '33333333-3333-4333-8333-333333333333',
      asset_id: ready.asset.id,
      filename: 'almuerzo.png',
    })).status).toBe(400);
  });

  it('retira el archivo y deja la descarga en 404; el PDF activo no entra', async () => {
    const reserved = await post('/api/assets/upload-intents', {
      patient_id: patient, category: 'chat_attachment', mime_declared: 'application/pdf',
    });
    const intent = (await reserved.json() as { intent: { id: string } }).intent;
    expect((await post(`/api/assets/${intent.id}/content`, { patient_id: patient, file: evilPdf }, 'PUT')).status).toBe(400);
    expect((await post(`/api/assets/${intent.id}/content`, { patient_id: patient, file: pdf }, 'PUT')).status).toBe(200);
    const asset = (await (await post(`/api/assets/${intent.id}/complete`, { patient_id: patient })).json() as { asset: { id: string } }).asset;
    const sent = await post(`/api/patients/${patient}/messages`, {
      text: 'estudio',
      from: 'patient',
      client_id: '44444444-4444-4444-8444-444444444444',
      asset_id: asset.id,
      filename: 'estudio.pdf',
    });
    const messageId = getPatient(patient)!.messages.find((message) => message.attachment?.asset_id === asset.id)?.id;
    expect(sent.status).toBe(200);
    expect(messageId).toBeTruthy();
    expect((await post(`/api/assets/${asset.id}/withdraw`, { patient_id: patient })).status).toBe(200);
    expect((await post(`/api/patients/${patient}/messages/${messageId}/attachment`, {})).status).toBe(404);
  });

  it('cierra en 501 si falta el schema persistente de adjuntos', () => {
    expect(() => messageDbError({ code: '42883' })).toThrow(CareError);
    try {
      messageDbError({ code: 'PGRST202' });
      throw new Error('expected CareError');
    } catch (error) {
      expect(error).toMatchObject({ status: 501 });
    }
  });
});
