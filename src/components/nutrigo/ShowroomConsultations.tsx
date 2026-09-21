import { useEffect, useMemo, useState } from 'react';
import { api, apiErrorMessage } from '../../api/client';
import type { Patient } from '../../types';
import { Icon } from '../shared/Icon';
import { NvBadge, NvButton } from './primitives';
import { AppointmentHistoryList } from './AppointmentHistory';
import './showroom-consultations.css';

const WEEK_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const;
const DURATIONS = [15, 30, 45, 60, 90];
const CHANNELS = [{ id: 'video', label: 'Videollamada' }, { id: 'presencial', label: 'Presencial' }] as const;
type Appointment = NonNullable<Patient['appointment']>;
type FormState = { day: string; time: string; duration: number; channel: string; meet_url: string };

function localDateId(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function strictAppointmentWhen(when?: string): { day: string; time: string } | null {
  const [day = '', time = ''] = (when ?? '').split(' · ');
  if (!WEEK_DAYS.includes(day as typeof WEEK_DAYS[number]) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  return { day, time };
}

export function parseAppointmentWhen(when?: string): { day: string; time: string } {
  return strictAppointmentWhen(when) ?? { day: 'Lunes', time: '14:30' };
}

export function nextAppointmentDate(appointment: Pick<Appointment, 'when'> | null, now: Date): Date | null {
  if (!appointment) return null;
  const parsed = strictAppointmentWhen(appointment.when);
  if (!parsed) return null;
  const target = WEEK_DAYS.indexOf(parsed.day as typeof WEEK_DAYS[number]);
  const today = (now.getDay() + 6) % 7;
  let delta = (target - today + 7) % 7;
  const [hours, minutes] = parsed.time.split(':').map(Number);
  if (delta === 0 && (hours < now.getHours() || (hours === now.getHours() && minutes < now.getMinutes()))) delta = 7;
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + delta, hours, minutes);
  return date;
}

function sentenceCase(value: string): string {
  return value ? value[0].toLocaleUpperCase('es-AR') + value.slice(1) : value;
}

export function buildConsultationCalendar(appointment: Appointment | null, now: Date) {
  const appointmentDate = nextAppointmentDate(appointment, now);
  const month = appointmentDate ?? now;
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(month.getFullYear(), month.getMonth(), 1 - offset);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const occupied = offset + last.getDate();
  const count = occupied <= 35 ? 35 : 42;
  const appointmentId = appointmentDate ? localDateId(appointmentDate) : null;
  return {
    label: sentenceCase(month.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })),
    dateLabel: appointmentDate ? sentenceCase(appointmentDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })) : null,
    cells: Array.from({ length: count }, (_, index) => {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
      return { dateId: localDateId(date), day: date.getDate(), inMonth: date.getMonth() === month.getMonth(), isToday: localDateId(date) === localDateId(now), hasAppointment: localDateId(date) === appointmentId };
    }),
  };
}

function formFrom(appointment: Appointment | null): FormState {
  return { ...parseAppointmentWhen(appointment?.when), duration: appointment?.duration ?? 45, channel: appointment?.channel ?? 'video', meet_url: appointment?.meet_url ?? '' };
}

export function secureMeetUrl(value?: string): string | null {
  if (!value) return null;
  try { const parsed = new URL(value); return parsed.protocol === 'https:' ? parsed.href : null; } catch { return null; }
}

export function ShowroomConsultations({ patient, patients = [], now, onSelect, onChanged = () => undefined }: {
  patient: Patient; patients?: Patient[]; now: Date; onSelect: (id: string) => void; onChanged?: (patient: Patient) => void;
}) {
  const current = patient.appointment;
  const [editing, setEditing] = useState(() => !current);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => formFrom(current));
  const calendar = useMemo(() => buildConsultationCalendar(current, now), [current, now]);
  const channelLabel = CHANNELS.find((channel) => channel.id === current?.channel)?.label ?? current?.channel ?? 'Sin definir';
  const channelMetric = current?.channel === 'video' ? 'Video' : current?.channel === 'presencial' ? 'Presencial' : 'Sin definir';
  const safeUrl = secureMeetUrl(current?.meet_url);

  useEffect(() => { setEditing(!patient.appointment); setConfirmingCancel(false); setError(null); setForm(formFrom(patient.appointment)); }, [patient.id, patient.appointment]);

  const save = async () => {
    setBusy(true); setError(null);
    const meet_url = form.meet_url.trim();
    try {
      const result = await api.updateAppointment(patient.id, meet_url ? { ...form, meet_url } : { day: form.day, time: form.time, duration: form.duration, channel: form.channel });
      onChanged(result.patient); setEditing(false);
    } catch (error) { setError(apiErrorMessage(error, 'No pudimos guardar la consulta. Revisá que el enlace sea HTTPS.')); }
    finally { setBusy(false); }
  };

  const cancel = async () => {
    setBusy(true); setError(null);
    try { const result = await api.updateAppointment(patient.id, null); onChanged(result.patient); setConfirmingCancel(false); }
    catch { setError('No pudimos cancelar la consulta. Intentá nuevamente.'); }
    finally { setBusy(false); }
  };

  return <section className="nvc-consultations" aria-label={`Consultas de ${patient.name}`}>
    <header className="nvc-context"><div><span className={`nv-avatar person-${patient.tone}`}>{patient.initials}</span><div><strong>Consultas de {patient.name}</strong><small>Próximo turno y modalidad registrados por la profesional.</small></div></div>{patients.length > 0 && <label>Paciente<select aria-label="Paciente de la consulta" value={patient.id} onChange={(event) => onSelect(event.target.value)}>{patients.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>}</header>
    <div className="nvc-layout">
      <div className="nvc-primary">
        <section className="nvc-stats" aria-label="Resumen de la consulta">
          <article className="nvc-stat"><span className="nv-icon-tile"><Icon name="calendar" size={18} /></span><small>Estado</small><strong>{current ? 'Programada' : 'Sin turno'}</strong></article>
          <article className="nvc-stat"><span className="nv-icon-tile"><Icon name="video" size={18} /></span><small>Modalidad</small><strong>{channelMetric}</strong></article>
          <article className="nvc-stat"><span className="nv-icon-tile"><Icon name="clock" size={18} /></span><small>Duración</small><strong>{current ? `${current.duration} min` : 'Sin definir'}</strong></article>
        </section>
        <section className="nvc-calendar-card" aria-label="Calendario de la próxima consulta">
          <header><div><h2>{calendar.label}</h2><small>Próxima ocurrencia derivada del día y horario guardados.</small></div><NvBadge tone={current ? 'green' : 'gold'}>{current ? '1 consulta' : 'Sin consulta'}</NvBadge></header>
          <div className="nvc-weekdays" aria-hidden="true">{WEEK_DAYS.map((day) => <span key={day}>{day.slice(0, 3)}</span>)}</div>
          <div className="nvc-month-grid">{calendar.cells.map((cell) => <article key={cell.dateId} data-calendar-day={cell.dateId} className={`${cell.inMonth ? '' : 'nvc-outside'}${cell.isToday ? ' nvc-today' : ''}${cell.hasAppointment ? ' nvc-has-appointment' : ''}`}><time dateTime={cell.dateId}>{cell.day}</time>{cell.hasAppointment && current && <span><b>{current.when.split(' · ')[1]}</b><small>{channelLabel}</small></span>}</article>)}</div>
        </section>
      </div>
      <aside className="nvc-detail" aria-label="Detalle de consulta">
        <header><h2>Próxima consulta</h2><NvBadge tone={current ? 'green' : 'gold'}>{current ? 'Programada' : 'Pendiente'}</NvBadge></header>
        {current ? <article className="nvc-appointment-card"><span className="nv-icon-tile"><Icon name="calendar" size={20} /></span><p className="nvc-date-label">{calendar.dateLabel}</p><h3>{current.when}</h3><dl><div><dt>Duración</dt><dd>{current.duration} min</dd></div><div><dt>Modalidad</dt><dd>{channelLabel}</dd></div><div><dt>Zona horaria</dt><dd>Buenos Aires (UTC−3)</dd></div>{current.confirmation === 'attending' && <div><dt>Confirmación</dt><dd>Asistencia confirmada</dd></div>}{current.confirmation === 'needs_change' && <div><dt>Confirmación</dt><dd>Pidió un cambio de horario</dd></div>}</dl>{safeUrl && <a href={safeUrl} target="_blank" rel="noopener noreferrer">Abrir videollamada <Icon name="arrow" size={14} /></a>}<div className="nvc-actions"><NvButton onClick={() => { setEditing(true); setConfirmingCancel(false); }}>Reagendar</NvButton>{confirmingCancel ? <><button type="button" className="nvc-danger" disabled={busy} onClick={cancel}>Sí, cancelar</button><button type="button" className="nvc-secondary" disabled={busy} onClick={() => setConfirmingCancel(false)}>No, volver</button></> : <button type="button" className="nvc-secondary" onClick={() => { setConfirmingCancel(true); setEditing(false); }}>Cancelar turno</button>}</div></article> : <div className="nvc-empty"><span className="nv-icon-tile"><Icon name="calendar" size={22} /></span><h3>Sin consulta programada</h3><p>Agendá el próximo encuentro para que aparezca en el calendario.</p></div>}
        {editing && <form className="nvc-form" onSubmit={(event) => { event.preventDefault(); save(); }}><h3>{current ? 'Reagendar consulta' : 'Agendar consulta'}</h3><div className="nvc-form-grid"><label>Día<select aria-label="Día de la consulta" value={form.day} onChange={(event) => setForm((value) => ({ ...value, day: event.target.value }))}>{WEEK_DAYS.map((day) => <option key={day}>{day}</option>)}</select></label><label>Hora<input aria-label="Hora de la consulta" type="time" value={form.time} onChange={(event) => setForm((value) => ({ ...value, time: event.target.value }))} /></label><label>Duración<select aria-label="Duración de la consulta" value={form.duration} onChange={(event) => setForm((value) => ({ ...value, duration: Number(event.target.value) }))}>{DURATIONS.map((duration) => <option key={duration} value={duration}>{duration} min</option>)}</select></label><label>Modalidad<select aria-label="Modalidad de la consulta" value={form.channel} onChange={(event) => setForm((value) => ({ ...value, channel: event.target.value }))}>{CHANNELS.map((channel) => <option key={channel.id} value={channel.id}>{channel.label}</option>)}</select></label><label className="nvc-url">Enlace HTTPS (opcional)<input aria-label="Enlace de videollamada" type="url" maxLength={500} placeholder="https://…" value={form.meet_url} onChange={(event) => setForm((value) => ({ ...value, meet_url: event.target.value }))} /></label></div>{error && <p role="alert" className="nvc-error">{error}</p>}<div className="nvc-actions"><NvButton type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar turno'}</NvButton>{current && <button type="button" className="nvc-secondary" disabled={busy} onClick={() => setEditing(false)}>Volver</button>}</div></form>}
        <AppointmentHistoryList entries={patient.appointment_history ?? []} audience="professional" />
      </aside>
    </div>
  </section>;
}
