import type { MealLog, Patient } from '../../types';

export type DailyReminderKind = 'comida' | 'agua' | 'consulta' | 'sueno';
export type DailyReminderState = 'done' | 'perdido' | 'ahora' | 'proximo';

export type DailyReminder = {
  id: string;
  kind: DailyReminderKind;
  title: string;
  detail: string;
  time: string | null;
  state: DailyReminderState;
};

export type RemindersInput = Pick<Patient, 'todayPlan' | 'meal_logs' | 'hydration' | 'sleep_minutes' | 'appointment'>;

function localDateId(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalize(value: string): string {
  return value
    .toLocaleLowerCase('es-AR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function minutesAt(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function reminderState(time: string, now: Date): DailyReminderState {
  const distance = minutesAt(time) - (now.getHours() * 60 + now.getMinutes());
  if (Math.abs(distance) <= 30) return 'ahora';
  return distance < 0 ? 'perdido' : 'proximo';
}

function loggedToday(log: MealLog, now: Date): boolean {
  return localDateId(new Date(log.logged_at)) === localDateId(now);
}

function sleepDetail(minutes: number | null): string {
  if (minutes === null) return 'Registrá cómo descansaste cuando puedas';
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours} h${remainder > 0 ? ` ${remainder} min` : ''} registrados`;
}

function appointmentReminder(
  appointment: Patient['appointment'],
  now: Date,
): DailyReminder | null {
  if (!appointment) return null;
  const [dayLabel, time] = appointment.when.split('·').map((part) => part.trim());
  if (!dayLabel || !/^\d{2}:\d{2}$/.test(time ?? '')) return null;

  const todayLabel = new Intl.DateTimeFormat('es-AR', { weekday: 'long' }).format(now);
  if (normalize(dayLabel) !== normalize(todayLabel)) return null;

  return {
    id: 'consulta',
    kind: 'consulta',
    title: 'consulta',
    detail: `${appointment.duration} min · ${appointment.channel === 'video' ? 'Videollamada' : 'Presencial'}`,
    time,
    state: reminderState(time, now),
  };
}

export function buildDailyReminders(input: RemindersInput, now = new Date()): DailyReminder[] {
  const loggedSlots = new Set(
    input.meal_logs.filter((log) => loggedToday(log, now)).map((log) => log.slot),
  );

  const timed: DailyReminder[] = input.todayPlan.map((meal) => ({
    id: `comida-${meal.slot}`,
    kind: 'comida',
    title: meal.slot,
    detail: meal.title,
    time: meal.time,
    state: loggedSlots.has(meal.slot) ? 'done' : reminderState(meal.time, now),
  }));

  const appointment = appointmentReminder(input.appointment, now);
  if (appointment) timed.push(appointment);
  timed.push({
    id: 'descanso',
    kind: 'sueno',
    title: 'descanso',
    detail: sleepDetail(input.sleep_minutes),
    time: '22:30',
    state: input.sleep_minutes === null ? reminderState('22:30', now) : 'done',
  });
  timed.sort((a, b) => minutesAt(a.time ?? '23:59') - minutesAt(b.time ?? '23:59'));

  if (input.hydration < 8) {
    timed.push({
      id: 'agua',
      kind: 'agua',
      title: 'agua',
      detail: `${input.hydration} de 8 vasos registrados`,
      time: null,
      state: 'ahora',
    });
  }

  return timed;
}
