import { useEffect, useRef, useState, type ReactNode, type MouseEvent } from 'react';
import type { Patient } from '../../types';
import type { CrmWorkItem, CrmWorkKind, CrmWorkResponse } from '../../types/crm-work';
import type { BillingBoard } from '../../types/fees';
import type { ProfessionalIntakeView } from '../../types/intake';
import type { CareSnapshot } from '../../types/care';
import type { SchedulingWorkspaceSnapshot } from '../../api/scheduling';
import { api } from '../../api/client';
import { careApi } from '../../api/care';
import { formatPesos } from '../../fees';
import { HOME_ZONE, copyHomeBookingLink, homeAppointments, homeAttention, homeDay, homeMonth, homeNews, homePendingTotal, patientHref, patientMessageHref, type HomeAppointment } from '../../lib/panel-home';
import { Icon, type IconName } from '../shared/Icon';
import { healthFactLabel } from './intake-review';
import { useHomeData, type HomeFilter } from './use-home-data';
import './panel-home.css';

type Open = (href: string) => void;
function HomeLink({ href, onOpen, children, className = '', ...props }: { href: string; onOpen: Open; children: ReactNode; className?: string; 'aria-label'?: string }) {
  const click = (event: MouseEvent<HTMLAnchorElement>) => { if (event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return; event.preventDefault(); onOpen(href); };
  return <a href={href} className={className} onClick={click} {...props}>{children}</a>;
}
const formatTime = (at: Date) => at.toLocaleTimeString('es-AR', { timeZone: HOME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const channelLabel = (channel: string) => channel === 'video' ? 'Online' : channel === 'presencial' ? 'Consultorio' : 'Modalidad por confirmar';
/** Fecha del encabezado de Inicio como en el boceto: «Miércoles 21 de octubre». */
export function panelHomeWhen(now: Date) {
  const text = now.toLocaleDateString('es-AR', { timeZone: HOME_ZONE, weekday: 'long', day: 'numeric', month: 'long' }).replace(',', '');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Saludo de Inicio según la hora del consultorio, con el primer nombre si existe (nunca uno inventado). */
export function panelHomeGreeting(name: string, now: Date) {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: HOME_ZONE, hour: '2-digit', hourCycle: 'h23' }).format(now));
  const greeting = hour < 12 ? 'Buen día' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';
  return `${greeting}${name.trim() ? `, ${name.trim().split(/\s+/)[0]}` : ''}`;
}

function PreparedAppointment({ entry, now, onOpen }: { entry: HomeAppointment | null; now: Date; onOpen: Open }) {
  const [intake, setIntake] = useState<ProfessionalIntakeView | null>(null);
  const [care, setCare] = useState<CareSnapshot | null>(null);
  const [failed, setFailed] = useState(false);
  const [revision, setRevision] = useState(0);
  const [preparedOpen, setPreparedOpen] = useState(true);
  useEffect(() => {
    const media = window.matchMedia('(min-width:800px)');
    const update = () => setPreparedOpen(media.matches);
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const id = entry?.patient.id;
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController(); setIntake(null); setCare(null); setFailed(false);
    // Los endpoints existentes conservan el alcance profesional y los permisos clínicos.
    api.getProfessionalIntake(id, { signal: controller.signal }).then(view => { if (!controller.signal.aborted) setIntake(view); }).catch(() => { if (!controller.signal.aborted) setFailed(true); });
    careApi.snapshot(id, true, controller.signal).then(view => { if (!controller.signal.aborted) setCare(view); }).catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [id, revision]);
  if (!entry) return <section className="ph-next"><h2>Próxima consulta</h2><p>No hay una próxima consulta programada.</p><HomeLink href="/crm/agenda" onOpen={onOpen} className="ph-button ph-ink">Abrir agenda</HomeLink></section>;
  const { patient, at } = entry;
  const minutes = Math.ceil((at.getTime() - now.getTime()) / 60_000);
  const when = minutes <= 0 ? 'En curso' : minutes < 60 ? `En ${minutes} min` : homeDay(at) === homeDay(now) ? 'Hoy' : at.toLocaleDateString('es-AR', { timeZone: HOME_ZONE, day: 'numeric', month: 'short' });
  const weights = (care?.measurements ?? []).filter(m => m.kind === 'weight' && m.captured_on <= homeDay(now)).sort((a,b) => b.captured_on.localeCompare(a.captured_on) || b.created_at.localeCompare(a.created_at));
  const weight = weights[0];
  return <section className="ph-next" aria-label="Próxima consulta preparada"><div className="ph-chips"><span>Próxima consulta · {when}</span><span>{formatTime(at)} · {channelLabel(entry.channel)}</span></div>
    <div className="ph-person"><span className="ph-avatar">{patient.initials}</span><div><h2>{patient.name}</h2><p>{patient.goal || 'Objetivo por definir'}</p></div></div>
    <details className="ph-preparation" open={preparedOpen} onToggle={event => setPreparedOpen(event.currentTarget.open)}><summary>Ver preparación de la consulta</summary><div className="ph-health"><span><b>Alergias:</b> {intake ? healthFactLabel(intake.intake.payload.allergies, 'alergias') : failed ? 'No disponible' : 'Consultando…'}</span><span><b>Restricciones:</b> {intake ? healthFactLabel(intake.intake.payload.restrictions, 'restricciones') : failed ? 'No disponible' : 'Consultando…'}</span></div>
    <div className="ph-facts"><div><small>Último peso</small><b>{weight ? `${weight.value_numeric.toLocaleString('es-AR')} ${weight.unit}` : care ? 'Sin dato' : failed ? 'No disponible' : 'Consultando…'}</b></div><div><small>Adherencia</small><b>{patient.adherence_score}%</b><small>registrada</small></div><div><small>Quedó pendiente</small><span>{patient.next_focus || 'Sin pendientes anotados'}</span></div></div></details>
    <div className="ph-next-actions"><HomeLink href={patientHref(patient, 'notas')} onOpen={onOpen} className="ph-button ph-ink">Preparar consulta</HomeLink><HomeLink href={patientHref(patient)} onOpen={onOpen} className="ph-button ph-glass">Ver ficha</HomeLink>{failed && <button type="button" className="ph-retry" onClick={() => setRevision(value => value + 1)}>Reintentar datos</button>}</div>
  </section>;
}

const TASKS: Record<CrmWorkKind, { label: string; action: string; icon: IconName; tone: string }> = {
  intake: { label: 'Ingresos', action: 'Revisar', icon: 'contact', tone: 'gold' },
  meal: { label: 'Comidas', action: 'Revisar', icon: 'camera', tone: 'orange' },
  ai_menu: { label: 'Planes', action: 'Revisar', icon: 'list', tone: 'lime' },
  message: { label: 'Mensajes', action: 'Responder', icon: 'message', tone: 'lime' },
  payment: { label: 'Pagos', action: 'Confirmar', icon: 'wallet', tone: 'gold' },
  appointment: { label: 'Reprogramar', action: 'Reprogramar', icon: 'calendar', tone: 'gold' },
  record: { label: 'Registros', action: 'Revisar', icon: 'edit', tone: 'gold' },
  fee_overdue: { label: 'Cobros', action: 'Recordar', icon: 'wallet', tone: 'orange' },
  quiet: { label: 'Sin registros', action: 'Escribir', icon: 'message', tone: 'orange' },
};
function TaskRow({ item, onOpen }: { item: CrmWorkItem; onOpen: Open }) {
  const config = TASKS[item.kind];
  return <li className="ph-task"><span className={`ph-icon ph-${config.tone}`}><Icon name={config.icon} size={18} /></span><div><b>{item.patient_name}</b><p>{item.title}</p></div><HomeLink href={item.href} onOpen={onOpen} className="ph-button" aria-label={`${config.action}: ${item.patient_name}`}>{config.action}</HomeLink></li>;
}

type ViewProps = {
  patients: Patient[]; now: Date; data: CrmWorkResponse | null; loading: boolean; error: string; kind: HomeFilter;
  onKind: (kind: HomeFilter) => void; onRefresh: () => void; onNext: () => void; hasPrevious: boolean;
  board: BillingBoard | null; billingError: boolean; scheduling: SchedulingWorkspaceSnapshot | null; schedulingError: boolean;
  onOpen: Open; onCopy: () => void; copyStatus: string;
};
export function PanelHomeView({ patients, now, data, loading, error, kind, onKind, onRefresh, onNext, hasPrevious, board, billingError, scheduling, schedulingError, onOpen, onCopy, copyStatus }: ViewProps) {
  const appointments = homeAppointments(patients, now);
  const items = (data?.items ?? []).filter(item => item.kind !== 'appointment' || item.status === 'needs_change');
  const reservations = scheduling?.bookings.filter(booking => booking.status === 'requested') ?? [];
  const total = data ? homePendingTotal(data.counts, data.home?.reschedule_count) : null;
  const attention = homeAttention(patients, data?.home?.quiet ?? []);
  const news = homeNews(patients, now, data?.home?.meal_streaks);
  const month = homeMonth(patients, board, now);
  const publicPage = scheduling?.profile.config.page;
  const filters: Array<{ id: HomeFilter; label: string; count: number | null }> = [
    { id: '', label: 'Todos', count: total === null || !scheduling ? null : total + reservations.length },
    ...(['meal', 'message'] as const).map(id => ({ id, label: TASKS[id].label, count: data?.counts[id] ?? null })),
    { id: 'reservas', label: 'Reservas', count: scheduling ? reservations.length : null },
    ...(['fee_overdue', 'ai_menu'] as const).map(id => ({ id, label: TASKS[id].label, count: data?.counts[id] ?? null })),
  ];
  return <section className="ph-home" aria-label="Inicio del consultorio">
    <div className="ph-grid-two ph-top">
      <section className="ph-summary"><div className="ph-eyebrow"><Icon name="sun" size={16} />Resumen del día · calculado con tus datos</div><p className="ph-summary-text">Hoy tenés <em>{appointments.today.length} consultas</em> y <em>{total === null ? 'pendientes por consultar' : scheduling ? `${total + reservations.length} pendientes` : `${total} pendientes registrados`}</em>. {appointments.next ? `Prepará la consulta de ${appointments.next.patient.name}.` : 'Revisá tu bandeja para organizar el día.'}</p><div className="ph-counts">{(['meal', 'message', 'fee_overdue', 'record'] as const).map(id => <button type="button" key={id} onClick={() => onKind(id)} className={id === 'fee_overdue' && data?.counts[id] ? 'ph-hot' : ''}><b>{data?.counts[id] ?? '—'}</b>{TASKS[id].label.toLocaleLowerCase('es-AR')}</button>)}<button type="button" onClick={() => onKind('reservas')}><b>{scheduling ? reservations.length : '—'}</b>reservas</button></div></section>
      <PreparedAppointment key={appointments.next?.patient.id ?? 'none'} entry={appointments.next} now={now} onOpen={onOpen} />
    </div>
    <div className="ph-quick" aria-label="Accesos rápidos">
      <HomeLink href="/crm/pacientes?accion=crear" onOpen={onOpen}><Icon name="users" size={19} />Nueva paciente</HomeLink>
      <HomeLink href="/crm/plan?planes=todos" onOpen={onOpen}><Icon name="list" size={19} />Armar un plan</HomeLink>
      {publicPage?.enabled ? <button type="button" onClick={onCopy}><Icon name="arrow" size={19} />Copiar link de reserva</button> : <HomeLink href="/crm/agenda?agenda=publica" onOpen={onOpen}><Icon name="arrow" size={19} />Configurar link de reserva</HomeLink>}
      <HomeLink href="/crm/cobranzas" onOpen={onOpen}><Icon name="wallet" size={19} />Registrar cobro</HomeLink>
    </div>{copyStatus && <p className="ph-feedback" role="status">{copyStatus}</p>}
    <div className="ph-grid-two ph-middle">
      <section className="ph-card ph-pending"><header><h2>Pendientes</h2><button type="button" className="ph-retry" disabled={loading} onClick={onRefresh}>Actualizar</button></header>
        <div className="ph-tabs" role="group" aria-label="Tipo de pendiente">{filters.map(filter => <button key={filter.id} type="button" aria-pressed={kind === filter.id} onClick={() => onKind(filter.id)}>{filter.label} <b>{filter.count ?? '—'}</b></button>)}<select aria-label="Otros pendientes" value={['intake','record','payment','quiet','appointment'].includes(kind) ? kind : ''} onChange={event => onKind(event.target.value as HomeFilter)}><option value="">Otros</option>{(['intake','record','payment','quiet','appointment'] as const).map(id => <option value={id} key={id}>{TASKS[id].label} ({id === 'appointment' ? data?.home?.reschedule_count ?? '—' : data?.counts[id] ?? '—'})</option>)}</select></div>
        <div className="ph-scroll" tabIndex={0} aria-label="Lista de pendientes">
          {kind === 'reservas' ? schedulingError ? <div className="ph-empty" role="alert">No pudimos consultar las reservas.<button type="button" className="ph-retry" onClick={onRefresh}>Reintentar reservas</button></div> : !scheduling ? <p className="ph-empty" role="status">Consultando reservas…</p> : reservations.length ? <ul>{reservations.map(booking => <li className="ph-task" key={booking.id}><span className="ph-icon ph-gold"><Icon name="calendar" size={18} /></span><div><b>{booking.contact_name}</b><p>{new Date(booking.starts_at).toLocaleString('es-AR', { timeZone: HOME_ZONE, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · Reserva por confirmar</p></div><HomeLink href="/crm/agenda?agenda=reservas" onOpen={onOpen} className="ph-button">Revisar</HomeLink></li>)}</ul> : <p className="ph-empty">No hay reservas por confirmar.</p>
          : loading ? <p className="ph-empty" role="status">Consultando pendientes…</p> : error ? <div className="ph-empty" role="alert">{error}<button type="button" className="ph-retry" onClick={onRefresh}>Reintentar pendientes</button></div> : <>
            {!kind && reservations.length > 0 && <div className="ph-task"><span className="ph-icon ph-gold"><Icon name="calendar" size={18} /></span><div><b>{reservations.length} reservas por confirmar</b><p>Revisá los horarios y vinculá cada paciente.</p></div><button type="button" className="ph-button" onClick={() => onKind('reservas')}>Revisar</button></div>}
            {items.length ? <ul>{items.map(item => <TaskRow key={item.id} item={item} onOpen={onOpen} />)}</ul> : <p className="ph-empty">No hay pendientes en este filtro.</p>}
            {(hasPrevious || data?.next_cursor) && <div className="ph-pagination">{hasPrevious && <button type="button" className="ph-retry" onClick={onRefresh}>Volver al principio</button>}{data?.next_cursor && <button type="button" className="ph-retry" onClick={onNext}>Siguientes pendientes</button>}</div>}
          </>}
        </div>
        {schedulingError && kind !== 'reservas' && <p className="ph-source-warning">Reservas no disponibles. <button type="button" className="ph-retry" onClick={onRefresh}>Reintentar reservas</button></p>}
      </section>
      <section className="ph-card ph-agenda"><header><h2>Consultas de hoy</h2><HomeLink href="/crm/agenda" onOpen={onOpen}>Ver agenda <Icon name="arrow" size={14} /></HomeLink></header><div className="ph-scroll" tabIndex={0} aria-label="Consultas de hoy">{appointments.today.length ? <ol className="ph-timeline">{appointments.today.map(entry => <li key={`${entry.patient.id}:${entry.at.toISOString()}`} className={entry === appointments.next ? 'ph-now' : entry.at.getTime() + entry.duration * 60_000 <= now.getTime() ? 'ph-done' : ''}><time dateTime={entry.at.toISOString()}>{formatTime(entry.at)}</time><span className="ph-rail" /><HomeLink href={patientHref(entry.patient, 'consultas')} onOpen={onOpen}><b>{entry.patient.name}</b><span>{entry.duration} min · {channelLabel(entry.channel)}</span></HomeLink></li>)}</ol> : <p className="ph-empty">No tenés consultas programadas para hoy.</p>}</div></section>
    </div>
    <div className="ph-grid-three ph-bottom">
      <section className="ph-card"><header><span className="ph-pip ph-orange" /><h2>Necesitan atención</h2><HomeLink href="/crm/seguimiento" onOpen={onOpen} aria-label="Ver todas las pacientes que necesitan atención"><Icon name="arrow" size={15} /></HomeLink></header><div className="ph-scroll" tabIndex={0} aria-label="Pacientes que necesitan atención">{attention.length ? <ul>{attention.map(notice => <li key={notice.id} className="ph-notice"><span className="ph-avatar ph-orange">{notice.patient.initials}</span><div><b>{notice.patient.name}</b><p>{notice.detail}</p></div><HomeLink href={patientMessageHref(notice.patient)} onOpen={onOpen} className="ph-button" aria-label={`Escribir a ${notice.patient.name}`}>Escribir</HomeLink></li>)}</ul> : <p className="ph-empty">Sin alertas en los datos disponibles.</p>}</div></section>
      <section className="ph-card"><header><span className="ph-pip ph-lime" /><h2>Buenas noticias</h2></header><div className="ph-scroll" tabIndex={0} aria-label="Buenas noticias">{news.length ? <ul>{news.map(notice => <li key={notice.id} className="ph-notice"><span className="ph-avatar ph-lime">{notice.patient.initials}</span><div><b>{notice.patient.name}</b><p>{notice.detail}</p></div><HomeLink href={patientMessageHref(notice.patient)} onOpen={onOpen} className="ph-button" aria-label={`Felicitar a ${notice.patient.name}`}><Icon name="heart" size={14} /><span className="ph-congratulate">Felicitar</span></HomeLink></li>)}</ul> : <p className="ph-empty">Las metas alcanzadas, rachas de comidas y aniversarios van a aparecer acá.</p>}</div></section>
      <section className="ph-card ph-month"><header><h2>Tu consultorio · {now.toLocaleDateString('es-AR', { timeZone: HOME_ZONE, month: 'long' })}</h2></header><dl><div><dt>Pacientes activas</dt><dd>{month.active}</dd></div><div><dt>Consultas del mes</dt><dd>{month.consultations}</dd><small>Horarios transcurridos</small></div><div><dt>Cobrado este mes</dt><dd>{month.collected === null ? billingError ? 'No disponible' : 'Consultando…' : formatPesos(month.collected)}</dd></div><div><dt>Por cobrar del mes</dt><dd>{month.outstanding === null ? billingError ? 'No disponible' : 'Consultando…' : formatPesos(month.outstanding)}</dd></div></dl>{billingError && <button type="button" className="ph-retry" onClick={onRefresh}>Reintentar cobros</button>}</section>
    </div>
    {data?.source === 'memory' && <p className="ph-demo">Modo demo · datos ficticios.</p>}
  </section>;
}

export function PanelHome({ patients, now, onOpen }: { patients: Patient[]; now: Date; onOpen: Open }) {
  const state = useHomeData(homeDay(now));
  const [copyStatus, setCopyStatus] = useState('');
  const copy = async () => {
    const page = state.scheduling?.profile.config.page;
    if (!page?.enabled) return;
    try { await copyHomeBookingLink(page, window.location.origin, text => navigator.clipboard.writeText(text)); setCopyStatus('Link de reserva copiado.'); }
    catch { setCopyStatus('No pudimos copiar el enlace. Abrí Página pública para copiarlo.'); }
  };
  return <PanelHomeView {...state} patients={patients} now={now} onOpen={onOpen} onCopy={() => void copy()} copyStatus={copyStatus} />;
}
