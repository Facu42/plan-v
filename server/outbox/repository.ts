import { getRequestDb } from '../db/supabase-client.js';
import { CareError } from '../care/errors.js';
import { getPatient } from '../store.js';
import {
  DEFAULT_NOTIFICATION_PREFS,
  type NotificationPrefs,
  type OutboxDelivery,
  type OutboxEvent,
  type OutboxEventType,
  type OutboxNoticeKind,
  type OutboxSnapshot,
} from '../../src/types/outbox.js';
import type { DemoNotice } from '../store.js';
import {
  enqueueMemoryOutbox,
  listMemoryMailbox,
  listMemorySnapshot,
  memoryPrefs,
  processMemoryDeliveries,
  saveMemoryPrefs,
  type MemoryEnqueueInput,
} from './memory.js';

export { CareError } from '../care/errors.js';
export {
  resetOutboxMemory,
  memoryHasSentEmailOrPush,
  DEMO_NOTICE_TO,
} from './memory.js';

const MISSING_SCHEMA = ['42P01', '42883', 'PGRST202', 'PGRST205', '42703'];

export function outboxDbError(error: { code?: string; message?: string } | null) {
  if (!error) return;
  if (MISSING_SCHEMA.includes(error.code ?? '')) {
    throw new CareError(501, 'Los avisos requieren instalar la migración de este módulo.');
  }
  if (error.code === '42501') throw new CareError(403, 'No tenés permiso para esta acción.');
  if (error.code === 'PT404' || error.code === 'PGRST116') throw new CareError(404, 'No encontramos a esa persona.');
  if (error.code === 'PT409' || error.code === '23505') throw new CareError(409, 'Ese aviso ya se usó con otro contenido.');
  if (['22023', '23514', '22P02'].includes(error.code ?? '')) {
    throw new CareError(400, 'Revisá el aviso o las preferencias.');
  }
  throw new CareError(503, 'No se pudo confirmar el aviso. Reintentá sin duplicar el envío.');
}

export function isMissingOutboxSchema(error: { code?: string } | null | undefined) {
  return MISSING_SCHEMA.includes(error?.code ?? '');
}

export function notificationProvidersConfigured() {
  return { email: false as const, push: false as const, reason: 'provider_unconfigured' as const };
}

function asEvent(raw: Record<string, unknown>): OutboxEvent {
  const payload = (raw.payload ?? {}) as Record<string, unknown>;
  return {
    id: String(raw.id),
    event_type: raw.event_type as OutboxEventType,
    patient_id: String(raw.patient_id),
    nutritionist_id: raw.nutritionist_id == null ? null : String(raw.nutritionist_id),
    client_id: String(raw.client_id),
    dedupe_key: String(raw.dedupe_key),
    payload: {
      subject: String(payload.subject ?? ''),
      body: String(payload.body ?? ''),
      kind: payload.kind as OutboxNoticeKind,
    },
    created_at: String(raw.created_at),
  };
}

function asDelivery(raw: Record<string, unknown>): OutboxDelivery {
  return {
    id: String(raw.id),
    outbox_event_id: String(raw.outbox_event_id),
    channel: raw.channel as OutboxDelivery['channel'],
    recipient_user_id: raw.recipient_user_id == null ? null : String(raw.recipient_user_id),
    status: raw.status as OutboxDelivery['status'],
    attempt: Number(raw.attempt ?? 0),
    max_attempts: Number(raw.max_attempts ?? 5),
    last_error: raw.last_error == null ? null : String(raw.last_error),
    skip_reason: raw.skip_reason == null ? null : String(raw.skip_reason),
    next_attempt_at: raw.next_attempt_at == null ? null : String(raw.next_attempt_at),
    sent_at: raw.sent_at == null ? null : String(raw.sent_at),
    created_at: String(raw.created_at),
  };
}

function asSnapshot(data: unknown): OutboxSnapshot {
  const row = data as { event?: Record<string, unknown>; deliveries?: Record<string, unknown>[] };
  return {
    event: asEvent(row.event ?? {}),
    deliveries: Array.isArray(row.deliveries) ? row.deliveries.map(asDelivery) : [],
  };
}

export type EnqueueOutboxInput = {
  patient_id: string;
  event_type: OutboxEventType;
  client_id: string;
  dedupe_key?: string;
  subject: string;
  body: string;
  kind: OutboxNoticeKind;
  pref_user?: string;
};

function memoryPatient(patientId: string): MemoryEnqueueInput['patient'] {
  const patient = getPatient(patientId);
  if (!patient) throw new CareError(404, 'No encontramos a esa persona.');
  return {
    id: patient.id,
    nutritionist_id: 'nutritionist_id' in patient ? String((patient as { nutritionist_id?: string }).nutritionist_id ?? '') : null,
    deactivated_at: patient.deactivated_at,
    anonymized_at: patient.anonymized_at,
  };
}

export async function enqueueOutboxEvent(input: EnqueueOutboxInput, persistent: boolean): Promise<OutboxSnapshot> {
  if (!persistent) {
    const snapshot = enqueueMemoryOutbox({
      patient: memoryPatient(input.patient_id),
      event_type: input.event_type,
      client_id: input.client_id,
      dedupe_key: input.dedupe_key,
      subject: input.subject,
      body: input.body,
      kind: input.kind,
      pref_user: input.pref_user ?? input.patient_id,
    });
    return snapshot;
  }
  const { data, error } = await getRequestDb().rpc('enqueue_outbox_event', {
    payload: {
      patient_id: input.patient_id,
      event_type: input.event_type,
      client_id: input.client_id,
      ...(input.dedupe_key ? { dedupe_key: input.dedupe_key } : {}),
      subject: input.subject,
      body: input.body,
      kind: input.kind,
    },
  });
  outboxDbError(error);
  const snapshot = asSnapshot(data);
  await processOutboxDeliveries(persistent).catch(() => undefined);
  return snapshot;
}

export async function enqueueOutboxBestEffort(input: EnqueueOutboxInput, persistent: boolean) {
  try {
    return await enqueueOutboxEvent(input, persistent);
  } catch {
    return null;
  }
}

export async function listOutboxMailbox(patientId: string | undefined, persistent: boolean): Promise<DemoNotice[]> {
  if (!persistent) return listMemoryMailbox(patientId);
  if (!patientId) throw new CareError(400, 'Revisá el aviso o las preferencias.');
  const { data, error } = await getRequestDb().rpc('list_outbox_mailbox', { target_patient: patientId });
  outboxDbError(error);
  const notices = (data as { notices?: DemoNotice[] } | null)?.notices;
  return Array.isArray(notices) ? notices : [];
}

export async function listOutboxSnapshot(patientId: string, persistent: boolean): Promise<OutboxSnapshot[]> {
  if (!persistent) return listMemorySnapshot(patientId);
  const { data, error } = await getRequestDb().rpc('list_outbox_snapshot', { target_patient: patientId });
  outboxDbError(error);
  const rows = (data as { events?: unknown[] } | null)?.events;
  return Array.isArray(rows) ? rows.map(asSnapshot) : [];
}

export async function processOutboxDeliveries(persistent: boolean, limit = 20): Promise<OutboxDelivery[]> {
  if (!persistent) return processMemoryDeliveries(limit);
  const { data, error } = await getRequestDb().rpc('process_outbox_deliveries', { input: { limit } });
  outboxDbError(error);
  const rows = (data as { deliveries?: Record<string, unknown>[] } | null)?.deliveries;
  return Array.isArray(rows) ? rows.map(asDelivery) : [];
}

export async function getNotificationPrefs(user: string, persistent: boolean): Promise<NotificationPrefs> {
  if (!persistent) return memoryPrefs(user);
  const { data, error } = await getRequestDb().rpc('get_notification_preferences');
  outboxDbError(error);
  const row = data as NotificationPrefs | null;
  if (!row) return { ...DEFAULT_NOTIFICATION_PREFS };
  return { in_app: Boolean(row.in_app), email: Boolean(row.email), push: Boolean(row.push) };
}

export async function saveNotificationPrefs(user: string, next: NotificationPrefs, persistent: boolean): Promise<NotificationPrefs> {
  if (!persistent) return saveMemoryPrefs(user, next);
  const { data, error } = await getRequestDb().rpc('save_notification_preferences', {
    payload: { in_app: next.in_app, email: next.email, push: next.push },
  });
  outboxDbError(error);
  const row = data as NotificationPrefs;
  return { in_app: Boolean(row.in_app), email: Boolean(row.email), push: Boolean(row.push) };
}

export function mailboxFromSnapshot(snapshot: OutboxSnapshot): DemoNotice | null {
  const inApp = snapshot.deliveries.find((row) => row.channel === 'in_app' && row.status === 'sent');
  if (!inApp) return null;
  return {
    id: snapshot.event.id,
    at: snapshot.event.created_at,
    channel: 'email',
    to: 'aviso.demo@plan-v.local',
    subject: snapshot.event.payload.subject,
    body: snapshot.event.payload.body,
    patientId: snapshot.event.patient_id,
    kind: snapshot.event.payload.kind === 'appointment' || snapshot.event.payload.kind === 'reminder'
      ? snapshot.event.payload.kind
      : 'reminder',
  };
}
