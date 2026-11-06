// Estadísticas del consultorio (consultas, ausencias, cancelaciones, pacientes nuevas, ingresos y sedes) mes a mes.
// Solo cuenta: no expone notas ni datos clínicos. El consultorio sale siempre de la sesión, nunca del pedido.
import { privilegedDb } from '../db/supabase-client.js';
import { readAllRows } from '../crm/repository.js';
import { getStore } from '../store.js';
import { getBoard } from '../fees/repository.js';
import { profile } from '../scheduling/repository.js';
import { leerSedesDeTurnos } from './sedes.js';
import { detalleDeSede, sedeDelTurno } from '../../src/lib/sedes.js';
import type { EstadisticasConsultorio, MesEstadistico, SedeEstadistica } from '../../src/types/estadisticas.js';
import type { SchedulingSettings } from '../../src/types/scheduling.js';

const TZ = 'America/Argentina/Buenos_Aires';
const dia = new Intl.DateTimeFormat('en-CA', { timeZone: TZ });
const ROTULOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export type TurnoEstadistico = { id: string; paciente: string; inicio: string; minutos: number; canal: string; estado: string; realizada: boolean | null; sede: string | null };
export type CancelacionEstadistica = { inicio: string };
export type PacienteEstadistica = { id: string; nombre: string; alta: string | null };
export type PagoEstadistico = { monto: number; fecha: string };

/** Los últimos `cuantos` meses que terminan en el mes de `hoy`, como «2026-11». */
export function mesesHasta(hoy: string, cuantos: number): string[] {
  const [anio, mes] = hoy.split('-').map(Number);
  return Array.from({ length: cuantos }, (_, i) => {
    const total = anio * 12 + (mes - 1) - (cuantos - 1 - i);
    return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
  });
}

const vacio = (mes: string): MesEstadistico => ({ mes, rotulo: ROTULOS[Number(mes.slice(5, 7)) - 1] ?? mes, consultas: 0, ausencias: 0, canceladas: 0, nuevas: 0, ingresos: 0 });
const mesDe = (iso: string | null | undefined) => { if (!iso) return null; const d = new Date(iso); return Number.isFinite(d.getTime()) ? dia.format(d).slice(0, 7) : null; };

export function armarEstadisticas(input: {
  hoy: string; ahora: Date; cuantos: number; sedes: SchedulingSettings['calendars']; sedesInstaladas: boolean;
  turnos: readonly TurnoEstadistico[]; cancelaciones: readonly CancelacionEstadistica[]; pacientes: readonly PacienteEstadistica[]; pagos: readonly PagoEstadistico[];
}): EstadisticasConsultorio {
  const lista = mesesHasta(input.hoy, input.cuantos);
  const porMes = new Map(lista.map(m => [m, vacio(m)]));
  const nombres = new Map(input.pacientes.map(p => [p.id, p.nombre]));
  const sedes = new Map<string, SedeEstadistica>(input.sedes.map(s => [s.id, { id: s.id, nombre: s.name, detalle: detalleDeSede(s), consultas: 0, ausencias: 0, online: 0, presencial: 0 }]));
  const extra = { primeraVez: 0, seguimiento: 0, presencial: 0, online: 0 };
  const atendidas = new Set<string>();
  const ausentes = new Map<string, { ausencias: number; ultima: string }>();
  // Primera consulta de cada paciente, mirando todo el historial que se leyó (no solo el período).
  const primeras = new Map<string, string>();
  for (const t of [...input.turnos].sort((a, b) => a.inicio.localeCompare(b.inicio))) {
    if (t.estado === 'cancelled' || t.realizada === false) continue;
    if (Date.parse(t.inicio) + t.minutos * 60_000 > input.ahora.getTime()) continue;
    if (!primeras.has(t.paciente)) primeras.set(t.paciente, t.id);
  }
  for (const t of input.turnos) {
    const mes = mesDe(t.inicio), fila = mes ? porMes.get(mes) : undefined;
    if (!fila || t.estado === 'cancelled') continue;
    if (Date.parse(t.inicio) + t.minutos * 60_000 > input.ahora.getTime()) continue;
    const sede = sedes.get(sedeDelTurno(input.sedes, t.sede) ?? '');
    if (t.realizada === false) {
      fila.ausencias += 1;
      if (sede) sede.ausencias += 1;
      const previo = ausentes.get(t.paciente);
      ausentes.set(t.paciente, { ausencias: (previo?.ausencias ?? 0) + 1, ultima: previo && previo.ultima > t.inicio ? previo.ultima : t.inicio });
      continue;
    }
    fila.consultas += 1;
    atendidas.add(t.paciente);
    const online = t.canal === 'video';
    if (online) extra.online += 1; else extra.presencial += 1;
    if (primeras.get(t.paciente) === t.id) extra.primeraVez += 1; else extra.seguimiento += 1;
    if (sede) { sede.consultas += 1; if (online) sede.online += 1; else sede.presencial += 1; }
  }
  for (const c of input.cancelaciones) { const fila = porMes.get(mesDe(c.inicio) ?? ''); if (fila) fila.canceladas += 1; }
  for (const p of input.pacientes) { const fila = porMes.get(mesDe(p.alta) ?? ''); if (fila) fila.nuevas += 1; }
  for (const pago of input.pagos) { const fila = porMes.get(pago.fecha.slice(0, 7)); if (fila) fila.ingresos += pago.monto; }
  const meses = lista.map(m => porMes.get(m)!);
  const suma = (clave: keyof Omit<MesEstadistico, 'mes' | 'rotulo'>) => meses.reduce((s, m) => s + m[clave], 0);
  return {
    hoy: input.hoy,
    meses,
    total: { mes: 'total', rotulo: 'Total', consultas: suma('consultas'), ausencias: suma('ausencias'), canceladas: suma('canceladas'), nuevas: suma('nuevas'), ingresos: suma('ingresos'), ...extra, pacientesAtendidas: atendidas.size },
    porSede: [...sedes.values()],
    masAusencias: [...ausentes.entries()].map(([id, v]) => ({ id, nombre: nombres.get(id) ?? 'Paciente', ausencias: v.ausencias, ultima: dia.format(new Date(v.ultima)) }))
      .sort((a, b) => b.ausencias - a.ausencias || b.ultima.localeCompare(a.ultima)).slice(0, 5),
    sedesInstaladas: input.sedesInstaladas,
  };
}

/** Primer instante del primer mes del período, en hora de Argentina. */
const desdeDe = (mes: string) => new Date(`${mes}-01T00:00:00-03:00`).toISOString();

async function cargarReales(nid: string, desde: string, ahora: Date) {
  const db = privilegedDb();
  const [turnos, completas, reservas, cancelaciones, pacientes] = await Promise.all([
    // Un año más para saber cuál fue la primera consulta de cada paciente.
    readAllRows((o, e) => db.from('appointments').select('id,patient_id,starts_at,duration_min,channel,status').eq('nutritionist_id', nid).gte('starts_at', new Date(Date.parse(desde) - 366 * 86_400_000).toISOString()).lt('starts_at', ahora.toISOString()).order('starts_at').order('id').range(o, e)),
    readAllRows((o, e) => db.from('consultation_completions').select('appointment_id,completed').eq('nutritionist_id', nid).gte('appointment_starts_at', desde).order('appointment_id').range(o, e)),
    readAllRows((o, e) => db.from('scheduling_bookings').select('appointment_id,calendar_id').eq('nutritionist_id', nid).not('appointment_id', 'is', null).order('id').range(o, e)),
    readAllRows((o, e) => db.from('appointment_events').select('id,starts_at').eq('nutritionist_id', nid).eq('action', 'cancelled').gte('starts_at', desde).order('id').range(o, e)),
    readAllRows((o, e) => db.from('patients').select('id,full_name,created_at,anonymized_at').eq('nutritionist_id', nid).order('id').range(o, e)),
  ]);
  return { turnos, completas, reservas, cancelaciones, pacientes };
}

export async function estadisticasDelConsultorio(nid: string, persistent: boolean, cuantos: number, ahora = new Date()): Promise<EstadisticasConsultorio> {
  const hoy = dia.format(ahora), meses = mesesHasta(hoy, cuantos), desde = desdeDe(meses[0]);
  const [config, sedesTurnos, board] = await Promise.all([profile(nid, persistent), leerSedesDeTurnos(nid, persistent), getBoard(persistent)]);
  const pagos = board.patients.flatMap(p => p.payments.filter(x => x.status === 'confirmed').map(x => ({ monto: x.amount, fecha: x.paid_on })));
  const sedes = config.config.calendars;
  if (!persistent) {
    const store = getStore();
    const turnos: TurnoEstadistico[] = store.patients.flatMap(p => (p.appointment_history ?? []).filter(h => h.action === 'elapsed' && h.dateId).map(h => {
      const hora = h.when.split(' · ')[1] ?? '10:00';
      return { id: h.id, paciente: p.id, inicio: new Date(`${h.dateId}T${/^\d{2}:\d{2}$/.test(hora) ? hora : '10:00'}:00-03:00`).toISOString(), minutos: h.duration || 45, canal: h.channel, estado: 'done', realizada: null, sede: sedesTurnos.turnos[h.id] ?? null };
    }));
    return armarEstadisticas({ hoy, ahora, cuantos, sedes, sedesInstaladas: true, turnos, cancelaciones: [], pacientes: store.patients.map(p => ({ id: p.id, nombre: p.name, alta: p.created_at ?? null })), pagos });
  }
  const r = await cargarReales(nid, desde, ahora);
  const realizada = new Map(r.completas.map(c => [String(c.appointment_id), Boolean(c.completed)]));
  const deReserva = new Map(r.reservas.map(b => [String(b.appointment_id), String(b.calendar_id)]));
  const turnos: TurnoEstadistico[] = r.turnos.map(t => {
    const id = String(t.id);
    return { id, paciente: String(t.patient_id), inicio: String(t.starts_at), minutos: Number(t.duration_min) || 0, canal: String(t.channel ?? ''), estado: String(t.status ?? ''), realizada: realizada.has(id) ? realizada.get(id)! : null, sede: sedesTurnos.turnos[id] ?? deReserva.get(id) ?? null };
  });
  return armarEstadisticas({
    hoy, ahora, cuantos, sedes, sedesInstaladas: sedesTurnos.instalada, turnos,
    cancelaciones: r.cancelaciones.map(c => ({ inicio: String(c.starts_at) })),
    pacientes: r.pacientes.map(p => ({ id: String(p.id), nombre: p.anonymized_at ? 'Datos borrados' : String(p.full_name ?? ''), alta: (p.created_at as string | null) ?? null })),
    pagos,
  });
}
