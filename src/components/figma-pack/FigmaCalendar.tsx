import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { ShowroomPage } from '../nutrigo/ShowroomPanels';
import type { ShowroomPatient } from '../nutrigo/showroom-model';
import { addDays, buildPatientCalendarEvents, countByKind, dateFromId, localDateId, monthAnchor, sentenceCase, shiftMonth, type CalendarEvent, type CalendarKind, type CalendarView } from '../nutrigo/showroom-calendar';
import { usePublishedPlan, weekPlanForPatient } from '../nutrigo/usePublishedPlan';
import { nextAppointmentDate, parseAppointmentWhen, secureMeetUrl } from '../nutrigo/ShowroomConsultations';
import { apiErrorMessage } from '../../api/client';

type CalendarCell = { dateId: string; date: Date; day: number; inMonth: boolean; isToday: boolean };
type NewActivity = { activity: string; duration_minutes: number; intensity: 'suave' | 'moderada' | 'intensa'; note?: string };
type CalendarValues = {
  month: Date;
  monthName: string;
  year: number;
  label: string;
  view: CalendarView;
  setView: (view: CalendarView) => void;
  shift: (step: number) => void;
  chooseMonth: (value: string) => void;
  selectedDateId: string;
  selectedLabel: string;
  selectDate: (dateId: string) => void;
  selectEvent: (event: CalendarEvent) => void;
  cells: CalendarCell[];
  events: CalendarEvent[];
  selectedEvents: CalendarEvent[];
  stats: [number, number, number];
  categories: [boolean, boolean, boolean];
  toggleCategory: (index: number) => void;
  openEvent: (event: CalendarEvent) => void;
  newActivity: () => void;
  appointment: ShowroomPatient['appointment'];
  planLoaded: boolean;
  planError: string;
  retryPlan: () => void;
  onConfirmAppointment?: (reply: 'attending' | 'needs_change') => Promise<void> | void;
  onRescheduleAppointment?: (day: string, time: string) => Promise<void> | void;
};
const context = createContext<CalendarValues | null>(null);
export function useFigmaCalendar() {
  const value = useContext(context);
  if (!value) throw new Error('El calendario Figma necesita datos del paciente.');
  return value;
}

export function buildFigmaMonthCells(month: Date, now: Date): CalendarCell[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1, 12);
  const start = addDays(first, -first.getDay());
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0, 12);
  const count = first.getDay() + last.getDate() <= 35 ? 35 : 42;
  const todayId = localDateId(now);
  return Array.from({ length: count }, (_, index) => {
    const date = addDays(start, index);
    return { dateId: localDateId(date), date, day: date.getDate(), inMonth: date.getMonth() === month.getMonth(), isToday: localDateId(date) === todayId };
  });
}

export function FigmaCalendarProvider({ patient, onNavigate, onRowCount, onConfirmAppointment, onRescheduleAppointment, onLogActivity, children }: {
  patient: ShowroomPatient;
  onNavigate: (page: ShowroomPage) => void;
  onRowCount?: (rows: number) => void;
  onConfirmAppointment?: (reply: 'attending' | 'needs_change') => Promise<void> | void;
  onRescheduleAppointment?: (day: string, time: string) => Promise<void> | void;
  onLogActivity?: (entry: NewActivity) => Promise<void> | void;
  children: ReactNode;
}) {
  const now = new Date();
  const { published, loaded: planLoaded, error: planError, retry: retryPlan } = usePublishedPlan(patient.id);
  const [month, setMonth] = useState(() => monthAnchor(now));
  const [selectedDateId, setSelectedDateId] = useState(() => localDateId(now));
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [view, setView] = useState<CalendarView>('month');
  const [categories, setCategories] = useState<[boolean, boolean, boolean]>([true, true, true]);
  const [activityOpen, setActivityOpen] = useState(false);
  const plannedPatient = useMemo(() => ({ ...patient, weekPlan: weekPlanForPatient(patient, published) }), [patient, published]);
  const allEvents = useMemo(() => buildPatientCalendarEvents(plannedPatient, now), [plannedPatient, now.getFullYear(), now.getMonth(), now.getDate()]);
  const events = allEvents.filter((event) => event.kind === 'consult' ? categories[2] : event.kind === 'activity' ? categories[1] : categories[0]);
  const inMonth = allEvents.filter((event) => event.at.getFullYear() === month.getFullYear() && event.at.getMonth() === month.getMonth());
  const counts = countByKind(inMonth);
  const stats: [number, number, number] = [counts.plan, counts.activity, counts.consult];
  const grid = buildFigmaMonthCells(month, now);
  const selectedDate = dateFromId(selectedDateId);
  const cells = view === 'month' ? grid : view === 'day'
    ? [{ dateId: selectedDateId, date: selectedDate, day: selectedDate.getDate(), inMonth: true, isToday: selectedDateId === localDateId(now) }]
    : Array.from({ length: 7 }, (_, index) => {
      const date = addDays(selectedDate, index - selectedDate.getDay());
      return { dateId: localDateId(date), date, day: date.getDate(), inMonth: date.getMonth() === month.getMonth(), isToday: localDateId(date) === localDateId(now) };
    });
  useEffect(() => onRowCount?.(view === 'month' ? cells.length / 7 : 1), [onRowCount, view, cells.length]);
  const selectedEvents = events.filter((event) => event.dateId === selectedDateId)
    .sort((a, b) => Number(b.id === selectedEventId) - Number(a.id === selectedEventId));
  const chooseMonth = (value: string) => {
    if (!/^\d{4}-\d{2}$/.test(value)) return;
    const [year, monthNumber] = value.split('-').map(Number);
    if (monthNumber < 1 || monthNumber > 12) return;
    const next = new Date(year, monthNumber - 1, 1, 12);
    setMonth(next); setSelectedDateId(localDateId(next)); setSelectedEventId(null);
  };
  const shift = (step: number) => {
    const next = view === 'month' ? shiftMonth(month, step) : addDays(selectedDate, step * (view === 'week' ? 7 : 1));
    setMonth(monthAnchor(next)); setSelectedDateId(localDateId(next)); setSelectedEventId(null);
  };
  const openEvent = (event: CalendarEvent) => onNavigate(event.kind === 'consult' ? 'mensajes' : event.kind === 'activity' ? 'ejercicio' : event.kind === 'meal' ? 'diario' : 'plan');
  const value: CalendarValues = {
    month,
    monthName: sentenceCase(month.toLocaleDateString('es-AR', { month: 'long' })),
    year: month.getFullYear(),
    label: sentenceCase(month.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })),
    view, setView, shift, chooseMonth,
    selectedDateId,
    selectedLabel: sentenceCase(selectedDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })),
    selectDate: (dateId) => { setSelectedDateId(dateId); setSelectedEventId(null); },
    selectEvent: (event) => { setSelectedDateId(event.dateId); setSelectedEventId(event.id); },
    cells, events, selectedEvents, stats, categories,
    toggleCategory: (index) => setCategories((current) => current.map((selected, position) => position === index ? !selected : selected) as [boolean, boolean, boolean]),
    openEvent,
    newActivity: () => setActivityOpen(true),
    appointment: patient.appointment,
    planLoaded, planError, retryPlan,
    onConfirmAppointment,
    onRescheduleAppointment: onRescheduleAppointment ? async (day, time) => {
      await onRescheduleAppointment(day, time);
      const next = nextAppointmentDate({ when: `${day} · ${time}` }, new Date());
      if (next) { setMonth(monthAnchor(next)); setSelectedDateId(localDateId(next)); setSelectedEventId(null); }
    } : undefined,
  };
  return <context.Provider value={value}>{children}{activityOpen && typeof document !== 'undefined' && createPortal(
    <FigmaCalendarActivityDialog onClose={() => setActivityOpen(false)} onSave={onLogActivity} />,
    document.body,
  )}</context.Provider>;
}

export function FigmaCalendarActivityDialog({ onClose, onSave }: { onClose: () => void; onSave?: (entry: NewActivity) => Promise<void> | void }) {
  const [activity, setActivity] = useState('');
  const [minutes, setMinutes] = useState('30');
  const [intensity, setIntensity] = useState<NewActivity['intensity']>('moderada');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const save = async () => {
    if (!onSave || busy) return;
    const duration = Number(minutes);
    if (activity.trim().length < 2 || !Number.isInteger(duration) || duration < 1 || duration > 600) {
      setError('Ingresá una actividad y una duración de 1 a 600 minutos.');
      return;
    }
    setBusy(true); setError('');
    try {
      await onSave({ activity: activity.trim(), duration_minutes: duration, intensity, note: note.trim() || undefined });
      onClose();
    } catch (cause) { setError(apiErrorMessage(cause, 'No pudimos guardar la actividad. Probá de nuevo.')); }
    finally { setBusy(false); }
  };
  return <div className="figma-calendar-activity-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <form className="figma-calendar-activity-dialog" role="dialog" aria-modal="true" aria-labelledby="figma-calendar-activity-title" onSubmit={(event) => { event.preventDefault(); void save(); }}>
      <div className="figma-calendar-activity-header"><div><span>CALENDARIO</span><h2 id="figma-calendar-activity-title">Registrar actividad</h2></div><button type="button" aria-label="Cerrar" disabled={busy} onClick={onClose}>×</button></div>
      <p>Registrá una actividad que ya realizaste. La fecha y hora se toman del momento de guardado.</p>
      <label>Actividad<input value={activity} onChange={(event) => setActivity(event.target.value)} minLength={2} maxLength={80} required placeholder="Por ejemplo, caminata" autoFocus /></label>
      <div className="figma-calendar-activity-fields"><label>Duración (min)<input type="number" min="1" max="600" step="1" value={minutes} onChange={(event) => setMinutes(event.target.value)} required /></label><label>Intensidad<select value={intensity} onChange={(event) => setIntensity(event.target.value as NewActivity['intensity'])}><option value="suave">Suave</option><option value="moderada">Moderada</option><option value="intensa">Intensa</option></select></label></div>
      <label>Nota opcional<textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={3} /></label>
      {error && <p role="alert">{error}</p>}
      <div className="figma-calendar-activity-actions"><button type="button" onClick={onClose} disabled={busy}>Cancelar</button><button type="submit" disabled={busy || !onSave}>{busy ? 'Guardando…' : 'Guardar actividad'}</button></div>
    </form>
  </div>;
}

const eventColor: Record<CalendarKind, string> = { plan: '#c2e66e', meal: '#dff9a2', activity: '#ffcb65', consult: '#ffa257' };
export function FigmaCalendarCell({ index, nodeId, className, assetPathPrefix }: { index: number; nodeId?: string; className: string; assetPathPrefix: string }) {
  const calendar = useFigmaCalendar();
  const cell = calendar.cells[index];
  if (!cell) return null;
  const items = calendar.events.filter((event) => event.dateId === cell.dateId);
  return <div className={className} data-node-id={nodeId} data-name="Cell-Calendar-Body" style={{ backgroundColor: cell.inMonth ? '#fff' : '#f6f6f7', flexGrow: calendar.view === 'day' ? 7 : undefined }} role="button" tabIndex={0} aria-label={cell.date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })} aria-pressed={calendar.selectedDateId === cell.dateId} onClick={() => calendar.selectDate(cell.dateId)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); calendar.selectDate(cell.dateId); } }}>
    {!cell.inMonth && <div className="absolute inset-[-6.74%_calc(-87.5%-1.87px)_-6.74%_calc(-86.46%-0.86px)]" data-name="Vector"><div className="absolute inset-[-0.24%_-0.11%]"><img alt="" className="block max-w-none size-full" src={`${assetPathPrefix}/7d323.svg`} /></div></div>}
    <div className="content-stretch flex items-center justify-center p-[2px] relative rounded-[4px] shrink-0 w-[18px]" data-name="Day" style={{ backgroundColor: calendar.selectedDateId === cell.dateId ? '#c2e66e' : undefined }}><p className={`[word-break:break-word] font-['Poppins:Regular'] leading-[1.35] relative text-[10px] whitespace-nowrap ${cell.inMonth ? 'text-[#272932]' : 'text-[#bebfc2]'}`}>{cell.day}</p></div>
    {items.length > 0 && <div className="content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-start min-h-px relative w-full" data-name="Schedules">{items.slice(0, 2).map((item) => <button key={item.id} type="button" className="border-0 content-stretch cursor-pointer flex flex-col items-start p-[6px] relative rounded-[4px] w-full text-left" data-name="Schedule" style={{ backgroundColor: eventColor[item.kind] }} onClick={(event) => { event.stopPropagation(); calendar.selectEvent(item); }} onKeyDown={(event) => event.stopPropagation()}><span className="font-['Poppins:Regular'] leading-[1.3] text-[8px] text-[#272932] w-full truncate">{item.title}</span><span className="font-['Poppins:Regular'] leading-[1.3] text-[8px] text-[#52545b] w-full truncate">{item.subtitle}</span></button>)}{items.length > 2 && <span className="text-[8px] text-[#52545b]">+{items.length - 2} más</span>}</div>}
  </div>;
}

export function FigmaCalendarExtraRow({ assetPathPrefix }: { assetPathPrefix: string }) {
  const calendar = useFigmaCalendar();
  if (calendar.cells.length <= 35) return null;
  return <div className="content-stretch flex h-[120px] items-start overflow-clip relative shrink-0 w-full" data-name="Row-Calendar-Body">{Array.from({ length: 7 }, (_, index) => <FigmaCalendarCell key={index} index={35 + index} assetPathPrefix={assetPathPrefix} className="bg-white border-[#e1e1e2] border-r border-solid content-stretch flex flex-[1_0_0] flex-col gap-[2px] h-full items-start min-w-px overflow-clip p-[4px] relative" />)}</div>;
}

export function FigmaCalendarDetails() {
  const calendar = useFigmaCalendar();
  const items = calendar.selectedEvents;
  return <>{!calendar.planLoaded && <div className="figma-calendar-plan-notice" role="status">Cargando plan de comidas…</div>}{calendar.planError && <div className="figma-calendar-plan-notice" role="alert"><span>No pudimos cargar el plan publicado. Se muestran las indicaciones ya disponibles.</span><button type="button" onClick={calendar.retryPlan}>Reintentar</button></div>}{!items.length ? <div className="bg-[#f9f4f2] content-stretch flex flex-col gap-[8px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full" role="status"><strong className="text-[12px] text-[#272932]">{calendar.selectedLabel}</strong><p className="text-[11px] text-[#8a8c90]">Sin actividades para esta fecha.</p></div> : items.map((item) => <div key={item.id} className="bg-[#f9f4f2] content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-w-px p-[16px] relative rounded-[16px] shrink-0 w-full" data-name="Schedule Details"><span className="rounded-[6px] px-[8px] py-[4px] text-[10px] text-[#272932]" style={{ backgroundColor: eventColor[item.kind] }}>{item.kind === 'consult' ? 'Cita' : item.kind === 'activity' ? 'Actividad física' : item.kind === 'meal' ? 'Diario' : 'Plan de comidas'}</span><strong className="font-['Poppins:SemiBold'] text-[14px] leading-[1.3] text-[#272932]">{item.title}</strong><div className="w-full text-[11px] text-[#52545b]"><p>{calendar.selectedLabel}</p><p>{item.subtitle}</p></div>{item.kind === 'consult' && <FigmaCalendarAppointmentActions />}<button type="button" className="border-0 cursor-pointer self-end rounded-[8px] bg-[#c2e66e] px-[12px] py-[6px] text-[11px] text-[#272932]" onClick={() => calendar.openEvent(item)}>{item.kind === 'consult' ? 'Escribir a la nutricionista' : `Abrir ${item.kind === 'activity' ? 'ejercicio' : item.kind === 'meal' ? 'diario' : 'plan'}`}</button></div>)}</>;
}

const WEEK_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
export function FigmaCalendarAppointmentActions() {
  const calendar = useFigmaCalendar();
  const [rescheduling, setRescheduling] = useState(false);
  const [schedule, setSchedule] = useState(() => parseAppointmentWhen(calendar.appointment?.when));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!calendar.appointment || (!calendar.onConfirmAppointment && !calendar.onRescheduleAppointment)) return null;
  const confirmation = calendar.appointment.confirmation;
  const meetUrl = secureMeetUrl(calendar.appointment.meet_url);
  const respond = async (reply: 'attending' | 'needs_change') => {
    if (!calendar.onConfirmAppointment) return;
    setBusy(true); setError('');
    try {
      await calendar.onConfirmAppointment(reply);
      if (reply === 'needs_change') setRescheduling(true);
    } catch (cause) { setError(apiErrorMessage(cause, 'No pudimos guardar tu respuesta. Probá de nuevo.')); }
    finally { setBusy(false); }
  };
  const saveSchedule = async () => {
    if (!calendar.onRescheduleAppointment) return;
    setBusy(true); setError('');
    try { await calendar.onRescheduleAppointment(schedule.day, schedule.time); setRescheduling(false); }
    catch (cause) { setError(apiErrorMessage(cause, 'No pudimos reprogramar la consulta. Probá de nuevo.')); }
    finally { setBusy(false); }
  };
  return <div className="figma-calendar-appointment-actions">
    <p>{confirmation === 'attending' ? 'Asistencia confirmada' : confirmation === 'needs_change' ? 'Solicitaste un cambio de horario' : 'Confirmación pendiente'}</p>
    <p>{calendar.appointment.when} · {calendar.appointment.duration} min</p>
    {meetUrl && <a href={meetUrl} target="_blank" rel="noopener noreferrer">Abrir videollamada</a>}
    {error && <p role="alert">{error}</p>}
    {!rescheduling && <div className="figma-calendar-appointment-buttons">
      {confirmation !== 'attending' && <button type="button" disabled={busy || !calendar.onConfirmAppointment} onClick={() => void respond('attending')}>Confirmar asistencia</button>}
      {confirmation === null && <button type="button" disabled={busy || !calendar.onConfirmAppointment} onClick={() => void respond('needs_change')}>Solicitar cambio</button>}
      <button type="button" disabled={busy || !calendar.onRescheduleAppointment} onClick={() => setRescheduling(true)}>Reprogramar horario</button>
    </div>}
    {rescheduling && <form onSubmit={(event) => { event.preventDefault(); void saveSchedule(); }}>
      <p>Se conserva la duración y la modalidad publicadas.</p>
      <label>Día<select aria-label="Nuevo día de la consulta" value={schedule.day} onChange={(event) => setSchedule((value) => ({ ...value, day: event.target.value }))}>{WEEK_DAYS.map((day) => <option key={day}>{day}</option>)}</select></label>
      <label>Hora<input aria-label="Nueva hora de la consulta" type="time" value={schedule.time} onChange={(event) => setSchedule((value) => ({ ...value, time: event.target.value }))} /></label>
      <div className="figma-calendar-appointment-buttons"><button type="submit" disabled={busy || !calendar.onRescheduleAppointment}>{busy ? 'Guardando…' : 'Confirmar horario'}</button><button type="button" onClick={() => setRescheduling(false)}>Volver</button></div>
    </form>}
  </div>;
}
