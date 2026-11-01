import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent as TeclaEvento, type ReactNode } from 'react';
import { api } from '../../api/client';
import { useAppStore } from '../../store/useAppStore';
import type { Patient } from '../../types';
import type { SchedulingBooking, SchedulingSettings } from '../../types/scheduling';
import { agendaDay, argentinaStamp, bookingHref, buildPanelAgendaEvents, dayHeading, depositMode, monthGrid, monthLabel, nowFraction, shiftDay, weekDays, withHalfDeposit, type AgendaView, type PanelAgendaEvent } from '../../lib/panel-agenda';
import { secureMeetUrl } from './ShowroomConsultations';
import { GoogleReviewControl } from './GoogleReviewControl';
import { PanelConnections, type ConnectionKey } from './PanelConnections';
import { PanelV29Icon } from './PanelV29Icon';
import { fondoAvatar, inicialesDe } from './seguimiento-presentacion';
import { claseDeEvento, consultasDelDia, encabezadoAgenda, etiquetaDeEvento, franjaDeHoras, lugaresLibres, miniMes, proximoEvento, recortarLugares, textoDelPedido, tituloDelPedido, type LugarLibre } from './agenda-presentacion';
import { argentinaStart, inVideoCallWindow } from '../../lib/video-call-window';
import { OfertaGrabarAudioDelTurno } from './MeetAudioBar';
import { useUnsavedChanges } from './unsaved-changes';
import { usePanelScheduling } from './use-panel-scheduling';
import './panel-fase5.css';

export type AgendaHeader = { sufijo: string; cuando: string; actions: ReactNode };

const DIAS_SEMANA_TURNO = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const;
const DURACIONES_TURNO = [15, 30, 45, 60, 90] as const;

function nombreDiaSemana(day: string): string {
  const fecha = new Date(`${day}T15:00:00Z`);
  return DIAS_SEMANA_TURNO[(fecha.getUTCDay() + 6) % 7] ?? 'Lunes';
}

type Seccion = 'horarios' | 'pagos' | 'conexiones';
const VISTAS: Array<[AgendaView, string]> = [['dia', 'Día'], ['semana', 'Semana'], ['mes', 'Mes']];
const PERIODO: Record<AgendaView, string> = { dia: 'Día', semana: 'Semana', mes: 'Mes' };
const DIAS_MES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const INICIALES_SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const ESTE_PERIODO: Record<AgendaView, string> = { dia: 'este día', semana: 'esta semana', mes: 'este mes' };

function Acciones({ view, busy, loading, onView, onShift, onBlock, onManage }: { view: AgendaView; busy: boolean; loading: boolean; onView: (view: AgendaView) => void; onShift: (delta: number) => void; onBlock: () => void; onManage: () => void }) {
  const periodo = { dia: 'día', semana: 'la semana', mes: 'el mes' }[view];
  return <>
    <div className="tabs" role="group" aria-label="Vista de la agenda">{VISTAS.map(([id, label]) => <button type="button" key={id} className={view === id ? 'on' : undefined} aria-pressed={view === id} onClick={() => onView(id)}>{label}</button>)}</div>
    <button className="ibtn" type="button" aria-label={`${PERIODO[view]} anterior`} title={view === 'dia' ? 'Ir al día anterior' : `Ir a ${periodo} anterior`} onClick={() => onShift(-1)}><PanelV29Icon name="left" /></button>
    <button className="ibtn" type="button" aria-label={`${PERIODO[view]} siguiente`} title={view === 'dia' ? 'Ir al día siguiente' : `Ir a ${periodo} siguiente`} onClick={() => onShift(1)}><PanelV29Icon name="right" /></button>
    <button className="chip" type="button" onClick={onBlock} disabled={busy || loading}><PanelV29Icon name="lock" />Bloquear horario</button>
    <button className="cta" type="button" onClick={onManage}><PanelV29Icon name="plus" />Nuevo turno</button>
  </>;
}

const iniciar = (nombre: string) => inicialesDe(nombre);

export function PanelAgendaView({ view, anchor = '', days, today, now, events, pending, types, page, connections, status, busy, loading, error, focus, onView, onShift, onToday, onManage, onPickSlot, onCopy, onConnect, onConfirm, onCancel, onReschedule, onBlock, onRetry, patients, editor, transfers = [], bookings = [], moreBookings = false, morePatients = false, onReviewTransfer, onSync, onReconcile, onMoreBookings, onMorePatients, onDisconnect, libres = [], recordatorio, onPickDay, onMonth, onHeader }: {
  title?: string; subtitle?: string; view: AgendaView; anchor?: string; days: string[]; today: string; now: Date; events: PanelAgendaEvent[];
  pending: SchedulingBooking[]; types: SchedulingSettings['types']; page?: SchedulingSettings['page'];
  connections: Record<ConnectionKey, boolean>; status: string; busy: boolean; loading: boolean; error: string; focus: string | null;
  onView: (view: AgendaView) => void; onShift: (delta: number) => void; onToday: () => void; onManage: () => void; onPickSlot?: (slot: LugarLibre) => void; onCopy: () => void;
  onConnect: (key: ConnectionKey) => void; onConfirm: (booking: SchedulingBooking, patientId: string) => void; onCancel: (booking: SchedulingBooking) => void;
  onReschedule: (booking: SchedulingBooking, startsAt: string) => void; onBlock: () => void; onRetry: () => void; patients: Array<{ id: string; name: string }>; editor?: ReactNode;
  transfers?: Array<{ id: string; amount_minor: number; reference: string }>; bookings?: SchedulingBooking[]; moreBookings?: boolean; morePatients?: boolean;
  onReviewTransfer?: (id: string, decision: 'confirm' | 'reject') => void; onSync?: (id: string) => void; onReconcile?: (id: string) => void; onMoreBookings?: () => void; onMorePatients?: () => void; onDisconnect?: (key: 'google' | 'mercadopago') => void;
  libres?: LugarLibre[]; recordatorio?: boolean; onPickDay?: (day: string) => void; onMonth?: (delta: number) => void; onHeader?: (header: AgendaHeader | null) => void;
}) {
  const [seccion, setSeccion] = useState<Seccion | null>(focus === 'horarios' || focus === 'pagos' || focus === 'conexiones' ? focus : null);
  const ancla = anchor || days[0] || today;
  const franja = franjaDeHoras(events.filter(event => days.includes(event.day)));
  const filas = franja.end - franja.start;
  const proximo = useMemo(() => proximoEvento(events, now), [events, now]);
  const encabezado = encabezadoAgenda(view, ancla, days, events, libres.length, pending.length);
  const acciones = <Acciones view={view} busy={busy} loading={loading} onView={onView} onShift={onShift} onBlock={onBlock} onManage={onManage} />;
  const claveEncabezado = `${encabezado.sufijo}|${encabezado.cuando}|${view}|${busy}|${loading}`;
  useEffect(() => { onHeader?.({ sufijo: encabezado.sufijo, cuando: encabezado.cuando, actions: acciones }); }, [claveEncabezado]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => onHeader?.(null), []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (focus === 'horarios' || focus === 'pagos' || focus === 'conexiones') setSeccion(focus); }, [focus]);
  useEffect(() => {
    if (!seccion) return;
    const alTeclear = (event: KeyboardEvent) => { if (event.key === 'Escape') setSeccion(null); };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [seccion]);
  const mini = miniMes(ancla, today, days, events);
  const { visibles, ocultos } = recortarLugares(libres);
  const conTransferencias = transfers.length + bookings.filter(item => item.status !== 'cancelled').length;
  const elegirDia = (day: string) => onPickDay?.(day);
  const alTeclear = (day: string) => (event: TeclaEvento) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); elegirDia(day); } };
  return <div className="scr" id="s-agenda" aria-label="Agenda">
    {!onHeader && <div className="top"><div><h1>Agenda <span>{encabezado.sufijo}</span></h1><div className="date">{encabezado.cuando}</div></div><div className="sp" />{acciones}</div>}
    {error && <p className="ag-aviso" role="alert">{error} <button type="button" className="lnk" onClick={onRetry}>Reintentar</button></p>}
    {status && <p className="ag-aviso" role="status">{status}</p>}
    <section className="ag">
      <div className="card cal" aria-label={view === 'mes' ? 'Mes' : view === 'dia' ? 'Día' : 'Semana'}>
        {loading ? <p className="ag-vacio">Cargando la agenda…</p> : view === 'mes' ? <Mes events={events} anchor={ancla} today={today} /> : <>
          <div className="days" id="days" style={{ gridTemplateColumns: `52px repeat(${days.length},minmax(0,1fr))` }}><div />
            {days.map(day => { const { name, number } = dayHeading(day); const cantidad = consultasDelDia(events, day); return <div key={day} className={day === today ? 'today' : undefined}>{name}<b className="num">{number}</b><small className="num">{cantidad} cons.</small></div>; })}
          </div>
          <div className="hrs" id="hrs" style={{ gridTemplateColumns: `52px repeat(${days.length},minmax(0,1fr))` }}>
            <div className="hlab">{Array.from({ length: filas }, (_, k) => <span className="num" key={k} style={{ top: `${(k / filas) * 100}%` }}>{k ? `${String(franja.start + k).padStart(2, '0')}:00` : ''}</span>)}</div>
            {days.map(day => <div className={`hcol${day === today ? ' today' : ''}`} key={day}>
              {events.filter(event => event.day === day).map(event => {
                const clase = claseDeEvento(event, now, proximo);
                const top = ((event.startMin - franja.start * 60) / (filas * 60)) * 100;
                const alto = ((event.endMin - event.startMin) / (filas * 60)) * 100;
                const entrar = event.tone === 'online' && Boolean(event.meetUrl) && inVideoCallWindow(now, argentinaStart(event.day, event.startMin), event.endMin - event.startMin);
                return <div className={`ev ${clase}`} key={event.id} style={{ top: `calc(${top}% + 1px)`, height: `calc(${alto}% - 3px)` }}><b>{event.title}</b><small className="num">{etiquetaDeEvento(event, clase)}</small>{entrar && <a href={event.meetUrl} target="_blank" rel="noopener noreferrer">Entrar a la videollamada</a>}{entrar && event.patientId ? <OfertaGrabarAudioDelTurno patientId={event.patientId} appointmentId={event.id} /> : null}</div>;
              })}
            </div>)}
            {Array.from({ length: filas - 1 }, (_, k) => <div className="gl" key={k} style={{ top: `${((k + 1) / filas) * 100}%` }} />)}
            {days.includes(today) && nowFraction(now, today, franja.start, franja.end) != null && <div className="nowl" style={{ top: `${(nowFraction(now, today, franja.start, franja.end) ?? 0) * 100}%` }} aria-hidden="true" />}
            {!events.some(event => days.includes(event.day)) && <p className="ag-vacio ag-vacio-sobre">Todavía no hay turnos {ESTE_PERIODO[view]}.</p>}
          </div>
        </>}
      </div>
      <div className="agside">
        <div className="card"><div className="mini"><div className="mh">{monthLabel(ancla).replace(' de ', ' ')}<span style={{ display: 'flex', gap: 4, color: 'var(--ink3)' }}>
          <button className="lnk" type="button" aria-label="Mes anterior" onClick={() => onMonth?.(-1)}><PanelV29Icon name="left" /></button>
          <button className="lnk" type="button" aria-label="Mes siguiente" onClick={() => onMonth?.(1)}><PanelV29Icon name="right" /></button></span></div>
          <div className="mg" id="mg">{INICIALES_SEMANA.map((letra, index) => <span className="wd" key={index}>{letra}</span>)}
            {mini.map(celda => <span key={celda.day} className={`num${celda.clase ? ` ${celda.clase}` : ''}`} role="button" tabIndex={0} aria-label={`Ir al ${dayHeading(celda.day).name} ${celda.numero}`} onClick={() => elegirDia(celda.day)} onKeyDown={alTeclear(celda.day)}>{celda.numero}</span>)}</div></div>
          <div className="lgd"><span style={{ '--c': 'var(--lima)' } as never}>Consultorio</span><span style={{ '--c': 'var(--azul-ink)' } as never}>Videollamada</span><span style={{ '--c': 'var(--azaf)' } as never}>Sin confirmar</span><span style={{ '--c': 'var(--ink3)' } as never}>Hecha</span></div></div>
        <div className={`card req${focus === 'reservas' ? ' ag-foco' : ''}`} id="pn-reservas" tabIndex={-1}>
          <div className="ch"><h2>Pedidos de turno</h2><span className="meta">desde tu página</span></div>
          <div className="lst">
            {!pending.length && <p className="ag-vacio">No hay pedidos de turno.</p>}
            {pending.map(booking => <Pedido key={booking.id} booking={booking} types={types} patients={patients} busy={busy} morePatients={morePatients} onMorePatients={onMorePatients} onConfirm={onConfirm} onCancel={onCancel} onReschedule={onReschedule} />)}
          </div></div>
        <div className="card" style={{ flex: 1, minHeight: 0 }}>
          <div className="ch"><h2>Lugares libres</h2><span className="meta">{ESTE_PERIODO[view]}</span></div>
          {visibles.length > 0 ? <div className="slot">{visibles.map(lugar => <button type="button" key={`${lugar.day}:${lugar.startMin}`} title="Agendar un turno" onClick={() => onPickSlot ? onPickSlot(lugar) : onManage()}><small>{lugar.dia}</small>{lugar.hora}</button>)}{ocultos > 0 && <span className="meta ag-mas-lugares">+{ocultos} más</span>}</div>
            : <p className="ag-vacio">{types.length ? 'No quedan lugares libres.' : 'Cargá tus horarios y tipos de consulta para ver los lugares libres.'}</p>}
          <div className="foot ag-foot">
            <button type="button" className="lnk" onClick={onCopy} disabled={!page?.enabled}>{page?.enabled ? 'Copiar link de reservas' : 'Reservas online sin publicar'}</button>
            <button type="button" className="lnk" onClick={() => setSeccion('horarios')}>Horarios y precios</button>
            <button type="button" className="lnk" onClick={() => setSeccion('pagos')}>Pagos y calendario{conTransferencias ? ` · ${conTransferencias}` : ''}</button>
            <button type="button" className="lnk" onClick={() => setSeccion('conexiones')}>Conexiones</button>
          </div>
          {recordatorio !== undefined && <div className="foot" id="ag-recordatorio"><b>Recordatorio de turno</b>{recordatorio ? 'activo · en la app y por mail 24 h antes' : 'apagado · no se avisa antes del turno'}</div>}
        </div>
      </div>
    </section>
    {seccion && <div className="p5-dialog p5-dialog-wide" role="dialog" aria-modal="true" aria-label={seccion === 'horarios' ? 'Horarios y precios' : seccion === 'pagos' ? 'Pagos y calendario' : 'Conexiones'}>
      <div className="p5 ag-mas">
        {seccion === 'horarios' && (editor ?? <section className="p5-card" id="pn-horarios"><header><h3>Tipos de consulta</h3></header>
          {!types.length && <p className="p5-empty">Todavía no hay tipos de consulta.</p>}
          {types.map(type => <div className="p5-li" key={type.id}><div className="p5-tx"><b>{type.name}</b><span>{type.duration_min} min · {type.channel === 'video' ? 'Online' : 'Consultorio'}</span></div><span className="p5-num">{money(type.price_minor)}</span></div>)}
        </section>)}
        {seccion === 'pagos' && <section className="p5-card" aria-label="Pagos y calendario"><header><h3>Pagos y calendario</h3></header>
          {!conTransferencias && !moreBookings && <p className="p5-empty">No hay pagos ni turnos para revisar.</p>}
          {transfers.map(transfer => <article className="p5-pending" key={transfer.id}><div className="p5-tx"><b>Transferencia para revisar</b><span>{money(transfer.amount_minor)} · {transfer.reference}</span></div><button type="button" className="p5-btn p5-ink" disabled={busy} onClick={() => onReviewTransfer?.(transfer.id, 'confirm')}>Confirmar transferencia recibida</button><button type="button" className="p5-btn" disabled={busy} onClick={() => onReviewTransfer?.(transfer.id, 'reject')}>Rechazar</button></article>)}
          {bookings.filter(item => item.status !== 'cancelled').map(item => <article className="p5-pending" key={item.id}><div className="p5-tx"><b>{item.contact_name}</b><span>{item.status === 'confirmed' ? 'Confirmado' : 'Pendiente'} · pagos {money(item.paid_minor)}{item.paid_minor > item.total_minor ? ' · Hay un pago excedente para revisar.' : ''}</span></div><button type="button" className="p5-btn" disabled={busy} onClick={() => onSync?.(item.id)}>Sincronizar calendario</button><button type="button" className="p5-btn" disabled={busy} onClick={() => onReconcile?.(item.id)}>Conciliar Mercado Pago</button></article>)}
          {moreBookings && <button type="button" className="p5-btn" disabled={busy} onClick={onMoreBookings}>Ver más reservas</button>}
        </section>}
        {seccion === 'conexiones' && <section className="p5-card"><header><h3>Reservas online</h3></header>
          <p className="p5-link">{page?.enabled ? `/consultorio/${page.slug}` : 'La página todavía no está publicada.'}</p>
          <button type="button" className="p5-btn" onClick={onCopy} disabled={!page?.enabled}>Copiar link</button>
          <PanelConnections connected={connections} onConnect={onConnect} onDisconnect={onDisconnect} />
        </section>}
        <div className="p5-row"><button type="button" className="p5-btn p5-pri" onClick={() => setSeccion(null)}>Cerrar</button></div>
      </div>
    </div>}
  </div>;
}

function money(minor: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(minor / 100);
}

function Mes({ events, anchor, today }: { events: PanelAgendaEvent[]; anchor: string; today: string }) {
  return <div className="agm">{DIAS_MES.map(label => <span key={label}>{label}</span>)}{monthGrid(anchor).map(day => <div key={day} className={`${day === today ? 'td' : ''}${day.slice(0, 7) === anchor.slice(0, 7) ? '' : ' o'}`.trim() || undefined}><b className="num">{Number(day.slice(8))}</b>{events.filter(event => event.day === day).slice(0, 3).map(event => <small key={event.id} className={event.tone === 'bloqueo' ? 'blk' : event.tone === 'pendiente' ? 'w' : event.tone === 'online' ? 'v' : 'c'}>{event.title}</small>)}</div>)}</div>;
}

function Pedido({ booking, types, patients, busy, morePatients, onMorePatients, onConfirm, onCancel, onReschedule }: { booking: SchedulingBooking; types: SchedulingSettings['types']; patients: Array<{ id: string; name: string }>; busy: boolean; morePatients?: boolean; onMorePatients?: () => void; onConfirm: (booking: SchedulingBooking, patientId: string) => void; onCancel: (booking: SchedulingBooking) => void; onReschedule: (booking: SchedulingBooking, startsAt: string) => void }) {
  const [patientId, setPatientId] = useState(booking.patient_id ?? '');
  const [when, setWhen] = useState('');
  const [abierto, setAbierto] = useState(false);
  const vinculada = booking.patient_id && !patients.some(patient => patient.id === booking.patient_id);
  return <div className="li"><span className="av" style={{ background: fondoAvatar(undefined) }}>{iniciar(booking.contact_name)}</span>
    <div className="tx"><b>{tituloDelPedido(booking)}</b><small>{textoDelPedido(booking, types)} · {booking.paid_minor > 0 ? 'pagó la seña' : 'sin seña'}</small>
      <div className="bt"><button className="sbtn k" type="button" disabled={busy} onClick={() => onConfirm(booking, patientId)}>Aceptar</button><button className="sbtn" type="button" aria-expanded={abierto} onClick={() => setAbierto(value => !value)}>Proponer otro</button></div>
      {abierto && <div className="ag-otro">
        <label>Vincular ficha<select value={patientId} onChange={event => setPatientId(event.target.value)} disabled={busy}><option value="">Crear ficha nueva</option>{vinculada && <option value={booking.patient_id ?? ''}>Ficha ya vinculada</option>}{patients.map(patient => <option key={patient.id} value={patient.id}>{patient.name}</option>)}</select></label>
        {morePatients && <button type="button" className="sbtn" disabled={busy} onClick={onMorePatients}>Ver más fichas</button>}
        <label>Nuevo horario<input type="datetime-local" value={when} onChange={event => setWhen(event.target.value)} /></label>
        <div className="bt"><button type="button" className="sbtn" disabled={busy || !when} onClick={() => onReschedule(booking, argentinaStamp(when.slice(0, 10), when.slice(11, 16)))}>Reprogramar</button><button type="button" className="sbtn" disabled={busy} onClick={() => onCancel(booking)}>Cancelar turno</button></div>
      </div>}
    </div></div>;
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
    <div className="p5-li"><div className="p5-tx"><b>Recordatorio de turno</b><span>{config.reminders_enabled !== false ? 'Cada paciente recibe un aviso 24 h antes, en la app y por mail, si activó esos avisos' : 'Apagado: no se avisa a tus pacientes antes del turno'}</span></div><button type="button" className={`p5-switch${config.reminders_enabled !== false ? ' on' : ''}`} aria-pressed={config.reminders_enabled !== false} onClick={() => onChange({ ...config, reminders_enabled: config.reminders_enabled === false })}><span className="p5-sr">Recordatorio de turno</span></button></div>
    <label>Comprobar Google al ofrecer horarios<input type="checkbox" checked={config.google_enabled} disabled={!googleConnected} onChange={event => onChange({ ...config, google_enabled: event.target.checked })} /></label>
    <label>Crear un enlace de Meet por consulta<input type="checkbox" checked={config.create_meet} onChange={event => onChange({ ...config, create_meet: event.target.checked })} /></label>
    <label>Alias de transferencia<input maxLength={100} value={config.transfer_alias} onChange={event => onChange({ ...config, transfer_alias: event.target.value })} /></label>
    {config.calendars.map(calendar => <label key={calendar.id}>Agenda<input maxLength={80} value={calendar.name} onChange={event => onChange({ ...config, calendars: config.calendars.map(item => item.id === calendar.id ? { ...item, name: event.target.value } : item) })} /></label>)}
    <button type="button" className="p5-btn" disabled={config.calendars.length >= 10} onClick={() => onChange({ ...config, calendars: [...config.calendars, { id: crypto.randomUUID(), name: 'Otra agenda' }] })}>Agregar agenda</button>
    <button type="button" className="p5-btn p5-ink" disabled={busy} onClick={onSave}>Guardar horarios</button>
  </section>;
}

export function PanelAgenda({ patients, now, section, onManage: _onManage, onHeader }: { patients: Patient[]; now: Date; section: string | null; onManage: (patientId: string) => void; onHeader?: (header: AgendaHeader | null) => void }) {
  const scheduling = usePanelScheduling();
  const [view, setView] = useState<AgendaView>('semana');
  const [anchor, setAnchor] = useState(() => agendaDay(now));
  const [draft, setDraft] = useState<SchedulingSettings | null>(null);
  const [blocking, setBlocking] = useState(false);
  const [block, setBlock] = useState({ day: agendaDay(now), start: '13:00', end: '14:00', label: '' });
  const [creatingAppt, setCreatingAppt] = useState(false);
  const [savingAppt, setSavingAppt] = useState(false);
  const [apptError, setApptError] = useState('');
  const [newAppt, setNewAppt] = useState({ patientId: '', day: agendaDay(now), time: '10:00', duration: 45, channel: 'video' as 'video' | 'presencial', meetUrl: '' });
  const config = draft ?? scheduling.config;
  const loaded = Boolean(scheduling.snapshot);
  const days = useMemo(() => view === 'dia' ? [anchor] : weekDays(anchor), [view, anchor]);
  const month = useMemo(() => monthGrid(anchor), [anchor]);
  const verDias = view === 'mes' ? month : days;
  // Se arman una sola vez para todo el mes: la grilla, el mes chico y los lugares libres salen de los mismos turnos.
  const events = useMemo(() => loaded ? buildPanelAgendaEvents(patients, config, scheduling.snapshot?.bookings ?? [], now, month) : [], [loaded, patients, config, scheduling.snapshot, now, month]);
  const libres = useMemo(() => loaded ? lugaresLibres(config, events, now, verDias) : [], [loaded, config, events, now, verDias]);
  const patientOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const p of patients) if (p.id && p.name) seen.set(p.id, p.name);
    for (const p of scheduling.patients) if (p.id && p.name && !seen.has(p.id)) seen.set(p.id, p.name);
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [patients, scheduling.patients]);
  const moverMes = (delta: number) => setAnchor(current => { const [year, mes] = current.split('-').map(Number); return new Date(Date.UTC(year, mes - 1 + delta, 1)).toISOString().slice(0, 10); });
  const pending = (scheduling.snapshot?.bookings ?? []).filter(booking => booking.status === 'requested');
  useUnsavedChanges(Boolean(draft), scheduling.busy);
  useEffect(() => {
    if (!blocking && !creatingAppt) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setBlocking(false);
        setCreatingAppt(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [blocking, creatingAppt]);
  useEffect(() => { if (section === 'reservas') document.getElementById('pn-reservas')?.focus(); }, [section, pending.length]);

  const abrirNuevoTurno = (slot?: LugarLibre) => {
    setApptError('');
    setNewAppt({
      patientId: '',
      day: slot?.day ?? anchor,
      time: slot?.hora ?? '10:00',
      duration: config.types[0]?.duration_min ?? 45,
      channel: config.types[0]?.channel === 'presencial' ? 'presencial' : 'video',
      meetUrl: '',
    });
    setCreatingAppt(true);
  };

  const saveNewAppt = async (event: FormEvent) => {
    event.preventDefault();
    if (!newAppt.patientId) {
      setApptError('Elegí una paciente antes de guardar el turno.');
      return;
    }
    const meetUrlTrimmed = newAppt.meetUrl.trim();
    if (newAppt.channel === 'video' && meetUrlTrimmed && !secureMeetUrl(meetUrlTrimmed)) {
      setApptError('El enlace de videollamada debe empezar con https://.');
      return;
    }
    setSavingAppt(true);
    setApptError('');
    try {
      const weekday = nombreDiaSemana(newAppt.day);
      const result = await api.updateAppointment(newAppt.patientId, {
        day: weekday,
        time: newAppt.time,
        duration: newAppt.duration,
        channel: newAppt.channel,
        ...(newAppt.channel === 'video' && meetUrlTrimmed ? { meet_url: meetUrlTrimmed } : {}),
      });
      useAppStore.getState().addPatient(result.patient);
      setAnchor(newAppt.day);
      setCreatingAppt(false);
      scheduling.setStatus('Turno agendado.');
    } catch (error) {
      setApptError(error instanceof Error ? error.message : 'No pudimos agendar el turno. Intentá de nuevo.');
    } finally {
      setSavingAppt(false);
    }
  };

  const saveBlock = (event: FormEvent) => {
    event.preventDefault();
    if (!scheduling.snapshot || block.end <= block.start) { scheduling.setStatus('El bloqueo tiene que terminar después de empezar.'); return; }
    const next = { ...config, blocks: [...config.blocks, { id: crypto.randomUUID(), calendar_id: config.calendars[0].id, label: block.label.trim(), start: argentinaStamp(block.day, block.start), end: argentinaStamp(block.day, block.end) }] };
    void scheduling.save(next, 'Horario bloqueado.').then(ok => { if (ok) setBlocking(false); });
  };

  return <>
    <PanelAgendaView view={view} anchor={anchor} days={days} today={agendaDay(now)} now={now} events={events} pending={pending} types={config.types} page={loaded ? config.page : undefined} connections={{ google: Boolean(scheduling.snapshot?.connections.google), mercadopago: Boolean(scheduling.snapshot?.connections.mercadopago) }} status={scheduling.status} busy={scheduling.busy} loading={!loaded && !scheduling.error} error={scheduling.error} focus={section} libres={libres} recordatorio={loaded ? config.reminders_enabled !== false : undefined} onHeader={onHeader} onView={setView} onShift={delta => view === 'mes' ? moverMes(delta) : setAnchor(current => shiftDay(current, view === 'dia' ? delta : delta * 7))} onToday={() => setAnchor(agendaDay(now))} onPickDay={day => { setAnchor(day); if (view === 'mes') setView('dia'); }} onMonth={moverMes} onManage={() => abrirNuevoTurno()} onPickSlot={slot => abrirNuevoTurno(slot)} onCopy={() => { if (!config.page.enabled) return; const href = bookingHref(window.location.origin, config.page.slug); void navigator.clipboard?.writeText(href).then(() => scheduling.setStatus('Link copiado.'), () => scheduling.setStatus(href)); }} onConnect={key => void scheduling.connect(key)} onConfirm={(booking, patientId) => void scheduling.confirm(booking, patientId)} onCancel={booking => void scheduling.changeBooking(booking, 'cancel')} onReschedule={(booking, startsAt) => void scheduling.changeBooking(booking, 'reschedule', startsAt)} onBlock={() => setBlocking(true)} onRetry={() => void scheduling.load()} patients={scheduling.patients} editor={loaded ? <HoursEditor config={config} busy={scheduling.busy} googleConnected={Boolean(scheduling.snapshot?.connections.google)} onChange={setDraft} onSave={() => void scheduling.save(config, 'Horarios guardados.').then(ok => { if (ok) setDraft(null); })} /> : undefined} transfers={scheduling.snapshot?.transfers ?? []} bookings={scheduling.snapshot?.bookings ?? []} moreBookings={scheduling.bookingMore} morePatients={scheduling.patientMore} onReviewTransfer={(id, decision) => void scheduling.reviewTransfer(id, decision)} onSync={id => void scheduling.syncBooking(id)} onReconcile={id => void scheduling.reconcileBooking(id)} onMoreBookings={() => void scheduling.loadMoreBookings()} onMorePatients={() => void scheduling.loadMorePatients()} onDisconnect={key => void scheduling.disconnect(key)} />
    {scheduling.snapshot?.bookings.some(booking => booking.google_sync_status === 'uncertain') && <div className="p5-card">{scheduling.snapshot.bookings.filter(booking => booking.google_sync_status === 'uncertain').map(booking => <GoogleReviewControl key={booking.id} kind="booking" targetId={booking.id} revision={booking.revision} disabled={scheduling.busy} onResolved={async () => { await scheduling.load(); }} />)}</div>}
    {creatingAppt && <div className="p5-dialog" role="dialog" aria-modal="true" aria-labelledby="p5-new-appt-title"><form onSubmit={saveNewAppt}><h3 id="p5-new-appt-title">Nuevo turno</h3>
      <label>Paciente<select aria-label="Paciente" required value={newAppt.patientId} onChange={event => setNewAppt(current => ({ ...current, patientId: event.target.value }))}><option value="">Elegí una paciente…</option>{patientOptions.map(patient => <option key={patient.id} value={patient.id}>{patient.name}</option>)}</select></label>
      <label>Día<input aria-label="Día" type="date" required value={newAppt.day} onChange={event => setNewAppt(current => ({ ...current, day: event.target.value }))} /></label>
      <label>Hora<input aria-label="Hora" type="time" required value={newAppt.time} onChange={event => setNewAppt(current => ({ ...current, time: event.target.value }))} /></label>
      <label>Duración<select aria-label="Duración" value={newAppt.duration} onChange={event => setNewAppt(current => ({ ...current, duration: Number(event.target.value) }))}>{DURACIONES_TURNO.map(duration => <option key={duration} value={duration}>{duration} min</option>)}</select></label>
      <label>Modalidad<select aria-label="Modalidad" value={newAppt.channel} onChange={event => setNewAppt(current => ({ ...current, channel: event.target.value as 'video' | 'presencial' }))}><option value="presencial">Consultorio</option><option value="video">Videollamada</option></select></label>
      {newAppt.channel === 'video' && <label>Enlace de videollamada (opcional)<input aria-label="Enlace de videollamada" type="url" maxLength={500} placeholder="https://…" value={newAppt.meetUrl} onChange={event => setNewAppt(current => ({ ...current, meetUrl: event.target.value }))} /></label>}
      {apptError && <p className="ag-aviso" role="alert">{apptError}</p>}
      <div className="p5-row"><button type="button" className="p5-btn" disabled={savingAppt} onClick={() => setCreatingAppt(false)}>Volver</button><button className="p5-btn p5-pri" disabled={savingAppt}>{savingAppt ? 'Guardando…' : 'Guardar turno'}</button></div>
    </form></div>}
    {blocking && <div className="p5-dialog" role="dialog" aria-modal="true" aria-labelledby="p5-block-title"><form onSubmit={saveBlock}><h3 id="p5-block-title">Bloquear horario</h3>
      <label>Día<input type="date" required value={block.day} onChange={event => setBlock(current => ({ ...current, day: event.target.value }))} /></label>
      <label>Desde<input type="time" required value={block.start} onChange={event => setBlock(current => ({ ...current, start: event.target.value }))} /></label>
      <label>Hasta<input type="time" required value={block.end} onChange={event => setBlock(current => ({ ...current, end: event.target.value }))} /></label>
      <label>Motivo<input maxLength={80} value={block.label} onChange={event => setBlock(current => ({ ...current, label: event.target.value }))} /></label>
      <div className="p5-row"><button type="button" className="p5-btn" onClick={() => setBlocking(false)}>Volver</button><button className="p5-btn p5-pri" disabled={scheduling.busy}>Guardar bloqueo</button></div>
    </form></div>}
  </>;
}
