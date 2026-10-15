import type { Hono, Context } from 'hono';
import { z, ZodError } from 'zod';
import { authorizePatientAction } from '../security/authorization.js';
import * as sb from '../db/supabase-repo.js';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { getPatient } from '../store.js';
import { requireCareConsent, currentCareConsents } from '../care/routes.js';
import { AssetError, ASSET_CATEGORIES, consentPurpose } from './inspect.js';
import * as repo from './repository.js';

const intentSchema = z.object({ category: z.enum(ASSET_CATEGORIES) }).strict();
const completeSchema = z.object({ image: z.string().min(20).max(28_000_000).optional() }).strict();

async function access(c: Context, patientId: string, mode: 'patient' | 'read') {
  const auth = c.get('auth');
  const persistent = 'userId' in auth && isSupabaseEnabled();
  if (!persistent) {
    if (!getPatient(patientId)) throw new AssetError(404, 'Paciente no encontrado.');
    return { persistent: false };
  }
  const actor = await authorizePatientAction(
    auth.userId,
    patientId,
    mode === 'patient' ? 'log_activity' : 'read_patient',
    { getActor: sb.sbGetActor, getPatientResource: sb.sbGetPatientResource },
  );
  if (!actor || (mode === 'patient' && actor.role !== 'paciente')) throw new AssetError(403, 'No tenés permiso para esta acción.');
  return { persistent: true };
}

export function registerAssetRoutes(app: Hono) {
  app.post('/api/patients/:id/assets/intents', async c => {
    const id = c.req.param('id');
    const { persistent } = await access(c, id, 'patient');
    let body: z.infer<typeof intentSchema>;
    try { body = intentSchema.parse(await c.req.json()); } catch (error) {
      if (error instanceof ZodError) throw new AssetError(400, 'Revisá los campos del formulario.');
      throw error;
    }
    await requireCareConsent(id, persistent, consentPurpose(body.category));
    const asset = await repo.reserveAsset(id, body.category, persistent);
    const upload = persistent ? await repo.signedQuarantineUpload(asset.object_path) : null;
    return c.json({ asset, expires_in: 900, upload }, 201);
  });

  app.post('/api/patients/:id/assets/:assetId/complete', async c => {
    const id = c.req.param('id');
    const { persistent } = await access(c, id, 'patient');
    let body: z.infer<typeof completeSchema>;
    try { body = completeSchema.parse(await c.req.json()); } catch (error) {
      if (error instanceof ZodError) throw new AssetError(400, 'Revisá los campos del formulario.');
      throw error;
    }
    if (!persistent && !body.image) throw new AssetError(400, 'El archivo no tiene un formato reconocible.');
    const intent = await repo.peekIntent(id, c.req.param('assetId'), persistent);
    await requireCareConsent(id, persistent, consentPurpose(intent.category));
    const asset = await repo.completeAsset(id, c.req.param('assetId'), body.image, persistent);
    return c.json({ asset });
  });

  app.get('/api/patients/:id/assets', async c => {
    const id = c.req.param('id');
    const { persistent } = await access(c, id, 'read');
    const category = c.req.query('category');
    if (category && !ASSET_CATEGORIES.includes(category as typeof ASSET_CATEGORIES[number])) {
      throw new AssetError(400, 'Elegí el tipo de archivo.');
    }
    const { consented } = await currentCareConsents(id, persistent);
    const assets = (await repo.listReadyAssets(id, persistent))
      .filter(row => consented.includes(row.category) && (!category || row.category === category))
      .map(row => ({ id: row.id, category: row.category, mime: row.mime, byte_size: row.byte_size, created_at: row.created_at }));
    return c.json({ assets });
  });

  app.post('/api/patients/:id/assets/:assetId/access', async c => {
    const id = c.req.param('id');
    const { persistent } = await access(c, id, 'read');
    const asset = (await repo.listReadyAssets(id, persistent)).find(row => row.id === c.req.param('assetId'));
    if (!asset) throw new AssetError(404, 'Archivo no encontrado.');
    await requireCareConsent(id, persistent, consentPurpose(asset.category));
    return c.json(await repo.accessAsset(id, c.req.param('assetId'), persistent));
  });

  app.post('/api/patients/:id/assets/:assetId/withdraw', async c => {
    const id = c.req.param('id');
    const { persistent } = await access(c, id, 'patient');
    await repo.withdrawAsset(id, c.req.param('assetId'), persistent);
    return c.json({ ok: true });
  });
}
