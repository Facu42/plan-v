import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  CalendarCheck, CalendarDots, CaretDown, CaretLeft, CaretRight, Clock, ForkKnife, MapPinArea, Notebook, PersonSimpleRun,
} from '@phosphor-icons/react';
import { NvState } from './primitives';
import { appointmentReplyLabel, readAppointmentReply, writeAppointmentReply, type AppointmentReply } from './appointment-reply';
import { parseAppointmentWhen, secureMeetUrl } from './ShowroomConsultations';
import { AppointmentHistoryList } from './AppointmentHistory';
import type { ShowroomPage } from './ShowroomPanels';
import {
  addDays,
  buildMonthGrid,
  buildPatientCalendarEvents,
  buildWeekGrid,
  canShiftDay,
  canShiftMonth,
  canShiftWeek,
  countByKind,
  dateFromId,
  localDateId,
  monthAnchor,
  sentenceCase,
  shiftMonth,
  type CalendarEvent,
  type CalendarKind,
  type CalendarView,
} from './showroom-calendar';
import type { ShowroomPatient } from './showroom-model';
import './showroom-patient-agenda.css';
import './agenda-diario-fig.css';
import dotsFigma from '../../assets/figma-mobile/427-14552-imgIconDotsThree.svg';
import facebookFigma from '../../assets/figma-mobile/427-14667-imgFacebookLogo.svg';
import twitterFigma from '../../assets/figma-mobile/427-14667-imgTwitterLogo.svg';
import instagramFigma from '../../assets/figma-mobile/427-14667-imgInstagramLogo.svg';
import youtubeFigma from '../../assets/figma-mobile/427-14667-imgYoutubeLogo.svg';
import linkedinFigma from '../../assets/figma-mobile/427-14667-imgLinkedinLogo.svg';
import './figma-mobile-agenda.css';

/* ──────────────────────────────────────────────────────────────────────────
   Piezas compartidas del frame "04. Calendar" (84:1666 / móvil 433:17250).
   Las usan la agenda del paciente (acá) y la del consultorio (ShowroomAgenda).
   ────────────────────────────────────────────────────────────────────────── */

export type FigTone = 'green' | 'mint' | 'saffron' | 'orange' | 'gray';
export type FigCategory = { id: string; label: string; tone: FigTone };
export type FigCalendarItem = { id: string; dateId: string; at: Date; category: string; time: string; title: string; /** menor = primero en la celda */ priority?: number };

const WEEK_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const RESCHEDULE_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const;
const VIEWS: Array<{ id: CalendarView; label: string }> = [
  { id: 'day', label: 'Día' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
];
const MONTH_YEAR = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' });
const LONG_DATE = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export function longDateLabel(date: Date): string {
  return sentenceCase(LONG_DATE.format(date));
}

/** Card Statistic - Calendar (214:5650): rótulo, divisor, ícono de 36 y cifra 22 + unidad 14. */
export function FigStatCard({ label, value, unit, tone, icon }: { label: string; value: number; unit: string; tone: FigTone; icon: ReactNode }) {
  return <article className="nvcal-stat">
    <p>{label}</p>
    <hr />
    <div><span className={`nvcal-stat-icon ${tone}`} aria-hidden="true">{icon}</span><p><strong>{value}</strong><small>{unit}</small></p></div>
  </article>;
}

/** Schedule 1/2 (217:8308): badge de categoría, título 18, detalles con ícono, nota y acciones. */
export function FigScheduleCard({ tone, badge, title, details, note, actions, children, dataId }: {
  tone: FigTone;
  badge: string;
  title: string;
  details: Array<{ icon: 'date' | 'time' | 'place'; text: string }>;
  note?: { label: string; text: ReactNode } | null;
  actions?: ReactNode;
  children?: ReactNode;
  dataId?: string;
}) {
  return <article className="nvcal-card" data-calendar-event={dataId}>
    <span className={`nvcal-badge ${tone}`}>{badge}</span>
    <strong>{title}</strong>
    <div className="nvcal-card-details">{details.map((detail) => <p key={`${detail.icon}:${detail.text}`}>
      {detail.icon === 'date' ? <CalendarDots size={16} aria-hidden="true" /> : detail.icon === 'time' ? <Clock size={16} aria-hidden="true" /> : <MapPinArea size={16} aria-hidden="true" />}{detail.text}
    </p>)}</div>
    {note && <div className="nvcal-card-note"><span>{note.label}</span><div>{note.text}</div></div>}
    {children}
    {actions && <div className="nvcal-card-actions">{actions}</div>}
  </article>;
}

export function useCalendarNav(dateIds: readonly string[], now: Date, resetKey: string, initialDateId?: string) {
  const range = useMemo(() => {
    const sorted = [...dateIds, localDateId(now)].sort();
    return { minId: sorted[0], maxId: sorted[sorted.length - 1] };
  }, [dateIds, now]);
  const startId = initialDateId ?? localDateId(now);
  const [view, setView] = useState<CalendarView>('month');
  const [selectedDateId, setSelectedDateId] = useState(startId);
  const [month, setMonth] = useState(() => monthAnchor(dateFromId(startId)));

  useEffect(() => {
    setView('month');
    setSelectedDateId(startId);
    setMonth(monthAnchor(dateFromId(startId)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, now]);

  const selectedDate = dateFromId(selectedDateId);
  const monthGrid = buildMonthGrid(month, now);
  const weekGrid = buildWeekGrid(selectedDate, now);

  const selectDate = (dateId: string) => {
    setSelectedDateId(dateId);
    setMonth(monthAnchor(dateFromId(dateId)));
  };
  const goMonth = (next: Date) => {
    setMonth(next);
    const todayId = localDateId(now);
    const today = dateFromId(todayId);
    setSelectedDateId(today.getMonth() === next.getMonth() && today.getFullYear() === next.getFullYear() ? todayId : localDateId(next));
  };
  const canPrev = view === 'month' ? canShiftMonth(month, -1, range) : view === 'week' ? canShiftWeek(weekGrid.start, -1, range) : canShiftDay(selectedDate, -1, range);
  const canNext = view === 'month' ? canShiftMonth(month, 1, range) : view === 'week' ? canShiftWeek(weekGrid.start, 1, range) : canShiftDay(selectedDate, 1, range);
  const onNav = (delta: number) => {
    if (delta < 0 ? !canPrev : !canNext) return;
    if (view === 'month') goMonth(shiftMonth(month, delta));
    else if (view === 'week') {
      const nextId = localDateId(addDays(selectedDate, delta * 7));
      selectDate(nextId < range.minId ? range.minId : nextId > range.maxId ? range.maxId : nextId);
    } else selectDate(localDateId(addDays(selectedDate, delta)));
  };
  const monthOptions = useMemo(() => {
    const options: Date[] = [];
    let cursor = monthAnchor(dateFromId(range.minId));
    const last = monthAnchor(dateFromId(range.maxId));
    while (cursor.getTime() <= last.getTime() && options.length < 36) {
      options.push(cursor);
      cursor = shiftMonth(cursor, 1);
    }
    return options;
  }, [range]);

  return { view, setView, month, goMonth, monthOptions, selectedDateId, selectedDate, selectDate, monthGrid, weekGrid, canPrev, canNext, onNav };
}

export type CalendarNav = ReturnType<typeof useCalendarNav>;

function itemsOn(items: readonly FigCalendarItem[], dateId: string) {
  return items.filter((item) => item.dateId === dateId);
}

/** Section Calendar (217:6452): Header-Section + card con Category List, cabecera de días y grilla. */
export function FigCalendarBoard({ nav, items, categories, hidden, onToggle, cta, dayAttr, renderDay, caption }: {
  nav: CalendarNav;
  items: readonly FigCalendarItem[];
  categories: readonly FigCategory[];
  hidden: ReadonlySet<string>;
  onToggle: (id: string) => void;
  cta?: { label: string; onClick: () => void } | null;
  dayAttr: string;
  renderDay: (items: FigCalendarItem[]) => ReactNode;
  caption?: string;
}) {
  const toneOf = (category: string) => categories.find((option) => option.id === category)?.tone ?? 'gray';
  const visible = items.filter((item) => !hidden.has(item.category));
  const [monthWord, yearWord] = sentenceCase(MONTH_YEAR.format(nav.month)).split(' de ');
  const selectedLabel = sentenceCase(nav.selectedDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }));
  const subLabel = nav.view === 'week' ? nav.weekGrid.label : nav.view === 'day' ? selectedLabel : null;
  const monthValue = `${nav.month.getFullYear()}-${nav.month.getMonth()}`;

  const renderChips = (dateId: string, max: number) => {
    const dayItems = itemsOn(visible, dateId).sort((a, b) => (a.priority ?? 1) - (b.priority ?? 1));
    const shown = dayItems.slice(0, max);
    return <>
      {shown.length > 0 && <span className="nvcal-schedules">{shown.map((item) => <span key={item.id} className={`nvcal-chip ${toneOf(item.category)}`}><b>{item.time}</b><small>{item.title}</small></span>)}</span>}
      {dayItems.length > max && <small className="nvcal-more">+{dayItems.length - max}</small>}
    </>;
  };

  return <section className="nvcal-section" aria-label="Calendario" data-figma-node="433:18153">
    <header className="nvcal-head">
      <div className="nvcal-head-left">
        <div className="nvcal-arrows">
          <button type="button" aria-label="Anterior" disabled={!nav.canPrev} onClick={() => nav.onNav(-1)}><CaretLeft size={18} aria-hidden="true" /></button>
          <button type="button" aria-label="Siguiente" disabled={!nav.canNext} onClick={() => nav.onNav(1)}><CaretRight size={18} aria-hidden="true" /></button>
        </div>
        <label className="nvcal-title">
          <span>{monthWord}</span><span className="nvcal-title-year">{yearWord}</span><CaretDown size={14} aria-hidden="true" />
          <select aria-label="Elegir mes" value={monthValue} onChange={(event) => {
            const option = nav.monthOptions.find((date) => `${date.getFullYear()}-${date.getMonth()}` === event.target.value);
            if (option) nav.goMonth(option);
          }}>{nav.monthOptions.map((date) => <option key={date.getTime()} value={`${date.getFullYear()}-${date.getMonth()}`}>{sentenceCase(MONTH_YEAR.format(date))}</option>)}</select>
        </label>
        {subLabel && <p className="nvcal-title-sub">{subLabel}</p>}
      </div>
      <div className="nvcal-head-right">
        <div className="nvcal-views" aria-label="Vista del calendario">{VIEWS.map((option) => <button type="button" key={option.id} aria-pressed={nav.view === option.id} onClick={() => nav.setView(option.id)}>{option.label}</button>)}</div>
        {cta && <button type="button" className="nvcal-cta" onClick={cta.onClick}><span className="nvcal-cta-long">{cta.label}</span><span className="nvcal-cta-short">Escribir</span></button>}
        <details className="nvcal-mobile-more"><summary aria-label="Opciones del calendario"><img src={dotsFigma} alt="" width="24" height="24" /></summary><div><div className="nvcal-mobile-month"><button type="button" disabled={!nav.canPrev} onClick={() => nav.onNav(-1)}>Anterior</button><button type="button" disabled={!nav.canNext} onClick={() => nav.onNav(1)}>Siguiente</button></div><div className="nvcal-mobile-views">{VIEWS.map((option) => <button type="button" key={option.id} aria-pressed={nav.view === option.id} onClick={() => nav.setView(option.id)}>{option.label}</button>)}</div></div></details>
      </div>
    </header>

    <div className="nvcal-board">
      <div className="nvcal-categories" aria-label="Filtrar eventos">{categories.map((option) => <button type="button" key={option.id} aria-pressed={!hidden.has(option.id)} onClick={() => onToggle(option.id)}><i className={`nvcal-check ${option.tone}`} aria-hidden="true" />{option.label}</button>)}</div>
      {nav.view === 'month' && <>
        <div className="nvcal-weekdays" aria-hidden="true">{WEEK_DAYS.map((day) => <span key={day}>{day}</span>)}</div>
        <div className="nvcal-month" aria-label="Calendario mensual">{nav.monthGrid.cells.map((cell) => {
          const count = itemsOn(visible, cell.dateId).length;
          return <button type="button" key={cell.dateId} {...{ [`data-${dayAttr}-day`]: cell.dateId }} aria-pressed={cell.dateId === nav.selectedDateId} aria-label={`${cell.dateId}${count ? `, ${count} ${count === 1 ? 'evento' : 'eventos'}` : ''}`} className={`${cell.inMonth ? '' : 'nvcal-outside'}${cell.isToday ? ' nvcal-today' : ''}${cell.dateId === nav.selectedDateId ? ' nvcal-selected' : ''}${count === 1 ? ' nvcal-solo' : ''}`} onClick={() => nav.selectDate(cell.dateId)}>
            <time dateTime={cell.dateId} className={count > 1 ? 'nvcal-multi' : undefined}>{cell.day}</time>
            {renderChips(cell.dateId, 2)}
          </button>;
        })}</div>
      </>}
      {nav.view === 'week' && <div className="nvcal-week" aria-label="Calendario semanal">{nav.weekGrid.days.map((day) => <button type="button" key={day.dateId} {...{ [`data-${dayAttr}-week-day`]: day.dateId }} aria-pressed={day.dateId === nav.selectedDateId} className={`${day.isToday ? 'nvcal-today' : ''}${day.dateId === nav.selectedDateId ? ' nvcal-selected' : ''}`} onClick={() => nav.selectDate(day.dateId)}>
        <span>{day.weekday}</span><time dateTime={day.dateId} className={itemsOn(visible, day.dateId).length > 1 ? 'nvcal-multi' : undefined}>{day.day}</time>{renderChips(day.dateId, 8)}
      </button>)}</div>}
      {nav.view === 'day' && <div className="nvcal-day" aria-label="Día seleccionado">{renderDay(itemsOn(visible, nav.selectedDateId))}</div>}
    </div>
    {caption && <p className="nvcal-caption">{caption}</p>}
  </section>;
}

/* ──────────────────────────────────────────────────────────────────────────
   Agenda del paciente
   ────────────────────────────────────────────────────────────────────────── */

const PATIENT_CATEGORIES: FigCategory[] = [
  { id: 'plan', label: 'Plan de comidas', tone: 'green' },
  { id: 'meal', label: 'Diario', tone: 'mint' },
  { id: 'activity', label: 'Actividad física', tone: 'saffron' },
  { id: 'consult', label: 'Consultas', tone: 'orange' },
];
const KIND_TONE: Record<CalendarKind, FigTone> = { plan: 'green', meal: 'mint', activity: 'saffron', consult: 'orange' };
const KIND_BADGE: Record<CalendarKind, string> = { plan: 'Plan de comidas', meal: 'Diario', activity: 'Actividad física', consult: 'Consulta' };

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

function clockTime(event: Pick<CalendarEvent, 'at'>): string {
  return event.at.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

/** Las indicaciones del plan no tienen hora propia (se anclan al mediodía): se muestra el momento y,
    si el plan de hoy la trae, su hora. Nunca un "12:00" inventado. */
export function eventTime(event: Pick<CalendarEvent, 'at' | 'kind' | 'subtitle'>): string {
  if (event.kind !== 'plan') return clockTime(event);
  const [slot, rest = ''] = event.subtitle.split(' · ');
  return /^\d{1,2}:\d{2}$/.test(rest.trim()) ? `${slot} · ${rest.trim()}` : slot;
}

export function toggleInSet<T>(set: ReadonlySet<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

export function ShowroomPatientAgenda({
  patient,
  now,
  onMessage,
  onNavigate,
  onReschedule,
  onConfirm,
  storage = typeof window === 'undefined' ? null : window.localStorage,
}: {
  patient: ShowroomPatient;
  now: Date;
  onMessage: () => void;
  onNavigate?: (page: ShowroomPage) => void;
  onReschedule?: (day: string, time: string) => Promise<void> | void;
  onConfirm?: (reply: Exclude<AppointmentReply, 'pending'>) => Promise<void> | void;
  storage?: Pick<Storage, 'getItem' | 'setItem'> | null;
}) {
  const current = patient.appointment;
  const allEvents = useMemo(() => buildPatientCalendarEvents(patient, now), [patient, now]);
  const counts = countByKind(allEvents);
  const eventsById = useMemo(() => new Map(allEvents.map((event) => [event.id, event])), [allEvents]);
  const items = useMemo<FigCalendarItem[]>(() => allEvents.map((event) => ({ id: event.id, dateId: event.dateId, at: event.at, category: event.kind, time: eventTime(event), title: event.title, priority: event.kind === 'consult' ? 0 : 1 })), [allEvents]);
  const dateIds = useMemo(() => allEvents.map((event) => event.dateId), [allEvents]);
  const nav = useCalendarNav(dateIds, now, patient.id);
  const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set());
  const [reply, setReply] = useState<AppointmentReply>(() => current?.patient_reply ?? (current ? readAppointmentReply(storage, patient.id, current.when) : 'pending'));
  const [rescheduling, setRescheduling] = useState(false);
  const [reschedule, setReschedule] = useState(() => parseAppointmentWhen(current?.when));
  const [rescheduleBusy, setRescheduleBusy] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  useEffect(() => {
    setHidden(new Set());
    setReply(current?.patient_reply ?? (current ? readAppointmentReply(storage, patient.id, current.when) : 'pending'));
    setRescheduling(false);
    setReschedule(parseAppointmentWhen(current?.when));
    setRescheduleError(null);
    setConfirmError(null);
  }, [patient.id, now, current, storage]);

  const consultEvent = allEvents.find((event) => event.kind === 'consult') ?? null;
  const safeUrl = current?.channel === 'video' ? secureMeetUrl(current.meet_url) : null;
  const dayEvents = allEvents.filter((event) => event.dateId === nav.selectedDateId && !hidden.has(event.kind));
  const consultOnDay = Boolean(consultEvent && dayEvents.some((event) => event.id === consultEvent.id));
  const otherDayEvents = dayEvents.filter((event) => event.kind !== 'consult');

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

  const related = (event: CalendarEvent): { label: string; page: ShowroomPage } | null => {
    if (!onNavigate) return null;
    if (event.kind === 'plan') return { label: 'Ver en el plan', page: 'plan' };
    if (event.kind === 'meal') return { label: 'Abrir diario', page: 'diario' };
    if (event.kind === 'activity') return { label: 'Abrir ejercicio', page: 'ejercicio' };
    return null;
  };

  const eventCard = (event: CalendarEvent) => {
    const link = related(event);
    return <FigScheduleCard key={event.id} dataId={event.id} tone={KIND_TONE[event.kind]} badge={KIND_BADGE[event.kind]} title={event.title}
      details={[{ icon: 'date', text: longDateLabel(event.at) }, { icon: 'time', text: eventTime(event) }]}
      note={{ label: 'Nota', text: <p>{event.subtitle}</p> }}
      actions={link ? <button type="button" className="nvcal-btn" onClick={() => onNavigate?.(link.page)}>{link.label}</button> : null} />;
  };

  const consultCard = consultEvent && current ? <FigScheduleCard key="consult" dataId={consultEvent.id} tone="orange" badge="Consulta" title={channelLabel(current.channel)}
    details={[
      { icon: 'date', text: longDateLabel(consultEvent.at) },
      { icon: 'time', text: `${clockTime(consultEvent)} · ${current.duration} min` },
      { icon: 'place', text: `${channelLabel(current.channel)} · ${current.timezone ?? 'America/Argentina/Buenos_Aires'}` },
    ]}
    note={{ label: 'Tu respuesta', text: <p>{reply === 'pending' ? 'Todavía no confirmaste la asistencia.' : `${appointmentReplyLabel(reply)}.`}{reply === 'needs_change' ? ' Podés proponer un nuevo día y hora; duración y modalidad las conserva el consultorio.' : ''}</p> }}
    actions={<>
      {safeUrl && <a className="nvcal-btn" href={safeUrl} target="_blank" rel="noopener noreferrer">Abrir videollamada</a>}
      {reply === 'pending' && <>
        <button type="button" className="nvcal-btn" disabled={confirmBusy} onClick={() => { void respond('needs_change'); }}>Necesito cambiar el horario</button>
        <button type="button" className="nvcal-btn nvcal-btn-primary" disabled={confirmBusy} onClick={() => { void respond('attending'); }}>Confirmar asistencia</button>
      </>}
      {!rescheduling && <button type="button" className="nvcal-btn" onClick={() => setRescheduling(true)}>Reprogramar horario</button>}
      <button type="button" className="nvcal-btn" onClick={onMessage}>Escribirle a Verónica</button>
    </>}>
    {confirmError && <p className="nvcal-alert" role="alert">{confirmError}</p>}
    {rescheduling && <form className="nvcal-reschedule" onSubmit={(event) => { event.preventDefault(); void submitReschedule(); }}>
      <h4>Reprogramar horario</h4>
      <p>Se conservan la duración y la modalidad publicadas. Cancelar el turno sigue a cargo del consultorio.</p>
      <label>Día<select aria-label="Nuevo día de la consulta" value={reschedule.day} onChange={(event) => setReschedule((value) => ({ ...value, day: event.target.value }))}>{RESCHEDULE_DAYS.map((day) => <option key={day}>{day}</option>)}</select></label>
      <label>Hora<input aria-label="Nueva hora de la consulta" type="time" value={reschedule.time} onChange={(event) => setReschedule((value) => ({ ...value, time: event.target.value }))} /></label>
      {rescheduleError && <p className="nvcal-alert" role="alert">{rescheduleError}</p>}
      <div className="nvcal-card-actions"><button type="button" className="nvcal-btn" onClick={() => setRescheduling(false)}>Volver</button><button type="submit" className="nvcal-btn nvcal-btn-primary" disabled={rescheduleBusy || !onReschedule}>{rescheduleBusy ? 'Guardando…' : 'Confirmar horario'}</button></div>
    </form>}
  </FigScheduleCard> : null;

  return <><section className="nvcal" aria-label="Tu calendario" data-figma-frame="433:17250">
    <div className="nvcal-main">
      <section className="nvcal-stats" aria-label="Resumen del calendario" data-figma-node="433:18045">
        <FigStatCard label="Comidas del plan" value={counts.plan} unit={counts.plan === 1 ? 'comida' : 'comidas'} tone="green" icon={<ForkKnife size={16} />} />
        <FigStatCard label="Registros del diario" value={counts.meal} unit={counts.meal === 1 ? 'registro' : 'registros'} tone="mint" icon={<Notebook size={16} />} />
        <FigStatCard label="Actividad física" value={counts.activity} unit={counts.activity === 1 ? 'registro' : 'registros'} tone="saffron" icon={<PersonSimpleRun size={16} />} />
        <FigStatCard label="Consultas" value={counts.consult} unit={counts.consult === 1 ? 'consulta' : 'consultas'} tone="orange" icon={<CalendarCheck size={16} />} />
      </section>
      <FigCalendarBoard nav={nav} items={items} categories={PATIENT_CATEGORIES} hidden={hidden} onToggle={(id) => setHidden((set) => toggleInSet(set, id))}
        cta={{ label: 'Nueva consulta', onClick: onMessage }} dayAttr="patient-agenda"
        caption="Las indicaciones del plan se muestran sólo sobre la semana calendario actual."
        renderDay={(list) => list.length ? list.map((item) => { const event = eventsById.get(item.id); return event ? (event.kind === 'consult' ? consultCard : eventCard(event)) : null; })
          : <NvState title="Sin eventos este día" description="El calendario no inventa turnos, comidas ni actividad." />} />
    </div>

    <aside className="nvcal-aside" aria-label="Detalle del día" data-figma-node="433:18471">
      <header><h3>Detalle del día</h3><small>{sentenceCase(nav.selectedDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }))}</small></header>
      {consultOnDay && consultCard}
      {otherDayEvents.map(eventCard)}
      {!dayEvents.length && <p className="nvcal-empty-day">No hay eventos publicados o registrados en este día.</p>}
      {consultCard && !consultOnDay && <><h4 className="nvcal-aside-sub">Próxima consulta</h4>{consultCard}</>}
      {current && !consultEvent && <p className="nvcal-empty-day">Fecha pendiente de corregir. La gestión del turno corresponde al consultorio.</p>}
      {!current && <div className="nvcal-empty-consult"><NvState title="Sin consulta programada" description="Podés escribirle a Verónica para coordinar el próximo encuentro." /><button type="button" className="nvcal-btn nvcal-btn-primary" onClick={onMessage}>Escribirle a Verónica</button></div>}
      <AppointmentHistoryList entries={patient.appointmentHistory ?? []} audience="patient" />
    </aside>
  </section><footer className="fmca-footer" data-figma-node="433:17504"><strong>Copyright © {now.getFullYear()} Plan V</strong><span>Privacidad　 Condiciones　 Contacto</span><span aria-hidden="true">{[facebookFigma, twitterFigma, instagramFigma, youtubeFigma, linkedinFigma].map((src) => <img key={src} src={src} alt="" width="20" height="20" />)}</span></footer></>;
}
