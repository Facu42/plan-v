import type { Hono, Context } from 'hono';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import * as sb from '../db/supabase-repo.js';
import { noticeCreateSchema } from '../schemas.js';
import { notificationPrefsSchema, outboxEnqueueSchema } from '../../src/types/outbox.js';
import { authorizePatientAction } from '../security/authorization.js';
import { getPatient } from '../store.js';
import * as repo from './repository.js';

const access = {
  getActor: sb.sbGetActor,
  getPatientResource: sb.sbGetPatientResource,
};

async function jsonBody<T>(c: Context, schema: z.ZodType<T>) {
  const raw = await c.req.text();
  if (raw.length > 8_000) throw new repo.CareError(413, 'El archivo es demasiado grande.');
  try {
    return schema.parse(JSON.parse(raw));
  } catch {
    throw new repo.CareError(400, 'Revisá el aviso o las preferencias.');
  }
}

async function patientAccess(c: Context, patientId: string, write: boolean) {
  const auth = c.get('auth');
  const persistent = 'userId' in auth && isSupabaseEnabled();
    if (!persistent) {
    if (!getPatient(patientId)) throw new repo.CareError(404, 'No encontramos a esa persona.');
    return { persistent: false, prefUser: c.req.query('audience') === 'pro' ? 'pro' : patientId };
  }
  const actor = await authorizePatientAction(auth.userId, patientId, write ? 'send_message' : 'read_patient', access);
  if (!actor) throw new repo.CareError(403, 'No tenés permiso para esta acción.');
  return { persistent: true, prefUser: auth.userId };
}

function persistentAuth(c: Context) {
  const auth = c.get('auth');
  return 'userId' in auth && isSupabaseEnabled();
}

export function registerOutboxRoutes(app: Hono) {
  app.get('/api/notices', async (c) => {
    const patientId = c.req.query('patientId') || undefined;
    const persistent = persistentAuth(c);
    if (persistent && !patientId) throw new repo.CareError(400, 'Revisá el aviso o las preferencias.');
    if (patientId) await patientAccess(c, patientId, false);
    const notices = await repo.listOutboxMailbox(patientId, persistent);
    return c.json({ notices, source: persistent ? 'supabase' : 'memory' });
  });

  app.post('/api/notices', async (c) => {
    const body = await jsonBody(c, noticeCreateSchema);
    const { persistent, prefUser } = await patientAccess(c, body.patientId, true);
    const snapshot = await repo.enqueueOutboxEvent({
      patient_id: body.patientId,
      event_type: 'reminder',
      client_id: body.client_id ?? randomUUID(),
      subject: `Recordatorio · ${body.title}`,
      body: `${body.detail} Este aviso quedó en el buzón in-app de Plan V; no se envió a internet.`,
      kind: 'reminder',
      pref_user: prefUser,
    }, persistent);
    const notice = repo.mailboxFromSnapshot(snapshot);
    if (!notice) {
      return c.json({
        notice: null,
        event: snapshot.event,
        deliveries: snapshot.deliveries,
        source: persistent ? 'supabase' : 'memory',
      }, 201);
    }
    return c.json({ notice, deliveries: snapshot.deliveries, source: persistent ? 'supabase' : 'memory' }, 201);
  });

  app.get('/api/outbox', async (c) => {
    const patientId = c.req.query('patientId');
    if (!patientId) throw new repo.CareError(400, 'Revisá el aviso o las preferencias.');
    const { persistent } = await patientAccess(c, patientId, false);
    const events = await repo.listOutboxSnapshot(patientId, persistent);
    return c.json({
      events,
      providers: repo.notificationProvidersConfigured(),
      source: persistent ? 'supabase' : 'memory',
    });
  });

  app.post('/api/outbox', async (c) => {
    const input = await jsonBody(c, outboxEnqueueSchema);
    const { persistent, prefUser } = await patientAccess(c, input.patient_id, true);
    const snapshot = await repo.enqueueOutboxEvent({ ...input, pref_user: prefUser }, persistent);
    return c.json({
      event: snapshot.event,
      deliveries: snapshot.deliveries,
      providers: repo.notificationProvidersConfigured(),
      source: persistent ? 'supabase' : 'memory',
    }, 201);
  });

  app.post('/api/outbox/drain', async (c) => {
    const persistent = persistentAuth(c);
    const deliveries = await repo.processOutboxDeliveries(persistent);
    return c.json({
      deliveries,
      providers: repo.notificationProvidersConfigured(),
      source: persistent ? 'supabase' : 'memory',
    });
  });

  app.get('/api/notification-preferences', async (c) => {
    const persistent = persistentAuth(c);
    const user = persistent
      ? (c.get('auth') as { userId: string }).userId
      : (c.req.query('audience') === 'pro' ? 'pro' : (c.req.query('patientId') || 'patient'));
    const prefs = await repo.getNotificationPrefs(user, persistent);
    return c.json({ prefs, source: persistent ? 'supabase' : 'memory' });
  });

  app.put('/api/notification-preferences', async (c) => {
    const next = await jsonBody(c, notificationPrefsSchema);
    const persistent = persistentAuth(c);
    const user = persistent
      ? (c.get('auth') as { userId: string }).userId
      : (c.req.query('audience') === 'pro' ? 'pro' : (c.req.query('patientId') || 'patient'));
    const prefs = await repo.saveNotificationPrefs(user, next, persistent);
    return c.json({ prefs, source: persistent ? 'supabase' : 'memory' });
  });
}
