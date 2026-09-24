import type { Hono, Context } from 'hono';
import { z } from 'zod';
import { authorizePatientAction } from '../security/authorization.js';
import * as sb from '../db/supabase-repo.js';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { getPatient } from '../store.js';
import { writeOpsLog } from '../ops/log.js';
import { PRIVACY_REQUEST_KINDS } from '../../src/types/privacy.js';
import * as repo from './repository.js';

async function jsonBody<T>(c: Context, schema: z.ZodType<T>): Promise<T> {
  try {
    return schema.parse(await c.req.json());
  } catch {
    throw new repo.CareError(400, 'Revisá el tipo de pedido.');
  }
}

async function patientOnly(c: Context, patientId: string) {
  const auth = c.get('auth');
  const persistent = 'userId' in auth && isSupabaseEnabled();
  if (!persistent) {
    if (!getPatient(patientId)) throw new repo.CareError(404, 'Paciente no encontrado.');
    if (c.req.query('audience') === 'pro') throw new repo.CareError(403, 'Sólo el paciente puede pedir exportación o borrado.');
    return { persistent: false };
  }
  const actor = await authorizePatientAction(auth.userId, patientId, 'request_privacy', {
    getActor: sb.sbGetActor,
    getPatientResource: sb.sbGetPatientResource,
  });
  if (!actor || actor.role !== 'paciente') throw new repo.CareError(403, 'Sólo el paciente puede pedir exportación o borrado.');
  return { persistent: true };
}

const createSchema = z.object({
  kind: z.enum(PRIVACY_REQUEST_KINDS),
  notes: z.string().max(500).optional(),
}).strict();

export function registerPrivacyRoutes(app: Hono) {
  app.post('/api/patients/:id/privacy/requests', async (c) => {
    const patientId = c.req.param('id');
    const { persistent } = await patientOnly(c, patientId);
    const body = await jsonBody(c, createSchema);
    const request = await repo.requestPrivacyAction(patientId, body.kind, persistent, body.notes ?? '');
    writeOpsLog('info', 'privacy_requested', { kind: body.kind, persistent });
    return c.json({ request, source: persistent ? 'supabase' : 'memory' }, 201);
  });

  app.get('/api/patients/:id/privacy/requests', async (c) => {
    const patientId = c.req.param('id');
    const { persistent } = await patientOnly(c, patientId);
    const requests = await repo.listPrivacyRequests(patientId, persistent);
    return c.json({ requests, source: persistent ? 'supabase' : 'memory' });
  });

  app.get('/api/patients/:id/privacy/requests/:requestId/package', async (c) => {
    const patientId = c.req.param('id');
    const { persistent } = await patientOnly(c, patientId);
    const downloaded = await repo.downloadPrivacyPackage(patientId, c.req.param('requestId'), persistent);
    writeOpsLog('info', 'privacy_export_downloaded', { persistent, category: 'export' });
    return c.json({ ...downloaded, source: persistent ? 'supabase' : 'memory' });
  });
}
