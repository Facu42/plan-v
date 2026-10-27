// Lo que Pacientes v29 dibuja, armado solo con datos reales. Sin dato dice «Sin dato», «Sin registros» o «—»; no se inventa nada.
import type { Patient } from '../../types';
import type { Measurement } from '../../types/care';
import type { BillingBoard } from '../../types/fees';
import type { PatientRowPreview } from '../../types/patient-preview';
import { HOME_ZONE, homeAppointments, homeDay } from '../../lib/panel-home';
import { daysAgoText, lastVisit } from './directory-last-visit';
import { sortDirectoryPatients, type DirectoryOrder } from './directory-sort';
import { cuotaDe, hora } from './inicio-presentacion';

export type FiltroPacientes = 'todas' | 'atencion' | 'primera' | 'vencer' | 'inactivas' | 'sinvincular';
export const FILTROS: Array<{ id: Exclude<FiltroPacientes, 'sinvincular'>; label: string }> = [
  { id: 'todas', label: 'Todas' }, { id: 'atencion', label: 'Necesitan atención' }, { id: 'primera', label: 'Primera vez' },
  { id: 'vencer', label: 'Plan por vencer' }, { id: 'inactivas', label: 'Inactivas' },
];
export const ETIQUETA_SIN_VINCULAR = 'Sin vincular';
export const ORDENES: Record<DirectoryOrder, string> = { appointment: 'Próxima consulta', name: 'Nombre', adherence: 'Menor adherencia' };
export const SIGUIENTE_ORDEN: Record<DirectoryOrder, DirectoryOrder> = { appointment: 'name', name: 'adherence', adherence: 'appointment' };

export const DIAS_PLAN_POR_VENCER = 7;
/** Una comida registrada cuenta un cuarto del día: desayuno, almuerzo, merienda y cena. */
export const COMIDAS_POR_DIA = 4;
export const UMBRAL_ADHERENCIA_BAJA = 70;
export const PUNTOS_DE_PESO = 10;
export const DIAS_DE_ADHERENCIA = 7;

export type Previews = Readonly<Record<string, PatientRowPreview | undefined>>;

const dayMs = (id: string) => Date.parse(`${id}T12:00:00Z`);
const diasEntre = (desde: string, hasta: string) => Math.round((dayMs(hasta) - dayMs(desde)) / 86_400_000);
const fechaCorta = (id: string) => id.slice(0, 10).split('-').reverse().join('/');
const num = (valor: number, decimales = 0) => valor.toLocaleString('es-AR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });

export const esActiva = (p: Patient) => !p.archived_at && !p.deactivated_at && !p.anonymized_at;
export const esInactiva = (p: Patient) => !p.anonymized_at && Boolean(p.archived_at || p.deactivated_at);
export const tieneRegistros = (p: Patient) => (p.weekly_registration?.recorded_days ?? 0) > 0 || p.adherence_score > 0;

/** Sin consultas hechas y con turno: la primera vez que la ve. */
export function esPrimeraVez(p: Patient) {
  return esActiva(p) && Boolean(p.appointment) && p.appointment_history !== undefined && !p.appointment_history.some(entry => entry.action === 'elapsed');
}

export function necesitaAtencion(p: Patient) {
  return esActiva(p) && ((p.weekly_registration?.pending_review ?? 0) > 0 || (tieneRegistros(p) && p.adherence_score < UMBRAL_ADHERENCIA_BAJA));
}

export function planPorVencer(preview: PatientRowPreview | undefined, hoy: string) {
  const fin = preview?.plan.period_end;
  if (!fin || (preview.plan.status !== 'published' && preview.plan.status !== 'scheduled')) return false;
  const falta = diasEntre(hoy, fin);
  return falta >= 0 && falta <= DIAS_PLAN_POR_VENCER;
}

const sinTildes = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export const coincideBusqueda = (p: Patient, consulta: string) => {
  const termino = sinTildes(consulta.trim());
  return !termino || sinTildes([p.name, p.status, p.goal, p.next_focus].join(' ')).includes(termino);
};

export function pasaFiltro(p: Patient, filtro: FiltroPacientes, previews: Previews, hoy: string) {
  if (filtro === 'inactivas') return esInactiva(p);
  if (!esActiva(p)) return false;
  if (filtro === 'atencion') return necesitaAtencion(p);
  if (filtro === 'primera') return esPrimeraVez(p);
  if (filtro === 'vencer') return planPorVencer(previews[p.id], hoy);
  if (filtro === 'sinvincular') return p.has_account === false;
  return true;
}

/** Cantidad por solapa. «Plan por vencer» necesita el plan de cada una: hasta que llega, no hay cifra (null). */
export function contarFiltros(pacientes: readonly Patient[], previews: Previews, hoy: string): Record<FiltroPacientes, number | null> {
  const activas = pacientes.filter(esActiva);
  const planesListos = activas.every(p => previews[p.id]);
  const cuenta = (filtro: FiltroPacientes) => pacientes.filter(p => pasaFiltro(p, filtro, previews, hoy)).length;
  return {
    todas: cuenta('todas'), atencion: cuenta('atencion'), primera: cuenta('primera'), inactivas: cuenta('inactivas'), sinvincular: cuenta('sinvincular'),
    vencer: planesListos ? cuenta('vencer') : null,
  };
}

export function filtrarPacientes(pacientes: readonly Patient[], consulta: string, filtro: FiltroPacientes, previews: Previews, hoy: string, orden: DirectoryOrder, ahora: Date) {
  return sortDirectoryPatients(pacientes.filter(p => pasaFiltro(p, filtro, previews, hoy) && coincideBusqueda(p, consulta)), orden, ahora);
}

const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const diaDeSemana = (id: string) => DIAS_CORTOS[new Date(`${id}T12:00:00Z`).getUTCDay()]!;

/** «Hoy 10:30», «Mañana 9:00», «Jue 29, 10:00» (esta semana) o «4/11» (más lejos). */
export function proximaConsulta(p: Patient, ahora: Date): string {
  const siguiente = homeAppointments([p], ahora).next;
  if (!siguiente) return p.appointment?.when || 'Sin turno';
  const hoy = homeDay(ahora), dia = homeDay(siguiente.at), falta = diasEntre(hoy, dia);
  const horaTexto = hora(siguiente.at).replace(/^0/, '');
  if (falta <= 0) return `Hoy ${horaTexto}`;
  if (falta === 1) return `Mañana ${horaTexto}`;
  if (falta < 7) return `${diaDeSemana(dia)} ${Number(dia.slice(8))}, ${horaTexto}`;
  return `${Number(dia.slice(8))}/${Number(dia.slice(5, 7))}`;
}

/** Último registro de comida o hábito. Sin ninguno, «sin registros». `viejo` pinta el aviso de más de un día y medio. */
export function ultimoRegistro(p: Patient, ahora: Date): { texto: string; viejo: boolean } {
  const instantes = [...p.meal_logs.map(log => Date.parse(log.logged_at)), ...p.habit_logs.map(log => Date.parse(`${log.date}T12:00:00-03:00`))].filter(Number.isFinite);
  if (!instantes.length) return { texto: 'sin registros', viejo: true };
  const ultimo = new Date(Math.max(...instantes));
  const dias = diasEntre(homeDay(ultimo), homeDay(ahora));
  const cuando = dias <= 0 ? 'hoy' : dias === 1 ? 'ayer' : `hace ${dias} días`;
  return { texto: dias <= 0 && p.meal_logs.length ? `hoy, ${hora(ultimo).replace(/^0/, '')}` : cuando, viejo: dias >= 2 };
}

export type EstadoPaciente = { texto: string; pill: string; cuota: string };
/** Estado de la fila: lo primero que aplica, en el orden de las solapas. La cuota sale aparte, debajo, si no está al día. */
export function estadoDe(p: Patient, preview: PatientRowPreview | undefined, board: BillingBoard | null, hoy: string): EstadoPaciente {
  const cuota = cuotaDe(board, p.id, hoy).texto;
  const aviso = cuota === 'Al día' || cuota === '—' || cuota === 'Sin cuota' ? '' : cuota;
  if (p.archived_at) return { texto: 'Archivada', pill: 'p-wait', cuota: '' };
  if (p.deactivated_at) return { texto: 'Inactiva', pill: 'p-wait', cuota: '' };
  if (p.has_account === false) return { texto: 'Acceso pendiente', pill: 'p-wait', cuota: aviso };
  if (p.goal_status === 'completed') return { texto: 'En objetivo', pill: 'p-now', cuota: aviso };
  if (esPrimeraVez(p)) return { texto: 'Primera vez', pill: 'p-vid', cuota: aviso };
  if (necesitaAtencion(p)) return { texto: 'Atención', pill: 'p-wait', cuota: aviso };
  if (preview?.plan.status === 'draft') return { texto: 'Plan por aprobar', pill: 'p-wait', cuota: aviso };
  return { texto: 'Activa', pill: 'p-conf', cuota: aviso };
}

/** Avance al objetivo (porcentaje de la ficha) con el último peso. Sin objetivo o sin avance, «Sin medir». */
export function avanceDe(p: Patient, preview: PatientRowPreview | undefined): { pct: number; texto: string } | null {
  if (!p.goal || p.goal_progress == null) return null;
  const pct = Math.max(0, Math.min(100, Math.round(p.goal_progress)));
  const peso = preview?.latest_weight;
  return { pct, texto: `${pct} %${peso ? ` · ${num(peso.value, 1)} ${peso.unit}` : ''}` };
}

/** La línea de arriba: promedio de adherencia, objetivos logrados este año y quienes no registraron esta semana. */
export function encabezadoPacientes(pacientes: readonly Patient[], ahora: Date) {
  const activas = pacientes.filter(esActiva);
  const conRegistros = activas.filter(tieneRegistros);
  const anio = homeDay(ahora).slice(0, 4);
  const logradas = activas.filter(p => p.goal_status === 'completed' && p.goal_updated_at && homeDay(new Date(p.goal_updated_at)).startsWith(anio)).length;
  const sinRegistrar = activas.filter(p => p.weekly_registration && p.weekly_registration.recorded_days === 0).length;
  const promedio = conRegistros.length ? `Adherencia promedio ${Math.round(conRegistros.reduce((suma, p) => suma + p.adherence_score, 0) / conRegistros.length)} %` : 'Adherencia promedio sin dato';
  return {
    sufijo: `· ${activas.length} ${activas.length === 1 ? 'activa' : 'activas'}`,
    cuando: `${promedio} · ${logradas} ${logradas === 1 ? 'llegó' : 'llegaron'} a su objetivo este año · ${sinRegistrar} sin registrar esta semana`,
  };
}

// ---------------------------------------------------------------- detalle desplegable

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export function pacienteDesde(creada: string | undefined, ahora: Date): string {
  if (!creada) return 'Sin dato';
  const dia = homeDay(new Date(creada)), hoy = homeDay(ahora);
  if (dia === hoy) return 'hoy';
  const mes = MESES[Number(dia.slice(5, 7)) - 1]!;
  return dia.slice(0, 4) === hoy.slice(0, 4) ? mes : `${mes} ${dia.slice(0, 4)}`;
}

export const metaEnKg = (objetivo: string): number | null => {
  const encontrada = objetivo.match(/(\d+(?:[.,]\d+)?)\s*kg/i)?.[1];
  const valor = encontrada ? parseFloat(encontrada.replace(',', '.')) : NaN;
  return Number.isFinite(valor) ? valor : null;
};

export type PuntoPeso = { fecha: string; valor: number };
export function serieDePeso(medidas: readonly Pick<Measurement, 'kind' | 'captured_on' | 'created_at' | 'value_numeric'>[], hoy: string): PuntoPeso[] {
  return medidas.filter(m => m.kind === 'weight' && m.captured_on <= hoy)
    .sort((a, b) => a.captured_on.localeCompare(b.captured_on) || a.created_at.localeCompare(b.created_at))
    .map(m => ({ fecha: m.captured_on, valor: m.value_numeric })).slice(-PUNTOS_DE_PESO);
}

export type GraficoPeso = {
  ancho: number; alto: number; curva: string; area: string; puntos: Array<[number, number]>; ultimo: [number, number] | null;
  meta: { y: number; kg: number; xFin: number } | null; actual: string; variacion: { texto: string; sube: boolean } | null; pie: string;
};
/** Misma geometría del boceto (150 × 104, curva suave y línea de objetivo), con los pesos reales. */
export function graficoDePeso(serie: readonly PuntoPeso[], objetivo: string): GraficoPeso {
  const W = 150, H = 104, pl = 4, pr = 22, pt = 18, pb = 8;
  const kg = metaEnKg(objetivo);
  const valores = serie.map(punto => punto.valor);
  const menor = Math.min(...valores, kg ?? Infinity) - 0.4, mayor = Math.max(...valores, kg ?? -Infinity) + 0.4;
  const Y = (valor: number) => pt + (mayor - valor) / ((mayor - menor) || 1) * (H - pt - pb);
  const X = (k: number) => serie.length < 2 ? W - pr : pl + k * (W - pl - pr) / (serie.length - 1);
  const puntos = serie.map((punto, k): [number, number] => [X(k), Y(punto.valor)]);
  let curva = '';
  puntos.forEach(([x, y], k) => {
    if (!k) { curva = `M${x.toFixed(1)} ${y.toFixed(1)}`; return; }
    const [x0, y0] = puntos[k - 1]!, m = (x - x0) / 2;
    curva += ` C${(x0 + m).toFixed(1)} ${y0.toFixed(1)} ${(x - m).toFixed(1)} ${y.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
  });
  const ultimo = puntos[puntos.length - 1] ?? null;
  const primero = serie[0], final = serie[serie.length - 1];
  const delta = primero && final && serie.length > 1 ? final.valor - primero.valor : null;
  const area = ultimo ? `${curva} L${ultimo[0].toFixed(1)} ${H - pb} L${puntos[0]![0].toFixed(1)} ${H - pb}Z` : '';
  return {
    ancho: W, alto: H, curva, area, puntos: puntos.slice(0, -1), ultimo,
    meta: kg ? { y: Y(kg), kg, xFin: W - pr + 6 } : null,
    actual: final ? num(final.valor, 1) : '—',
    variacion: delta === null ? null : { texto: `${delta > 0 ? '+' : delta < 0 ? '−' : '±'}${num(Math.abs(delta), 1)} kg`, sube: delta > 0 },
    pie: `${serie.length > 1 ? `últimas ${serie.length} mediciones` : serie.length ? 'una sola medición' : 'sin mediciones'}${kg ? ` · objetivo ${num(kg, kg % 1 ? 1 : 0)} kg` : ''}`,
  };
}

export type GraficoAvance = { pct: number; fin: [number, number] | null; marcas: Array<[number, number, number, number]>; arco: string; pie: string };
/** Medio círculo del boceto (160 × 88). El avance es el de la ficha; «faltan» solo si hay peso y objetivo en kilos. */
export function graficoDeAvance(pct: number, objetivo: string, pesoActual: number | null): GraficoAvance {
  const R = 62, cx = 80, cy = 78, angulo = Math.PI * (1 - pct / 100), kg = metaEnKg(objetivo);
  const marcas = [0, 25, 50, 75, 100].map((t): [number, number, number, number] => {
    const a = Math.PI * (1 - t / 100);
    return [cx + (R + 8) * Math.cos(a), cy - (R + 8) * Math.sin(a), cx + (R + 12) * Math.cos(a), cy - (R + 12) * Math.sin(a)];
  });
  return {
    pct, marcas, arco: `M${cx - R} ${cy}A${R} ${R} 0 0 1 ${cx + R} ${cy}`,
    fin: pct ? [cx + R * Math.cos(angulo), cy - R * Math.sin(angulo)] : null,
    pie: !pct ? 'falta la primera medición' : kg && pesoActual != null ? `faltan ${num(Math.abs(pesoActual - kg), 1)} kg` : objetivo.toLowerCase(),
  };
}

export type BarraDia = { letra: string; alto: number; comidas: number; hoy: boolean; nivel: '' | 'md' | 'lo' };
const LETRAS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
/** Comidas registradas en cada uno de los últimos siete días (el último es hoy), contra cuatro por día. */
export function barrasDeLaSemana(comidas: readonly { logged_at: string }[], ahora: Date): { barras: BarraDia[]; total: number; promedio: number } {
  const hoy = homeDay(ahora);
  const porDia = new Map<string, number>();
  for (const comida of comidas) { const dia = homeDay(new Date(comida.logged_at)); porDia.set(dia, (porDia.get(dia) ?? 0) + 1); }
  const barras = Array.from({ length: DIAS_DE_ADHERENCIA }, (_, k): BarraDia => {
    const dia = new Date(dayMs(hoy) - (DIAS_DE_ADHERENCIA - 1 - k) * 86_400_000).toISOString().slice(0, 10);
    const cantidad = porDia.get(dia) ?? 0, alto = Math.min(100, Math.round(cantidad / COMIDAS_POR_DIA * 100));
    return { letra: LETRAS[new Date(`${dia}T12:00:00Z`).getUTCDay()]!, alto, comidas: cantidad, hoy: dia === hoy, nivel: alto < 60 ? 'lo' : alto < 80 ? 'md' : '' };
  });
  return { barras, total: barras.reduce((suma, b) => suma + b.comidas, 0), promedio: Math.round(barras.reduce((suma, b) => suma + b.alto, 0) / DIAS_DE_ADHERENCIA) };
}

export type HechoReciente = { texto: string; cuando: string };
/** Tres hechos reales: último registro, última consulta hecha y el plan. */
export function hechosRecientes(p: Patient, preview: { plan: PatientRowPreview['plan'] } | undefined, ahora: Date): HechoReciente[] {
  const registro = ultimoRegistro(p, ahora);
  const visita = lastVisit(p.appointment_history, homeDay(ahora));
  const plan = preview?.plan;
  const estadoPlan = plan ? ({ none: 'Todavía sin plan', draft: 'Plan en borrador', published: 'Plan publicado', scheduled: 'Plan programado' })[plan.status] : 'Plan sin consultar';
  return [
    { texto: registro.texto === 'sin registros' ? 'Todavía no registró comidas' : 'Registró comidas', cuando: registro.texto === 'sin registros' ? '—' : registro.texto },
    { texto: visita ? 'Última consulta' : 'Sin consultas hechas', cuando: visita ? `${daysAgoText(visita.daysAgo)} · ${fechaCorta(visita.dateId).slice(0, 5)}` : '—' },
    { texto: estadoPlan, cuando: plan?.period_end ? `hasta ${fechaCorta(plan.period_end).slice(0, 5)}` : '—' },
  ];
}

export function turnoDetalle(p: Patient, ahora: Date): { cuando: string; sub: string } {
  const turno = p.appointment;
  if (!turno) return { cuando: 'Sin turno', sub: 'todavía no hay una próxima consulta' };
  const modo = turno.channel === 'video' ? 'videollamada' : turno.channel === 'presencial' ? 'consultorio' : 'modalidad por confirmar';
  return { cuando: proximaConsulta(p, ahora), sub: `${modo}${turno.confirmed_at || turno.patient_reply === 'attending' ? ' · confirmado' : turno.patient_reply === 'needs_change' ? ' · pidió cambio' : ' · sin confirmar'}` };
}

export const zonaHoraria = HOME_ZONE;
