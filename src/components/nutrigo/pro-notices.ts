import type { Patient } from '../../types';
import type { ShowroomPage } from './ShowroomPanels';
import type { BoardRow } from './cobranzas-utils';
import { unreadMessages } from './message-receipts';

export type ProNoticeKind = 'messages' | 'appointment' | 'payment' | 'debt';
export type ProNotice = { id: string; kind: ProNoticeKind; patientId: string; title: string; detail: string; page: ShowroomPage };
export type ProNoticePerson = Pick<Patient, 'id' | 'name' | 'messages' | 'appointment'>;
export type ProNoticeStorage = Pick<Storage, 'getItem' | 'setItem'>;

export const readNoticeKey = (id: string) => `plan-v:pro-notice-read:${id}`;

/** Avisos del consultorio a partir de lo que ya existe (mensajes, turnos, cobros). Cada id incluye lo que lo hizo nacer: un hecho nuevo es un aviso nuevo. */
export function buildProNotices({ patients, board, now }: { patients: readonly ProNoticePerson[]; board: readonly BoardRow[]; now: Date }): ProNotice[] {
  const items: ProNotice[] = [];
  for (const person of patients) {
    const unread = unreadMessages((person.messages ?? []).filter(message => message.patient_id === person.id), 'pro');
    if (unread.length) {
      const last = unread[unread.length - 1];
      items.push({ id: `messages:${person.id}:${last.id}`, kind: 'messages', patientId: person.id, title: `${person.name} te escribió`, detail: unread.length === 1 ? '1 mensaje sin leer' : `${unread.length} mensajes sin leer`, page: 'mensajes' });
    }
    const appointment = person.appointment;
    const startsAt = appointment?.starts_at ? Date.parse(appointment.starts_at) : NaN;
    if (appointment?.patient_reply && !Number.isNaN(startsAt) && startsAt > now.getTime()) {
      const asks = appointment.patient_reply === 'needs_change';
      items.push({ id: `appointment:${person.id}:${appointment.starts_at}:${appointment.patient_reply}`, kind: 'appointment', patientId: person.id, title: asks ? `${person.name} pide cambiar la consulta` : `${person.name} confirmó la consulta`, detail: appointment.when, page: 'consultas' });
    }
  }
  for (const { patient, summary } of board) {
    if (summary.pending_reports > 0) {
      items.push({ id: `payment:${patient.patient_id}:${summary.pending_reports}`, kind: 'payment', patientId: patient.patient_id, title: `${patient.full_name} avisó un pago`, detail: summary.pending_reports === 1 ? 'Falta confirmarlo' : `${summary.pending_reports} avisos por confirmar`, page: 'cobranzas' });
    }
    if (summary.state === 'debe') {
      items.push({ id: `debt:${patient.patient_id}:${summary.debt_since ?? ''}`, kind: 'debt', patientId: patient.patient_id, title: `${patient.full_name} tiene una cuota vencida`, detail: summary.debt_since ? `Desde el ${summary.debt_since.split('-').reverse().join('/')}` : 'Cuota vencida', page: 'cobranzas' });
    }
  }
  return items;
}

const wasRead = (storage: Pick<Storage, 'getItem'> | null, id: string) => {
  try { return storage?.getItem(readNoticeKey(id)) === '1'; } catch { return false; }
};

export function unreadProNotices(items: readonly ProNotice[], storage: Pick<Storage, 'getItem'> | null): ProNotice[] {
  return items.filter(item => !wasRead(storage, item.id));
}

export function markRead(storage: Pick<Storage, 'setItem'> | null, id: string) {
  try { storage?.setItem(readNoticeKey(id), '1'); } catch { /* sin almacenamiento: el aviso sigue sin leer */ }
}

export function markAllRead(storage: Pick<Storage, 'setItem'> | null, items: readonly ProNotice[]) {
  items.forEach(item => markRead(storage, item.id));
}
