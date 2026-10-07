import { useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { FramePair } from '../FramePair';
import { nodeName, sourceText, type SourceBinding, type SourceNode, type SourceResolver } from '../SourceView';
import { api } from '../../../api/client';
import { plansApi } from '../../../api/plans';
import { useAppStore } from '../../../store/useAppStore';
import { canLeaveWorkspace } from '../../../components/nutrigo/unsaved-changes';
import { descendants, EmptyState, errorText, idEnds, leaf, objects, RecordDialog, safeUrl, source, Stateful, useRemote, type ScreenProps } from './shared';
import { agendaDateId as dateId, agendaWeekdays as weekdays, buildAgendaEvents, monthAnchor, wallDate, wallDateId, type AgendaEvent as Event } from './agenda-data';
export { nextConsultation } from './agenda-data';

type Props = ScreenProps & { onConfirm?: (reply: 'attending' | 'needs_change') => Promise<void> | void; onReschedule?: (day: string, time: string) => Promise<void> | void };
type View = 'month' | 'week' | 'day';
const kindLabel = { plan: 'Plan', meal: 'Diario', activity: 'Actividad', consult: 'Consulta' };
const eventColor = { plan: '#c2e66e', meal: '#dff9a2', activity: '#ffcb65', consult: '#ffa257' };
const kindOrder: Event['kind'][] = ['consult', 'plan', 'meal', 'activity'];
const viewLabel: Record<View, string> = { month: 'Mes', week: 'Semana', day: 'Día' };
/** El panel de detalle muestra dos tarjetas por página, como el archivo. */
const DETAIL_PAGE = 2;
/** En la vista mensual cada celda mide 120 y entra un máximo de dos eventos, como el archivo. */
const CELL_EVENTS = 2;

const capitalize = (value: string) => value.replace(/^./, letter => letter.toLocaleUpperCase('es'));
const fullDate = (id: string) => capitalize(wallDate(id).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }));
const oneLine = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } as const;
const has = (node: SourceNode, name: string) => descendants(node).some(child => nodeName(child) === name);
const sample = (node: SourceNode, ...texts: string[]) => leaf(node) && texts.includes(sourceText(node));
const startsWith = (node: SourceNode, ...texts: string[]) => leaf(node) && texts.some(text => sourceText(node).startsWith(text));

export function NutrigoAgenda({ patient, now = new Date(), onNavigate, onSignOut, onConfirm, onReschedule }: Props) {
  const plan = useRemote(`${patient.id}:agenda-plan`, signal => plansApi.published(patient.id, signal));
  const today = dateId(now);
  const [month, setMonth] = useState(() => monthAnchor(wallDate(today))); const [selected, setSelected] = useState(today); const [view, setView] = useState<View>('month'); const [hidden, setHidden] = useState<Set<Event['kind']>>(new Set());
  const [detail, setDetail] = useState({ day: today, page: 0 }); const page = detail.day === selected ? detail.page : 0;
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [status, setStatus] = useState(''); const lock = useRef(false); const refresh = useAppStore(state => state.refreshPatient);
  const picker = useRef<HTMLInputElement | null>(null);
  const [changing, setChanging] = useState(false); const [proposedDay, setProposedDay] = useState(() => patient.appointment?.when.split(' · ')[0] || 'Lunes'); const [proposedTime, setProposedTime] = useState(() => patient.appointment?.when.split(' · ')[1] || '15:00');
  const closeReschedule = () => { if (canLeaveWorkspace()) setChanging(false); };
  const openReschedule = () => { setError(''); setChanging(true); };
  const rescheduleDirty = proposedDay !== (patient.appointment?.when.split(' · ')[0] || 'Lunes') || proposedTime !== (patient.appointment?.when.split(' · ')[1] || '15:00');
  const all = useMemo(() => buildAgendaEvents(patient, plan.data?.plan ?? null, now), [patient, plan.data, now]);
  const events = all.filter(item => !hidden.has(item.kind));
  const selectedEvents = events.filter(item => item.day === selected).sort((a, b) => kindOrder.indexOf(a.kind) - kindOrder.indexOf(b.kind) || a.time.localeCompare(b.time));
  const pages = Math.max(1, Math.ceil(selectedEvents.length / DETAIL_PAGE)); const shownPage = Math.min(page, pages - 1);
  const toggle = (kind: Event['kind']) => setHidden(previous => { const next = new Set(previous); if (next.has(kind)) next.delete(kind); else next.add(kind); return next; });
  const reply = async (value: 'attending' | 'needs_change') => { if (lock.current) return; lock.current = true; setBusy(true); setError(''); setStatus(''); try { if (onConfirm) await onConfirm(value); else { await api.confirmAppointment(patient.id, value); await refresh(patient.id); } setStatus(value === 'attending' ? 'Asistencia confirmada.' : 'Cambio de horario solicitado.'); if (value === 'needs_change') setChanging(false); } catch (caught) { setError(errorText(caught)); } finally { lock.current = false; setBusy(false); } };
  const reschedule = async (event: FormEvent) => { event.preventDefault(); if (lock.current) return; lock.current = true; setBusy(true); setError(''); setStatus(''); try { if (onReschedule) await onReschedule(proposedDay, proposedTime); else { await api.rescheduleAppointment(patient.id, { day: proposedDay, time: proposedTime }); await refresh(patient.id); } setChanging(false); setStatus('Nuevo horario guardado.'); } catch (caught) { setError(errorText(caught)); } finally { lock.current = false; setBusy(false); } };
  const move = (delta: number) => { if (view === 'month') setMonth(current => new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + delta, 1, 12))); else { const next = wallDate(selected); next.setUTCDate(next.getUTCDate() + delta * (view === 'week' ? 7 : 1)); setSelected(wallDateId(next)); setMonth(monthAnchor(next)); } };
  const openPicker = () => { const input = picker.current; if (!input) return; try { input.showPicker(); } catch { input.focus(); } };
  const monthName = capitalize(month.toLocaleDateString('es-AR', { month: 'long', timeZone: 'UTC' }));
  const appointment = patient.appointment;
  const meetUrl = appointment?.channel === 'video' ? safeUrl(appointment.meet_url) : null;
  // El botón verde del encabezado ("New Schedule") abre el cambio de horario si hay turno; si no, el chat para pedirlo.
  const schedule: SourceBinding = appointment ? { onClick: openReschedule, label: 'Cambiar horario de mi consulta' } : { onClick: () => onNavigate('mensajes'), label: 'Pedir un turno a mi nutricionista' };

  /** Bloque de evento de la celda: mismo nodo del archivo, con color, hora y título reales. */
  const scheduleResolver = (node: SourceNode, item: Event, compact: boolean, grow: boolean): SourceResolver => child => {
    if (child === node) return { props: { title: `${item.time} · ${item.title}`, style: { background: eventColor[item.kind], overflow: 'hidden', ...(grow ? {} : { flex: '0 0 auto' }) } } };
    if (child.tag === 'ul') return { tag: 'p', props: { className: 'leading-[1.3] relative shrink-0 text-[#272932] w-full' }, text: item.title };
    if (leaf(child) && /\d{1,2}:\d{2} (AM|PM)/.test(sourceText(child))) return { text: item.time, props: { style: oneLine } };
    if (leaf(child)) return { text: item.title, props: compact ? { style: oneLine } : undefined };
    return undefined;
  };

  const cell = (prototypes: Record<'out' | 'empty' | 'one' | 'many', SourceNode | undefined>, day: Date, column: number) => {
    const id = wallDateId(day); const inMonth = view !== 'month' || day.getUTCMonth() === month.getUTCMonth();
    const own = events.filter(item => item.day === id).sort((a, b) => kindOrder.indexOf(a.kind) - kindOrder.indexOf(b.kind) || a.time.localeCompare(b.time));
    const limit = view === 'month' ? CELL_EVENTS : own.length;
    const prototype = (!inMonth ? prototypes.out : own.length === 0 ? prototypes.empty : own.length === 1 ? prototypes.one : prototypes.many) ?? prototypes.empty;
    if (!prototype) return null;
    const isToday = id === today; const isSelected = id === selected;
    const single = own.length === 1 && inMonth ? descendants(prototype).find(child => nodeName(child) === 'Schedule') : undefined;
    const inside = new Set(single ? descendants(single) : []);
    return source(prototype, child => {
      if (single && inside.has(child)) return scheduleResolver(single, own[0], false, view === 'month')(child);
      if (child === prototype) return { tag: 'button', onClick: () => setSelected(id), label: `${fullDate(id)}, ${own.length} ${own.length === 1 ? 'evento' : 'eventos'}`, props: { 'aria-pressed': isSelected, 'data-calendar-date': id, style: { textAlign: 'left', ...(inMonth ? { background: '#ffffff' } : {}), boxShadow: isSelected ? 'inset 0 0 0 2px #c2e66e' : undefined, borderRightWidth: column === 6 ? 0 : undefined, ...(view === 'month' ? {} : { height: 'auto', alignSelf: 'stretch' }) } } };
      if (nodeName(child) === 'Day') return { props: { style: { background: isToday ? '#c2e66e' : own.length > 1 ? '#dff9a2' : undefined, borderRadius: 4 } } };
      if (leaf(child) && /^\d+$/.test(sourceText(child))) return { text: day.getUTCDate() };
      if (nodeName(child) === 'Schedules') {
        const slots = objects(child);
        const shown = own.slice(0, limit);
        return { props: view === 'month' ? undefined : { style: { flex: '0 0 auto' } }, children: <>{shown.map((item, index) => { const slot = slots[index % slots.length]; return source(slot, scheduleResolver(slot, item, true, view === 'month'), item.id); })}{own.length > limit && <span className="relative shrink-0 font-['Poppins:Regular'] text-[8px] leading-[1.3] text-[#52545b]">+{own.length - limit} más</span>}</> };
      }
      return undefined;
    }, id);
  };

  /** Tarjetas del detalle del día: las dos del archivo repetidas en ciclo, con los botones del propio archivo. */
  const detailCards = (container: SourceNode): ReactNode => {
    const cards = objects(container).filter(child => /^Schedule \d$/.test(nodeName(child)));
    if (!cards.length) return null;
    const firstButton = descendants(cards[0]).find(child => nodeName(child) === 'Button CTA');
    const pageButton = (label: string, delta: number) => {
      const disabled = shownPage + delta < 0 || shownPage + delta >= pages;
      return firstButton ? source(firstButton, child => child === firstButton ? { onClick: () => setDetail({ day: selected, page: shownPage + delta }), label: `${label} eventos del día`, props: { disabled, style: { opacity: disabled ? 0.5 : 1 } } } : leaf(child) ? { text: label } : undefined, label) : null;
    };
    const visible = selectedEvents.slice(shownPage * DETAIL_PAGE, shownPage * DETAIL_PAGE + DETAIL_PAGE);
    return <>
      {visible.length ? visible.map((item, index) => {
        const card = cards[(shownPage * DETAIL_PAGE + index) % cards.length];
        const editButton = descendants(card).find(child => nodeName(child) === 'Button CTA');
        const bind: SourceResolver = child => {
          if (child === card) return { tag: 'article', props: { 'aria-label': `${kindLabel[item.kind]}: ${item.title}` } };
          if (nodeName(child) === 'Badge Category') return { props: { style: { background: eventColor[item.kind] } } };
          if (sample(child, 'Physical Activities', 'Appointments')) return { text: kindLabel[item.kind] };
          if (startsWith(child, 'Morning Yoga', 'General Health')) return { text: item.title };
          if (startsWith(child, 'Tuesday,')) return { text: fullDate(item.day) };
          if (leaf(child) && /^\d{1,2}:\d{2} (AM|PM)$/.test(sourceText(child))) return { text: item.time || 'Sin horario' };
          if (startsWith(child, 'Sunrise Yoga', 'Central Health')) return { text: item.kind === 'consult' ? (appointment?.channel === 'video' ? 'Videollamada' : 'Consultorio de tu nutricionista') : item.kind === 'plan' ? 'Plan de comidas publicado' : item.kind === 'meal' ? 'Registrado en tu diario' : 'Actividad registrada' };
          if (startsWith(child, 'Focus on', 'Annual check-up')) return { text: item.detail || 'Sin indicaciones adicionales.' };
          if (nodeName(child) === 'Details' && child.props.className && /h-\[108px\]/.test(String(child.props.className))) return { props: { style: { height: 'auto', minHeight: 108 } } };
          if (nodeName(child) === 'Action' && !(item.kind === 'consult' && meetUrl && editButton)) return { props: { style: { flexWrap: 'wrap' } } };
          if (nodeName(child) === 'Action' && editButton) return { props: { style: { flexWrap: 'wrap' } }, children: <>{source(editButton, node => node === editButton ? { tag: 'a', props: { href: meetUrl, target: '_blank', rel: 'noopener noreferrer' } } : leaf(node) ? { text: 'Entrar a videollamada' } : undefined, 'video')}{objects(child).map((button, position) => source(button, bind, position))}</> };
          if (nodeName(child) === 'Button CTA') {
            const secondary = sourceText(child) === 'Edit';
            if (item.kind === 'consult') return secondary ? { onClick: openReschedule, label: 'Cambiar horario de la consulta', props: { disabled: busy } } : { onClick: () => void reply('attending'), label: 'Confirmar asistencia a la consulta', props: { disabled: busy || appointment?.patient_reply === 'attending' } };
            return secondary ? { onClick: () => onNavigate('mensajes'), label: `Consultar sobre ${item.title}` } : { onClick: () => onNavigate(item.kind === 'activity' ? 'ejercicio' : item.kind === 'meal' ? 'diario' : 'plan'), label: `Ver ${item.title} en ${kindLabel[item.kind].toLocaleLowerCase('es')}` };
          }
          if (sample(child, 'Edit')) return { text: item.kind === 'consult' ? 'Cambiar' : 'Consultar' };
          if (sample(child, 'Remove')) return { text: item.kind === 'consult' ? (appointment?.patient_reply === 'attending' ? 'Confirmada' : 'Confirmar') : `Ver ${kindLabel[item.kind].toLocaleLowerCase('es')}` };
          return undefined;
        };
        return source(card, bind, item.id);
      }) : <EmptyState text={`${fullDate(selected)}: sin eventos.`} />}
      {pages > 1 && <div className="flex w-full items-center justify-between gap-[8px]"><p className="font-['Poppins:Regular'] text-[12px] leading-[1.3] text-[#8a8c90]">{shownPage * DETAIL_PAGE + 1}–{Math.min(selectedEvents.length, (shownPage + 1) * DETAIL_PAGE)} de {selectedEvents.length} eventos</p><div className="flex gap-[8px]">{pageButton('Anteriores', -1)}{pageButton('Siguientes', 1)}</div></div>}
      <p className="w-full font-['Poppins:Regular'] text-[11px] leading-[1.4] text-[#8a8c90]">Fechas y horas de Argentina. Las comidas siguen las fechas del plan publicado.</p>
    </>;
  };

  const category = (node: SourceNode, kind: Event['kind'], label?: string): SourceBinding => ({
    onClick: () => toggle(kind), label: `Mostrar ${kindLabel[kind].toLocaleLowerCase('es')}`,
    props: { 'aria-pressed': !hidden.has(kind), style: { opacity: hidden.has(kind) ? 0.5 : 1 } },
    ...(label ? { children: objects(node).map((child, index) => source(child, part => {
      // Diario no existe en el archivo: misma casilla de 16 con el Green-Light del pack.
      if (nodeName(part) === 'Checkbox') return { children: <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center rounded-[4px]" style={{ background: eventColor.meal }}><svg viewBox="0 0 16 16" width="12" height="12"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="#272932" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg></span> };
      if (leaf(part)) return { text: label };
      return undefined;
    }, index)) } : {}),
  });

  const resolver: SourceResolver = node => {
    const name = nodeName(node); const text = sourceText(node);
    if (name === 'Category List') {
      const first = objects(node).find(child => nodeName(child) === 'Category');
      return { props: { style: { flexWrap: 'wrap', rowGap: 8 } }, children: <>{objects(node).map((child, index) => source(child, resolver, index))}{first && source(first, child => child === first ? category(first, 'meal', 'Diario') : undefined, 'meal')}</> };
    }
    if (name === 'Category' && node.tag !== 'p' && ['Meal Planning', 'Physical Activities', 'Appointments/Events'].includes(text) && has(node, 'Checkbox')) return category(node, text === 'Meal Planning' ? 'plan' : text === 'Physical Activities' ? 'activity' : 'consult');
    if (name === 'Calendar' && has(node, 'Row-Calendar-Body')) {
      const parts = objects(node); const rows = parts.filter(child => nodeName(child) === 'Row-Calendar-Body'); const row = rows[0];
      const head = parts.find(child => nodeName(child) === 'Row-Calendar-Head');
      const cells = rows.flatMap(objects);
      const prototypes = {
        out: cells.find(child => has(child, 'Vector')),
        empty: cells.find(child => !has(child, 'Vector') && !has(child, 'Schedule') && nodeName(child) === 'Cell-Calendar-Body'),
        one: cells.find(child => has(child, 'Schedule') && !has(child, 'Schedules')),
        many: cells.find(child => has(child, 'Schedules')),
      };
      if (!row || !prototypes.empty) return { children: <Stateful empty="No se pudo cargar el calendario." /> };
      const start = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1 - month.getUTCDay(), 12)); let count = Math.ceil((month.getUTCDay() + new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)).getUTCDate()) / 7) * 7;
      if (view === 'week') { const at = wallDate(selected); start.setTime(at.getTime()); start.setUTCDate(at.getUTCDate() - at.getUTCDay()); count = 7; }
      if (view === 'day') { start.setTime(wallDate(selected).getTime()); count = 1; }
      const headCells = head ? objects(head) : [];
      return { children: <>
        {parts.filter(child => !['Row-Calendar-Body', 'Row-Calendar-Head'].includes(nodeName(child))).map((child, index) => source(child, resolver, `part-${index}`))}
        {head && source(head, child => child === head && view === 'day' ? { children: headCells[start.getUTCDay()] ? source(headCells[start.getUTCDay()], () => undefined, 'day') : null } : undefined, 'head')}
        {Array.from({ length: Math.ceil(count / 7) }, (_, week) => source(row, child => child === row ? { props: view === 'month' ? undefined : { style: { height: 'auto', minHeight: 120 } }, children: Array.from({ length: Math.min(7, count - week * 7) }, (_, index) => { const day = new Date(start); day.setUTCDate(start.getUTCDate() + week * 7 + index); return cell(prototypes, day, view === 'day' ? 6 : index); }) } : undefined, week))}
      </> };
    }
    if (name === 'Right Side' && objects(node).some(child => /^Schedule \d$/.test(nodeName(child)))) return { children: <>{objects(node).filter(child => !/^Schedule \d$/.test(nodeName(child))).map((child, index) => source(child, resolver, index))}{detailCards(node)}</> };
    if (name === 'List Schedule') return { children: detailCards(node) };
    // La "X"/"…" del detalle vuelve al día de hoy.
    if (name === 'Button More' && idEnds(node, '2:4233')) return { onClick: () => { setSelected(today); setMonth(monthAnchor(wallDate(today))); }, label: 'Volver al día de hoy' };
    if (name === 'Button More' && idEnds(node, '433:18171')) return schedule;
    if (name === 'Card Statistic - Calendar' || (name === '' && /^(Total Meal Planning Schedule|Meal Planning)/.test(text) && text.endsWith('agendas'))) {
      const kind = /Physical/.test(text) ? 'activity' : /Appointments/.test(text) ? 'consult' : 'plan'; const total = all.filter(item => item.kind === kind).length;
      return { children: objects(node).map((child, index) => source(child, part => leaf(part) && /^\d+$/.test(sourceText(part)) ? { text: total } : sample(part, 'agendas') ? { text: total === 1 ? 'evento' : 'eventos' } : sample(part, 'Meal Planning') ? { text: 'Plan' } : sample(part, 'Physical Activities') ? { text: 'Actividad' } : sample(part, 'Appointments/Events') ? { text: 'Consultas' } : undefined, index)) };
    }
    if (name === 'Left Section' && has(node, 'Div Title')) return { props: { style: { position: 'relative' } }, children: <>{objects(node).map((child, index) => source(child, resolver, index))}<input ref={picker} tabIndex={-1} aria-hidden="true" type="month" value={`${month.getUTCFullYear()}-${String(month.getUTCMonth() + 1).padStart(2, '0')}`} onChange={event => { const [year, value] = event.target.value.split('-').map(Number); if (year && value) setMonth(new Date(Date.UTC(year, value - 1, 1, 12))); }} className="pointer-events-none absolute bottom-0 right-0 h-px w-px opacity-0" /></> };
    if (name === 'Div Title' && /September 2028/.test(text)) return { onClick: openPicker, label: `Elegir mes: ${monthName} de ${month.getUTCFullYear()}`, children: objects(node).map((child, index) => source(child, part => sample(part, 'September') ? { text: monthName } : sample(part, '2028') ? { text: String(month.getUTCFullYear()) } : undefined, index)) };
    if (name === 'Buttons' && objects(node).length === 2) return { children: objects(node).map((button, index) => source(button, child => child === button ? { onClick: () => move(index ? 1 : -1), label: index ? 'Período siguiente' : 'Período anterior' } : undefined, index)) };
    if (name === 'Button Picker' && ['Day', 'Week', 'Month'].includes(text)) { const value: View = text === 'Day' ? 'day' : text === 'Week' ? 'week' : 'month'; return { onClick: () => setView(value), props: { 'aria-pressed': view === value, style: { background: view === value ? '#c2e66e' : '#ffffff' } }, label: value === 'day' ? 'Vista del día' : value === 'week' ? 'Vista semanal' : 'Vista mensual' }; }
    // En el celular el archivo usa un desplegable "Month": alterna entre las tres vistas.
    if (name === 'Button CTA' && text === 'Month') return { onClick: () => setView(current => current === 'month' ? 'week' : current === 'week' ? 'day' : 'month'), label: `Cambiar vista (ahora: ${viewLabel[view].toLocaleLowerCase('es')})`, children: objects(node).map((child, index) => source(child, part => sample(part, 'Month') ? { text: viewLabel[view] } : undefined, index)) };
    if (name === 'Button CTA' && text === 'New Schedule') return { ...schedule, children: objects(node).map((child, index) => source(child, part => sample(part, 'New Schedule') ? { text: appointment ? 'Cambiar mi consulta' : 'Pedir un turno' } : undefined, index)) };
    return undefined;
  };
  return <FramePair nodes={['84:1666', '433:17250']} resolve={resolver} patientName={patient.name} onNavigate={onNavigate} onSignOut={onSignOut}>
    {(!plan.data || plan.error) && <Stateful loading={!plan.data && !plan.error} error={plan.error || undefined} onRetry={plan.reload} />}
    {error && !changing && <Stateful error={error} />}{status && <p role="status" className="p-[16px] text-[#272932]">{status}</p>}
    {changing && <RecordDialog title="Cambiar horario de mi consulta" onClose={closeReschedule} busy={busy} dirty={rescheduleDirty}><form onSubmit={event => void reschedule(event)} className="flex w-full max-w-[420px] flex-col gap-[16px] rounded-[16px] bg-white p-[24px]"><h2 className="text-[22px] font-medium">Cambiar horario</h2><label>Día<select value={proposedDay} onChange={event => setProposedDay(event.target.value)} className="mt-[4px] w-full rounded-[8px] border border-[#e1e1e2] p-[10px]">{weekdays.map(day => <option key={day}>{day}</option>)}</select></label><label>Hora<input required type="time" value={proposedTime} onChange={event => setProposedTime(event.target.value)} className="mt-[4px] w-full rounded-[8px] border border-[#e1e1e2] p-[10px]" /></label>{error && <Stateful error={error} />}<div className="flex flex-wrap gap-[8px]"><button type="submit" disabled={busy} className="rounded-[8px] bg-[#c2e66e] px-[16px] py-[10px] text-[#272932]">{busy ? 'Guardando…' : 'Guardar horario'}</button><button type="button" disabled={busy} onClick={() => void reply('needs_change')} className="rounded-[8px] border border-[#e1e1e2] px-[16px] py-[10px]">Sólo avisar que necesito otro horario</button><button type="button" disabled={busy} onClick={closeReschedule} className="rounded-[8px] border border-[#e1e1e2] px-[16px] py-[10px]">Cancelar</button></div></form></RecordDialog>}
  </FramePair>;
}
