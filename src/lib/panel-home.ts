import type { Patient } from '../types';
import type { BillingBoard } from '../types/fees';
import type { CrmHomeOverview, CrmWorkItem, CrmWorkKind } from '../types/crm-work';
import { countConsultations, incomeIn } from './inicio-indicators';
import { summarizeLedger } from '../fees';

export const HOME_ZONE = 'America/Argentina/Buenos_Aires';
export const homeDay = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: HOME_ZONE }).format(date);
const dayMs = (day: string) => Date.parse(`${day}T12:00:00Z`);
const isActive = (p: Patient) => !p.archived_at && !p.deactivated_at && !p.anonymized_at;
export const patientHref = (patient: Patient, section = 'resumen') => `/crm/ficha?${new URLSearchParams({ paciente: patient.id, seccion: section })}`;
export const patientMessageHref = (patient: Patient) => `/crm/mensajes?${new URLSearchParams({ paciente: patient.id })}`;
export async function copyHomeBookingLink(page: { enabled: boolean; slug: string } | undefined, origin: string, write: (text: string) => Promise<void>): Promise<boolean> {
  if (!page?.enabled) return false;
  await write(new URL(`/${encodeURIComponent(page.slug)}`, origin).href);
  return true;
}
export type HomeAppointment = { patient: Patient; at: Date; duration: number; channel: string; elapsed?: boolean };

/** Los turnos actuales tienen fecha absoluta. El formato semanal antiguo solo se interpreta si no hay fecha. */
export function homeAppointments(patients: readonly Patient[], now: Date) {
  const today = homeDay(now);
  const todayNoon = new Date(`${today}T12:00:00-03:00`);
  const weekday = (todayNoon.getUTCDay() + 6) % 7;
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const entries: HomeAppointment[] = [];
  for (const patient of patients.filter(isActive)) {
    for (const history of patient.appointment_history ?? []) {
      const time = history.when.split(' · ')[1];
      if (history.action !== 'elapsed' || history.dateId !== today) continue;
      // El directorio persistente entrega when vacío y at=endsAt; el historial antiguo conserva la hora escrita.
      const at = /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time ?? '') ? new Date(`${history.dateId}T${time}:00-03:00`) : new Date(Date.parse(history.at) - history.duration * 60_000);
      if (!Number.isFinite(at.getTime())) continue;
      if (!entries.some(entry => entry.patient.id === patient.id && entry.at.getTime() === at.getTime())) entries.push({ patient, at, duration: history.duration, channel: history.channel, elapsed: true });
    }
    const appointment = patient.appointment;
    if (!appointment) continue;
    let at: Date;
    if (appointment.starts_at) at = new Date(appointment.starts_at);
    else {
      const [day, time] = appointment.when.split(' · ');
      const target = days.indexOf(day);
      if (target < 0 || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time ?? '')) continue;
      const delta = (target - weekday + 7) % 7;
      const date = new Date(dayMs(today) + delta * 86_400_000).toISOString().slice(0, 10);
      at = new Date(`${date}T${time}:00-03:00`);
    }
    if (!Number.isFinite(at.getTime())) continue;
    const duplicate = entries.findIndex(entry => entry.patient.id === patient.id && entry.at.getTime() === at.getTime());
    if (duplicate >= 0) entries.splice(duplicate, 1);
    entries.push({ patient, at, duration: appointment.duration, channel: appointment.channel });
  }
  entries.sort((a, b) => a.at.getTime() - b.at.getTime() || a.patient.name.localeCompare(b.patient.name, 'es-AR'));
  return { today: entries.filter(entry => homeDay(entry.at) === today), next: entries.find(entry => !entry.elapsed && entry.at.getTime() + entry.duration * 60_000 > now.getTime()) ?? null };
}

export type HomePatientNotice = { id: string; patient: Patient; detail: string };
export function homeNews(patients: readonly Patient[], now: Date, streaks: CrmHomeOverview['meal_streaks'] = []): HomePatientNotice[] {
  const today = homeDay(now), todayMs = dayMs(today);
  const result: HomePatientNotice[] = [];
  for (const patient of patients.filter(isActive)) {
    const updated = patient.goal_updated_at ? new Date(patient.goal_updated_at) : null;
    const goalDay = updated && Number.isFinite(updated.getTime()) ? homeDay(updated) : null;
    if (patient.goal_status === 'completed' && goalDay && goalDay <= today && todayMs - dayMs(goalDay) < 7 * 86_400_000) {
      result.push({ id: `${patient.id}:goal`, patient, detail: 'Alcanzó su objetivo registrado' });
      continue;
    }
    const streak = streaks.find(entry => entry.patient_id === patient.id);
    if (streak && streak.days >= 7) { result.push({ id: `${patient.id}:streak`, patient, detail: `${streak.at_least ? 'Al menos ' : ''}${streak.days} días seguidos registrando comidas` }); continue; }
    const created = patient.created_at ? new Date(patient.created_at) : null;
    if (!created || !Number.isFinite(created.getTime())) continue;
    const createdDay = homeDay(created);
    const years = Number(today.slice(0, 4)) - Number(createdDay.slice(0, 4));
    if (years >= 1 && createdDay.slice(5) === today.slice(5)) result.push({ id: `${patient.id}:anniversary`, patient, detail: `Cumple ${years === 1 ? 'un año' : `${years} años`} con vos` });
  }
  return result;
}

export function homeAttention(patients: readonly Patient[], items: readonly CrmWorkItem[]): HomePatientNotice[] {
  return patients.filter(isActive).flatMap(patient => {
    const quiet = items.find(item => item.kind === 'quiet' && item.patient_id === patient.id);
    const pending = patient.weekly_registration?.pending_review ?? 0;
    const detail = quiet ? quiet.title : patient.adherence_score > 0 && patient.adherence_score < 70 ? `${patient.adherence_score}% de adherencia registrada` : pending > 0 ? `${pending} registros por revisar` : null;
    return detail ? [{ id: patient.id, patient, detail }] : [];
  }).sort((a, b) => a.patient.adherence_score - b.patient.adherence_score);
}

export function homePendingTotal(counts: Record<CrmWorkKind, number>, rescheduleCount = 0) {
  return Object.entries(counts).reduce((total, [kind, count]) => total + (kind === 'appointment' ? 0 : count), rescheduleCount);
}

/** Cobrado = pagos confirmados este mes. Por cobrar = saldo de cargos de este mes, después de aplicar el historial de pagos. */
export function homeMonth(patients: readonly Patient[], board: BillingBoard | null, now: Date) {
  const today = homeDay(now), month = today.slice(0, 7);
  const current = { from: `${month}-01`, to: today };
  return {
    active: patients.filter(isActive).length,
    consultations: countConsultations(patients, current).total,
    collected: board ? incomeIn(board, current).amount : null,
    outstanding: board ? board.patients.reduce((total, patient) => total + summarizeLedger(patient, today).charges.filter(charge => charge.status === 'open' && charge.due_on.startsWith(month)).reduce((sum, charge) => sum + charge.amount - charge.paid, 0), 0) : null,
  };
}
