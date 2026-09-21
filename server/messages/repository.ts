import { randomUUID } from 'node:crypto';
import type { Message, Patient } from '../../src/types/index.js';
import { getRequestDb } from '../db/supabase-client.js';
import { CareError } from '../care/errors.js';
import { getPatient } from '../store.js';

export { CareError } from '../care/errors.js';

export type ThreadParty = 'vero' | 'patient';

type MemReceipt = {
  delivered_at: string | null;
  read_at: string | null;
};

type MemMessage = Message & { client_id: string };

const messages = new Map<string, MemMessage>();
const clientIndex = new Map<string, string>();
const receipts = new Map<string, MemReceipt>();

const MISSING_SCHEMA = ['42P01', '42883', 'PGRST202', 'PGRST205', '42703'];

export function resetMessageMemory() {
  messages.clear();
  clientIndex.clear();
  receipts.clear();
}

export function messageDbError(error: { code?: string; message?: string } | null) {
  if (!error) return;
  if (MISSING_SCHEMA.includes(error.code ?? '')) {
    throw new CareError(501, 'Los hilos de mensajes requieren instalar la migración de este módulo.');
  }
  if (error.code === '42501') throw new CareError(403, 'No tenés permiso para esta acción.');
  if (error.code === 'PT404' || error.code === 'PGRST116') throw new CareError(404, 'No encontramos esa conversación.');
  if (['22023', '23514', '22P02'].includes(error.code ?? '')) {
    throw new CareError(400, 'Revisá el texto o el identificador del mensaje.');
  }
  throw new CareError(503, 'No se pudo confirmar el envío. Reintentá sin duplicar el mensaje.');
}

export function isMissingMessageSchema(error: { code?: string } | null | undefined) {
  return MISSING_SCHEMA.includes(error?.code ?? '');
}

function counterpartOf(from: ThreadParty): ThreadParty {
  return from === 'vero' ? 'patient' : 'vero';
}

function receiptKey(messageId: string, userId: string) {
  return `${messageId}:${userId}`;
}

function asIso(value: unknown): string | null {
  if (value == null) return null;
  return String(value);
}

export function asThreadMessage(row: Record<string, unknown>): Message {
  const from = row.from;
  if (from !== 'vero' && from !== 'patient') {
    throw new CareError(503, 'No se pudo confirmar el envío. Reintentá sin duplicar el mensaje.');
  }
  if (!row.id || !row.patient_id || !row.sent_at) {
    throw new CareError(503, 'No se pudo confirmar el envío. Reintentá sin duplicar el mensaje.');
  }
  return {
    id: String(row.id),
    patient_id: String(row.patient_id),
    from,
    text: String(row.text ?? row.body ?? ''),
    suggested_by_ai: Boolean(row.suggested_by_ai),
    sent_at: String(row.sent_at),
    delivered_at: asIso(row.delivered_at),
    read_at: asIso(row.read_at),
  };
}

function project(entry: MemMessage): Message {
  const receipt = receipts.get(receiptKey(entry.id, counterpartOf(entry.from)));
  const { client_id: _clientId, ...message } = entry;
  return {
    ...message,
    delivered_at: receipt?.delivered_at ?? entry.delivered_at ?? null,
    read_at: receipt?.read_at ?? entry.read_at ?? null,
  };
}

function attachToPatient(message: Message, insert: boolean) {
  const patient = getPatient(message.patient_id);
  if (!patient) throw new CareError(404, 'No encontramos esa conversación.');
  const idx = patient.messages.findIndex((row) => row.id === message.id);
  if (idx >= 0) patient.messages[idx] = { ...patient.messages[idx], ...message };
  else if (insert) patient.messages.push(message);
  else throw new CareError(404, 'No encontramos esa conversación.');
}

function refreshPatientThread(patientId: string) {
  const patient = getPatient(patientId);
  if (!patient) throw new CareError(404, 'No encontramos esa conversación.');
  patient.messages = patient.messages.map((row) => {
    const stored = messages.get(row.id);
    if (!stored) {
      const counterpart = counterpartOf(row.from);
      const receipt = receipts.get(receiptKey(row.id, counterpart));
      if (!receipt) return row;
      return { ...row, delivered_at: receipt.delivered_at, read_at: receipt.read_at };
    }
    return project(stored);
  });
  return patient;
}

function ensureIncomingReceipts(patientId: string, reader: ThreadParty, stamp: { delivered?: boolean; read?: boolean }) {
  const patient = getPatient(patientId);
  if (!patient) throw new CareError(404, 'No encontramos esa conversación.');
  const incomingFrom = counterpartOf(reader);
  const at = new Date().toISOString();
  for (const row of patient.messages) {
    if (!row.sent_at || row.from !== incomingFrom) continue;
    const key = receiptKey(row.id, reader);
    const current = receipts.get(key) ?? { delivered_at: row.delivered_at ?? null, read_at: row.read_at ?? null };
    if (stamp.delivered && !current.delivered_at) current.delivered_at = at;
    if (stamp.read && !current.read_at) current.read_at = at;
    receipts.set(key, current);
  }
}

export function sendMemoryMessage(
  patientId: string,
  input: { text: string; from: ThreadParty; suggestedByAi: boolean; client_id: string },
): { message: Message; duplicate: boolean } {
  if (!getPatient(patientId)) throw new CareError(404, 'No encontramos esa conversación.');
  const key = `${patientId}:${input.client_id}`;
  const existingId = clientIndex.get(key);
  if (existingId) {
    const existing = messages.get(existingId);
    if (!existing) throw new CareError(503, 'No se pudo confirmar el envío. Reintentá sin duplicar el mensaje.');
    return { message: project(existing), duplicate: true };
  }
  const entry: MemMessage = {
    id: randomUUID(),
    patient_id: patientId,
    from: input.from,
    text: input.text,
    suggested_by_ai: input.suggestedByAi,
    sent_at: new Date().toISOString(),
    delivered_at: null,
    read_at: null,
    client_id: input.client_id,
  };
  messages.set(entry.id, entry);
  clientIndex.set(key, entry.id);
  receipts.set(receiptKey(entry.id, counterpartOf(entry.from)), { delivered_at: null, read_at: null });
  const message = project(entry);
  attachToPatient(message, true);
  return { message, duplicate: false };
}

export async function sendThreadMessage(
  patientId: string,
  input: { text: string; from: ThreadParty; suggestedByAi: boolean; client_id: string },
  persistent: boolean,
): Promise<{ message: Message; duplicate: boolean }> {
  if (!persistent) return sendMemoryMessage(patientId, input);
  let data: unknown;
  let error: { code?: string; message?: string } | null = null;
  try {
    const result = await getRequestDb().rpc('send_thread_message', {
      payload: {
        patient_id: patientId,
        client_id: input.client_id,
        text: input.text,
        suggested_by_ai: input.suggestedByAi,
      },
    });
    data = result.data;
    error = result.error;
  } catch (caught) {
    if (caught instanceof CareError) throw caught;
    messageDbError(caught as { code?: string; message?: string });
    throw new CareError(503, 'No se pudo confirmar el envío. Reintentá sin duplicar el mensaje.');
  }
  messageDbError(error);
  const row = data as { message?: Record<string, unknown>; duplicate?: boolean } | null;
  if (!row?.message) throw new CareError(503, 'No se pudo confirmar el envío. Reintentá sin duplicar el mensaje.');
  return { message: asThreadMessage(row.message), duplicate: Boolean(row.duplicate) };
}

export function markMemoryRead(patientId: string, reader: ThreadParty): Patient {
  ensureIncomingReceipts(patientId, reader, { delivered: true, read: true });
  return refreshPatientThread(patientId);
}

export async function markThreadRead(
  patientId: string,
  reader: ThreadParty,
  persistent: boolean,
): Promise<Patient | undefined> {
  if (!persistent) return markMemoryRead(patientId, reader);
  let error: { code?: string; message?: string } | null = null;
  try {
    const result = await getRequestDb().rpc('mark_thread_read', { target_patient: patientId });
    error = result.error;
  } catch (caught) {
    if (caught instanceof CareError) throw caught;
    messageDbError(caught as { code?: string; message?: string });
    throw new CareError(503, 'No se pudo confirmar el envío. Reintentá sin duplicar el mensaje.');
  }
  messageDbError(error);
  return undefined;
}

export async function ackThreadDelivery(
  patientId: string,
  reader: ThreadParty,
  persistent: boolean,
): Promise<Patient | undefined> {
  if (!persistent) {
    ensureIncomingReceipts(patientId, reader, { delivered: true });
    return refreshPatientThread(patientId);
  }
  let error: { code?: string; message?: string } | null = null;
  try {
    const result = await getRequestDb().rpc('ack_thread_delivery', { target_patient: patientId });
    error = result.error;
  } catch (caught) {
    if (caught instanceof CareError) throw caught;
    messageDbError(caught as { code?: string; message?: string });
    throw new CareError(503, 'No se pudo confirmar el envío. Reintentá sin duplicar el mensaje.');
  }
  messageDbError(error);
  return undefined;
}

export async function listThreadMessagesPersist(patientId: string): Promise<Message[] | null> {
  try {
    const { data, error } = await getRequestDb().rpc('list_thread_messages', {
      target_patient: patientId,
      ack_delivery: false,
    });
    if (isMissingMessageSchema(error)) return null;
    if (error || !Array.isArray(data)) return null;
    return data.map((row) => asThreadMessage(row as Record<string, unknown>));
  } catch {
    return null;
  }
}
