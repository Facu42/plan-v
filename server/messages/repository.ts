import { randomUUID } from 'node:crypto';
import type { Message, MessageAttachment, Patient } from '../../src/types/index.js';
import { getRequestDb } from '../db/supabase-client.js';
import { CareError } from '../care/errors.js';
import { getPatient } from '../store.js';
import { privateAssetSnapshot, accessPrivateAsset } from '../assets/repository.js';

export { CareError } from '../care/errors.js';

export type ThreadParty = 'vero' | 'patient';

export type ThreadSendInput = {
  text: string;
  from: ThreadParty;
  suggestedByAi: boolean;
  client_id: string;
  asset_id?: string;
  filename?: string;
};

type MemReceipt = {
  delivered_at: string | null;
  read_at: string | null;
};

type MemMessage = Message & { client_id: string };

const messages = new Map<string, MemMessage>();
const clientIndex = new Map<string, string>();
const receipts = new Map<string, MemReceipt>();
const attachments = new Map<string, MessageAttachment>();
const assetIndex = new Map<string, string>();

const MISSING_SCHEMA = ['42P01', '42883', 'PGRST202', 'PGRST205', '42703'];

export function resetMessageMemory() {
  messages.clear();
  clientIndex.clear();
  receipts.clear();
  attachments.clear();
  assetIndex.clear();
}

export function sanitizeChatFilename(raw: string | undefined, mime: string) {
  const ext = mime === 'application/pdf' ? '.pdf' : mime === 'image/png' ? '.png' : mime === 'image/webp' ? '.webp' : '.jpg';
  const stem = (raw ?? 'adjunto')
    .replace(/[\\/]+/g, '')
    .replace(/[^A-Za-z0-9._ \-áéíóúñÁÉÍÓÚÑ]/g, '')
    .trim()
    .replace(/\.[A-Za-z0-9]+$/, '')
    .slice(0, 70) || 'adjunto';
  return `${stem}${ext}`;
}

export function messageDbError(error: { code?: string; message?: string } | null) {
  if (!error) return;
  if (MISSING_SCHEMA.includes(error.code ?? '')) {
    throw new CareError(501, 'Los hilos de mensajes requieren instalar la migración de este módulo.');
  }
  if (error.code === '42501') throw new CareError(403, 'No tenés permiso para esta acción.');
  if (error.code === 'PT409' || error.code === '23505') {
    throw new CareError(409, 'Ese identificador ya se usó con otro adjunto.');
  }
  if (error.code === 'PT404' || error.code === 'PGRST116') {
    if ((error.message ?? '').includes('attachment')) {
      throw new CareError(404, 'El adjunto ya no está disponible.');
    }
    throw new CareError(404, 'No encontramos esa conversación.');
  }
  if (['22023', '23514', '22P02'].includes(error.code ?? '')) {
    throw new CareError(400, 'Revisá el texto o el archivo adjunto.');
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

export function asThreadAttachment(value: unknown): MessageAttachment | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const row = value as Record<string, unknown>;
  if (!row.asset_id || !row.filename || !row.mime) return undefined;
  return {
    asset_id: String(row.asset_id),
    filename: String(row.filename).slice(0, 80),
    mime: String(row.mime),
    byte_size: Number(row.byte_size ?? 0),
    kind: String(row.mime).startsWith('image/') ? 'image' : 'pdf',
    available: row.available !== false,
  };
}

export function asThreadMessage(row: Record<string, unknown>): Message {
  const from = row.from;
  if (from !== 'vero' && from !== 'patient') {
    throw new CareError(503, 'No se pudo confirmar el envío. Reintentá sin duplicar el mensaje.');
  }
  if (!row.id || !row.patient_id || !row.sent_at) {
    throw new CareError(503, 'No se pudo confirmar el envío. Reintentá sin duplicar el mensaje.');
  }
  const attachment = asThreadAttachment(row.attachment);
  return {
    id: String(row.id),
    patient_id: String(row.patient_id),
    from,
    text: String(row.text ?? row.body ?? ''),
    suggested_by_ai: Boolean(row.suggested_by_ai),
    sent_at: String(row.sent_at),
    delivered_at: asIso(row.delivered_at),
    read_at: asIso(row.read_at),
    ...(attachment ? { attachment } : {}),
  };
}

function liveAttachment(messageId: string): MessageAttachment | undefined {
  const stored = attachments.get(messageId);
  if (!stored) return undefined;
  const asset = privateAssetSnapshot().assets.find((row) => row.id === stored.asset_id);
  const available = Boolean(asset && asset.status === 'ready' && !asset.withdrawn_at);
  return { ...stored, available };
}

function project(entry: MemMessage): Message {
  const receipt = receipts.get(receiptKey(entry.id, counterpartOf(entry.from)));
  const { client_id: _clientId, ...message } = entry;
  const attachment = liveAttachment(entry.id);
  return {
    ...message,
    delivered_at: receipt?.delivered_at ?? entry.delivered_at ?? null,
    read_at: receipt?.read_at ?? entry.read_at ?? null,
    ...(attachment ? { attachment } : {}),
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

function memoryAttachmentFor(patientId: string, assetId: string, filename?: string): MessageAttachment {
  const asset = privateAssetSnapshot().assets.find((row) => row.id === assetId);
  if (!asset) throw new CareError(404, 'El adjunto ya no está disponible.');
  if (asset.patient_id !== patientId) throw new CareError(403, 'No tenés permiso para este archivo.');
  if (asset.category !== 'chat_attachment') throw new CareError(400, 'Revisá el texto o el archivo adjunto.');
  if (asset.status === 'withdrawn' || asset.withdrawn_at || asset.status !== 'ready') {
    throw new CareError(400, 'Revisá el texto o el archivo adjunto.');
  }
  const bound = assetIndex.get(assetId);
  if (bound) throw new CareError(409, 'Ese identificador ya se usó con otro adjunto.');
  return {
    asset_id: asset.id,
    filename: sanitizeChatFilename(filename, asset.mime),
    mime: asset.mime,
    byte_size: asset.byte_size,
    kind: asset.mime.startsWith('image/') ? 'image' : 'pdf',
    available: true,
  };
}

export function sendMemoryMessage(
  patientId: string,
  input: ThreadSendInput,
): { message: Message; duplicate: boolean } {
  if (!getPatient(patientId)) throw new CareError(404, 'No encontramos esa conversación.');
  const key = `${patientId}:${input.client_id}`;
  const existingId = clientIndex.get(key);
  if (existingId) {
    const existing = messages.get(existingId);
    if (!existing) throw new CareError(503, 'No se pudo confirmar el envío. Reintentá sin duplicar el mensaje.');
    const existingAsset = attachments.get(existingId)?.asset_id;
    if ((input.asset_id ?? null) !== (existingAsset ?? null)) {
      throw new CareError(409, 'Ese identificador ya se usó con otro adjunto.');
    }
    return { message: project(existing), duplicate: true };
  }
  const attachment = input.asset_id ? memoryAttachmentFor(patientId, input.asset_id, input.filename) : undefined;
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
    ...(attachment ? { attachment } : {}),
  };
  messages.set(entry.id, entry);
  clientIndex.set(key, entry.id);
  receipts.set(receiptKey(entry.id, counterpartOf(entry.from)), { delivered_at: null, read_at: null });
  if (attachment) {
    attachments.set(entry.id, attachment);
    assetIndex.set(attachment.asset_id, entry.id);
  }
  const message = project(entry);
  attachToPatient(message, true);
  return { message, duplicate: false };
}

export async function sendThreadMessage(
  patientId: string,
  input: ThreadSendInput,
  persistent: boolean,
): Promise<{ message: Message; duplicate: boolean }> {
  if (!persistent) return sendMemoryMessage(patientId, input);
  const rpcName = input.asset_id ? 'send_thread_attachment' : 'send_thread_message';
  const payload: Record<string, unknown> = {
    patient_id: patientId,
    client_id: input.client_id,
    text: input.text,
    suggested_by_ai: input.suggestedByAi,
  };
  if (input.asset_id) {
    payload.asset_id = input.asset_id;
    payload.filename = input.filename ?? 'adjunto';
  }
  let data: unknown;
  let error: { code?: string; message?: string } | null = null;
  try {
    const result = await getRequestDb().rpc(rpcName, { payload });
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

export async function openThreadAttachment(
  patientId: string,
  messageId: string,
  persistent: boolean,
) {
  if (!persistent) {
    if (!getPatient(patientId)) throw new CareError(404, 'No encontramos esa conversación.');
    const stored = messages.get(messageId);
    if (!stored || stored.patient_id !== patientId) throw new CareError(404, 'El adjunto ya no está disponible.');
    const attachment = liveAttachment(messageId);
    if (!attachment?.available) throw new CareError(404, 'El adjunto ya no está disponible.');
    const grant = await accessPrivateAsset(attachment.asset_id, patientId, false);
    return { ...grant, filename: attachment.filename };
  }
  let data: unknown;
  let error: { code?: string; message?: string } | null = null;
  try {
    const result = await getRequestDb().rpc('open_message_attachment', {
      target_patient: patientId,
      target_message: messageId,
    });
    data = result.data;
    error = result.error;
  } catch (caught) {
    if (caught instanceof CareError) throw caught;
    messageDbError(caught as { code?: string; message?: string });
    throw new CareError(503, 'No se pudo confirmar el envío. Reintentá sin duplicar el mensaje.');
  }
  messageDbError(error);
  const attachment = asThreadAttachment(data);
  if (!attachment) throw new CareError(404, 'El adjunto ya no está disponible.');
  const grant = await accessPrivateAsset(attachment.asset_id, patientId, true);
  return { ...grant, filename: attachment.filename };
}
