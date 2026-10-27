// Lo que Inicio v29 dibuja, armado solo con datos reales. No inventa cifras: sin dato dice «Sin dato».
import type { Patient } from '../../types';
import type { CrmWorkItem, CrmWorkKind, CrmWorkResponse } from '../../types/crm-work';
import type { BillingBoard } from '../../types/fees';
import { summarizeLedger } from '../../fees';
import { incomeIn } from '../../lib/inicio-indicators';
import { HOME_ZONE, homeAppointments, homeDay, patientHref, patientMessageHref, type HomeAppointment, type HomePatientNotice } from '../../lib/panel-home';
import type { PanelV29IconName } from './panel-v29-icons';
import { fondoAvatar, inicialesDe } from './seguimiento-presentacion';

export type Tono = 'l' | 'b' | 'a' | 'r';
export type DetalleAccion = { icono: PanelV29IconName; texto: string; href: string; principal?: boolean };
export type DetalleObservacion = { clase: 'pa' | 'pb' | 'pr'; icono: PanelV29IconName; titulo: string; texto: string };
export type Detalle = {
  hd: string; live?: string; iniciales: string; fondo: string; nombre: string; sub: string;
  hero: string; unidad?: string; leyenda?: string;
  grid?: Array<[string, string, string?]>; lista?: Array<[string, string]>;
  observaciones?: DetalleObservacion[]; sinObservaciones?: string;
  acciones: DetalleAccion[];
  /** Paciente de la que se piden el último peso y los datos de ingreso. */
  pacienteId?: string;
};
export type PendienteFila = { key: string; filtro: 'hacer' | 'fel'; tono: Tono; icono: PanelV29IconName; titulo: string; sub: string; tipo: string; detalle: Detalle };
export type AtencionFila = { key: string; iniciales: string; fondo: string; nombre: string; sub: string; motivo: string; tono: 'a' | 'r'; detalle: Detalle };
/** Lo que se sabe de una paciente que no viene en la lista: último peso y alergias o restricciones. */
export type DetalleExtra = { peso: string; alergias: string; restricciones: string; estado: 'cargando' | 'listo' | 'error' };

const CONFIG: Record<Exclude<CrmWorkKind, 'quiet'>, { icono: PanelV29IconName; tono: Tono; tipo: string; hd: string; unidad: string; titulo: (nombre: string) => string; accion: string }> = {
  meal: { icono: 'fork', tono: 'a', tipo: 'Comidas', hd: 'Comida para revisar', unidad: 'comidas', titulo: nombre => `Revisar la comida de ${nombre}`, accion: 'Revisar comida' },
  message: { icono: 'chat', tono: 'b', tipo: 'Mensajes', hd: 'Mensaje sin responder', unidad: 'mensajes', titulo: nombre => `Responderle a ${nombre}`, accion: 'Responder' },
  ai_menu: { icono: 'clip', tono: 'l', tipo: 'Plan', hd: 'Plan para aprobar', unidad: 'planes', titulo: nombre => `Aprobar el plan de ${nombre}`, accion: 'Revisar plan' },
  payment: { icono: 'coin', tono: 'l', tipo: 'Cobros', hd: 'Pago para registrar', unidad: 'pagos', titulo: nombre => `Registrar el pago de ${nombre}`, accion: 'Registrar pago' },
  fee_overdue: { icono: 'coin', tono: 'r', tipo: 'Cobros', hd: 'Cuota vencida', unidad: 'cuotas', titulo: nombre => `Cuota vencida de ${nombre}`, accion: 'Recordar' },
  intake: { icono: 'file', tono: 'a', tipo: 'Ingresos', hd: 'Ingreso para revisar', unidad: 'ingresos', titulo: nombre => `Revisar el ingreso de ${nombre}`, accion: 'Revisar ingreso' },
  record: { icono: 'pen', tono: 'a', tipo: 'Registros', hd: 'Registros para revisar', unidad: 'registros', titulo: nombre => `Revisar los registros de ${nombre}`, accion: 'Revisar registros' },
  appointment: { icono: 'swap', tono: 'a', tipo: 'Agenda', hd: 'Pedido de cambio de turno', unidad: 'pedidos', titulo: nombre => `${nombre} pidió cambiar su turno`, accion: 'Reprogramar' },
};

export const hora = (fecha: Date) => fecha.toLocaleTimeString('es-AR', { timeZone: HOME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
export const modalidad = (canal: string) => canal === 'video' ? 'Videollamada' : canal === 'presencial' ? 'Consultorio' : 'Por confirmar';
const num = (valor: number) => valor.toLocaleString('es-AR');
const minutosHasta = (fecha: Date, ahora: Date) => Math.ceil((fecha.getTime() - ahora.getTime()) / 60_000);

function persona(paciente: Patient) {
  return { iniciales: inicialesDe(paciente.name, paciente.initials), fondo: fondoAvatar(paciente.tone), nombre: paciente.name };
}

/** Los cuatro datos de la ficha que sí están en la lista de pacientes; el peso llega después. */
function datosDe(paciente: Patient, extra: DetalleExtra | null, proxima: HomeAppointment | null): Array<[string, string, string?]> {
  const peso = extra ? extra.estado === 'cargando' ? 'Consultando…' : extra.peso : 'Sin dato';
  return [
    ['Adherencia', paciente.adherence_score > 0 ? `${paciente.adherence_score}%` : 'Sin dato', 'registrada'],
    ['Último peso', peso],
    ['Objetivo', paciente.goal?.trim() || 'Sin definir', paciente.goal_progress != null && paciente.goal ? `${Math.round(paciente.goal_progress)}% logrado` : undefined],
    ['Próxima consulta', proxima && proxima.patient.id === paciente.id ? `${hora(proxima.at)}` : paciente.appointment ? 'Agendada' : 'Sin turno'],
  ];
}

function observacionesDe(extra: DetalleExtra | null): Pick<Detalle, 'observaciones' | 'sinObservaciones'> {
  if (!extra || extra.estado === 'cargando') return { sinObservaciones: 'Consultando…' };
  if (extra.estado === 'error') return { sinObservaciones: 'No disponible' };
  return { observaciones: [
    { clase: 'pa', icono: 'shield', titulo: 'Alergias', texto: extra.alergias },
    { clase: 'pb', icono: 'heart', titulo: 'Restricciones', texto: extra.restricciones },
  ] };
}

const ficha = (paciente: Patient): DetalleAccion => ({ icono: 'file', texto: 'Ficha', href: patientHref(paciente) });

export type DatosInicio = {
  pacientes: readonly Patient[]; ahora: Date; data: CrmWorkResponse | null;
  novedades: readonly HomePatientNotice[]; atencion: readonly HomePatientNotice[];
  reservas: ReadonlyArray<{ id: string; nombre: string; cuando: string }>;
  rachas: ReadonlyArray<{ patient_id: string; days: number; at_least: boolean }>;
};

function detalleProxima(entrada: HomeAppointment, ahora: Date, extra: DetalleExtra | null): Detalle {
  const { patient } = entrada;
  const minutos = minutosHasta(entrada.at, ahora);
  const cuando = minutos <= 0 ? 'en curso' : minutos < 60 ? `en ${minutos} min` : undefined;
  return {
    hd: 'Próxima consulta', live: cuando, ...persona(patient), sub: `${entrada.duration} min · ${modalidad(entrada.channel)}`,
    hero: hora(entrada.at), unidad: cuando ? undefined : homeDay(entrada.at) === homeDay(ahora) ? 'hoy' : undefined,
    leyenda: patient.goal_progress != null && patient.goal ? `${Math.round(patient.goal_progress)}% del objetivo` : patient.next_focus || undefined,
    grid: datosDe(patient, extra, entrada), ...observacionesDe(extra), pacienteId: patient.id,
    acciones: [ficha(patient), { icono: 'play', texto: 'Preparar consulta', href: patientHref(patient, 'notas'), principal: true }],
  };
}

function detalleTarea(item: CrmWorkItem, paciente: Patient | undefined, data: CrmWorkResponse | null, extra: DetalleExtra | null, proxima: HomeAppointment | null): Detalle {
  const kind = item.kind as Exclude<CrmWorkKind, 'quiet'>;
  const cfg = CONFIG[kind];
  const total = kind === 'appointment' ? undefined : data?.counts[kind];
  const base = {
    hd: cfg.hd, iniciales: paciente ? persona(paciente).iniciales : inicialesDe(item.patient_name), fondo: fondoAvatar(paciente?.tone), nombre: item.patient_name,
    sub: item.title, hero: total != null ? num(total) : '1', unidad: total != null ? cfg.unidad : undefined, leyenda: total != null ? 'en todo tu consultorio' : undefined,
  };
  const principal: DetalleAccion = kind === 'message' && paciente
    ? { icono: 'send', texto: cfg.accion, href: patientMessageHref(paciente), principal: true }
    : { icono: kind === 'payment' || kind === 'fee_overdue' ? 'coin' : 'eye', texto: cfg.accion, href: item.href, principal: true };
  const primera: DetalleAccion = kind === 'fee_overdue' || kind === 'payment' ? { icono: 'coin', texto: 'Ver cobranzas', href: '/crm/cobranzas' } : paciente ? ficha(paciente) : { icono: 'file', texto: 'Ficha', href: item.href };
  return {
    ...base, ...(paciente ? { grid: datosDe(paciente, extra, proxima), ...observacionesDe(extra), pacienteId: paciente.id } : { lista: [['Paciente', item.patient_name], ['Detalle', item.title]] as Array<[string, string]> }),
    acciones: [primera, principal],
  };
}

function detalleAviso(aviso: HomePatientNotice, hd: string, hero: string, unidad: string | undefined, extra: DetalleExtra | null, proxima: HomeAppointment | null, accion: DetalleAccion): Detalle {
  return {
    hd, ...persona(aviso.patient), sub: aviso.detail, hero, unidad, leyenda: undefined,
    grid: datosDe(aviso.patient, extra, proxima), ...observacionesDe(extra), pacienteId: aviso.patient.id,
    acciones: [ficha(aviso.patient), accion],
  };
}

function detalleReservas(reservas: DatosInicio['reservas']): Detalle {
  return {
    hd: 'Reservas por confirmar', iniciales: '·', fondo: fondoAvatar(undefined), nombre: reservas.length === 1 ? reservas[0]!.nombre : `${reservas[0]!.nombre} y ${reservas.length - 1} más`,
    sub: 'Pidieron turno desde tu página pública', hero: String(reservas.length), unidad: reservas.length === 1 ? 'reserva' : 'reservas',
    lista: reservas.slice(0, 4).map(reserva => [reserva.nombre, reserva.cuando] as [string, string]),
    acciones: [{ icono: 'cal', texto: 'Abrir agenda', href: '/crm/agenda' }, { icono: 'check', texto: 'Revisar reservas', href: '/crm/agenda?agenda=reservas', principal: true }],
  };
}

export function armarPendientes(entrada: DatosInicio, extras: Readonly<Record<string, DetalleExtra>>): PendienteFila[] {
  const { pacientes, ahora, data } = entrada;
  const filas: PendienteFila[] = [];
  const proxima = homeAppointments(pacientes, ahora).next;
  const extraDe = (id: string | undefined) => (id ? extras[id] ?? null : null);
  if (proxima) {
    filas.push({ key: `proxima:${proxima.patient.id}`, filtro: 'hacer', tono: 'l', icono: 'steth', titulo: `Preparar la consulta de ${proxima.patient.name}`, sub: `${hora(proxima.at)} · ${modalidad(proxima.channel)}${proxima.patient.goal ? ` · ${proxima.patient.goal}` : ''}`, tipo: 'Próxima', detalle: detalleProxima(proxima, ahora, extraDe(proxima.patient.id)) });
  }
  const porId = new Map(pacientes.map(paciente => [paciente.id, paciente]));
  for (const item of data?.items ?? []) {
    if (item.kind === 'quiet' || (item.kind === 'appointment' && item.status !== 'needs_change')) continue;
    const cfg = CONFIG[item.kind];
    filas.push({ key: item.id, filtro: 'hacer', tono: cfg.tono, icono: cfg.icono, titulo: cfg.titulo(item.patient_name), sub: item.title, tipo: cfg.tipo, detalle: detalleTarea(item, porId.get(item.patient_id), data, extraDe(item.patient_id), proxima) });
  }
  if (entrada.reservas.length) {
    filas.push({ key: 'reservas', filtro: 'hacer', tono: 'a', icono: 'cal', titulo: entrada.reservas.length === 1 ? '1 reserva por confirmar' : `${entrada.reservas.length} reservas por confirmar`, sub: 'Revisá los horarios y vinculá cada paciente', tipo: 'Agenda', detalle: detalleReservas(entrada.reservas) });
  }
  for (const aviso of entrada.novedades) {
    const racha = entrada.rachas.find(entry => aviso.id === `${entry.patient_id}:streak`);
    const [icono, hero, unidad]: [PanelV29IconName, string, string | undefined] = aviso.id.endsWith(':goal') ? ['trend', '✓', 'objetivo'] : racha ? ['flame', num(racha.days), 'días'] : ['star', '✓', 'aniversario'];
    filas.push({ key: `fel:${aviso.id}`, filtro: 'fel', tono: 'l', icono, titulo: aviso.patient.name, sub: aviso.detail, tipo: 'Felicitar', detalle: detalleAviso(aviso, 'Para felicitar', hero, unidad, extraDe(aviso.patient.id), proxima, { icono: 'heart', texto: 'Felicitar', href: patientMessageHref(aviso.patient), principal: true }) });
  }
  return filas;
}

export function armarAtencion(entrada: DatosInicio, extras: Readonly<Record<string, DetalleExtra>>): AtencionFila[] {
  const quietos = new Set((entrada.data?.home?.quiet ?? []).map(item => item.patient_id));
  const proxima = homeAppointments(entrada.pacientes, entrada.ahora).next;
  return entrada.atencion.map(aviso => {
    const paciente = aviso.patient;
    const motivo = quietos.has(paciente.id) ? 'Sin registros' : paciente.adherence_score > 0 && paciente.adherence_score < 70 ? 'Adherencia' : 'Para revisar';
    const hero = paciente.adherence_score > 0 ? `${paciente.adherence_score}%` : '—';
    return {
      key: `atn:${paciente.id}`, ...persona(paciente), sub: aviso.detail, motivo, tono: paciente.adherence_score > 0 && paciente.adherence_score < 50 ? 'r' : 'a',
      detalle: detalleAviso(aviso, 'Necesita atención', hero, 'adherencia', extras[paciente.id] ?? null, proxima, { icono: 'send', texto: 'Escribirle', href: patientMessageHref(paciente), principal: true }),
    };
  });
}

// --- Consultas de hoy / mañana / semana ---------------------------------------------------

export type RangoConsultas = 'hoy' | 'manana' | 'semana';
export type FilaConsulta = {
  key: string; hora: string; dia?: string; iniciales: string; fondo: string; nombre: string; consulta: string; canal: string; modalidad: string;
  adherencia: number | null; cuota: string; cuotaHoy: boolean; estado: string; pill: 'p-ok' | 'p-now' | 'p-conf' | 'p-wait'; clase: 'done' | 'now' | ''; href: string; video: boolean;
};

const DIA_MS = 86_400_000;
const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

export function cuotaDe(board: BillingBoard | null, pacienteId: string, hoy: string): { texto: string; hoy: boolean } {
  if (!board) return { texto: '—', hoy: false };
  const libro = board.patients.find(entry => entry.patient_id === pacienteId);
  if (!libro) return { texto: 'Sin cuota', hoy: false };
  const resumen = summarizeLedger(libro, hoy);
  if (resumen.state === 'debe') return { texto: resumen.debt_since === hoy ? 'Vence hoy' : 'Vencida', hoy: true };
  if (resumen.state === 'por_vencer') return { texto: resumen.next_due?.due_on === hoy ? 'Vence hoy' : 'Por vencer', hoy: resumen.next_due?.due_on === hoy };
  return { texto: resumen.state === 'sin_cuota' ? 'Sin cuota' : 'Al día', hoy: false };
}

function estadoDe(entrada: HomeAppointment, ahora: Date, esProxima: boolean): Pick<FilaConsulta, 'estado' | 'pill' | 'clase'> {
  if (entrada.elapsed || entrada.at.getTime() + entrada.duration * 60_000 <= ahora.getTime()) return { estado: 'Hecha', pill: 'p-ok', clase: 'done' };
  if (esProxima) return { estado: 'Próxima', pill: 'p-now', clase: 'now' };
  const turno = entrada.patient.appointment;
  if (turno?.patient_reply === 'needs_change') return { estado: 'Pide cambio', pill: 'p-wait', clase: '' };
  if (turno?.confirmed_at || turno?.patient_reply === 'attending') return { estado: 'Confirmada', pill: 'p-conf', clase: '' };
  return { estado: 'Sin confirmar', pill: 'p-wait', clase: '' };
}

export function armarConsultas(pacientes: readonly Patient[], ahora: Date, rango: RangoConsultas, board: BillingBoard | null): FilaConsulta[] {
  const desplazamientos = rango === 'hoy' ? [0] : rango === 'manana' ? [1] : [0, 1, 2, 3, 4, 5, 6];
  const proxima = homeAppointments(pacientes, ahora).next;
  const hoy = homeDay(ahora);
  const filas: FilaConsulta[] = [];
  for (const dias of desplazamientos) {
    const dia = new Date(ahora.getTime() + dias * DIA_MS);
    for (const entrada of homeAppointments(pacientes, dia).today) {
      const esProxima = proxima != null && proxima.patient.id === entrada.patient.id && proxima.at.getTime() === entrada.at.getTime();
      const cuota = cuotaDe(board, entrada.patient.id, hoy);
      const fecha = homeDay(entrada.at);
      filas.push({
        key: `${entrada.patient.id}:${entrada.at.toISOString()}`, hora: hora(entrada.at),
        dia: rango === 'semana' ? `${DIAS[new Date(`${fecha}T12:00:00Z`).getUTCDay()]} ${fecha.slice(8)}/${fecha.slice(5, 7)}` : undefined,
        ...persona(entrada.patient), consulta: `${entrada.duration} min`, canal: entrada.channel, modalidad: modalidad(entrada.channel), video: entrada.channel === 'video',
        adherencia: entrada.patient.adherence_score > 0 ? entrada.patient.adherence_score : null, cuota: cuota.texto, cuotaHoy: cuota.hoy,
        ...estadoDe(entrada, ahora, esProxima), href: patientHref(entrada.patient, 'consultas'),
      });
    }
  }
  return filas;
}

// --- Los cinco números de abajo -------------------------------------------------------------

export type Kpi = { etiqueta: string; icono: PanelV29IconName; valor: string; unidad?: string; pie: { clase: 'up' | 'wa' | ''; destacado: string; resto: string } };
export type KpiConsultas = Kpi & { puntos: Array<'s0' | 's1' | 's2'> };
export type KpiPacientes = Kpi & { columnas: Array<{ mes: string; alto: number }> };
export type KpiAdherencia = Kpi & { anillo: number; leyenda: string };
export type KpiCobrado = Kpi & { semanas: number[]; leyenda: string };
export type KpiPorCobrar = Kpi & { barras: Array<{ alto: number; dias: number }>; reintentar: boolean };

export function compacto(monto: number): { valor: string; unidad?: string } {
  const redondeo = (valor: number) => valor.toLocaleString('es-AR', { maximumFractionDigits: 2 });
  if (monto >= 1_000_000) return { valor: `$${redondeo(monto / 1_000_000)}`, unidad: 'M' };
  if (monto >= 10_000) return { valor: `$${Math.round(monto / 1000).toLocaleString('es-AR')}`, unidad: 'mil' };
  return { valor: `$${monto.toLocaleString('es-AR')}` };
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const activa = (p: Patient) => !p.archived_at && !p.deactivated_at && !p.anonymized_at;
const mesDe = (dia: string) => dia.slice(0, 7);
const mesesAtras = (dia: string, cuantos: number) => {
  const [anio, mes] = dia.split('-').map(Number) as [number, number];
  const total = anio * 12 + (mes - 1) - cuantos;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
};
const nombreMes = (clave: string) => new Date(`${clave}-01T12:00:00Z`).toLocaleDateString('es-AR', { timeZone: 'UTC', month: 'long' });

export function armarKpis(pacientes: readonly Patient[], ahora: Date, board: BillingBoard | null, billingError: boolean) {
  const hoy = homeDay(ahora), mes = mesDe(hoy);
  const turnosHoy = homeAppointments(pacientes, ahora).today;
  const hechas = turnosHoy.filter(entrada => entrada.elapsed || entrada.at.getTime() + entrada.duration * 60_000 <= ahora.getTime()).length;
  const consultas: KpiConsultas = {
    etiqueta: 'Consultas de hoy', icono: 'cal', valor: String(turnosHoy.length), unidad: turnosHoy.length === 1 ? 'consulta' : 'consultas',
    puntos: turnosHoy.length ? turnosHoy.map((_, i) => (i < hechas ? 's1' : 's2')) : ['s0', 's0', 's0', 's0'],
    pie: { clase: 'up', destacado: `${hechas} ${hechas === 1 ? 'hecha' : 'hechas'}`, resto: `${turnosHoy.length - hechas} por atender` },
  };
  const activas = pacientes.filter(activa);
  const alta = (p: Patient) => (p.created_at ? homeDay(new Date(p.created_at)) : null);
  const claves = [5, 4, 3, 2, 1, 0].map(n => mesesAtras(hoy, n));
  const hasta = (clave: string) => activas.filter(p => { const dia = alta(p); return dia != null && mesDe(dia) <= clave; }).length;
  const serie = claves.map(hasta);
  const tope = Math.max(...serie, 1);
  const nuevas = activas.filter(p => { const dia = alta(p); return dia != null && mesDe(dia) === mes; }).length;
  const pacientesKpi: KpiPacientes = {
    etiqueta: 'Pacientes activas', icono: 'users', valor: String(activas.length),
    columnas: claves.map((clave, i) => ({ mes: MESES[Number(clave.slice(5)) - 1]!, alto: Math.round(8 + 12 * ((serie[i] ?? 0) / tope)) })),
    pie: { clase: 'up', destacado: `+${nuevas}`, resto: 'este mes' },
  };
  const conDato = activas.filter(p => p.adherence_score > 0);
  const promedio = conDato.length ? Math.round(conDato.reduce((total, p) => total + p.adherence_score, 0) / conDato.length) : null;
  const adherencia: KpiAdherencia = {
    etiqueta: 'Adherencia al plan', icono: 'heart', valor: promedio == null ? '—' : String(promedio), unidad: promedio == null ? undefined : '%', anillo: promedio ?? 0, leyenda: 'registrada',
    pie: { clase: '', destacado: String(conDato.length), resto: conDato.length === 1 ? 'paciente con adherencia' : 'pacientes con adherencia' },
  };
  let cobrado: KpiCobrado, porCobrar: KpiPorCobrar;
  const sinTablero = billingError ? 'No disponible' : 'Consultando…';
  if (!board) {
    cobrado = { etiqueta: `Cobrado en ${nombreMes(mes)}`, icono: 'coin', valor: '—', semanas: [], leyenda: sinTablero, pie: { clase: '', destacado: sinTablero, resto: '' } };
    porCobrar = { etiqueta: 'Por cobrar', icono: 'clock', valor: '—', barras: [], reintentar: billingError, pie: { clase: '', destacado: sinTablero, resto: '' } };
  } else {
    const ventana = { from: `${mes}-01`, to: hoy };
    const anterior = mesesAtras(hoy, 1);
    const actual = incomeIn(board, ventana).amount;
    const previo = incomeIn(board, { from: `${anterior}-01`, to: `${anterior}-31` }).amount;
    const compactoCobrado = compacto(actual);
    const cortes = [8, 15, 22];
    const porSemana = [0, 0, 0, 0];
    for (const libro of board.patients) for (const pago of libro.payments) {
      if (pago.status !== 'confirmed' || mesDe(pago.paid_on) !== mes) continue;
      const diaDelMes = Number(pago.paid_on.slice(8));
      porSemana[cortes.filter(corte => diaDelMes >= corte).length]! += pago.amount;
    }
    cobrado = {
      etiqueta: `Cobrado en ${nombreMes(mes)}`, icono: 'coin', ...compactoCobrado, leyenda: actual ? 'por semana' : 'sin pagos este mes',
      semanas: actual ? porSemana.map(monto => Math.round((monto / actual) * 100)) : [],
      pie: previo > 0 ? { clase: actual >= previo ? 'up' : 'wa', destacado: `${actual >= previo ? '+' : '−'}${Math.round((Math.abs(actual - previo) / previo) * 100)}%`, resto: `vs. ${nombreMes(anterior)}` } : { clase: '', destacado: 'Sin dato', resto: `de ${nombreMes(anterior)}` },
    };
    const vencidas = board.patients.flatMap(libro => summarizeLedger(libro, hoy).charges.filter(c => c.status === 'open' && c.due && c.paid < c.amount).map(c => ({ dias: Math.max(0, Math.round((Date.parse(`${hoy}T12:00:00Z`) - Date.parse(`${c.due_on}T12:00:00Z`)) / DIA_MS)), debe: c.amount - c.paid })));
    vencidas.sort((a, b) => b.dias - a.dias);
    const viejo = vencidas[0]?.dias ?? 0;
    const porCobrarMes = board.patients.reduce((total, libro) => total + summarizeLedger(libro, hoy).charges.filter(c => c.status === 'open' && c.due_on.startsWith(mes)).reduce((suma, c) => suma + c.amount - c.paid, 0), 0);
    porCobrar = {
      etiqueta: 'Por cobrar', icono: 'clock', ...compacto(porCobrarMes), reintentar: false,
      barras: vencidas.slice(0, 3).map(v => ({ alto: viejo ? Math.max(4, Math.round((v.dias / viejo) * 24)) : 4, dias: v.dias })),
      pie: vencidas.length ? { clase: 'wa', destacado: `${vencidas.length} ${vencidas.length === 1 ? 'vencida' : 'vencidas'}`, resto: `la más vieja, ${viejo} ${viejo === 1 ? 'día' : 'días'}` } : { clase: 'up', destacado: 'Sin vencidas', resto: 'todo al día' },
    };
  }
  return { consultas, pacientes: pacientesKpi, adherencia, cobrado, porCobrar };
}

/** Texto del encabezado: «· 6 consultas hoy» y «la próxima es a las 10:30». */
export function encabezadoInicio(pacientes: readonly Patient[], ahora: Date) {
  const { today, next } = homeAppointments(pacientes, ahora);
  return {
    sufijo: `· ${today.length === 0 ? 'sin consultas' : today.length === 1 ? '1 consulta' : `${today.length} consultas`} hoy`,
    proxima: next ? `la próxima es ${cuandoEsLaProxima(next.at, ahora)}a las ${hora(next.at)}` : 'no queda otra consulta hoy',
  };
}

/** Hoy no lleva día; si la próxima es otro día se dice cuál («mañana», «el vie 30»). */
function cuandoEsLaProxima(cuando: Date, ahora: Date) {
  const dia = homeDay(cuando);
  if (dia === homeDay(ahora)) return '';
  const manana = homeDay(new Date(ahora.getTime() + 86_400_000));
  if (dia === manana) return 'mañana ';
  const corto = new Intl.DateTimeFormat('es-AR', { timeZone: HOME_ZONE, weekday: 'short', day: 'numeric' }).format(cuando).replace('.', '');
  return `el ${corto} `;
}
