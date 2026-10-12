import { stableUuid, type BrevoMessage } from './brevo.js';
import { appointmentReminderEmail } from './templates.js';

/** Turno que empieza dentro del tramo, con lo necesario para el mail (sin mail: no se le escribe). */
export type DueAppointment = {
  id: string;
  starts_at: string;
  channel: 'video' | 'presencial';
  meet_url: string | null;
  patient_name: string;
  patient_email: string | null;
  nutritionist_name: string;
};

export const REMINDER_SLOT_MS = 10 * 60_000;
export const REMINDER_LEAD_MS = 24 * 60 * 60_000;

/**
 * Sin guardar nada en la base: cada tramo de 10 minutos busca los turnos que empiezan 24 horas
 * después. La llave fija por turno y horario evita que Brevo lo mande dos veces si el tramo se repite.
 */
export function reminderWindow(now: Date): { from: string; to: string } {
  const slot = Math.floor(now.getTime() / REMINDER_SLOT_MS) * REMINDER_SLOT_MS;
  return { from: new Date(slot + REMINDER_LEAD_MS).toISOString(), to: new Date(slot + REMINDER_LEAD_MS + REMINDER_SLOT_MS).toISOString() };
}

export async function sendDueReminders(list: DueAppointment[], site: string, send: (message: BrevoMessage) => Promise<unknown>, canSend?: (appointment:DueAppointment)=>Promise<boolean>) {
  const result = { sent: 0, failed: 0, skipped: 0 };
  for (const appointment of list) {
    if (!appointment.patient_email) { result.skipped += 1; continue; }
    const content = appointmentReminderEmail({
      patientName: appointment.patient_name, nutritionistName: appointment.nutritionist_name,
      startsAt: appointment.starts_at, channel: appointment.channel, meetUrl: appointment.meet_url, site,
    });
    try {
      if(canSend&&!await canSend(appointment)){result.skipped+=1;continue;}
      await send({ to: { email: appointment.patient_email, name: appointment.patient_name }, ...content, idempotencyKey: stableUuid(`reminder:${appointment.id}:${appointment.starts_at}`) });
      result.sent += 1;
    } catch {
      result.failed += 1;
    }
  }
  return result;
}
