import { randomUUID } from 'node:crypto';
import { CareError } from '../care/errors.js';
import {
  DEFAULT_NOTIFICATION_PREFS,
  OUTBOX_CHANNELS,
  type NotificationPrefs,
  type OutboxDelivery,
  type OutboxEvent,
  type OutboxEventType,
  type OutboxNoticeKind,
  type OutboxSnapshot,
} from '../../src/types/outbox.js';

export const DEMO_NOTICE_TO = 'aviso.demo@plan-v.local';

export type MailboxNotice = {
  id: string;
  at: string;
  channel: 'email';
  to: string;
  subject: string;
  body: string;
  patientId: string;
  kind: 'appointment' | 'reminder';
};

export type MemoryPatientGate = {
  id: string;
  nutritionist_id?: string | null;
  deactivated_at?: string | null;
  anonymized_at?: string | null;
};

export type MemoryEnqueueInput = {
  patient: MemoryPatientGate;
  event_type: OutboxEventType;
  client_id: string;
  dedupe_key?: string;
  subject: string;
  body: string;
  kind: OutboxNoticeKind;
  pref_user?: string;
};

const events = new Map<string, OutboxEvent>();
const deliveries = new Map<string, OutboxDelivery>();
const clientIndex = new Map<string, string>();
const dedupeIndex = new Map<string, string>();
const prefs = new Map<string, NotificationPrefs>();
const unlinked = new Set<string>();

export function resetOutboxMemory() {
  events.clear();
  deliveries.clear();
  clientIndex.clear();
  dedupeIndex.clear();
  prefs.clear();
  unlinked.clear();
}

export function markMemoryUnlinked(patientId: string) {
  unlinked.add(patientId);
}

function skipReasonFor(patient: MemoryPatientGate) {
  if (patient.deactivated_at || patient.anonymized_at) return 'deactivated';
  if (unlinked.has(patient.id)) return 'unlinked';
  return null;
}

function prefKey(user: string) {
  return user;
}

export function memoryPrefs(user: string): NotificationPrefs {
  return prefs.get(prefKey(user)) ?? { ...DEFAULT_NOTIFICATION_PREFS };
}

export function saveMemoryPrefs(user: string, next: NotificationPrefs): NotificationPrefs {
  const value = { in_app: next.in_app, email: next.email, push: next.push };
  prefs.set(prefKey(user), value);
  return { ...value };
}

function snapshotOf(event: OutboxEvent): OutboxSnapshot {
  return {
    event,
    deliveries: [...deliveries.values()].filter((row) => row.outbox_event_id === event.id).sort((a, b) => a.channel.localeCompare(b.channel)),
  };
}

function samePayload(event: OutboxEvent, input: MemoryEnqueueInput) {
  return event.event_type === input.event_type
    && event.dedupe_key === (input.dedupe_key?.trim() || input.client_id)
    && event.payload.subject === input.subject.trim()
    && event.payload.body === input.body.trim()
    && event.payload.kind === input.kind;
}

export function enqueueMemoryOutbox(input: MemoryEnqueueInput): OutboxSnapshot {
  const patientId = input.patient.id;
  const clientKey = `${patientId}:${input.client_id}`;
  const dedupe = input.dedupe_key?.trim() || input.client_id;
  const existingId = clientIndex.get(clientKey);
  if (existingId) {
    const existing = events.get(existingId);
    if (!existing) throw new CareError(503, 'No se pudo confirmar el aviso. Reintentá sin duplicar el envío.');
    if (!samePayload(existing, { ...input, dedupe_key: dedupe })) {
      throw new CareError(409, 'Ese aviso ya se usó con otro contenido.');
    }
    return snapshotOf(existing);
  }
  const dedupeKey = `${patientId}:${input.event_type}:${dedupe}`;
  const replay = dedupeIndex.get(dedupeKey);
  if (replay) {
    const existing = events.get(replay);
    if (!existing) throw new CareError(503, 'No se pudo confirmar el aviso. Reintentá sin duplicar el envío.');
    return snapshotOf(existing);
  }

  const stamp = new Date().toISOString();
  const event: OutboxEvent = {
    id: randomUUID(),
    event_type: input.event_type,
    patient_id: patientId,
    nutritionist_id: input.patient.nutritionist_id ?? null,
    client_id: input.client_id,
    dedupe_key: dedupe,
    payload: {
      subject: input.subject.trim(),
      body: input.body.trim(),
      kind: input.kind,
    },
    created_at: stamp,
  };
  events.set(event.id, event);
  clientIndex.set(clientKey, event.id);
  dedupeIndex.set(dedupeKey, event.id);

  const skip = skipReasonFor(input.patient);
  const userPrefs = memoryPrefs(input.pref_user ?? patientId);
  for (const channel of OUTBOX_CHANNELS) {
    const prefOn = userPrefs[channel];
    let status: OutboxDelivery['status'] = 'queued';
    let reason: string | null = null;
    let sentAt: string | null = null;
    if (skip) {
      status = 'skipped';
      reason = skip;
    } else if (!prefOn) {
      status = 'skipped';
      reason = 'pref_off';
    } else if (channel === 'in_app') {
      status = 'sent';
      sentAt = stamp;
    } else {
      status = 'queued';
    }
    const row: OutboxDelivery = {
      id: randomUUID(),
      outbox_event_id: event.id,
      channel,
      recipient_user_id: skip === 'unlinked' ? null : patientId,
      status,
      attempt: 0,
      max_attempts: 5,
      last_error: null,
      skip_reason: reason,
      next_attempt_at: status === 'queued' ? stamp : null,
      sent_at: sentAt,
      created_at: stamp,
    };
    deliveries.set(row.id, row);
  }
  return snapshotOf(event);
}

export function processMemoryDeliveries(limit = 20): OutboxDelivery[] {
  const due = [...deliveries.values()]
    .filter((row) => row.status === 'queued' && (!row.next_attempt_at || row.next_attempt_at <= new Date().toISOString()))
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .slice(0, limit);
  const hourLater = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const processed: OutboxDelivery[] = [];
  for (const row of due) {
    if (row.channel === 'email' || row.channel === 'push') {
      row.last_error = 'provider_unconfigured';
      row.next_attempt_at = hourLater;
      // never sent — no adapter, no keys
    } else if (row.channel === 'in_app') {
      row.status = 'sent';
      row.sent_at = row.sent_at ?? new Date().toISOString();
      row.last_error = null;
      row.next_attempt_at = null;
    }
    deliveries.set(row.id, row);
    processed.push({ ...row });
  }
  return processed;
}

export function listMemoryMailbox(patientId?: string): MailboxNotice[] {
  return [...events.values()]
    .filter((event) => !patientId || event.patient_id === patientId)
    .filter((event) => snapshotOf(event).deliveries.some((row) => row.channel === 'in_app' && row.status === 'sent'))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((event) => ({
      id: event.id,
      at: event.created_at,
      channel: 'email' as const,
      to: DEMO_NOTICE_TO,
      subject: event.payload.subject,
      body: event.payload.body,
      patientId: event.patient_id,
      kind: event.payload.kind === 'appointment' || event.payload.kind === 'reminder' ? event.payload.kind : 'reminder',
    }));
}

export function listMemorySnapshot(patientId: string): OutboxSnapshot[] {
  return [...events.values()]
    .filter((event) => event.patient_id === patientId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(snapshotOf);
}

export function memoryHasSentEmailOrPush(patientId?: string) {
  return [...deliveries.values()].some((row) => {
    if (row.channel === 'in_app') return false;
    if (row.status !== 'sent') return false;
    if (!patientId) return true;
    const event = events.get(row.outbox_event_id);
    return event?.patient_id === patientId;
  });
}
