import { useEffect, useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import type { Patient } from '../../types';
import type { SchedulingBooking, SchedulingSettings } from '../../types/scheduling';
import { agendaDay, argentinaStamp, bookingHref, buildPanelAgendaEvents, dayHeading, depositMode, formatMinutes, hourWindow, monthGrid, monthLabel, nowFraction, shiftDay, weekDays, weekLabel, withHalfDeposit, type AgendaView, type PanelAgendaEvent } from '../../lib/panel-agenda';
import { Icon } from '../shared/Icon';
import { GoogleReviewControl } from './GoogleReviewControl';
import { PanelConnections, type ConnectionKey } from './PanelConnections';
import { useUnsavedChanges } from './unsaved-changes';
import { usePanelScheduling } from './use-panel-scheduling';
import './panel-fase5.css';

const TONE_LABEL: Record<PanelAgendaEvent['tone'], string> = { primera: 'Primera', seguimiento: 'Seguimiento', online: 'Online', pendiente: 'Por confirmar', bloqueo: 'Bloqueado' };

export function PanelAgendaView({ title, subtitle, view, days, today, now, events, pending, types, page, connections, status, busy, loading, error, focus, onView, onShift, onToday, onManage, onCopy, onConnect, onConfirm, onCancel, onReschedule, onBlock, onRetry, patients, editor, transfers = [], bookings = [], moreBookings = false, morePatients = false, onReviewTransfer, onSync, onReconcile, onMoreBookings, onMorePatients, onDisconnect }: {
  title: string; subtitle: string; view: AgendaView; days: string[]; today: string; now: Date; events: PanelAgendaEvent[];
  pending: SchedulingBooking[]; types: SchedulingSettings['types']; page?: SchedulingSettings['page'];
  connections: Record<ConnectionKey, boolean>; status: string; busy: boolean; loading: boolean; error: string; focus: string | null;
  onView: (view: AgendaView) => void; onShift: (delta: number) => void; onToday: () => void; onManage: () => void; onCopy: () => void;
  onConnect: (key: ConnectionKey) => void; onConfirm: (booking: SchedulingBooking, patientId: string) => void; onCancel: (booking: SchedulingBooking) => void;
  onReschedule: (booking: SchedulingBooking, startsAt: string) => void; onBlock: () => void; onRetry: () => void; patients: Array<{ id: string; name: string }>; editor?: ReactNode;
  transfers?: Array<{ id: string; amount_minor: number; reference: string }>; bookings?: SchedulingBooking[]; moreBookings?: boolean; morePatients?: boolean;
  onReviewTransfer?: (id: string, decision: 'confirm' | 'reject') => void; onSync?: (id: string) => void; onReconcile?: (id: string) => void; onMoreBookings?: () => void; onMorePatients?: () => void; onDisconnect?: (key: 'google' | 'mercadopago') => void;
}) {
  const windowHours = hourWindow(events.filter(event => days.includes(event.day)));
  const rows = windowHours.end - windowHours.start;
  return <section className="p5" aria-label="Agenda">
    <header className="p5-head">
      <div><h2>{title}</h2><p>{subtitle}</p></div>
      <div className="p5-seg" role="group" aria-label="Vista de la agenda">{(['dia', 'semana', 'mes'] as const).map(item => <button type="button" key={item} aria-pressed={view === item} onClick={() => onView(item)}>{item === 'dia' ? 'Día' : item === 'semana' ? 'Semana' : 'Mes'}</button>)}</div>
      <button type="button" className="p5-btn" onClick={onBlock} disabled={busy || loading}><Icon name="calendar" size={15} />Bloquear horario</button>
      <button type="button" className="p5-btn p5-pri" onClick={onManage}><Icon name="plus" size={15} />Nueva consulta</button>
    </header>
    {error && <p className="p5-alert" role="alert">{error} <button type="button" onClick={onRetry}>Reintentar</button></p>}
    {status && <p className="p5-status" role="status">{status}</p>}
    <div className="p5-split">
      <section className="p5-card p5-cal-card" aria-label={view === 'mes' ? 'Mes' : 'Semana'}>
        <div className="p5-cal-nav">
          <button type="button" className="p5-btn p5-back" aria-label="Período anterior" onClick={() => onShift(-1)}><Icon name="chevron" size={14} /></button>
          <button type="button" className="p5-btn" onClick={onToday}>Hoy</button>
          <button type="button" className="p5-btn" aria-label="Semana siguiente" onClick={() => onShift(1)}><Icon name="chevron" size={14} /></button>
          <b>{view === 'mes' ? monthLabel(today) : monthLabel(days[0] ?? today)}</b>
          <span className="p5-legend"><i className="p5-swatch p5-primera" />Primera <i className="p5-swatch p5-seguimiento" />Seguimiento <i className="p5-swatch p5-online" />Online <i className="p5-swatch p5-pendiente" />Por confirmar</span>
        </div>
        {loading ? <p className="p5-empty">Cargando la agenda…</p> : view === 'mes' ? <Month events={events} anchor={today} now={today} /> : <>
          <div className="p5-week" style={{ '--p5-rows': rows, '--p5-days': days.length } as CSSProperties}>
            <span style={{ gridColumn: 1, gridRow: 1 }} />
            {days.map((day, index) => { const head = dayHeading(day); return <div className={day === today ? 'p5-today' : ''} style={{ gridColumn: index + 2, gridRow: 1 }} key={day}>{head.name}<b>{head.number}</b></div>; })}
            {Array.from({ length: rows }, (_, index) => <div className="p5-hour" style={{ gridColumn: 1, gridRow: index + 2 }} key={index}>{String(windowHours.start + index).padStart(2, '0')}:00</div>)}
            {days.map((day, index) => <div className="p5-col" style={{ gridColumn: index + 2, gridRow: `2 / span ${rows}` }} key={day}>
              {events.filter(event => event.day === day).map(event => <EventBlock event={event} start={windowHours.start} rows={rows} key={event.id} />)}
              {nowFraction(now, day, windowHours.start, windowHours.end) != null && <span className="p5-now" style={{ top: `${(nowFraction(now, day, windowHours.start, windowHours.end) ?? 0) * 100}%` }} aria-hidden="true" />}
            </div>)}
          </div>
          <DayList days={days} events={events} />
          {!events.length && <p className="p5-empty">Todavía no hay turnos esta semana.</p>}
        </>}
      </section>
      <div className="p5-side">
        <section className={`p5-card${focus === 'reservas' ? ' p5-focus' : ''}`} id="pn-reservas" tabIndex={-1}><header><h3>Por confirmar</h3><span>{pending.length}</span></header>
          {!pending.length && <p className="p5-empty">No hay reservas por confirmar.</p>}
          {pending.map(booking => <Pending key={booking.id} booking={booking} patients={patients} busy={busy} morePatients={morePatients} onMorePatients={onMorePatients} onConfirm={onConfirm} onCancel={onCancel} onReschedule={onReschedule} />)}
        </section>
        {(transfers.length > 0 || bookings.some(item => item.status !== 'cancelled') || moreBookings) && <section className="p5-card" aria-label="Pagos y calendario"><header><h3>Pagos y calendario</h3></header>
          {transfers.map(transfer => <article className="p5-pending" key={transfer.id}><div className="p5-tx"><b>Transferencia para revisar</b><span>{money(transfer.amount_minor)} · {transfer.reference}</span></div><button type="button" className="p5-btn p5-ink" disabled={busy} onClick={() => onReviewTransfer?.(transfer.id, 'confirm')}>Confirmar transferencia recibida</button><button type="button" className="p5-btn" disabled={busy} onClick={() => onReviewTransfer?.(transfer.id, 'reject')}>Rechazar</button></article>)}
          {bookings.filter(item => item.status !== 'cancelled').map(item => <article className="p5-pending" key={item.id}><div className="p5-tx"><b>{item.contact_name}</b><span>{item.status === 'confirmed' ? 'Confirmado' : 'Pendiente'} · pagos {money(item.paid_minor)}{item.paid_minor > item.total_minor ? ' · Hay un pago excedente para revisar.' : ''}</span></div><button type="button" className="p5-btn" disabled={busy} onClick={() => onSync?.(item.id)}>Sincronizar calendario</button><button type="button" className="p5-btn" disabled={busy} onClick={() => onReconcile?.(item.id)}>Conciliar Mercado Pago</button></article>)}
          {moreBookings && <button type="button" className="p5-btn" disabled={busy} onClick={onMoreBookings}>Ver más reservas</button>}
        </section>}
        {editor ?? <section className="p5-card" id="pn-horarios"><header><h3>Tipos de consulta</h3></header>
          {!types.length && <p className="p5-empty">Todavía no hay tipos de consulta.</p>}
          {types.map(type => <div className="p5-li" key={type.id}><div className="p5-tx"><b>{type.name}</b><span>{type.duration_min} min · {type.channel === 'video' ? 'Online' : 'Consultorio'}</span></div><span className="p5-num">{money(type.price_minor)}</span></div>)}
        </section>}
        <section className="p5-card"><header><h3>Reservas online</h3></header>
          <p className="p5-link">{page?.enabled ? `/consultorio/${page.slug}` : 'La página todavía no está publicada.'}</p>
          <button type="button" className="p5-btn" onClick={onCopy} disabled={!page?.enabled}>Copiar link</button>
          <PanelConnections connected={connections} onConnect={onConnect} onDisconnect={onDisconnect} />
        </section>
      </div>
    </div>
  </section>;
}

function money(minor: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(minor / 100);
}

function EventBlock({ event, start, rows }: { event: PanelAgendaEvent; start: number; rows: number }) {
  const top = ((event.startMin - start * 60) / (rows * 60)) * 100;
  const height = Math.max(8, ((event.endMin - event.startMin) / (rows * 60)) * 100);
  return <article className={`p5-ev p5-${event.tone}`} style={{ top: `${top}%`, height: `${height}%` }} title={`${event.title}. ${formatMinutes(event.startMin)}`}>
    <b>{event.title}</b>{height > 12 && <span>{formatMinutes(event.startMin)} · {event.subtitle}</span>}
  </article>;
}

function DayList({ days, events }: { days: string[]; events: PanelAgendaEvent[] }) {
  return <ol className="p5-daylist">{days.map(day => <li key={day}><b>{dayHeading(day).name} {dayHeading(day).number}</b>{events.filter(event => event.day === day).map(event => <p key={event.id}><span className={`p5-dot p5-${event.tone}`} />{formatMinutes(event.startMin)} {event.title}<small>{TONE_LABEL[event.tone]}</small></p>)}{!events.some(event => event.day === day) && <p className="p5-empty">Sin turnos</p>}</li>)}</ol>;
}

function Month({ events, anchor, now }: { events: PanelAgendaEvent[]; anchor: string; now: string }) {
  const cells = monthGrid(anchor);
  return <div className="p5-month">{['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(label => <span key={label}>{label}</span>)}{cells.map(day => <div key={day} className={day === now ? 'p5-today' : day.slice(0, 7) === anchor.slice(0, 7) ? '' : 'p5-out'}><b>{Number(day.slice(8))}</b>{events.filter(event => event.day === day).slice(0, 3).map(event => <small key={event.id} className={`p5-${event.tone}`}>{event.title}</small>)}</div>)}</div>;
}

function Pending({ booking, patients, busy, morePatients, onMorePatients, onConfirm, onCancel, onReschedule }: { booking: SchedulingBooking; patients: Array<{ id: string; name: string }>; busy: boolean; morePatients?: boolean; onMorePatients?: () => void; onConfirm: (booking: SchedulingBooking, patientId: string) => void; onCancel: (booking: SchedulingBooking) => void; onReschedule: (booking: SchedulingBooking, startsAt: string) => void }) {
  const [patientId, setPatientId] = useState('');
  const [when, setWhen] = useState('');
  const at = new Date(booking.starts_at);
  const whenLabel = Number.isFinite(at.getTime()) ? at.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', weekday: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Horario por revisar';
  return <article className="p5-pending"><div className="p5-tx"><b>{booking.contact_name}</b><span>{whenLabel} · {booking.paid_minor > 0 ? 'Pagó la seña' : 'Sin seña'}</span></div>
    <label>Vincular ficha<select value={patientId} onChange={event => setPatientId(event.target.value)} disabled={busy}><option value="">Crear ficha nueva</option>{patients.map(patient => <option key={patient.id} value={patient.id}>{patient.name}</option>)}</select></label>
    {morePatients && <button type="button" className="p5-btn" disabled={busy} onClick={onMorePatients}>Ver más fichas</button>}
    <button type="button" className="p5-btn p5-ink" disabled={busy} onClick={() => onConfirm(booking, patientId)}>Confirmar</button>
    <details><summary>Cambiar o cancelar</summary>
      <label>Nuevo horario<input type="datetime-local" value={when} onChange={event => setWhen(event.target.value)} /></label>
      <button type="button" className="p5-btn" disabled={busy || !when} onClick={() => onReschedule(booking, argentinaStamp(when.slice(0, 10), when.slice(11, 16)))}>Reprogramar</button>
      <button type="button" className="p5-btn" disabled={busy} onClick={() => onCancel(booking)}>Cancelar turno</button>
    </details></article>;
}

function HoursEditor({ config, busy, googleConnected, onChange, onSave }: { config: SchedulingSettings; busy: boolean; googleConnected: boolean; onChange: (next: SchedulingSettings) => void; onSave: () => void }) {
  const mode = depositMode(config.types);
  const setTypes = (types: SchedulingSettings['types']) => onChange({ ...config, types });
  return <section className="p5-card" id="pn-horarios"><header><h3>Horarios y precios</h3></header>
    {config.types.map(type => <fieldset key={type.id}><legend>{type.name || 'Consulta'}</legend>
      <label>Nombre<input value={type.name} maxLength={80} onChange={event => setTypes(config.types.map(item => item.id === type.id ? { ...item, name: event.target.value } : item))} /></label>
      <label>Minutos<input type="number" min={10} max={180} value={type.duration_min} onChange={event => setTypes(config.types.map(item => item.id === type.id ? { ...item, duration_min: Number(event.target.value) } : item))} /></label>
      <label>Precio<input type="number" min={0} step="1" value={type.price_minor / 100} onChange={event => setTypes(config.types.map(item => item.id === type.id ? { ...item, price_minor: Math.round(Number(event.target.value) * 100) } : item))} /></label>
      <label>Seña en pesos<input type="number" min={0} step="1" value={type.deposit_minor / 100} onChange={event => { const deposit = Math.round(Number(event.target.value) * 100); setTypes(config.types.map(item => item.id === type.id ? { ...item, deposit_minor: Math.min(deposit, item.price_minor) } : item)); }} /></label>
      <label>Modalidad<select value={type.channel} onChange={event => setTypes(config.types.map(item => item.id === type.id ? { ...item, channel: event.target.value as 'video' | 'presencial' } : item))}><option value="presencial">Consultorio</option><option value="video">Online</option></select></label>
      <button type="button" className="p5-btn" onClick={() => setTypes(config.types.filter(item => item.id !== type.id))}>Quitar</button>
    </fieldset>)}
    <button type="button" className="p5-btn" disabled={config.types.length >= 30} onClick={() => setTypes([...config.types, { id: crypto.randomUUID(), name: 'Consulta', calendar_id: config.calendars[0].id, duration_min: 45, channel: 'video', price_minor: 0, deposit_minor: 0 }])}>Agregar tipo</button>
    <h4>Días de atención</h4>
    {config.weekly.map((row, index) => <div className="p5-li" key={`${row.calendar_id}-${index}`}><label>Día<select value={row.weekday} onChange={event => onChange({ ...config, weekly: config.weekly.map((item, itemIndex) => itemIndex === index ? { ...item, weekday: Number(event.target.value) } : item) })}>{['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((name, weekday) => <option key={name} value={weekday}>{name}</option>)}</select></label><label>Desde<input type="time" value={row.start} onChange={event => onChange({ ...config, weekly: config.weekly.map((item, itemIndex) => itemIndex === index ? { ...item, start: event.target.value } : item) })} /></label><label>Hasta<input type="time" value={row.end} onChange={event => onChange({ ...config, weekly: config.weekly.map((item, itemIndex) => itemIndex === index ? { ...item, end: event.target.value } : item) })} /></label><button type="button" className="p5-btn" onClick={() => onChange({ ...config, weekly: config.weekly.filter((_, itemIndex) => itemIndex !== index) })}>Quitar</button></div>)}
    <button type="button" className="p5-btn" onClick={() => onChange({ ...config, weekly: [...config.weekly, { calendar_id: config.calendars[0].id, weekday: 1, start: '09:00', end: '13:00' }] })}>Agregar horario</button>
    {config.blocks.map(block => <div className="p5-li" key={block.id}><div className="p5-tx"><b>{block.label || 'Bloqueo'}</b></div><button type="button" className="p5-btn" onClick={() => onChange({ ...config, blocks: config.blocks.filter(item => item.id !== block.id) })}>Quitar bloqueo</button></div>)}
    {mode === 'mixed' ? <p>La seña cambia según el tipo de consulta.</p> : mode !== 'none' && <div className="p5-li"><div className="p5-tx"><b>Pedir seña al reservar</b><span>{mode === 'on' ? '50% del precio' : 'Sin seña'}</span></div><button type="button" className={`p5-switch${mode === 'on' ? ' on' : ''}`} aria-pressed={mode === 'on'} onClick={() => setTypes(withHalfDeposit(config.types, mode !== 'on'))}><span className="p5-sr">Pedir seña al reservar</span></button></div>}
    <label>Comprobar Google al ofrecer horarios<input type="checkbox" checked={config.google_enabled} disabled={!googleConnected} onChange={event => onChange({ ...config, google_enabled: event.target.checked })} /></label>
    <label>Crear un enlace de Meet por consulta<input type="checkbox" checked={config.create_meet} onChange={event => onChange({ ...config, create_meet: event.target.checked })} /></label>
    <label>Alias de transferencia<input maxLength={100} value={config.transfer_alias} onChange={event => onChange({ ...config, transfer_alias: event.target.value })} /></label>
    {config.calendars.map(calendar => <label key={calendar.id}>Agenda<input maxLength={80} value={calendar.name} onChange={event => onChange({ ...config, calendars: config.calendars.map(item => item.id === calendar.id ? { ...item, name: event.target.value } : item) })} /></label>)}
    <button type="button" className="p5-btn" disabled={config.calendars.length >= 10} onClick={() => onChange({ ...config, calendars: [...config.calendars, { id: crypto.randomUUID(), name: 'Otra agenda' }] })}>Agregar agenda</button>
    <button type="button" className="p5-btn p5-ink" disabled={busy} onClick={onSave}>Guardar horarios</button>
  </section>;
}

export function PanelAgenda({ patients, now, section, onManage }: { patients: Patient[]; now: Date; section: string | null; onManage: (patientId: string) => void }) {
  const scheduling = usePanelScheduling();
  const [view, setView] = useState<AgendaView>('semana');
  const [anchor, setAnchor] = useState(() => agendaDay(now));
  const [draft, setDraft] = useState<SchedulingSettings | null>(null);
  const [blocking, setBlocking] = useState(false);
  const [block, setBlock] = useState({ day: agendaDay(now), start: '13:00', end: '14:00', label: '' });
  const config = draft ?? scheduling.config;
  const loaded = Boolean(scheduling.snapshot);
  const days = view === 'dia' ? [anchor] : weekDays(anchor);
  const range = view === 'mes' ? monthGrid(anchor) : days;
  const events = useMemo(() => loaded ? buildPanelAgendaEvents(patients, config, scheduling.snapshot?.bookings ?? [], now, range) : [], [loaded, patients, config, scheduling.snapshot, now, range]);
  const pending = (scheduling.snapshot?.bookings ?? []).filter(booking => booking.status === 'requested');
  useUnsavedChanges(Boolean(draft), scheduling.busy);
  useEffect(() => {
    if (!blocking) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setBlocking(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [blocking]);
  useEffect(() => { if (section === 'reservas') document.getElementById('pn-reservas')?.focus(); }, [section, pending.length]);

  const saveBlock = (event: FormEvent) => {
    event.preventDefault();
    if (!scheduling.snapshot || block.end <= block.start) { scheduling.setStatus('El bloqueo tiene que terminar después de empezar.'); return; }
    const next = { ...config, blocks: [...config.blocks, { id: crypto.randomUUID(), calendar_id: config.calendars[0].id, label: block.label.trim(), start: argentinaStamp(block.day, block.start), end: argentinaStamp(block.day, block.end) }] };
    void scheduling.save(next, 'Horario bloqueado.').then(ok => { if (ok) setBlocking(false); });
  };

  return <>
    <PanelAgendaView title="Agenda" subtitle={view === 'dia' ? `${dayHeading(anchor).name} ${dayHeading(anchor).number}` : weekLabel(weekDays(anchor))} view={view} days={days} today={agendaDay(now)} now={now} events={events} pending={pending} types={config.types} page={loaded ? config.page : undefined} connections={{ google: Boolean(scheduling.snapshot?.connections.google), mercadopago: Boolean(scheduling.snapshot?.connections.mercadopago), whatsapp: scheduling.whatsapp }} status={scheduling.status} busy={scheduling.busy} loading={!loaded && !scheduling.error} error={scheduling.error} focus={section} onView={setView} onShift={delta => setAnchor(current => shiftDay(current, view === 'mes' ? delta * 30 : view === 'dia' ? delta : delta * 7))} onToday={() => setAnchor(agendaDay(now))} onManage={() => { const id = patients.find(patient => !patient.appointment)?.id ?? patients[0]?.id; if (id) onManage(id); }} onCopy={() => { if (!config.page.enabled) return; const href = bookingHref(window.location.origin, config.page.slug); void navigator.clipboard?.writeText(href).then(() => scheduling.setStatus('Link copiado.'), () => scheduling.setStatus(href)); }} onConnect={key => void scheduling.connect(key)} onConfirm={(booking, patientId) => void scheduling.confirm(booking, patientId)} onCancel={booking => void scheduling.changeBooking(booking, 'cancel')} onReschedule={(booking, startsAt) => void scheduling.changeBooking(booking, 'reschedule', startsAt)} onBlock={() => setBlocking(true)} onRetry={() => void scheduling.load()} patients={scheduling.patients} editor={section === 'horarios' && loaded ? <HoursEditor config={config} busy={scheduling.busy} googleConnected={Boolean(scheduling.snapshot?.connections.google)} onChange={setDraft} onSave={() => void scheduling.save(config, 'Horarios guardados.').then(ok => { if (ok) setDraft(null); })} /> : undefined} transfers={scheduling.snapshot?.transfers ?? []} bookings={scheduling.snapshot?.bookings ?? []} moreBookings={scheduling.bookingMore} morePatients={scheduling.patientMore} onReviewTransfer={(id, decision) => void scheduling.reviewTransfer(id, decision)} onSync={id => void scheduling.syncBooking(id)} onReconcile={id => void scheduling.reconcileBooking(id)} onMoreBookings={() => void scheduling.loadMoreBookings()} onMorePatients={() => void scheduling.loadMorePatients()} onDisconnect={key => void scheduling.disconnect(key)} />
    {scheduling.snapshot?.bookings.some(booking => booking.google_sync_status === 'uncertain') && <div className="p5-card">{scheduling.snapshot.bookings.filter(booking => booking.google_sync_status === 'uncertain').map(booking => <GoogleReviewControl key={booking.id} kind="booking" targetId={booking.id} revision={booking.revision} disabled={scheduling.busy} onResolved={async () => { await scheduling.load(); }} />)}</div>}
    {blocking && <div className="p5-dialog" role="dialog" aria-modal="true" aria-labelledby="p5-block-title"><form onSubmit={saveBlock}><h3 id="p5-block-title">Bloquear horario</h3>
      <label>Día<input type="date" required value={block.day} onChange={event => setBlock(current => ({ ...current, day: event.target.value }))} /></label>
      <label>Desde<input type="time" required value={block.start} onChange={event => setBlock(current => ({ ...current, start: event.target.value }))} /></label>
      <label>Hasta<input type="time" required value={block.end} onChange={event => setBlock(current => ({ ...current, end: event.target.value }))} /></label>
      <label>Motivo<input maxLength={80} value={block.label} onChange={event => setBlock(current => ({ ...current, label: event.target.value }))} /></label>
      <div className="p5-row"><button type="button" className="p5-btn" onClick={() => setBlocking(false)}>Volver</button><button className="p5-btn p5-pri" disabled={scheduling.busy}>Guardar bloqueo</button></div>
    </form></div>}
  </>;
}
