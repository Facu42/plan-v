import { isSupabaseEnabled, privilegedDb } from '../db/supabase-client.js';
import { writeOpsLog } from '../ops/log.js';
import { REMINDER_SLOT_MS, reminderWindow } from '../mail/reminders.js';
import { pushConfig, pushNotifier } from './push.js';

type PushReminderDeps = {
  /** Pacientes activas con una consulta agendada que empieza dentro del tramo. */
  list(from: string, to: string): Promise<string[]>;
  notify(patientId: string): Promise<number>;
};

let lastSlot = -1;
let running = false;

async function listDuePatients(from: string, to: string): Promise<string[]> {
  const db = privilegedDb();
  const { data: rows, error } = await db.from('appointments').select('patient_id')
    .eq('status', 'scheduled').gte('starts_at', from).lt('starts_at', to).limit(500);
  if (error) throw error;
  const ids = [...new Set((rows ?? []).map((row) => String(row.patient_id)))];
  if (!ids.length) return [];
  const { data: patients, error: patientError } = await db.from('patients').select('id,user_id,deactivated_at,anonymized_at').in('id', ids);
  if (patientError) throw patientError;
  return (patients ?? []).filter((patient) => patient.user_id && !patient.deactivated_at && !patient.anonymized_at).map((patient) => String(patient.id));
}

function defaultDeps(): PushReminderDeps | null {
  if (!isSupabaseEnabled() || !pushConfig()) return null;
  return { list: listDuePatients, notify: (patientId) => pushNotifier.notifyPatient(patientId, 'reminder') };
}

/**
 * Aviso al teléfono 24 horas antes de cada consulta, con el mismo tramo de 10 minutos que el
 * recordatorio por mail. Lleva solo «Mañana tenés consulta»: ni la hora ni el nombre de la nutri.
 * Sin las claves de avisos o en la demo no hace nada.
 */
export async function tickPushReminders(now = new Date(), deps: PushReminderDeps | null = defaultDeps()) {
  if (!deps || running) return null;
  const slot = Math.floor(now.getTime() / REMINDER_SLOT_MS);
  if (slot === lastSlot) return null;
  lastSlot = slot;
  running = true;
  const result = { patients: 0, delivered: 0 };
  try {
    const { from, to } = reminderWindow(now);
    for (const patientId of await deps.list(from, to)) {
      result.patients += 1;
      result.delivered += await deps.notify(patientId).catch(() => 0);
    }
    if (result.patients) writeOpsLog('info', 'push_reminders', { patients: String(result.patients), delivered: String(result.delivered) });
    return result;
  } catch {
    writeOpsLog('warn', 'push_reminders_failed', { step: 'list' });
    return null;
  } finally {
    running = false;
  }
}

export function resetPushReminderTick() { lastSlot = -1; running = false; }
