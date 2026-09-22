import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../shared/Icon';
import { NvBadge, NvButton, NvState } from './primitives';
import { appointmentReplyLabel, readAppointmentReply, writeAppointmentReply, type AppointmentReply } from './appointment-reply';
import { parseAppointmentWhen, secureMeetUrl } from './ShowroomConsultations';
import { AppointmentHistoryList } from './AppointmentHistory';
import type { ShowroomPage } from './ShowroomPanels';
import {
  KIND_LABEL,
  addDays,
  buildMonthGrid,
  buildPatientCalendarEvents,
  buildWeekGrid,
  calendarRange,
  canShiftDay,
  canShiftMonth,
  canShiftWeek,
  countByKind,
  dateFromId,
  eventsOnDate,
  filterCalendarEvents,
  localDateId,
  monthAnchor,
  sentenceCase,
  shiftMonth,
  type CalendarEvent,
  type CalendarFilter,
  type CalendarView,
} from './showroom-calendar';
import type { ShowroomPatient } from './showroom-model';
import './showroom-patient-agenda.css';

const WEEK_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const RESCHEDULE_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const;
const VIEWS: Array<{ id: CalendarView; label: string }> = [
  { id: 'day', label: 'Día' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
];
const FILTERS: Array<{ id: CalendarFilter; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'consult', label: 'Consultas' },
  { id: 'plan', label: 'Plan' },
  { id: 'meal', label: 'Diario' },
  { id: 'activity', label: 'Actividad' },
];
const MONTH_YEAR = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' });

export function buildPatientAgendaView(patient: ShowroomPatient, now: Date) {
  const events = buildPatientCalendarEvents(patient, now);
  const date = events.find((event) => event.kind === 'consult')?.at ?? null;
  return {
    date,
    events,
    calendar: buildMonthGrid(monthAnchor(date ?? now), now),
    safeUrl: patient.appointment?.channel === 'video' ? secureMeetUrl(patient.appointment.meet_url) : null,
  };
}

function channelLabel(channel: string): string {
  if (channel === 'video') return 'Videollamada';
  if (channel === 'presencial') return 'Presencial';
  return 'Modalidad por confirmar';
}

function eventTime(event: CalendarEvent): string {
  return event.at.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

export function ShowroomPatientAgenda({
  patient,
  now,
  onMessage,
  onNavigate,
  onReschedule,
  onConfirm,
  audience = 'patient',
  storage = typeof window === 'undefined' ? null : window.localStorage,
}: {
  patient: ShowroomPatient;
  now: Date;
  onMessage: () => void;
  onNavigate?: (page: ShowroomPage) => void;
  onReschedule?: (day: string, time: string) => Promise<void> | void;
  onConfirm?: (reply: Exclude<AppointmentReply, 'pending'>) => Promise<void> | void;
  audience?: 'patient' | 'professional';
  storage?: Pick<Storage, 'getItem' | 'setItem'> | null;
}) {
  const current = patient.appointment;
  const allEvents = useMemo(() => buildPatientCalendarEvents(patient, now), [patient, now]);
  const counts = countByKind(allEvents);
  const range = useMemo(() => calendarRange(allEvents, now), [allEvents, now]);
  const [view, setView] = useState<CalendarView>('month');
  const [filter, setFilter] = useState<CalendarFilter>('all');
  const [selectedDateId, setSelectedDateId] = useState(() => localDateId(now));
  const [month, setMonth] = useState(() => monthAnchor(now));
  const [reply, setReply] = useState<AppointmentReply>(() => current?.patient_reply ?? (current ? readAppointmentReply(storage, patient.id, current.when) : 'pending'));
  const [rescheduling, setRescheduling] = useState(false);
  const [reschedule, setReschedule] = useState(() => parseAppointmentWhen(current?.when));
  const [rescheduleBusy, setRescheduleBusy] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  useEffect(() => {
    setView('month');
    setFilter('all');
    setSelectedDateId(localDateId(now));
    setMonth(monthAnchor(now));
    setReply(current?.patient_reply ?? (current ? readAppointmentReply(storage, patient.id, current.when) : 'pending'));
    setRescheduling(false);
    setReschedule(parseAppointmentWhen(current?.when));
    setRescheduleError(null);
    setConfirmError(null);
  }, [patient.id, now, current, storage]);

  const events = filterCalendarEvents(allEvents, filter);
  const monthGrid = buildMonthGrid(month, now);
  const weekGrid = buildWeekGrid(dateFromId(selectedDateId), now);
  const selectedEvents = eventsOnDate(events, selectedDateId);
  const selectedDate = dateFromId(selectedDateId);
  const selectedLabel = sentenceCase(selectedDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }));
  const safeUrl = current?.channel === 'video' ? secureMeetUrl(current.meet_url) : null;
  const isPatient = audience === 'patient';

  const respond = async (next: Exclude<AppointmentReply, 'pending'>) => {
    if (!current || confirmBusy) return;
    setConfirmBusy(true);
    setConfirmError(null);
    try {
      if (onConfirm) await onConfirm(next);
      writeAppointmentReply(storage, patient.id, current.when, next);
      setReply(next);
      if (next === 'needs_change') setRescheduling(true);
    } catch {
      setConfirmError('No pudimos guardar la confirmación. Probá de nuevo o escribile a Verónica.');
    } finally {
      setConfirmBusy(false);
    }
  };

  const submitReschedule = async () => {
    if (!onReschedule) return;
    setRescheduleBusy(true);
    setRescheduleError(null);
    try {
      await onReschedule(reschedule.day, reschedule.time);
      setRescheduling(false);
    } catch {
      setRescheduleError('No pudimos reprogramar el horario. Probá de nuevo o escribile a Verónica.');
    } finally {
      setRescheduleBusy(false);
    }
  };

  const openRelated = (event: CalendarEvent) => {
    if (event.kind === 'consult') {
      if (isPatient) onMessage();
      else onNavigate?.('consultas');
      return;
    }
    if (event.kind === 'plan') onNavigate?.('plan');
    if (event.kind === 'meal') onNavigate?.('diario');
    if (event.kind === 'activity') onNavigate?.(isPatient ? 'ejercicio' : 'reciente');
  };

  const shiftSelectedDay = (delta: number) => {
    if (!canShiftDay(selectedDate, delta, range)) return;
    const next = addDays(selectedDate, delta);
    setSelectedDateId(localDateId(next));
    setMonth(monthAnchor(next));
  };

  const goMonth = (delta: number) => {
    if (!canShiftMonth(month, delta, range)) return;
    const next = shiftMonth(month, delta);
    setMonth(next);
    const todayId = localDateId(now);
    const today = dateFromId(todayId);
    setSelectedDateId(today.getMonth() === next.getMonth() && today.getFullYear() === next.getFullYear() ? todayId : localDateId(next));
  };

  const goWeek = (delta: number) => {
    if (!canShiftWeek(weekGrid.start, delta, range)) return;
    const next = addDays(selectedDate, delta * 7);
    const nextId = localDateId(next);
    const clamped = nextId < range.minId ? range.minId : nextId > range.maxId ? range.maxId : nextId;
    setSelectedDateId(clamped);
    setMonth(monthAnchor(dateFromId(clamped)));
  };

  const navLabel = view === 'month' ? monthGrid.label : view === 'week' ? weekGrid.label : selectedLabel;
  const canPrev = view === 'month' ? canShiftMonth(month, -1, range) : view === 'week' ? canShiftWeek(weekGrid.start, -1, range) : canShiftDay(selectedDate, -1, range);
  const canNext = view === 'month' ? canShiftMonth(month, 1, range) : view === 'week' ? canShiftWeek(weekGrid.start, 1, range) : canShiftDay(selectedDate, 1, range);
  const onNav = (delta: number) => {
    if (view === 'month') goMonth(delta);
    else if (view === 'week') goWeek(delta);
    else shiftSelectedDay(delta);
  };
  const [monthWord, yearWord] = sentenceCase(MONTH_YEAR.format(month)).split(' de ');

  const renderChips = (dateId: string, compact = false) => {
    const dayEvents = eventsOnDate(events, dateId);
    const visible = compact ? dayEvents.slice(0, 2) : dayEvents;
    return <>
      <div className={`nvpa-day-events${visible.length === 1 ? ' nvpa-day-events-solo' : ''}`}>
        {visible.map((event) => <span key={event.id} className={`nvpa-chip ${event.kind}`}><b>{eventTime(event)}</b><small>{event.title}</small></span>)}
      </div>
      {compact && dayEvents.length > 2 && <small className="nvpa-more">+{dayEvents.length - 2}</small>}
    </>;
  };

  return <section className={`nvpa-agenda${isPatient ? '' : ' nvpa-embed'}`} aria-label={isPatient ? 'Tu calendario' : `Calendario de ${patient.name}`}>
    {isPatient ? <header className="nvpa-hero"><div><span>TU SEMANA</span><h2>Tu calendario</h2><p>Consultas publicadas, indicaciones de esta semana y lo que ya registraste. Nada más.</p></div><span className="nvpa-hero-icon"><Icon name="calendar" size={22} /></span></header>
      : <header className="nvpa-echo-head"><div><span>ECO DE LA PACIENTE</span><h2>Calendario de {patient.name}</h2><p>Las mismas fechas que ella ve: próxima consulta, plan de esta semana, diario y actividad.</p></div><NvBadge>{allEvents.length} eventos</NvBadge></header>}

    <dl className="nvpa-summary" aria-label="Resumen del calendario">
      <div><dt>Consultas</dt><dd>{counts.consult}</dd></div>
      <div><dt>Plan de la semana</dt><dd>{counts.plan}</dd></div>
      <div><dt>Diario</dt><dd>{counts.meal}</dd></div>
      <div><dt>Actividad</dt><dd>{counts.activity}</dd></div>
    </dl>

    <div className="nvpa-header">
      <div className="nvpa-header-left">
        <div className="nvpa-nav">
          <button type="button" aria-label="Anterior" disabled={!canPrev} onClick={() => onNav(-1)}><Icon name="chevron" size={16} /></button>
          <button type="button" aria-label="Siguiente" disabled={!canNext} onClick={() => onNav(1)}><Icon name="chevron" size={16} /></button>
        </div>
        <p className="nvpa-title"><span>{monthWord}</span><span className="nvpa-title-year">{yearWord}</span></p>
        {view !== 'month' && <p className="nvpa-title-sub">{navLabel}</p>}
      </div>
      <div className="nvpa-header-right">
        <div className="nvpa-views" aria-label="Vista del calendario">{VIEWS.map((option) => <button type="button" key={option.id} aria-pressed={view === option.id} onClick={() => setView(option.id)}>{option.label}</button>)}</div>
        <NvButton className="nvpa-new" onClick={onMessage}>{isPatient ? 'Nueva consulta' : 'Escribir'}</NvButton>
      </div>
    </div>

    <div className="nvpa-layout">
      <section className="nvpa-calendar" aria-label={view === 'month' ? 'Calendario mensual' : view === 'week' ? 'Calendario semanal' : 'Día seleccionado'}>
        <div className="nvpa-categories" aria-label="Filtrar eventos">{FILTERS.map((option) => <button type="button" key={option.id} aria-pressed={filter === option.id} onClick={() => setFilter(option.id)}><i className={`nvpa-checkbox ${option.id}`} aria-hidden="true" />{option.label}</button>)}</div>
        {view === 'month' && <>
          <div className="nvpa-weekdays" aria-hidden="true">{WEEK_DAYS.map((day) => <span key={day}>{day}</span>)}</div>
          <div className="nvpa-month-grid">{monthGrid.cells.map((cell) => {
            const dayEvents = eventsOnDate(events, cell.dateId);
            const occupied = dayEvents.length > 0;
            return <button type="button" key={cell.dateId} data-patient-agenda-day={cell.dateId} aria-pressed={cell.dateId === selectedDateId} aria-label={`${cell.dateId}${occupied ? ', con eventos' : ''}`} className={`${cell.inMonth ? '' : 'nvpa-outside'}${cell.isToday ? ' nvpa-today' : ''}${occupied ? ' nvpa-occupied' : ''}${cell.dateId === selectedDateId ? ' nvpa-selected' : ''}`} onClick={() => { setSelectedDateId(cell.dateId); setMonth(monthAnchor(cell.date)); }}><time dateTime={cell.dateId} className={dayEvents.length > 1 ? 'nvpa-day-badge' : undefined}>{cell.day}</time>{renderChips(cell.dateId, true)}</button>;
          })}</div>
        </>}
        {view === 'week' && <div className="nvpa-week-grid">{weekGrid.days.map((day) => <button type="button" key={day.dateId} data-patient-agenda-week-day={day.dateId} aria-pressed={day.dateId === selectedDateId} className={`${day.isToday ? 'nvpa-today' : ''}${day.dateId === selectedDateId ? ' nvpa-selected' : ''}`} onClick={() => setSelectedDateId(day.dateId)}><span>{day.weekday}</span><time dateTime={day.dateId}>{day.day}</time>{renderChips(day.dateId)}</button>)}</div>}
        {view === 'day' && <div className="nvpa-day-list">{selectedEvents.length ? selectedEvents.map((event) => <article key={event.id} data-calendar-event={event.id} className={`nvpa-event ${event.kind}`}>
          <span className={`nvpa-event-badge ${event.kind}`}>{KIND_LABEL[event.kind]}</span>
          <strong>{event.title}</strong>
          <div className="nvpa-event-details">
            <p><Icon name="calendar" size={14} />{selectedLabel}</p>
            <p><Icon name="clock" size={14} />{eventTime(event)}</p>
          </div>
        </article>) : <NvState title="Sin eventos este día" description="El calendario no inventa turnos, comidas ni actividad." />}</div>}
      </section>

      <aside className="nvpa-detail" aria-label="Detalle del día">
        <header><h3>Detalle del día</h3><NvBadge>{selectedEvents.length} {selectedEvents.length === 1 ? 'evento' : 'eventos'}</NvBadge></header>
        {selectedEvents.length ? selectedEvents.map((event) => <article key={event.id} className={`nvpa-event ${event.kind}`}>
          <span className={`nvpa-event-badge ${event.kind}`}>{KIND_LABEL[event.kind]}</span>
          <strong>{event.title}</strong>
          <div className="nvpa-event-details">
            <p><Icon name="calendar" size={14} />{selectedLabel}</p>
            <p><Icon name="clock" size={14} />{eventTime(event)}</p>
          </div>
          <div className="nvpa-event-note"><span>Nota</span><p>{event.subtitle}</p></div>
          {(onNavigate && event.kind !== 'consult') || (event.kind === 'consult' && !isPatient) ? <div className="nvpa-event-actions">
            {onNavigate && event.kind !== 'consult' && <NvButton className="nv-ghost" onClick={() => openRelated(event)}>{event.kind === 'plan' ? 'Ver en el plan' : event.kind === 'meal' ? 'Abrir diario' : isPatient ? 'Abrir ejercicio' : 'Ver actividad'}</NvButton>}
            {event.kind === 'consult' && !isPatient && <NvButton className="nv-ghost" onClick={() => onNavigate?.('consultas')}>Gestionar consulta</NvButton>}
          </div> : null}
        </article>)
          : <p className="nvpa-empty-day">No hay eventos publicados o registrados en este día.</p>}

        {counts.consult > 0 && current && isPatient && <>
          <p className="nvpa-consult-when">{current.when} · {current.duration} min</p>
          <p className="nvpa-reply-note">Zona horaria: {current.timezone ?? 'America/Argentina/Buenos_Aires'}</p>
          {safeUrl && <a href={safeUrl} target="_blank" rel="noopener noreferrer">Abrir videollamada <Icon name="arrow" size={15} /></a>}
          {reply === 'pending' ? <div className="nvpa-reply"><NvButton disabled={confirmBusy} onClick={() => { void respond('attending'); }}>Confirmar asistencia</NvButton><NvButton className="nv-ghost" disabled={confirmBusy} onClick={() => { void respond('needs_change'); }}>Necesito cambiar el horario</NvButton></div>
            : <p className="nvpa-reply-note">{appointmentReplyLabel(reply)}. {reply === 'needs_change' ? 'Podés proponer un nuevo día y hora; duración y modalidad las conserva el consultorio.' : 'Si más adelante necesitás mover el turno, reprogramalo acá.'}</p>}
          {confirmError && <p role="alert">{confirmError}</p>}
          {!rescheduling && <NvButton className="nv-ghost" onClick={() => setRescheduling(true)}>Reprogramar horario</NvButton>}
          {rescheduling && <form className="nvpa-reschedule" onSubmit={(event) => { event.preventDefault(); submitReschedule(); }}>
            <h4>Reprogramar horario</h4>
            <p>Se conserva la duración y la modalidad publicadas. Cancelar el turno sigue a cargo del consultorio.</p>
            <label>Día<select aria-label="Nuevo día de la consulta" value={reschedule.day} onChange={(event) => setReschedule((value) => ({ ...value, day: event.target.value }))}>{RESCHEDULE_DAYS.map((day) => <option key={day}>{day}</option>)}</select></label>
            <label>Hora<input aria-label="Nueva hora de la consulta" type="time" value={reschedule.time} onChange={(event) => setReschedule((value) => ({ ...value, time: event.target.value }))} /></label>
            {rescheduleError && <p role="alert">{rescheduleError}</p>}
            <div className="nvpa-reply"><NvButton type="submit" disabled={rescheduleBusy || !onReschedule}>{rescheduleBusy ? 'Guardando…' : 'Confirmar horario'}</NvButton><NvButton className="nv-ghost" type="button" onClick={() => setRescheduling(false)}>Volver</NvButton></div>
          </form>}
          <NvButton className="nv-soft" onClick={onMessage}>Escribirle a Verónica <Icon name="message" size={15} /></NvButton>
        </>}

        {current && !counts.consult && isPatient && <p className="nvpa-reply-note">Fecha pendiente de corregir. La gestión del turno corresponde al consultorio.</p>}
        {!current && isPatient && <div className="nvpa-empty-consult"><NvState title="Sin consulta programada" description="Podés escribirle a Verónica para coordinar el próximo encuentro." /><NvButton onClick={onMessage}>Escribirle a Verónica <Icon name="message" size={16} /></NvButton></div>}
        <AppointmentHistoryList entries={patient.appointmentHistory ?? []} audience={isPatient ? 'patient' : 'professional'} />
      </aside>
    </div>

    <p className="nvpa-note"><Icon name="calendar" size={16} /> Las indicaciones del plan se muestran sólo sobre la semana calendario actual. Diario y actividad usan su fecha real. La consulta es la próxima ocurrencia publicada. Los avisos de comidas, hábitos y consulta están en la campana; el teléfono usa el navegador de este dispositivo y el mail queda en el buzón demo.</p>
  </section>;
}
