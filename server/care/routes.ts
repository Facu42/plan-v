import type { Hono, Context } from 'hono';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { authorizePatientAction } from '../security/authorization.js';
import * as sb from '../db/supabase-repo.js';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { getPatient, getStore } from '../store.js';
import { getIntakeRecord, listConsentEvents } from '../intake/memory.js';
import { readIntakeBundle } from '../intake/repository.js';
import { CONSENT_CATALOG, type ConsentPurpose } from '../intake/consent.js';
import { careInputSchema, carePreferencesSchema, replacementRecipeSchema, CARE_LABELS, type CareAlert } from '../../src/types/care.js';
import * as repo from './repository.js';
import { generateReplacement } from '../ai/replacements.js';

export async function currentCareConsents(patientId: string, persistent: boolean) {
  const bundle = persistent ? await readIntakeBundle(patientId) : { intake: getIntakeRecord(patientId), consents: listConsentEvents(patientId) };
  const latest = new Map<string, typeof bundle.consents[number]>();
  for (const entry of bundle.consents) latest.set(entry.purpose, entry);
  const consented = CONSENT_CATALOG.filter(text => {
    const last = latest.get(text.purpose);
    return last?.decision === 'granted' && last.text_version === text.text_version && last.text_hash === text.text_hash;
  }).map(text => text.purpose);
  return { ...bundle, consented };
}
export async function requireCareConsent(patientId: string, persistent: boolean, purpose: ConsentPurpose) {
  const bundle = await currentCareConsents(patientId, persistent);
  if (!bundle.consented.includes(purpose)) throw new repo.CareError(403, `Activá el permiso «${CONSENT_CATALOG.find(c => c.purpose === purpose)?.title}» antes de continuar.`);
  return bundle;
}
async function access(c: Context, patientId: string, mode: 'read' | 'patient' | 'professional') {
  const auth = c.get('auth'); const persistent = 'userId' in auth && isSupabaseEnabled();
  if (!persistent) { if (!getPatient(patientId)) throw new repo.CareError(404, 'Paciente no encontrado.'); return { persistent: false, professional: c.req.query('audience') === 'pro' || mode === 'professional' }; }
  const actor = await authorizePatientAction(auth.userId, patientId, mode === 'professional' ? 'review_intake' : mode === 'patient' ? 'log_activity' : 'read_patient', { getActor: sb.sbGetActor, getPatientResource: sb.sbGetPatientResource });
  if (!actor || (mode === 'patient' && actor.role !== 'paciente')) throw new repo.CareError(403, 'No tenés permiso para esta acción.');
  return { persistent: true, professional: actor.role === 'nutri' };
}
async function body<T>(c: Context, schema: z.ZodType<T>): Promise<T> {
  if (Number(c.req.header('Content-Length')) > 7_100_000) throw new repo.CareError(413, 'El archivo es demasiado grande.');
  const raw = await c.req.text();
  if (raw.length > 7_100_000) throw new repo.CareError(413, 'El archivo es demasiado grande.');
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
  app.post('/api/patients/:id/care/replacements/:recordId/generate', async c => {
    const id = c.req.param('id'); const { persistent } = await access(c, id, 'professional');
    const bundle = await requireCareConsent(id, persistent, 'ai_menu_draft');
    const record = (await repo.listCareRecords(id, persistent)).find(r => r.id === c.req.param('recordId'));
    if (!record || record.data.kind !== 'menu_request') throw new repo.CareError(404, 'Solicitud no encontrada.');
    const existing = (await repo.listReplacements(id, persistent)).find(r => r.request_id === record.id);
    if (existing) return c.json({ replacement: existing });
    const patient = persistent ? await sb.sbGetPatientById(id, 'professional') : getPatient(id);
    const result = await generateReplacement(record.data, bundle.intake.payload, patient?.weekPlan ?? []);
    const replacement = { id: randomUUID(), patient_id: id, request_id: record.id, ...result, published_at: null, created_at: new Date().toISOString() };
    await repo.saveReplacement(replacement, persistent); return c.json({ replacement });
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
    const alerts: CareAlert[] = records.filter(r => !r.reviewed_at && r.data.kind !== 'payment' && names.has(r.patient_id)).map(r => ({ id: r.id, patient_id: r.patient_id, patient_name: names.get(r.patient_id)!, title: r.data.kind === 'body_photo' ? 'Nuevo archivo privado' : CARE_LABELS[r.data.kind], detail: r.data.kind === 'menu_request' ? 'El paciente solicitó un reemplazo. Revisá su menú.' : 'Nuevo registro para revisar en la ficha.', target: 'ficha', created_at: r.created_at }));
    for (const p of patients) {
      if (!names.has(p.id)) continue;
      const pending = p.meal_logs.filter(m => m.status === 'pending_review');
      if (pending.length) alerts.push({ id: `meals:${p.id}:${pending[0].id}`, patient_id: p.id, patient_name: p.name, title: 'Comidas para revisar', detail: `${pending.length} registros pendientes.`, target: 'diario', created_at: pending[0].logged_at });
      if (p.brief?.suggested_action === 'ajuste_menu' && !p.briefDismissed) alerts.push({ id: `menu:${p.id}`, patient_id: p.id, patient_name: p.name, title: 'Revisar menú', detail: 'Hay una propuesta del copiloto pendiente de evaluación profesional.', target: 'ficha', created_at: '' });
    }
    return c.json({ alerts: alerts.sort((a,b) => b.created_at.localeCompare(a.created_at)) });
  });
}
