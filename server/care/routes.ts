import type { Hono, Context } from 'hono';
import { z } from 'zod';
import { authorizePatientAction } from '../security/authorization.js';
import * as sb from '../db/supabase-repo.js';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { getPatient, getStore } from '../store.js';
import { careInputSchema, carePreferencesSchema, replacementRecipeSchema, CARE_LABELS, type CareAlert } from '../../src/types/care.js';
import * as repo from './repository.js';
import { handleProcessingJob } from '../jobs/handlers.js';
import { processQueue, runOne } from '../jobs/queue.js';
import { AIUnavailableError } from '../ai/errors.js';
import { currentCareConsents, requireCareConsent } from './consents.js';

export { currentCareConsents, requireCareConsent } from './consents.js';
async function access(c: Context, patientId: string, mode: 'read' | 'patient' | 'professional') {
  const auth = c.get('auth'); const persistent = 'userId' in auth && isSupabaseEnabled();
  if (!persistent) { if (!getPatient(patientId)) throw new repo.CareError(404, 'Paciente no encontrado.'); return { persistent: false, professional: c.req.query('audience') === 'pro' || mode === 'professional' }; }
  const actor = await authorizePatientAction(auth.userId, patientId, mode === 'professional' ? 'review_intake' : mode === 'patient' ? 'log_activity' : 'read_patient', { getActor: sb.sbGetActor, getPatientResource: sb.sbGetPatientResource });
  if (!actor || (mode === 'patient' && actor.role !== 'paciente')) throw new repo.CareError(403, 'No tenés permiso para esta acción.');
  return { persistent: true, professional: actor.role === 'nutri' };
}
async function body<T>(c: Context, schema: z.ZodType<T>, max = 7_100_000): Promise<T> {
  if (Number(c.req.header('Content-Length')) > max) throw new repo.CareError(413, 'El archivo es demasiado grande.');
  const raw = await c.req.text();
  if (raw.length > max) throw new repo.CareError(413, 'El archivo es demasiado grande.');
  try { return schema.parse(JSON.parse(raw)); } catch { throw new repo.CareError(400, 'Revisá los campos del formulario.'); }
}
export function registerCareRoutes(app: Hono) {
  app.get('/api/patients/:id/care', async c => {
    const id = c.req.param('id'); const { persistent, professional } = await access(c, id, 'read');
    const [records, preferences, replacements, bundle] = await Promise.all([repo.listCareRecords(id, persistent), repo.getCarePreferences(id, persistent), repo.listReplacements(id, persistent), currentCareConsents(id, persistent)]);
    return c.json({ records: records.filter(r => professional || r.data.kind !== 'payment'), preferences, replacements: replacements.filter(r => professional || r.published_at), consented: bundle.consented, source: persistent ? 'supabase' : 'memory' });
  });
  app.post('/api/patients/:id/care/records', async c => {
    const id = c.req.param('id'); const input = await body(c, careInputSchema);
    if (input.data.kind === 'body_photo') throw new repo.CareError(400, 'Usá el formulario de foto privada.');
    if (input.data.kind === 'clinical_document') throw new repo.CareError(400, 'Usá el formulario de estudios.');
    const { persistent } = await access(c, id, input.data.kind === 'payment' ? 'professional' : 'patient');
    if (input.data.kind === 'weight' || input.data.kind === 'waist') await requireCareConsent(id, persistent, 'measurement');
    const record = await repo.saveCareRecord(id, input, persistent); return c.json({ record });
  });
  app.patch('/api/patients/:id/care/records/:recordId/review', async c => {
    const id = c.req.param('id'); const { persistent } = await access(c, id, 'professional');
    await repo.reviewCareRecord(id, c.req.param('recordId'), persistent); return c.json({ ok: true });
  });
  app.put('/api/patients/:id/care/preferences', async c => {
    const id = c.req.param('id'); const { persistent } = await access(c, id, 'patient');
    const settings = await body(c, carePreferencesSchema); await repo.saveCarePreferences(id, settings, persistent); return c.json({ preferences: settings });
  });
  app.post('/api/patients/:id/care/photos', async c => {
    const id = c.req.param('id'); const { persistent } = await access(c, id, 'patient');
    await requireCareConsent(id, persistent, 'body_progress');
    const input = await body(c, z.object({ id: z.uuid(), recorded_on: careInputSchema.shape.recorded_on, image: z.string().max(7_000_000), note: z.string().trim().max(500) }).strict());
    const path = `${id}/${input.id}`;
    const recordInput = { id: input.id, recorded_on: input.recorded_on, data: { kind: 'body_photo' as const, path, note: input.note } };
    await repo.storeCarePhoto(path, input.image, persistent);
    const record = await repo.saveCareRecord(id, recordInput, persistent); return c.json({ record });
  });
  app.get('/api/patients/:id/care/photos/:recordId', async c => {
    const id = c.req.param('id'); const { persistent } = await access(c, id, 'read');
    await requireCareConsent(id, persistent, 'body_progress');
    const record = (await repo.listCareRecords(id, persistent)).find(r => r.id === c.req.param('recordId'));
    if (!record || record.data.kind !== 'body_photo') throw new repo.CareError(404, 'Foto no encontrada.');
    return c.json({ url: await repo.carePhotoUrl(record.data.path, persistent), expires_in: 60 });
  });
  app.delete('/api/patients/:id/care/photos/:recordId',async c=>{
    const id=c.req.param('id');const {persistent,professional}=await access(c,id,'read');
    if(professional)throw new repo.CareError(403,'Sólo el paciente puede eliminar su foto.');
    await repo.deleteCarePhoto(id,c.req.param('recordId'),persistent);return c.json({ok:true});
  });
  app.post('/api/patients/:id/care/documents', async c => {
    const id = c.req.param('id'); const { persistent } = await access(c, id, 'patient');
    await requireCareConsent(id, persistent, 'clinical_document');
    const input = await body(c, z.object({
      id: z.uuid(), recorded_on: careInputSchema.shape.recorded_on, file: z.string().max(28_000_000),
      note: z.string().trim().max(500), filename: z.string().trim().min(1).max(120), document_kind: z.string().trim().max(80).default(''),
    }).strict(), 28_000_000);
    const filename = repo.sanitizeDocumentFilename(input.filename);
    const { mime } = repo.validateDocument(input.file);
    const path = `${id}/${input.id}`;
    const recordInput = { id: input.id, recorded_on: input.recorded_on, data: { kind: 'clinical_document' as const, path, mime, filename, document_kind: input.document_kind, note: input.note } };
    await repo.storeCareDocument(path, input.file, persistent);
    const record = await repo.saveCareRecord(id, recordInput, persistent); return c.json({ record });
  });
  app.get('/api/patients/:id/care/documents/:recordId', async c => {
    const id = c.req.param('id'); const { persistent } = await access(c, id, 'read');
    await requireCareConsent(id, persistent, 'clinical_document');
    const record = (await repo.listCareRecords(id, persistent)).find(r => r.id === c.req.param('recordId'));
    if (!record || record.data.kind !== 'clinical_document') throw new repo.CareError(404, 'Estudio no encontrado.');
    return c.json({ url: await repo.careDocumentUrl(record.data.path, persistent), expires_in: 60, mime: record.data.mime, filename: record.data.filename });
  });
  app.delete('/api/patients/:id/care/documents/:recordId', async c => {
    const id = c.req.param('id'); const { persistent, professional } = await access(c, id, 'read');
    if (professional) throw new repo.CareError(403, 'Sólo el paciente puede retirar su estudio.');
    await repo.deleteCareDocument(id, c.req.param('recordId'), persistent); return c.json({ ok: true });
  });
  app.post('/api/patients/:id/care/replacements/:recordId/generate', async c => {
    const id = c.req.param('id'); const { persistent } = await access(c, id, 'professional');
    await requireCareConsent(id, persistent, 'ai_menu_draft');
    const record = (await repo.listCareRecords(id, persistent)).find(r => r.id === c.req.param('recordId'));
    if (!record || record.data.kind !== 'menu_request') throw new repo.CareError(404, 'Solicitud no encontrada.');
    const existing = (await repo.listReplacements(id, persistent)).find(r => r.request_id === record.id);
    if (existing) return c.json({ replacement: existing });
    const job = await processQueue.enqueue({
      kind: 'menu_draft',
      payload: { patient_id: id, record_id: record.id, persistent },
    });
    const processed = await runOne(processQueue, `api-${job.id}`, handleProcessingJob);
    const saved = (await repo.listReplacements(id, persistent)).find(r => r.request_id === record.id);
    if (processed?.status === 'succeeded' && saved) return c.json({ replacement: saved, job_id: job.id });
    if (processed?.last_error === new AIUnavailableError().message) throw new AIUnavailableError();
    throw new repo.CareError(503, processed?.last_error || 'No se pudo preparar la alternativa.');
  });
  app.post('/api/patients/:id/care/replacements/:replacementId/publish', async c => {
    const id = c.req.param('id'); const { persistent } = await access(c, id, 'professional');
    const input=await body(c,z.object({expected_recipe:replacementRecipeSchema,recipe:replacementRecipeSchema}).strict());
    await repo.publishReplacement(id, c.req.param('replacementId'), persistent,input.expected_recipe,input.recipe); return c.json({ ok: true });
  });
  app.get('/api/care/alerts', async c => {
    const auth = c.get('auth'); const persistent = 'userId' in auth && isSupabaseEnabled();
    if (persistent && await sb.sbGetProfileRole(auth.userId) !== 'nutri') throw new repo.CareError(403, 'Solo profesionales.');
    const patients = persistent ? (await sb.sbListPatientsForNutri(auth.userId, { limit: 100, offset: 0 })).patients : getStore().patients;
    const names = new Map(patients.filter(p => !p.archived_at).map(p => [p.id,p.name]));
    const records = await repo.listCareRecords(null, persistent);
    const alerts: CareAlert[] = records.filter(r => !r.reviewed_at && r.data.kind !== 'payment' && names.has(r.patient_id)).map(r => ({ id: r.id, patient_id: r.patient_id, patient_name: names.get(r.patient_id)!, title: r.data.kind === 'body_photo' ? 'Nuevo archivo privado' : r.data.kind === 'clinical_document' ? 'Nuevo estudio' : CARE_LABELS[r.data.kind], detail: r.data.kind === 'menu_request' ? 'El paciente solicitó un reemplazo. Revisá su menú.' : 'Nuevo registro para revisar en la ficha.', target: 'ficha', created_at: r.created_at }));
    for (const p of patients) {
      if (!names.has(p.id)) continue;
      const pending = p.meal_logs.filter(m => m.status === 'pending_review');
      if (pending.length) alerts.push({ id: `meals:${p.id}:${pending[0].id}`, patient_id: p.id, patient_name: p.name, title: 'Comidas para revisar', detail: `${pending.length} registros pendientes.`, target: 'diario', created_at: pending[0].logged_at });
      if (p.brief?.suggested_action === 'ajuste_menu' && !p.briefDismissed) alerts.push({ id: `menu:${p.id}`, patient_id: p.id, patient_name: p.name, title: 'Revisar menú', detail: 'Hay una propuesta del copiloto pendiente de evaluación profesional.', target: 'ficha', created_at: '' });
    }
    return c.json({ alerts: alerts.sort((a,b) => b.created_at.localeCompare(a.created_at)) });
  });
}
