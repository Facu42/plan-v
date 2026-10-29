// «Mensaje a varias» programado («Mañana a las 9»): se guarda ya personalizado por paciente y el worker lo manda a la hora.
import { getRequestDb, isSupabaseEnabled, privilegedDb } from '../db/supabase-client.js';
import { registerDemoState } from '../demo/state.js';
import { CareError } from '../care/errors.js';
import { getPatient } from '../store.js';
import { notifyPatientPush } from '../push/push.js';
import { writeOpsLog } from '../ops/log.js';
import { sendMemoryMessage } from './repository.js';

export const MAX_PROGRAMADAS = 300;
export const MIN_ADELANTO_MS = 60_000;
export const MAX_ADELANTO_MS = 8 * 86_400_000;
const CADA_MS = 30_000;

export type ScheduleItem = { patient_id: string; client_id: string; text: string };
export type ScheduleInput = { send_at: string; items: ScheduleItem[] };
type Pendiente = ScheduleItem & { send_at: string; state: 'pending' | 'sent' | 'skipped' };

const pendientes = new Map<string, Pendiente>();
registerDemoState('messages/scheduled', () => ({ pendientes }));
export function resetScheduledMessages() { pendientes.clear(); ultimaVuelta = 0; corriendo = false; }

function dbError(error: { code?: string; message?: string } | null) {
  if (!error) return;
  if (['42P01', '42883', 'PGRST202', 'PGRST205'].includes(error.code ?? '')) throw new CareError(501, 'Programar mensajes necesita instalar la tabla nueva en la base.');
  if (error.code === '42501') throw new CareError(403, 'Solo podés programar mensajes a tus pacientes.');
  if ((error.message ?? '').includes('schedule_when')) throw new CareError(400, 'Elegí un horario de mañana en adelante.');
  if (['22023', '23514', '22P02'].includes(error.code ?? '')) throw new CareError(400, 'Revisá el mensaje y a quién se lo mandás.');
  throw new CareError(503, 'No pudimos programar el mensaje. Probá de nuevo en un momento.');
}

/** Valida la hora: entre un minuto y ocho días desde ahora, igual que la base. */
export function horarioValido(sendAt: string, now = new Date()) {
  const at = Date.parse(sendAt), diff = at - now.getTime();
  return Number.isFinite(at) && diff >= MIN_ADELANTO_MS && diff <= MAX_ADELANTO_MS;
}

export async function scheduleThreadMessages(input: ScheduleInput, persistent: boolean, now = new Date()): Promise<{ scheduled: number; send_at: string }> {
  if (!horarioValido(input.send_at, now)) throw new CareError(400, 'Elegí un horario de mañana en adelante.');
  if (persistent) {
    const { data, error } = await getRequestDb().rpc('schedule_thread_messages', { payload: input });
    dbError(error);
    const row = data as { scheduled?: number; send_at?: string } | null;
    return { scheduled: Number(row?.scheduled ?? 0), send_at: String(row?.send_at ?? input.send_at) };
  }
  if (input.items.some(item => !getPatient(item.patient_id))) throw new CareError(403, 'Solo podés programar mensajes a tus pacientes.');
  let scheduled = 0;
  for (const item of input.items) {
    const key = `${item.patient_id}:${item.client_id}`;
    if (pendientes.has(key)) continue;
    pendientes.set(key, { ...item, text: item.text.trim(), send_at: new Date(input.send_at).toISOString(), state: 'pending' });
    scheduled += 1;
  }
  return { scheduled, send_at: new Date(input.send_at).toISOString() };
}

/** Manda los que ya vencieron y devuelve a qué pacientes les llegó. */
export async function deliverDueScheduledMessages(now = new Date(), persistent = isSupabaseEnabled()): Promise<string[]> {
  if (persistent) {
    const { data, error } = await privilegedDb().rpc('deliver_due_scheduled_messages', { p_limit: 50 });
    if (error) throw error;
    const ids = Array.isArray(data) ? data.map(String) : [];
    for (const id of new Set(ids)) notifyPatientPush(id, 'message');
    return ids;
  }
  const enviadas: string[] = [];
  for (const row of pendientes.values()) {
    if (row.state !== 'pending' || Date.parse(row.send_at) > now.getTime()) continue;
    try { sendMemoryMessage(row.patient_id, { text: row.text, from: 'vero', suggestedByAi: false, client_id: row.client_id }); } catch { row.state = 'skipped'; continue; }
    row.state = 'sent';
    enviadas.push(row.patient_id);
  }
  return enviadas;
}

let ultimaVuelta = 0;
let corriendo = false;

/** Vuelta del worker: cada 30 segundos, una a la vez. Si falta la tabla o la base falla, avisa en el registro y sigue. */
export async function tickScheduledMessages(now = new Date()) {
  if (corriendo || now.getTime() - ultimaVuelta < CADA_MS) return null;
  ultimaVuelta = now.getTime();
  corriendo = true;
  try {
    const enviadas = await deliverDueScheduledMessages(now);
    if (enviadas.length) writeOpsLog('info', 'scheduled_messages_sent', { patients: String(enviadas.length) });
    return enviadas;
  } catch (error) {
    const code = (error as { code?: string })?.code ?? '';
    writeOpsLog('warn', 'scheduled_messages_failed', { status: ['42883', 'PGRST202'].includes(code) ? 'schema_missing' : 'retry_pending' });
    return null;
  } finally {
    corriendo = false;
  }
}
