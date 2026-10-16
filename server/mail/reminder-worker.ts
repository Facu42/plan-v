import { isSupabaseEnabled } from '../db/supabase-client.js';
import { writeOpsLog } from '../ops/log.js';
import { siteUrl } from '../admin/accounts.js';
import { brevoConfig, sendBrevoEmail, type BrevoMessage } from './brevo.js';
import { REMINDER_SLOT_MS, reminderWindow, sendDueReminders, type DueAppointment } from './reminders.js';
import { listDueAppointments,isReminderCurrentlyAllowed } from './reminder-source.js';

type ReminderDeps = {
  list(from: string, to: string): Promise<DueAppointment[]>;
  send(message: BrevoMessage): Promise<unknown>;
  site: string;
  canSend?: (appointment:DueAppointment)=>Promise<boolean>;
};

let lastSlot = -1;
let running = false;

function defaultDeps(): ReminderDeps | null {
  if (!isSupabaseEnabled()) return null;
  const config = brevoConfig();
  const site = siteUrl();
  if (!config || !site) return null;
  return { list: listDueAppointments, send: (message) => sendBrevoEmail(config, message), site,canSend:isReminderCurrentlyAllowed };
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
    const result = await sendDueReminders(await deps.list(from, to), deps.site, deps.send,deps.canSend);
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
