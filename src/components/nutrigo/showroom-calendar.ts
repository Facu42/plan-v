import { nextAppointmentDate } from './ShowroomConsultations';
import { buildCalendarWeek } from './WeeklyPlanCalendar';
import type { ShowroomPatient } from './showroom-model';

export const CALENDAR_KINDS = ['consult', 'plan', 'meal', 'activity'] as const;
export type CalendarKind = (typeof CALENDAR_KINDS)[number];
export type CalendarFilter = 'all' | CalendarKind;
export type CalendarView = 'month' | 'week' | 'day';

export type CalendarEvent = {
  id: string;
  kind: CalendarKind;
  dateId: string;
  at: Date;
  title: string;
  subtitle: string;
};

export const KIND_LABEL: Record<CalendarKind, string> = {
  consult: 'Consulta',
  plan: 'Plan',
  meal: 'Diario',
  activity: 'Actividad',
};

const KIND_ORDER: Record<CalendarKind, number> = { consult: 0, plan: 1, meal: 2, activity: 3 };

export function localDateId(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseStamp(value: string): Date | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function startOfWeekMonday(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  const weekday = start.getDay();
  start.setDate(start.getDate() + (weekday === 0 ? -6 : 1 - weekday));
  return start;
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, 12);
}

export function monthAnchor(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

export function shiftMonth(anchor: Date, delta: number): Date {
  return new Date(anchor.getFullYear(), anchor.getMonth() + delta, 1, 12);
}

export function sentenceCase(value: string): string {
  return value ? value[0].toLocaleUpperCase('es-AR') + value.slice(1) : value;
}

function sortEvents(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => a.at.getTime() - b.at.getTime() || KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.title.localeCompare(b.title, 'es-AR'));
}

export function buildPatientCalendarEvents(patient: ShowroomPatient, now: Date): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const appointment = patient.appointment;
  const consultAt = nextAppointmentDate(appointment, now);
  if (appointment && consultAt) {
    const mode = appointment.channel === 'video' ? 'Videollamada' : appointment.channel === 'presencial' ? 'Presencial' : 'Modalidad por confirmar';
    const time = appointment.when.split(' · ')[1] ?? '';
    events.push({
      id: `consult:${patient.id}:${localDateId(consultAt)}`,
      kind: 'consult',
      dateId: localDateId(consultAt),
      at: consultAt,
      title: mode,
      subtitle: `${time} · ${appointment.duration} min`,
    });
  }

  for (const day of buildCalendarWeek(now)) {
    const planned = patient.weekPlan.find((entry) => entry.day === day.day)?.meals ?? [];
    for (const meal of planned) {
      const timed = day.isToday
        ? patient.todayPlan.find((entry) => entry.slot === meal.slot && entry.title === meal.title)
          ?? patient.todayPlan.find((entry) => entry.slot === meal.slot)
        : undefined;
      events.push({
        id: `plan:${day.isoDate}:${meal.slot}`,
        kind: 'plan',
        dateId: day.isoDate,
        at: new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate(), 12),
        title: meal.title,
        subtitle: timed?.time ? `${meal.slot} · ${timed.time}` : `${meal.slot} · indicación de esta semana`,
      });
    }
  }

  for (const log of patient.logs ?? []) {
    const at = parseStamp(log.logged_at);
    if (!at) continue;
    events.push({
      id: log.id,
      kind: 'meal',
      dateId: localDateId(at),
      at,
      title: log.slot,
      subtitle: log.description?.trim() || 'Registro de comida',
    });
  }

  for (const entry of patient.activities ?? []) {
    const at = parseStamp(entry.logged_at);
    if (!at) continue;
    events.push({
      id: entry.id,
      kind: 'activity',
      dateId: localDateId(at),
      at,
      title: entry.activity,
      subtitle: `${entry.duration_minutes} min · ${entry.intensity}`,
    });
  }

  return sortEvents(events);
}

export function filterCalendarEvents(events: readonly CalendarEvent[], filter: CalendarFilter): CalendarEvent[] {
  return filter === 'all' ? [...events] : events.filter((event) => event.kind === filter);
}

export function eventsOnDate(events: readonly CalendarEvent[], dateId: string): CalendarEvent[] {
  return events.filter((event) => event.dateId === dateId);
}

export function countByKind(events: readonly CalendarEvent[]): Record<CalendarKind, number> {
  return {
    consult: events.filter((event) => event.kind === 'consult').length,
    plan: events.filter((event) => event.kind === 'plan').length,
    meal: events.filter((event) => event.kind === 'meal').length,
    activity: events.filter((event) => event.kind === 'activity').length,
  };
}

export function buildMonthGrid(month: Date, now: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(month.getFullYear(), month.getMonth(), 1 - offset, 12);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const count = offset + last.getDate() <= 35 ? 35 : 42;
  const todayId = localDateId(now);
  return {
    label: sentenceCase(month.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })),
    cells: Array.from({ length: count }, (_, index) => {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index, 12);
      const dateId = localDateId(date);
      return {
        dateId,
        date,
        day: date.getDate(),
        inMonth: date.getMonth() === month.getMonth(),
        isToday: dateId === todayId,
      };
    }),
  };
}

export function buildWeekGrid(anchor: Date, now: Date) {
  const start = startOfWeekMonday(anchor);
  const todayId = localDateId(now);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(start, index);
    const dateId = localDateId(date);
    return {
      dateId,
      date,
      day: date.getDate(),
      weekday: sentenceCase(date.toLocaleDateString('es-AR', { weekday: 'short' })),
      isToday: dateId === todayId,
    };
  });
  return {
    label: `${days[0].date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} – ${days[6].date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}`,
    start,
    days,
  };
}

export function calendarRange(events: readonly CalendarEvent[], now: Date) {
  const ids = events.map((event) => event.dateId);
  ids.push(localDateId(now));
  const sorted = [...ids].sort();
  return { minId: sorted[0], maxId: sorted[sorted.length - 1] };
}

export function canShiftMonth(month: Date, delta: number, range: { minId: string; maxId: string }): boolean {
  const next = shiftMonth(month, delta);
  const nextStart = localDateId(next);
  const nextLast = localDateId(new Date(next.getFullYear(), next.getMonth() + 1, 0, 12));
  return delta < 0 ? nextLast >= range.minId : nextStart <= range.maxId;
}

export function canShiftDay(date: Date, delta: number, range: { minId: string; maxId: string }): boolean {
  const next = localDateId(addDays(date, delta));
  return next >= range.minId && next <= range.maxId;
}

export function weekOverlaps(start: Date, range: { minId: string; maxId: string }): boolean {
  const end = addDays(start, 6);
  return localDateId(end) >= range.minId && localDateId(start) <= range.maxId;
}

export function canShiftWeek(start: Date, delta: number, range: { minId: string; maxId: string }): boolean {
  return weekOverlaps(addDays(start, delta * 7), range);
}

export function dateFromId(dateId: string): Date {
  const [year, month, day] = dateId.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1, 12);
}
