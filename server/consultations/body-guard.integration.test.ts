import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../index.js';
import { resetStore } from '../store.js';
import { resetConsultationMemory } from './memory.js';
import { appendConsent } from '../intake/memory.js';
import { consentTextByPurpose } from '../intake/consent.js';
import { encodeConsultationWav } from '../../src/lib/consultation-capture.js';
import { CONSULTATION_TRANSCRIPT_MAX_BYTES, CONSULTATION_AUDIO_MAX_BYTES } from '../../src/types/consultations.js';

const patient = 'pat-sofia';
const session = '20000000-0000-4000-a000-000000000001';
const base = `/api/patients/${patient}/consultations`;
const chunk = `${base}/${session}/chunks`;
const post = (url: string, body: string, length?: string) => app.request(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...(length ? { 'Content-Length': length } : {}) },
  body,
});
async function start(source: 'manual' | 'upload') {
  const response = await post(base, JSON.stringify({
    action: 'start', id: session, source,
    ...(source === 'upload' ? { recording_version: 'consultation_recording.v1' } : {}),
  }));
  expect(response.status).toBe(201);
}
beforeEach(() => {
  resetStore();
  resetConsultationMemory();
  for (const purpose of ['care_relationship', 'consultation_recording', 'ai_consultation'] as const) {
    const text = consentTextByPurpose(purpose);
    appendConsent(patient, { purpose, text_version: text.text_version, text_hash: text.text_hash, decision: 'granted', actor_id: 'patient-demo' });
  }
});
describe('límites de consultas a través de la API real', () => {
  it('guarda íntegro el máximo UTF-8 aun cuando JSON escapa cada carácter seis veces', async () => {
    await start('manual');
    const transcript = '\u0001'.repeat(CONSULTATION_TRANSCRIPT_MAX_BYTES);
    const body = JSON.stringify({ action: 'draft', id: session, expected_revision: 1, draft: '', transcript });
    expect(Buffer.byteLength(body)).toBeGreaterThan(6 * CONSULTATION_TRANSCRIPT_MAX_BYTES);
    expect((await post(base, body)).status).toBe(200);
    const response = await app.request(base + '?audience=pro');
    expect((await response.json()).sessions[0].transcript).toBe(transcript);
  });
  it('admite un segmento WAV real de treinta segundos con su base64', async () => {
    await start('upload');
    const audio = encodeConsultationWav(new Float32Array(480_000), 16_000);
    const body = JSON.stringify({ client_id: '30000000-0000-4000-a000-000000000001', index: 0,
      audio: Buffer.from(audio).toString('base64'), mime: 'audio/wav', consent_version: 'ai_consultation.v1' });
    expect(Buffer.byteLength(body)).toBeGreaterThan(1_048_576);
    expect((await post(chunk, body)).ok).toBe(true);
  });
  it('aplica límites exactos de cada ruta y rechaza exceso aunque el encabezado mienta', async () => {
    for (const [url, limit] of [[base, 7_000_000], [chunk, 11_201_000], ['/api/patients', 1_048_576]] as const) {
      // El cuerpo inválido pasa el guard en el límite y lo rechaza el contrato de la ruta.
      expect((await post(url, ' '.repeat(limit))).status).not.toBe(413);
      for (const length of [undefined, '1']) {
        expect((await post(url, ' '.repeat(limit + 1), length)).status).toBe(413);
      }
    }
  });
  it('acepta el WAV máximo de ocho MiB y rechaza dos bytes de exceso en el contrato de audio', async () => {
    await start('upload');
    for (const extra of [0, 2]) {
      const audio = encodeConsultationWav(new Float32Array((CONSULTATION_AUDIO_MAX_BYTES - 44 + extra) / 2), 96_000);
      const body = JSON.stringify({ client_id: '30000000-0000-4000-a000-000000000002', index: extra,
        audio: Buffer.from(audio).toString('base64'), mime: 'audio/wav', consent_version: 'ai_consultation.v1' });
      expect(Buffer.byteLength(body)).toBeLessThan(11_201_000);
      expect((await post(chunk, body)).status).toBe(extra ? 413 : 202);
    }
  });
});
