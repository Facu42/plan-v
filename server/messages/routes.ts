import type { Hono, Context } from 'hono';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import * as sb from '../db/supabase-repo.js';
import { messageInputSchema, messageReadSchema } from '../schemas.js';
import { authorizePatientAction } from '../security/authorization.js';
import { toPatientSelfView, type PatientAction } from '../security/contracts.js';
import { getPatient } from '../store.js';
import * as repo from './repository.js';
import { writeOpsLog } from '../ops/log.js';

const access = {
  getActor: sb.sbGetActor,
  getPatientResource: sb.sbGetPatientResource,
};

function authorize(userId: string, patientId: string, action: PatientAction) {
  return authorizePatientAction(userId, patientId, action, access);
}

function audience(role: 'nutri' | 'paciente') {
  return role === 'paciente' ? 'patient' as const : 'professional' as const;
}

function partyFromRole(role: 'nutri' | 'paciente'): repo.ThreadParty {
  return role === 'paciente' ? 'patient' : 'vero';
}

async function jsonBody<T>(c: Context, schema: z.ZodType<T>) {
  try {
    return schema.safeParse(await c.req.json());
  } catch {
    return { success: false as const };
  }
}

export function registerMessageRoutes(app: Hono) {
  app.post('/api/patients/:id/messages', async (c) => {
    const auth = c.get('auth');
    const patientId = c.req.param('id');
    const parsedBody = await jsonBody(c, messageInputSchema);
    if (!parsedBody.success) return c.json({ error: 'Datos inválidos' }, 400);
    const body = parsedBody.data;
    const persistent = 'userId' in auth && isSupabaseEnabled();
    const clientId = body.client_id ?? randomUUID();

    if (persistent) {
      const actor = await authorize(auth.userId, patientId, 'send_message');
      if (!actor) return c.json({ error: 'Prohibido' }, 403);
      const patient = await sb.sbGetPatientById(patientId, audience(actor.role));
      const resource = await sb.sbGetPatientResource(patientId);
      if (!patient || !resource) return c.notFound();
      await repo.sendThreadMessage(patientId, {
        text: body.text,
        from: partyFromRole(actor.role),
        suggestedByAi: actor.role === 'nutri' && (body.suggested_by_ai ?? false),
        client_id: clientId,
        asset_id: body.asset_id,
        filename: body.filename,
      }, true);
      const updated = await sb.sbGetPatientById(patientId, audience(actor.role));
      return c.json({
        patient: updated && actor.role === 'paciente' ? toPatientSelfView(updated) : updated,
        source: 'supabase',
      });
    }

    if (!getPatient(patientId)) return c.notFound();
    await repo.sendThreadMessage(patientId, {
      text: body.text,
      from: body.from,
      suggestedByAi: body.from === 'vero' && (body.suggested_by_ai ?? false),
      client_id: clientId,
      asset_id: body.asset_id,
      filename: body.filename,
    }, false);
    const updated = getPatient(patientId)!;
    return c.json({
      patient: body.from === 'patient' ? toPatientSelfView(updated) : updated,
      source: 'memory',
    });
  });

  app.post('/api/patients/:id/messages/read', async (c) => {
    const auth = c.get('auth');
    const patientId = c.req.param('id');
    const parsedBody = await jsonBody(c, messageReadSchema);
    if (!parsedBody.success) return c.json({ error: 'Datos inválidos' }, 400);
    const persistent = 'userId' in auth && isSupabaseEnabled();

    if (persistent) {
      const actor = await authorize(auth.userId, patientId, 'send_message');
      if (!actor) return c.json({ error: 'Prohibido' }, 403);
      await repo.markThreadRead(patientId, partyFromRole(actor.role), true);
      const updated = await sb.sbGetPatientById(patientId, audience(actor.role));
      if (!updated) return c.notFound();
      return c.json({
        patient: actor.role === 'paciente' ? toPatientSelfView(updated) : updated,
        source: 'supabase',
      });
    }

    const patient = await repo.markThreadRead(patientId, parsedBody.data.reader, false);
    if (!patient) return c.notFound();
    return c.json({
      patient,
      source: 'memory',
    });
  });

  app.post('/api/patients/:id/messages/:messageId/attachment', async (c) => {
    const auth = c.get('auth');
    const patientId = c.req.param('id');
    const messageId = c.req.param('messageId');
    const persistent = 'userId' in auth && isSupabaseEnabled();
    if (persistent) {
      const actor = await authorize(auth.userId, patientId, 'send_message');
      if (!actor) return c.json({ error: 'Prohibido' }, 403);
    } else if (!getPatient(patientId)) {
      return c.notFound();
    }
    const grant = await repo.openThreadAttachment(patientId, messageId, persistent);
    writeOpsLog('info', 'chat_attachment_access', { persistent, mime: grant.mime });
    return c.json(grant);
  });
}
