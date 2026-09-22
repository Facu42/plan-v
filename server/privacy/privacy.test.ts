import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../index.js';
import { getPatient, resetStore } from '../store.js';
import { CONSENT_CATALOG } from '../intake/consent.js';
import { addClinicalNote } from '../intake/memory.js';
import { drain, processQueue, resetProcessQueue } from '../jobs/queue.js';
import { handleProcessingJob } from '../jobs/handlers.js';
import { privacyAccessSnapshot, privacyDbError, CareError } from './repository.js';
import { assertSafePackage, stripLiveUrls } from './package.js';
import { purgeDelayMs, purgeRunAfter } from './retention.js';
import { resetPrivateAssets } from '../assets/repository.js';
import { liveRestoreRefusal } from '../ops/restore.js';
import { BACKUP_CONFIRM, restoreRefusal } from '../ops/backup.js';

const patient = 'pat-sofia';
const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3uoAAAAASUVORK5CYII=';

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

async function uploadBodyPhoto() {
  await consent('body_progress');
  const reserved = await (await post('/api/assets/upload-intents', {
    patient_id: patient, category: 'body_progress', mime_declared: 'image/png',
  })).json() as { intent: { id: string } };
  await post(`/api/assets/${reserved.intent.id}/content`, { patient_id: patient, file: png }, 'PUT');
  const completed = await (await post(`/api/assets/${reserved.intent.id}/complete`, { patient_id: patient })).json() as { asset: { id: string } };
  return completed.asset.id;
}

describe('errores de privacidad', () => {
  it('cierra en 501 si falta el schema persistente', () => {
    expect(() => privacyDbError({ code: '42P01' })).toThrow(CareError);
    for (const code of ['PGRST205', '42883', '42703', 'PGRST202']) {
      try {
        privacyDbError({ code });
        throw new Error('expected CareError');
      } catch (error) {
        expect(error).toMatchObject({ status: 501 });
      }
    }
    try {
      privacyDbError({ code: '42501' });
      throw new Error('expected CareError');
    } catch (error) {
      expect(error).toMatchObject({ status: 403 });
    }
  });
});

describe('retención por categoría', () => {
  it('demora 30 días la purga de fotos corporales y es inmediata en el resto', () => {
    expect(purgeDelayMs('body_progress')).toBe(30 * 24 * 60 * 60 * 1000);
    expect(purgeDelayMs('meal_photo')).toBe(0);
    expect(purgeDelayMs('clinical_document')).toBe(0);
    expect(purgeDelayMs('chat_attachment')).toBe(0);
    const now = new Date('2026-09-21T12:00:00.000Z');
    expect(purgeRunAfter('body_progress', now)).toBe('2026-10-21T12:00:00.000Z');
    expect(purgeRunAfter('meal_photo', now)).toBe(now.toISOString());
  });
});

describe('paquete de exportación', () => {
  it('omite notas clínicas, IA y URLs firmadas vivas', () => {
    const stripped = stripLiveUrls({
      clinical_notes: [{ body: 'secreto' }],
      adherence_why: 'interno',
      photo: 'https://example.supabase.co/storage/v1/object/sign/a.jpg?token=zz',
      path: 'patients/demo/q/1',
    }) as Record<string, unknown>;
    expect(stripped.clinical_notes).toBeUndefined();
    expect(stripped.adherence_why).toBeUndefined();
    expect(stripped.photo).toBeNull();
    expect(stripped.path).toBe('patients/demo/q/1');
    expect(() => assertSafePackage({
      clinical_notes: [],
    })).toThrow(/privacy_forbidden_fields/);
  });
});

describe('PV-31 exportación / retiro / purga', () => {
  beforeEach(() => {
    resetStore();
    resetPrivateAssets();
    resetProcessQueue();
  });

  it('exporta el allowlist y registra el acceso, sin notas ni URLs firmadas', async () => {
    addClinicalNote(patient, 'nutri-demo', 'Nota privada de Verónica');
    const created = await post(`/api/patients/${patient}/privacy/requests`, { kind: 'export' });
    expect(created.status).toBe(201);
    const body = await created.json() as { request: { id: string; kind: string; status: string } };
    expect(body.request.kind).toBe('export');
    expect(body.request.status).toBe('completed');
    expect((await post(`/api/patients/pat-marina/privacy/requests`, { kind: 'export' })).status).toBe(201);

    const listed = await app.request(`/api/patients/${patient}/privacy/requests`);
    expect(listed.status).toBe(200);
    const requests = (await listed.json() as { requests: Array<{ id: string }> }).requests;
    expect(requests[0].id).toBe(body.request.id);

    const downloaded = await app.request(`/api/patients/${patient}/privacy/requests/${body.request.id}/package`);
    expect(downloaded.status).toBe(200);
    const pack = await downloaded.json() as { package: Record<string, unknown> };
    const raw = JSON.stringify(pack.package);
    expect(raw).toContain('privacy-export.v1');
    expect(raw).not.toContain('Nota privada de Verónica');
    expect(raw).not.toContain('clinical_notes');
    expect(raw).not.toContain('adherence_why');
    expect(raw).not.toContain('ai_artifacts');
    expect(raw).not.toContain('note_for_nutri');
    expect(raw).not.toMatch(/https?:\/\//);
    expect(pack.package.working_periods_not_legal).toBe(true);
    expect(privacyAccessSnapshot().some((event) => event.action === 'export_downloaded' && event.category === 'export')).toBe(true);
  });

  it('el profesional no abre pedidos y Marina no lee el paquete de Sofía', async () => {
    const created = await (await post(`/api/patients/${patient}/privacy/requests`, { kind: 'export' })).json() as { request: { id: string } };
    expect((await post(`/api/patients/${patient}/privacy/requests?audience=pro`, { kind: 'export' })).status).toBe(403);
    expect((await app.request(`/api/patients/pat-marina/privacy/requests/${created.request.id}/package`)).status).toBe(404);
  });

  it('retiro de foto corporal corta lecturas y encola purga a 30 días', async () => {
    const id = await uploadBodyPhoto();
    const opened = await post(`/api/assets/${id}/access`, { patient_id: patient });
    expect(opened.status).toBe(200);
    expect((await opened.json()).category).toBe('body_progress');
    expect((await post(`/api/assets/${id}/withdraw`, { patient_id: patient })).status).toBe(200);
    expect((await post(`/api/assets/${id}/access`, { patient_id: patient })).status).toBe(404);
    const jobs = await processQueue.snapshot();
    const purge = jobs.find((job) => job.kind === 'purge_asset');
    expect(purge).toBeTruthy();
    expect(Date.parse(purge!.run_after) - Date.parse(purge!.created_at)).toBeGreaterThan(29 * 24 * 60 * 60 * 1000);
    const immediately = await processQueue.lease('worker', new Date(purge!.created_at));
    expect(immediately).toBeNull();
  });

  it('el borrado lógico es inmediato, no borra pagos y deja la anonimización en cola', async () => {
    const created = await post(`/api/patients/${patient}/privacy/requests`, { kind: 'delete' });
    expect(created.status).toBe(201);
    expect(getPatient(patient)?.deactivated_at).toBeTruthy();
    const jobs = await processQueue.snapshot();
    expect(jobs.some((job) => job.kind === 'privacy_delete')).toBe(true);
    await drain(processQueue, 'worker', handleProcessingJob);
    expect(getPatient(patient)?.anonymized_at).toBeTruthy();
    expect(privacyAccessSnapshot().some((event) => event.action === 'delete_requested')).toBe(true);
  });
});

describe('restore conjunto sigue siendo ensayo', () => {
  it('no aplica SQL remoto y exige el par DB+Storage', () => {
    expect(liveRestoreRefusal({ DISPOSABLE_DATABASE_URL: 'postgres://example.supabase.co/postgres' })).toMatch(/Live restore is disabled/);
    expect(restoreRefusal({
      appMode: 'demo',
      confirm: BACKUP_CONFIRM,
      patientCount: 0,
      pairComplete: false,
    })).toMatch(/joint DB \+ Storage/);
  });
});
