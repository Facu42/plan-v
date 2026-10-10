import { isSupabaseEnabled, privilegedDb } from '../db/supabase-client.js';
import { writeOpsLog } from '../ops/log.js';
import { siteUrl } from '../admin/accounts.js';
import { brevoConfig, sendBrevoEmail, type BrevoMessage } from './brevo.js';
import { REMINDER_SLOT_MS, reminderWindow, sendDueReminders, type DueAppointment } from './reminders.js';

type ReminderDeps = {
  list(from: string, to: string): Promise<DueAppointment[]>;
  send(message: BrevoMessage): Promise<unknown>;
  site: string;
};

let lastSlot = -1;
let running = false;

/** Turnos agendados de pacientes activas y vinculadas, con su mail confirmado. */
async function listDueAppointments(from: string, to: string): Promise<DueAppointment[]> {
  const db = privilegedDb();
  const { data: rows, error } = await db.from('appointments').select('id,starts_at,channel,meet_url,patient_id,nutritionist_id')
    .eq('status', 'scheduled').gte('starts_at', from).lt('starts_at', to).limit(500);
  if (error) throw error;
  if (!rows?.length) return [];
  const [{ data: patients, error: patientError }, { data: pros, error: proError }] = await Promise.all([
    db.from('patients').select('id,full_name,user_id,deactivated_at,anonymized_at').in('id', [...new Set(rows.map((row) => row.patient_id))]),
    db.from('nutritionists').select('id,display_name').in('id', [...new Set(rows.map((row) => row.nutritionist_id))]),
  ]);
  if (patientError) throw patientError;
  if (proError) throw proError;
  const due: DueAppointment[] = [];
  for (const row of rows) {
    const patient = patients?.find((entry) => entry.id === row.patient_id);
    if (!patient?.user_id || patient.deactivated_at || patient.anonymized_at) continue;
    const { data: account } = await db.auth.admin.getUserById(String(patient.user_id));
    const email = account.user?.email_confirmed_at ? account.user.email ?? null : null;
    due.push({
      id: String(row.id), starts_at: String(row.starts_at), channel: row.channel === 'video' ? 'video' : 'presencial',
      meet_url: row.meet_url ? String(row.meet_url) : null, patient_name: String(patient.full_name ?? ''), patient_email: email,
      nutritionist_name: String(pros?.find((entry) => entry.id === row.nutritionist_id)?.display_name ?? ''),
    });
  }
  return due;
}

function defaultDeps(): ReminderDeps | null {
  if (!isSupabaseEnabled()) return null;
  const config = brevoConfig();
  const site = siteUrl();
  if (!config || !site) return null;
  return { list: listDueAppointments, send: (message) => sendBrevoEmail(config, message), site };
}

/**
 * Recordatorio por mail 24 horas antes de cada turno. Corre una vez por tramo de 10 minutos y sólo
 * con la base real y Brevo configurado; en la demo y sin clave no hace nada.
 */
export async function tickAppointmentReminders(now = new Date(), deps: ReminderDeps | null = defaultDeps()) {
  if (!deps || running) return null;
  const slot = Math.floor(now.getTime() / REMINDER_SLOT_MS);
  if (slot === lastSlot) return null;
  lastSlot = slot;
  running = true;
  try {
    const { from, to } = reminderWindow(now);
    const result = await sendDueReminders(await deps.list(from, to), deps.site, deps.send);
    if (result.sent || result.failed) writeOpsLog(result.failed ? 'warn' : 'info', 'appointment_reminders', { sent: String(result.sent), failed: String(result.failed) });
    return result;
  } catch {
    writeOpsLog('warn', 'appointment_reminders_failed', { step: 'list' });
    return null;
  } finally {
    running = false;
  }
}

export function resetReminderTick() { lastSlot = -1; running = false; }
