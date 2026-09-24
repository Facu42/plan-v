import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck, MapPinArea, VideoCamera } from '@phosphor-icons/react';
import type { Patient } from '../../types';
import { NvState } from './primitives';
import { appointmentReplyLabel, readAppointmentReply } from './appointment-reply';
import { nextAppointmentDate, secureMeetUrl } from './ShowroomConsultations';
import {
  FigCalendarBoard, FigScheduleCard, FigStatCard, longDateLabel, toggleInSet, useCalendarNav,
  type FigCalendarItem, type FigCategory,
} from './ShowroomPatientAgenda';
import { localDateId, sentenceCase } from './showroom-calendar';
import type { ShowroomPage } from './ShowroomPanels';
import './showroom-agenda.css';
import './agenda-diario-fig.css';

type Appointment = NonNullable<Patient['appointment']>;
type ChannelKind = 'video' | 'presencial' | 'other';

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

export function agendaChannel(channel: string): ChannelKind {
  return channel === 'video' ? 'video' : channel === 'presencial' ? 'presencial' : 'other';
}

const CHANNEL_LABEL: Record<ChannelKind, string> = { video: 'Videollamada', presencial: 'Presencial', other: 'Modalidad por confirmar' };

/** Category List del archivo: tres categorías con su color literal (Green, Saffron, Orange). */
const CATEGORIES: FigCategory[] = [
  { id: 'video', label: 'Videollamadas', tone: 'green' },
  { id: 'presencial', label: 'Presenciales', tone: 'saffron' },
  { id: 'other', label: 'Modalidad por confirmar', tone: 'orange' },
];
const TONE = { video: 'green', presencial: 'saffron', other: 'orange' } as const;

/** Primera consulta desde hoy: el panel del día abre ahí en vez de en un día vacío. */
export function firstAgendaDateId(entries: readonly AgendaEntry[], now: Date): string {
  const todayId = localDateId(now);
  return entries.find((entry) => entry.dateId >= todayId)?.dateId ?? todayId;
}

function timeOf(entry: AgendaEntry) {
  return entry.appointment.when.split(' · ')[1] ?? entry.date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

export function ShowroomAgenda({ patients, now, onManage, focusPatient = null }: {
  patients: Patient[];
  now: Date;
  onManage: (patientId: string) => void;
  focusPatient?: Patient | null;
  /** Se conserva la firma del shell; la agenda ya no embebe el calendario de la paciente. */
  onNavigatePatient?: (patientId: string, page: ShowroomPage) => void;
}) {
  const entries = useMemo(() => buildAgendaEntries(patients, now), [patients, now]);
  const items = useMemo<FigCalendarItem[]>(() => entries.map((entry) => ({
    id: entry.patient.id, dateId: entry.dateId, at: entry.date, category: agendaChannel(entry.appointment.channel), time: timeOf(entry), title: entry.patient.name,
  })), [entries]);
  const dateIds = useMemo(() => entries.map((entry) => entry.dateId), [entries]);
  const initial = firstAgendaDateId(entries, now);
  const nav = useCalendarNav(dateIds, now, 'clinic', initial);
  const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set());
  useEffect(() => { setHidden(new Set()); }, [now]);

  const unassigned = patients.filter((patient) => !patient.appointment);
  const invalid = patients.filter((patient) => patient.appointment && !entries.some((entry) => entry.patient.id === patient.id));
  const videoCount = entries.filter((entry) => agendaChannel(entry.appointment.channel) === 'video').length;
  const presencialCount = entries.filter((entry) => agendaChannel(entry.appointment.channel) === 'presencial').length;
  const dayEntries = entries.filter((entry) => entry.dateId === nav.selectedDateId && !hidden.has(agendaChannel(entry.appointment.channel)));
  const storage = typeof window === 'undefined' ? null : window.localStorage;
  const ctaPatient = focusPatient?.id ?? unassigned[0]?.id ?? patients[0]?.id ?? null;

  const entryCard = (entry: AgendaEntry) => {
    const channel = agendaChannel(entry.appointment.channel);
    const safeUrl = secureMeetUrl(entry.appointment.meet_url);
    const reply = entry.appointment.patient_reply ?? readAppointmentReply(storage, entry.patient.id, entry.appointment.when);
    return <FigScheduleCard key={entry.patient.id} dataId={`consult:${entry.patient.id}`} tone={TONE[channel]} badge={CHANNEL_LABEL[channel]} title={entry.patient.name}
      details={[
        { icon: 'date', text: longDateLabel(entry.date) },
        { icon: 'time', text: `${timeOf(entry)} · ${entry.appointment.duration} min` },
        { icon: 'place', text: CHANNEL_LABEL[channel] },
      ]}
      note={{ label: 'Respuesta de la paciente', text: <p>{appointmentReplyLabel(reply)}</p> }}
      actions={<>
        {safeUrl && <a className="nvcal-btn" href={safeUrl} target="_blank" rel="noopener noreferrer">Abrir sala</a>}
        <button type="button" className="nvcal-btn nvcal-btn-primary" onClick={() => onManage(entry.patient.id)}>Gestionar consulta</button>
      </>} />;
  };

  return <section className="nvcal nvcal-clinic" aria-label="Agenda del consultorio">
    <div className="nvcal-main">
      <section className="nvcal-stats" aria-label="Resumen de agenda">
        <FigStatCard label="Consultas programadas" value={entries.length} unit={entries.length === 1 ? 'consulta' : 'consultas'} tone="orange" icon={<CalendarCheck size={16} />} />
        <FigStatCard label="Videollamadas" value={videoCount} unit={videoCount === 1 ? 'consulta' : 'consultas'} tone="green" icon={<VideoCamera size={16} />} />
        <FigStatCard label="Presenciales" value={presencialCount} unit={presencialCount === 1 ? 'consulta' : 'consultas'} tone="saffron" icon={<MapPinArea size={16} />} />
      </section>
      <FigCalendarBoard nav={nav} items={items} categories={CATEGORIES} hidden={hidden} onToggle={(id) => setHidden((set) => toggleInSet(set, id))}
        cta={ctaPatient ? { label: 'Nueva consulta', onClick: () => onManage(ctaPatient) } : null} dayAttr="agenda"
        caption="Se muestra una próxima ocurrencia por paciente, derivada del día y horario guardados."
        renderDay={(list) => list.length ? list.map((item) => { const entry = entries.find((candidate) => candidate.patient.id === item.id); return entry ? entryCard(entry) : null; })
          : <NvState title="Sin consultas este día" description="La agenda sólo muestra turnos guardados." />} />
    </div>

    <aside className="nvcal-aside" aria-label="Detalle del día">
      <header><h3>Detalle del día</h3><small>{sentenceCase(nav.selectedDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }))}</small></header>
      {dayEntries.map(entryCard)}
      {!dayEntries.length && <p className="nvcal-empty-day">No hay consultas programadas en este día.</p>}
      {(unassigned.length > 0 || invalid.length > 0) && <section className="nvcal-unassigned" aria-label="Pacientes sin turno">
        <h4 className="nvcal-aside-sub">Sin turno <span>{unassigned.length + invalid.length}</span></h4>
        {[...unassigned, ...invalid].map((patient) => <article key={patient.id}>
          <span className={`nv-avatar person-${patient.tone}`}>{patient.initials}</span>
          <div><strong>{patient.name}</strong><small>{patient.appointment ? 'Fecha pendiente de corregir' : 'Sin consulta programada'}</small></div>
          <button type="button" className="nvcal-btn nvcal-btn-primary" onClick={() => onManage(patient.id)}>Gestionar consulta</button>
        </article>)}
      </section>}
    </aside>
  </section>;
}
