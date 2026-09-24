import type { Patient } from '../../src/types/index.js';
import { getRequestDb } from '../db/supabase-client.js';
import { CareError } from '../care/errors.js';
import { DEFAULT_APPOINTMENT_TIMEZONE, type AppointmentHistoryAction, type AppointmentHistoryActor } from '../appointment-ops.js';
import { confirmAppointment as confirmMemory, getPatient, setAppointment } from '../store.js';

export { CareError } from '../care/errors.js';
export { DEFAULT_APPOINTMENT_TIMEZONE } from '../appointment-ops.js';

export type AppointmentReply = 'attending' | 'needs_change';

export type AppointmentInput = {
  day: string;
  time: string;
  duration: number;
  channel: string;
  meet_url?: string;
  timezone?: string;
};

const MISSING_SCHEMA = ['42P01', '42883', 'PGRST202', 'PGRST205', '42703'];

export function appointmentDbError(error: { code?: string; message?: string } | null) {
  if (!error) return;
  if (MISSING_SCHEMA.includes(error.code ?? '')) {
    throw new CareError(501, 'Los turnos requieren instalar la migración de este módulo.');
  }
  if (error.code === '42501') throw new CareError(403, 'No tenés permiso para esta acción.');
  if (error.code === 'PT404' || error.code === 'PGRST116') throw new CareError(404, 'No encontramos esa consulta.');
  if (error.code === 'PT409') {
    if (error.message === 'appointment_none') throw new CareError(409, 'No hay un turno para reprogramar');
    throw new CareError(409, 'Ese horario se solapa con otra consulta del consultorio.');
  }
  if (['22023', '23514', '22P02'].includes(error.code ?? '')) {
    throw new CareError(400, 'Revisá el día, la hora o la modalidad del turno.');
  }
  throw new CareError(503, 'No se pudo guardar el turno. Reintentá sin duplicar el cambio.');
}

export function isMissingAppointmentSchema(error: { code?: string } | null | undefined) {
  return MISSING_SCHEMA.includes(error?.code ?? '');
}

function asIso(value: unknown): string | undefined {
  if (value == null || value === '') return undefined;
  return String(value);
}

export function asAppointmentSlot(row: Record<string, unknown> | null | undefined): Patient['appointment'] {
  if (!row || row.when == null) return null;
  const duration = Number(row.duration);
  if (!Number.isFinite(duration)) return null;
  const reply = row.patient_reply;
  return {
    when: String(row.when),
    duration,
    channel: String(row.channel ?? ''),
    ...(row.meet_url ? { meet_url: String(row.meet_url) } : {}),
    ...(asIso(row.starts_at) ? { starts_at: asIso(row.starts_at) } : {}),
    ...(row.timezone ? { timezone: String(row.timezone) } : {}),
    ...(reply === 'attending' || reply === 'needs_change' ? { patient_reply: reply } : {}),
    ...(asIso(row.confirmed_at) ? { confirmed_at: asIso(row.confirmed_at) } : {}),
  };
}

function isHistoryAction(value: unknown): value is AppointmentHistoryAction {
  return value === 'scheduled' || value === 'rescheduled' || value === 'patient_rescheduled'
    || value === 'cancelled' || value === 'elapsed' || value === 'confirmed' || value === 'needs_change';
}

function isHistoryActor(value: unknown): value is AppointmentHistoryActor {
  return value === 'pro' || value === 'patient' || value === 'system';
}

export function asAppointmentHistory(rows: unknown): NonNullable<Patient['appointment_history']> {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const entry = row as Record<string, unknown>;
    const action = entry.action;
    const actor = entry.actor;
    if (!isHistoryAction(action) || !isHistoryActor(actor) || !entry.id) return [];
    return [{
      id: String(entry.id),
      when: String(entry.when ?? ''),
      dateId: entry.dateId == null ? null : String(entry.dateId),
      duration: Number(entry.duration ?? 0),
      channel: String(entry.channel ?? ''),
      action,
      actor,
      at: String(entry.at ?? ''),
    }];
  });
}

async function callAppointmentRpc(name: string, payload: Record<string, unknown>) {
  let error: { code?: string; message?: string } | null = null;
  try {
    const result = await getRequestDb().rpc(name, { payload });
    error = result.error;
  } catch (caught) {
    if (caught instanceof CareError) throw caught;
    appointmentDbError(caught as { code?: string; message?: string });
    throw new CareError(503, 'No se pudo guardar el turno. Reintentá sin duplicar el cambio.');
  }
  appointmentDbError(error);
}

export function scheduleMemoryAppointment(patientId: string, appointment: AppointmentInput | null): Patient {
  const updated = setAppointment(patientId, appointment);
  if (!updated) throw new CareError(404, 'No encontramos esa consulta.');
  return updated;
}

export function rescheduleMemoryAppointment(patientId: string, slot: { day: string; time: string }): Patient {
  const current = getPatient(patientId);
  if (!current) throw new CareError(404, 'No encontramos esa consulta.');
  if (!current.appointment) throw new CareError(409, 'No hay un turno para reprogramar');
  const parsed = current.appointment.when.split(' · ');
  if (parsed[0] === slot.day && parsed[1] === slot.time) return current;
  const updated = setAppointment(patientId, {
    day: slot.day,
    time: slot.time,
    duration: current.appointment.duration,
    channel: current.appointment.channel,
    timezone: current.appointment.timezone ?? DEFAULT_APPOINTMENT_TIMEZONE,
    ...(current.appointment.meet_url ? { meet_url: current.appointment.meet_url } : {}),
  }, { actor: 'patient' });
  if (!updated) throw new CareError(404, 'No encontramos esa consulta.');
  return updated;
}

export function confirmMemoryAppointment(patientId: string, reply: AppointmentReply): Patient {
  const updated = confirmMemory(patientId, reply);
  if (!updated) throw new CareError(404, 'No encontramos esa consulta.');
  return updated;
}

export async function scheduleAppointment(
  patientId: string,
  appointment: AppointmentInput | null,
  persistent: boolean,
): Promise<Patient | undefined> {
  if (!persistent) return scheduleMemoryAppointment(patientId, appointment);
  await callAppointmentRpc('schedule_appointment', {
    patient_id: patientId,
    appointment: appointment
      ? {
          day: appointment.day,
          time: appointment.time,
          duration: appointment.duration,
          channel: appointment.channel,
          timezone: appointment.timezone ?? DEFAULT_APPOINTMENT_TIMEZONE,
          ...(appointment.meet_url ? { meet_url: appointment.meet_url } : {}),
        }
      : null,
  });
  return undefined;
}

export async function rescheduleAppointment(
  patientId: string,
  slot: { day: string; time: string },
  persistent: boolean,
): Promise<Patient | undefined> {
  if (!persistent) return rescheduleMemoryAppointment(patientId, slot);
  await callAppointmentRpc('reschedule_appointment', {
    patient_id: patientId,
    day: slot.day,
    time: slot.time,
  });
  return undefined;
}

export async function confirmAppointmentReply(
  patientId: string,
  reply: AppointmentReply,
  persistent: boolean,
): Promise<Patient | undefined> {
  if (!persistent) return confirmMemoryAppointment(patientId, reply);
  await callAppointmentRpc('confirm_appointment', { patient_id: patientId, reply });
  return undefined;
}

export async function listPatientAppointmentPersist(patientId: string): Promise<{
  appointment: Patient['appointment'];
  history: NonNullable<Patient['appointment_history']>;
} | null> {
  try {
    const { data, error } = await getRequestDb().rpc('get_patient_appointment', {
      target_patient: patientId,
    });
    if (isMissingAppointmentSchema(error)) return null;
    if (error || !data || typeof data !== 'object') return null;
    const row = data as { appointment?: Record<string, unknown> | null; history?: unknown };
    return {
      appointment: asAppointmentSlot(row.appointment ?? null),
      history: asAppointmentHistory(row.history),
    };
  } catch {
    return null;
  }
}
