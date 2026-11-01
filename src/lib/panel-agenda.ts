import type { Patient } from '../types';
import type { SchedulingBooking, SchedulingSettings } from '../types/scheduling';
import { meetLink } from './video-call-window';

export const AGENDA_ZONE = 'America/Argentina/Buenos_Aires';
const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export type AgendaTone = 'primera' | 'seguimiento' | 'online' | 'pendiente' | 'bloqueo';
export type AgendaView = 'dia' | 'semana' | 'mes';

export type PanelAgendaEvent = {
  id: string;
  tone: AgendaTone;
  title: string;
  subtitle: string;
  day: string;
  startMin: number;
  endMin: number;
  patientId?: string;
  bookingId?: string;
  meetUrl?: string;
};

export const agendaDay = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: AGENDA_ZONE }).format(date);

export function agendaClock(date: Date) {
  const [hour, minute] = new Intl.DateTimeFormat('en-GB', { timeZone: AGENDA_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date).split(':').map(Number);
  return { hour, minute, minutes: hour * 60 + minute };
}

export function shiftDay(day: string, delta: number): string {
  const date = new Date(`${day}T15:00:00Z`);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

export function mondayOf(day: string): string {
  const weekday = new Date(`${day}T15:00:00Z`).getUTCDay();
  return shiftDay(day, weekday === 0 ? -6 : 1 - weekday);
}

export function weekDays(day: string, count = 6): string[] {
  const start = mondayOf(day);
  return Array.from({ length: count }, (_, index) => shiftDay(start, index));
}

export function weekLabel(days: readonly string[]): string {
  if (!days.length) return '';
  const first = new Date(`${days[0]}T15:00:00Z`);
  const last = new Date(`${days[days.length - 1]}T15:00:00Z`);
  const day = (date: Date) => date.getUTCDate();
  const month = (date: Date) => date.toLocaleDateString('es-AR', { month: 'long', timeZone: 'UTC' });
  if (first.getUTCMonth() === last.getUTCMonth()) return `Semana del ${day(first)} al ${day(last)} de ${month(first)}`;
  return `Semana del ${day(first)} de ${month(first)} al ${day(last)} de ${month(last)}`;
}

export function dayHeading(day: string): { name: string; number: number } {
  const date = new Date(`${day}T15:00:00Z`);
  return { name: DAY_NAMES[(date.getUTCDay() + 6) % 7].slice(0, 3), number: date.getUTCDate() };
}

export function monthGrid(day: string): string[] {
  const [year, month] = day.split('-').map(Number);
  const first = `${year}-${String(month).padStart(2, '0')}-01`;
  const start = mondayOf(first);
  const lastDate = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const last = `${year}-${String(month).padStart(2, '0')}-${String(lastDate).padStart(2, '0')}`;
  const cells = [start];
  while (cells[cells.length - 1] < last || cells.length % 7 !== 0) cells.push(shiftDay(cells[cells.length - 1], 1));
  return cells;
}

export function monthLabel(day: string): string {
  const label = new Date(`${day.slice(0, 7)}-01T15:00:00Z`).toLocaleDateString('es-AR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return label.charAt(0).toLocaleUpperCase('es-AR') + label.slice(1);
}

const timeOk = (value: string | undefined) => /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value ?? '');

export function nextAppointmentAt(appointment: NonNullable<Patient['appointment']>, now: Date): Date | null {
  if (appointment.starts_at) {
    const at = new Date(appointment.starts_at);
    return Number.isFinite(at.getTime()) ? at : null;
  }
  const today = agendaDay(now);
  const weekday = (new Date(`${today}T15:00:00Z`).getUTCDay() + 6) % 7;
  const [dayName, time] = appointment.when.split(' · ');
  const target = DAY_NAMES.indexOf(dayName ?? '');
  if (target < 0 || !timeOk(time)) return null;
  return new Date(`${shiftDay(today, (target - weekday + 7) % 7)}T${time}:00-03:00`);
}

function toneFor(channel: string, name: string, first: boolean): AgendaTone {
  if (/online|videollamada/i.test(name) || channel === 'video') return 'online';
  if (/primera/i.test(name) || first) return 'primera';
  return 'seguimiento';
}

function eventFromRange(id: string, tone: AgendaTone, title: string, subtitle: string, at: Date, durationMin: number, extra: Partial<PanelAgendaEvent> = {}): PanelAgendaEvent | null {
  if (!Number.isFinite(at.getTime()) || durationMin <= 0) return null;
  const day = agendaDay(at);
  const startMin = agendaClock(at).minutes;
  return { id, tone, title, subtitle, day, startMin, endMin: startMin + durationMin, ...extra };
}

export function buildPanelAgendaEvents(patients: readonly Patient[], settings: Pick<SchedulingSettings, 'types' | 'blocks'> | null, bookings: readonly SchedulingBooking[], now: Date, days: readonly string[]): PanelAgendaEvent[] {
  if (!days.length) return [];
  const from = days[0];
  const to = days[days.length - 1];
  const inRange = (day: string) => day >= from && day <= to;
  const events: PanelAgendaEvent[] = [];
  const covered = new Set<string>();

  for (const booking of bookings) {
    if (booking.status === 'cancelled') continue;
    const at = new Date(booking.starts_at);
    const day = agendaDay(at);
    if (!inRange(day)) continue;
    const type = settings?.types.find(item => item.id === booking.type_id);
    const tone = booking.status === 'requested' ? 'pendiente' : toneFor(type?.channel ?? 'presencial', type?.name ?? '', false);
    const event = eventFromRange(`book:${booking.id}`, tone, booking.contact_name, type?.name || (booking.status === 'requested' ? 'Por confirmar' : 'Consulta'), at, booking.duration_min, { patientId: booking.patient_id ?? undefined, bookingId: booking.id, meetUrl: type?.channel === 'video' ? meetLink(booking.meet_url) || undefined : undefined });
    if (!event) continue;
    events.push(event);
    if (booking.patient_id) covered.add(`${booking.patient_id}:${day}:${event.startMin}`);
  }

  for (const patient of patients) {
    if (patient.archived_at || patient.deactivated_at || patient.anonymized_at) continue;
    const seen = new Set((patient.appointment_history ?? []).filter(entry => entry.action === 'elapsed').map(entry => entry.dateId).filter(Boolean));
    const first = seen.size === 0;
    const appointment = patient.appointment;
    if (appointment) {
      const at = nextAppointmentAt(appointment, now);
      if (at) {
        const day = agendaDay(at);
        const startMin = agendaClock(at).minutes;
        if (inRange(day) && !covered.has(`${patient.id}:${day}:${startMin}`)) {
          const event = eventFromRange(`appt:${patient.id}`, toneFor(appointment.channel, appointment.when, first), patient.name, appointment.channel === 'video' ? 'Online' : 'Consultorio', at, appointment.duration, { patientId: patient.id, meetUrl: appointment.channel === 'video' ? meetLink(appointment.meet_url) || undefined : undefined });
          if (event) events.push(event);
        }
      }
    }
    for (const entry of patient.appointment_history ?? []) {
      if (entry.action !== 'elapsed' || !entry.dateId || !inRange(entry.dateId)) continue;
      const time = entry.when.split(' · ')[1];
      if (!timeOk(time)) continue;
      const at = new Date(`${entry.dateId}T${time}:00-03:00`);
      const event = eventFromRange(`hist:${entry.id}`, toneFor(entry.channel, entry.when, false), patient.name, 'Ya pasó', at, entry.duration, { patientId: patient.id });
      if (event && !events.some(item => item.patientId === patient.id && item.day === event.day && item.startMin === event.startMin)) events.push(event);
    }
  }

  for (const block of settings?.blocks ?? []) {
    for (const day of days) {
      const clip = clipBlock(block, day);
      if (!clip) continue;
      events.push({ id: `block:${block.id}:${day}`, tone: 'bloqueo', title: 'Bloqueado', subtitle: block.label || 'No disponible', day, startMin: clip.startMin, endMin: clip.endMin });
    }
  }

  return events.sort((a, b) => a.day.localeCompare(b.day) || a.startMin - b.startMin || a.title.localeCompare(b.title, 'es-AR'));
}

function clipBlock(block: SchedulingSettings['blocks'][number], day: string) {
  const dayStart = new Date(`${day}T00:00:00-03:00`).getTime();
  const dayEnd = new Date(`${shiftDay(day, 1)}T00:00:00-03:00`).getTime();
  const start = Date.parse(block.start);
  const end = Date.parse(block.end);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  const from = Math.max(start, dayStart);
  const to = Math.min(end, dayEnd);
  if (to <= from) return null;
  return { startMin: Math.round((from - dayStart) / 60_000), endMin: Math.max(Math.round((to - dayStart) / 60_000), Math.round((from - dayStart) / 60_000) + 15) };
}

export function hourWindow(events: readonly PanelAgendaEvent[], fallback = { start: 8, end: 20 }) {
  if (!events.length) return fallback;
  const start = Math.max(0, Math.min(fallback.start, Math.floor(Math.min(...events.map(event => event.startMin)) / 60)));
  const end = Math.min(24, Math.max(fallback.end, Math.ceil(Math.max(...events.map(event => event.endMin)) / 60)));
  return { start, end: Math.max(end, start + 1) };
}

export function nowFraction(now: Date, day: string, startHour: number, endHour: number): number | null {
  if (agendaDay(now) !== day) return null;
  const minutes = agendaClock(now).minutes;
  const start = startHour * 60;
  const end = endHour * 60;
  if (minutes < start || minutes > end) return null;
  return (minutes - start) / (end - start);
}

export function formatMinutes(minutes: number): string {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export type DepositMode = 'on' | 'off' | 'mixed' | 'none';

export function depositMode(types: readonly { price_minor: number; deposit_minor: number }[]): DepositMode {
  const priced = types.filter(type => type.price_minor > 0);
  if (!priced.length) return 'none';
  const half = (type: { price_minor: number; deposit_minor: number }) => type.deposit_minor > 0 && type.deposit_minor === Math.round(type.price_minor / 2);
  if (priced.every(half)) return 'on';
  if (priced.every(type => type.deposit_minor === 0)) return 'off';
  return 'mixed';
}

export function withHalfDeposit<T extends { price_minor: number; deposit_minor: number }>(types: readonly T[], on: boolean): T[] {
  return types.map(type => ({ ...type, deposit_minor: on && type.price_minor > 0 ? Math.round(type.price_minor / 2) : 0 }));
}

export function bookingHref(origin: string, slug: string): string {
  return new URL(`/consultorio/${encodeURIComponent(slug)}`, origin).href;
}

export function argentinaStamp(day: string, time: string): string {
  return new Date(`${day}T${time}:00-03:00`).toISOString();
}
