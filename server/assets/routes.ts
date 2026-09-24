import type { Hono, Context } from 'hono';
import { z } from 'zod';
import { authorizePatientAction } from '../security/authorization.js';
import * as sb from '../db/supabase-repo.js';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { DEMO_NUTRITIONIST_ID, getPatient } from '../store.js';
import { CareError } from '../care/errors.js';
import { requireCareConsent } from '../care/consents.js';
import { writeOpsLog } from '../ops/log.js';
import { ASSET_CATEGORIES, CONSENT_BY_CATEGORY } from './types.js';
import * as repo from './repository.js';

async function actorAccess(c: Context, patientId: string, mode: 'read' | 'patient' | 'thread') {
  const auth = c.get('auth');
  const persistent = 'userId' in auth && isSupabaseEnabled();
  if (!persistent) {
    if (!getPatient(patientId)) throw new CareError(404, 'Paciente no encontrado.');
    return { persistent: false, professional: c.req.query('audience') === 'pro', nutritionistId: DEMO_NUTRITIONIST_ID };
  }
  const action = mode === 'patient' ? 'log_activity' : mode === 'thread' ? 'send_message' : 'read_patient';
  const actor = await authorizePatientAction(
    auth.userId,
    patientId,
    action,
    { getActor: sb.sbGetActor, getPatientResource: sb.sbGetPatientResource },
  );
  if (!actor || (mode === 'patient' && actor.role !== 'paciente')) throw new CareError(403, 'No tenés permiso para esta acción.');
  const resource = await sb.sbGetPatientResource(patientId);
  if (!resource) throw new CareError(403, 'No tenés permiso para esta acción.');
  return { persistent: true, professional: actor.role === 'nutri', nutritionistId: resource.nutritionistId };
}

async function jsonBody<T>(c: Context, schema: z.ZodType<T>, max = 28_000_000): Promise<T> {
  if (Number(c.req.header('Content-Length')) > max) throw new CareError(413, 'El archivo es demasiado grande.');
  const raw = await c.req.text();
  if (raw.length > max) throw new CareError(413, 'El archivo es demasiado grande.');
  try { return schema.parse(JSON.parse(raw)); } catch { throw new CareError(400, 'Revisá los campos del formulario.'); }
}

const intentSchema = z.object({
  patient_id: z.string().min(1),
  category: z.enum(ASSET_CATEGORIES),
  mime_declared: z.string().min(1).max(80),
}).strict();

export function registerAssetRoutes(app: Hono) {
  app.post('/api/assets/upload-intents', async (c) => {
    const input = await jsonBody(c, intentSchema, 8_000);
    const chat = input.category === 'chat_attachment';
    const { persistent, professional, nutritionistId } = await actorAccess(
      c,
      input.patient_id,
      chat ? 'thread' : 'patient',
    );
    if (!chat && professional) throw new CareError(403, 'Sólo el paciente puede reservar una subida.');
    if (input.category !== 'chat_attachment') {
      await requireCareConsent(input.patient_id, persistent, CONSENT_BY_CATEGORY[input.category]);
    }
    const intent = await repo.reserveUploadIntent({
      patientId: input.patient_id,
      nutritionistId,
      category: input.category,
      mimeDeclared: input.mime_declared,
      persistent,
    });
    writeOpsLog('info', 'asset_reserved', { category: input.category, persistent });
    return c.json({
      intent,
      upload: { bucket: 'care-quarantine', path: intent.object_path, method: 'PUT', url: `/api/assets/${intent.id}/content` },
    }, 201);
  });

  app.put('/api/assets/:id/content', async (c) => {
    const input = await jsonBody(c, z.object({ patient_id: z.string().min(1), file: z.string().min(16) }).strict());
    const { persistent, professional } = await actorAccess(c, input.patient_id, 'read');
    const intent = await repo.uploadIntentBytes(c.req.param('id'), input.patient_id, input.file, persistent, professional);
    return c.json({ intent });
  });

  app.post('/api/assets/:id/complete', async (c) => {
    const input = await jsonBody(c, z.object({ patient_id: z.string().min(1) }).strict(), 4_000);
    const { persistent, professional } = await actorAccess(c, input.patient_id, 'read');
    const asset = await repo.completeUploadIntent(c.req.param('id'), input.patient_id, persistent, professional);
    writeOpsLog('info', 'asset_ready', { category: asset.category, persistent });
    return c.json({ asset });
  });

  app.post('/api/assets/:id/access', async (c) => {
    const input = await jsonBody(c, z.object({ patient_id: z.string().min(1) }).strict(), 4_000);
    const { persistent } = await actorAccess(c, input.patient_id, 'read');
    const asset = await repo.accessPrivateAsset(c.req.param('id'), input.patient_id, persistent);
    writeOpsLog('info', 'asset_access', { persistent, category: asset.category });
    return c.json(asset);
  });

  app.post('/api/assets/:id/withdraw', async (c) => {
    const input = await jsonBody(c, z.object({ patient_id: z.string().min(1) }).strict(), 4_000);
    const { persistent, professional } = await actorAccess(c, input.patient_id, 'patient');
    if (professional) throw new CareError(403, 'Sólo el paciente puede retirar el archivo.');
    const asset = await repo.withdrawPrivateAsset(c.req.param('id'), input.patient_id, persistent);
    writeOpsLog('info', 'asset_withdrawn', { persistent, category: asset.category });
    return c.json({ asset });
  });

  app.get('/api/assets/blob/:token', async (c) => {
    const blob = repo.readSignedBlob(c.req.param('token'));
    return new Response(Uint8Array.from(blob.bytes), {
      headers: {
        'Content-Type': blob.mime,
        'Cache-Control': 'no-store',
        'Content-Disposition': `inline; filename="${blob.filename}"`,
      },
    });
  });
}
