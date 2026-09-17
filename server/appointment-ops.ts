export const WEEK_DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const;

export type AppointmentSlot = {
  when: string;
  duration: number;
  channel: string;
  meet_url?: string;
  starts_at?: string;
};

export type AppointmentHistoryAction = 'scheduled' | 'rescheduled' | 'patient_rescheduled' | 'cancelled' | 'elapsed';
export type AppointmentHistoryActor = 'pro' | 'patient' | 'system';

export type AppointmentHistoryEntry = {
  id: string;
  when: string;
  dateId: string | null;
  duration: number;
  channel: string;
  action: AppointmentHistoryAction;
  actor: AppointmentHistoryActor;
  at: string;
};

export function localDateId(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function strictAppointmentWhen(when?: string): { day: string; time: string } | null {
  const [day = '', time = ''] = (when ?? '').split(' · ');
  if (!WEEK_DAY_NAMES.includes(day as typeof WEEK_DAY_NAMES[number]) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  return { day, time };
}

export function occurrenceFromWhen(when: string, now: Date): Date | null {
  const parsed = strictAppointmentWhen(when);
  if (!parsed) return null;
  const target = WEEK_DAY_NAMES.indexOf(parsed.day as typeof WEEK_DAY_NAMES[number]);
  const today = (now.getDay() + 6) % 7;
  let delta = (target - today + 7) % 7;
  const [hours, minutes] = parsed.time.split(':').map(Number);
  if (delta === 0 && (hours < now.getHours() || (hours === now.getHours() && minutes < now.getMinutes()))) delta = 7;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + delta, hours, minutes);
}

export function stampStartsAt(appointment: AppointmentSlot, now: Date): AppointmentSlot {
  if (appointment.starts_at) return appointment;
  const at = occurrenceFromWhen(appointment.when, now);
  return at ? { ...appointment, starts_at: at.toISOString() } : appointment;
}

export function historyEntry(input: {
  id: string;
  slot: AppointmentSlot;
  action: AppointmentHistoryAction;
  actor: AppointmentHistoryActor;
  at: string;
  now: Date;
}): AppointmentHistoryEntry {
  const start = input.slot.starts_at ? new Date(input.slot.starts_at) : occurrenceFromWhen(input.slot.when, input.now);
  return {
    id: input.id,
    when: input.slot.when,
    dateId: start ? localDateId(start) : null,
    duration: input.slot.duration,
    channel: input.slot.channel,
    action: input.action,
    actor: input.actor,
    at: input.at,
  };
}

export function resolveAppointmentState<T extends { id: string; appointment: AppointmentSlot | null; appointment_history?: AppointmentHistoryEntry[] }>(
  patient: T,
  now: Date,
  nextId: () => string,
): { appointment: AppointmentSlot | null; appointment_history: AppointmentHistoryEntry[]; changed: boolean } {
  const history = patient.appointment_history ?? [];
  if (!patient.appointment) {
    const changed = patient.appointment_history === undefined;
    return { appointment: null, appointment_history: history, changed };
  }

  const stamped = stampStartsAt(patient.appointment, now);
  let appointment = stamped;
  let nextHistory = history;
  let changed = stamped !== patient.appointment || patient.appointment_history === undefined;

  if (appointment.starts_at) {
    const start = new Date(appointment.starts_at);
    const end = new Date(start.getTime() + appointment.duration * 60_000);
    if (end.getTime() <= now.getTime()) {
      const dateId = localDateId(start);
      const already = nextHistory.some((entry) => entry.action === 'elapsed' && entry.dateId === dateId);
      if (!already) {
        nextHistory = [historyEntry({
          id: nextId(),
          slot: appointment,
          action: 'elapsed',
          actor: 'system',
          at: end.toISOString(),
          now,
        }), ...nextHistory];
      }
      const rolled = occurrenceFromWhen(appointment.when, now);
      appointment = rolled
        ? { ...appointment, starts_at: rolled.toISOString() }
        : appointment;
      changed = true;
    }
  }

  return { appointment, appointment_history: nextHistory, changed };
}
