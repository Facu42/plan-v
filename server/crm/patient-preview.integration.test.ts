import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../index.js';
import { getPatient, resetStore } from '../store.js';
import { shared } from '../consultations/memory.js';
import { appendConsent } from '../intake/memory.js';
import { CONSENT_CATALOG } from '../intake/consent.js';

describe('resumen liviano de paciente para el directorio', () => {
  beforeEach(() => resetStore());
  it('devuelve todos los accesos de la ficha con respuesta acotada, sin transcripción ni archivos', async () => {
    const response = await app.request('/api/crm/patients/pat-sofia/preview');
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const body = await response.json();
    expect(body.patient_id).toBe('pat-sofia');
    expect(body.sections).toHaveLength(14);
    expect(body.sections.map((s: { id: string }) => s.id)).toContain('laboratorio');
    expect(JSON.stringify(body).length).toBeLessThan(8000);
    expect(JSON.stringify(body)).not.toMatch(/transcript|audio_path|clinical_notes|photo_url|manual_transcript|"payload"/);
  });
  it('rechaza pacientes ajenas o desactivadas y no permite seleccionar otro consultorio', async () => {
    expect((await app.request('/api/crm/patients/otro-consultorio/preview')).status).toBe(403);
    getPatient('pat-sofia')!.deactivated_at = new Date().toISOString();
    expect((await app.request('/api/crm/patients/pat-sofia/preview')).status).toBe(403);
  });
  it('una ficha archivada ofrece restauración sin traer datos clínicos', async () => {
    getPatient('pat-sofia')!.archived_at = new Date().toISOString();
    const body = await (await app.request('/api/crm/patients/pat-sofia/preview')).json();
    expect(body.can_open).toBe(false);
    expect(body.latest_weight).toBeNull();
    expect(body.last_consultation).toBeNull();
  });
  it('el último resumen está acotado y desaparece al retirar el permiso de atención', async () => {
    const patient = 'pat-sofia';
    const consent = CONSENT_CATALOG.find(c => c.purpose === 'care_relationship')!;
    appendConsent(patient, { purpose: consent.purpose, text_version: consent.text_version, text_hash: consent.text_hash, decision: 'granted', actor_id: 'patient-demo' });
    shared.set('preview-note', { id:'preview-note',session_id:'s',patient_id:patient,version:1,summary:'Resumen revisado. '.repeat(100),published_at:new Date().toISOString(),consultation_date:'2026-10-19' });
    const allowed = await (await app.request(`/api/crm/patients/${patient}/preview`)).json();
    expect(allowed.last_consultation.summary.length).toBeLessThanOrEqual(301);
    appendConsent(patient, { purpose: consent.purpose, text_version: consent.text_version, text_hash: consent.text_hash, decision: 'withdrawn', actor_id: 'patient-demo' });
    const revoked = await (await app.request(`/api/crm/patients/${patient}/preview`)).json();
    expect(revoked.last_consultation).toBeNull();
  });
});
