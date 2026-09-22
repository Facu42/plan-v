import { useMemo, useState } from 'react';
import type { Patient } from '../../types';
import { Icon } from '../shared/Icon';
import { NvBadge, NvButton } from './primitives';
import { appointmentReplyLabel, readAppointmentReply } from './appointment-reply';
import { nextAppointmentDate, secureMeetUrl } from './ShowroomConsultations';
import { ShowroomPatientAgenda } from './ShowroomPatientAgenda';
import { buildShowroomPatient } from './showroom-model';
import type { ShowroomPage } from './ShowroomPanels';
import { canShiftMonth, localDateId, monthAnchor, sentenceCase, shiftMonth } from './showroom-calendar';
import './showroom-agenda.css';

const WEEK_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
type AgendaFilter = 'all' | 'video' | 'presencial' | 'unassigned';
type Appointment = NonNullable<Patient['appointment']>;

export type AgendaEntry = {
  patient: Patient;
  appointment: Appointment;
  date: Date;
  dateId: string;
};

export function buildAgendaEntries(patients: Patient[], now: Date): AgendaEntry[] {
  return patients.flatMap((patient) => {
    if (!patient.appointment) return [];
    const date = nextAppointmentDate(patient.appointment, now);
    return date ? [{ patient, appointment: patient.appointment, date, dateId: localDateId(date) }] : [];
  }).sort((a, b) => a.date.getTime() - b.date.getTime() || a.patient.name.localeCompare(b.patient.name, 'es-AR'));
}

export function buildAgendaCalendar(entries: AgendaEntry[], now: Date, month: Date = now) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(month.getFullYear(), month.getMonth(), 1 - offset);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const count = offset + last.getDate() <= 35 ? 35 : 42;
  const entriesByDate = new Map<string, AgendaEntry[]>();
  entries.forEach((entry) => entriesByDate.set(entry.dateId, [...(entriesByDate.get(entry.dateId) ?? []), entry]));
  return {
    label: sentenceCase(month.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })),
    cells: Array.from({ length: count }, (_, index) => {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
      const dateId = localDateId(date);
      return { dateId, day: date.getDate(), inMonth: date.getMonth() === month.getMonth(), isToday: dateId === localDateId(now), entries: entriesByDate.get(dateId) ?? [] };
    }),
  };
}

const FILTERS: Array<{ id: AgendaFilter; label: string }> = [
  { id: 'all', label: 'Todas' },
  { id: 'video', label: 'Video' },
  { id: 'presencial', label: 'Presenciales' },
  { id: 'unassigned', label: 'Sin turno' },
];

export function ShowroomAgenda({ patients, now, onManage, focusPatient = null, onNavigatePatient }: {
  patients: Patient[];
  now: Date;
  onManage: (patientId: string) => void;
  focusPatient?: Patient | null;
  onNavigatePatient?: (patientId: string, page: ShowroomPage) => void;
}) {
  const [filter, setFilter] = useState<AgendaFilter>('all');
  const [month, setMonth] = useState(() => monthAnchor(now));
  const entries = useMemo(() => buildAgendaEntries(patients, now), [patients, now]);
  const calendar = useMemo(() => buildAgendaCalendar(entries, now, month), [entries, now, month]);
  const clinicRange = useMemo(() => {
    const ids = entries.map((entry) => entry.dateId);
    ids.push(localDateId(now));
    const sorted = [...ids].sort();
    return { minId: sorted[0], maxId: sorted[sorted.length - 1] };
  }, [entries, now]);
  const unassigned = patients.filter((patient) => !patient.appointment);
  const videoCount = entries.filter((entry) => entry.appointment.channel === 'video').length;
  const presencialCount = entries.filter((entry) => entry.appointment.channel === 'presencial').length;
  const visibleEntries = filter === 'all' ? entries : filter === 'unassigned' ? [] : entries.filter((entry) => entry.appointment.channel === filter);
  const visibleUnassigned = filter === 'all' || filter === 'unassigned' ? unassigned : [];

  return <section className="nva-agenda" aria-label="Agenda del consultorio">
    <header className="nva-intro">
      <div><span className="nv-icon-tile"><Icon name="calendar" size={20} /></span><div><strong>Agenda del consultorio</strong><small>Próximas consultas de todos los pacientes activos.</small></div></div>
      <NvBadge tone="green">{entries.length} programadas</NvBadge>
    </header>

    <section className="nva-stats" aria-label="Resumen de agenda">
      <article className="nva-stat"><span className="nv-icon-tile"><Icon name="calendar" size={18} /></span><small>Programadas</small><strong>{entries.length}</strong></article>
      <article className="nva-stat"><span className="nv-icon-tile"><Icon name="video" size={18} /></span><small>Videollamadas</small><strong>{videoCount}</strong></article>
      <article className="nva-stat"><span className="nv-icon-tile"><Icon name="contact" size={18} /></span><small>Presenciales</small><strong>{presencialCount}</strong></article>
      <article className="nva-stat"><span className="nv-icon-tile"><Icon name="users" size={18} /></span><small>Sin turno</small><strong>{unassigned.length}</strong></article>
    </section>

    <div className="nva-layout">
      <section className="nva-calendar" aria-label="Calendario multipaciente">
        <header><div><h2>{calendar.label}</h2><small>Se muestra una próxima ocurrencia por paciente, derivada del día y horario guardados.</small></div><div className="nva-month-nav"><button type="button" aria-label="Mes anterior" disabled={!canShiftMonth(month, -1, clinicRange)} onClick={() => setMonth((current) => shiftMonth(current, -1))}><Icon name="chevron" size={16} /></button><NvBadge>{entries.length} consultas</NvBadge><button type="button" aria-label="Mes siguiente" disabled={!canShiftMonth(month, 1, clinicRange)} onClick={() => setMonth((current) => shiftMonth(current, 1))}><Icon name="chevron" size={16} /></button></div></header>
        <div className="nva-weekdays" aria-hidden="true">{WEEK_DAYS.map((day) => <span key={day}>{day}</span>)}</div>
        <div className="nva-month-grid">{calendar.cells.map((cell) => <article key={cell.dateId} data-agenda-day={cell.dateId} className={`${cell.inMonth ? '' : 'nva-outside'}${cell.isToday ? ' nva-today' : ''}${cell.entries.length ? ' nva-occupied' : ''}`}><time dateTime={cell.dateId}>{cell.day}</time><div>{cell.entries.map((entry) => <button type="button" key={entry.patient.id} onClick={() => onManage(entry.patient.id)}><b>{entry.appointment.when.split(' · ')[1]}</b><span>{entry.patient.name}</span></button>)}</div></article>)}</div>
      </section>

      <aside className="nva-queue" aria-label="Consultas y pacientes sin turno">
        <header><div><h2>Próximas consultas</h2><small>Ordenadas por la próxima fecha derivada.</small></div></header>
        <div className="nva-filters" aria-label="Filtrar agenda">{FILTERS.map((option) => <button type="button" key={option.id} aria-pressed={filter === option.id} onClick={() => setFilter(option.id)}>{option.label}</button>)}</div>
        <div className="nva-rows">
          {visibleEntries.map((entry) => {
            const safeUrl = secureMeetUrl(entry.appointment.meet_url);
            const reply = entry.appointment.patient_reply ?? readAppointmentReply(typeof window === 'undefined' ? null : window.localStorage, entry.patient.id, entry.appointment.when);
            return <article className="nva-row" key={entry.patient.id}><span className={`nv-avatar person-${entry.patient.tone}`}>{entry.patient.initials}</span><div><strong>{entry.patient.name}</strong><small>{sentenceCase(entry.date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' }))} · {entry.appointment.when.split(' · ')[1]} · {entry.appointment.duration} min</small><NvBadge tone={entry.appointment.channel === 'video' ? 'green' : 'gold'}>{entry.appointment.channel === 'video' ? 'Videollamada' : 'Presencial'}</NvBadge><small>{appointmentReplyLabel(reply)}</small></div><div className="nva-row-actions">{safeUrl && <a href={safeUrl} target="_blank" rel="noopener noreferrer">Abrir sala</a>}<NvButton onClick={() => onManage(entry.patient.id)}>Gestionar consulta</NvButton></div></article>;
          })}
          {visibleUnassigned.length > 0 && <section className="nva-unassigned" aria-label="Pacientes sin turno"><h3>Sin turno</h3>{visibleUnassigned.map((patient) => <article key={patient.id}><span className={`nv-avatar person-${patient.tone}`}>{patient.initials}</span><div><strong>{patient.name}</strong><small>Sin consulta programada</small></div><NvButton onClick={() => onManage(patient.id)}>Gestionar consulta</NvButton></article>)}</section>}
          {!visibleEntries.length && !visibleUnassigned.length && <p className="nva-empty">No hay consultas para este filtro.</p>}
        </div>
      </aside>
    </div>
    {focusPatient && <ShowroomPatientAgenda audience="professional" patient={buildShowroomPatient(focusPatient, now)} now={now} onMessage={() => onManage(focusPatient.id)} onNavigate={(page) => onNavigatePatient?.(focusPatient.id, page)} />}
  </section>;
}
