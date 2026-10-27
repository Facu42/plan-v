// Lo que la Agenda del panel v29 dibuja, calculado a partir de datos reales. Sin React.
import type { SchedulingBooking, SchedulingSettings } from '../../types/scheduling';
import { AGENDA_ZONE, agendaClock, agendaDay, dayHeading, formatMinutes, monthGrid, monthLabel, shiftDay, weekLabel, type AgendaView, type PanelAgendaEvent } from '../../lib/panel-agenda';

/** El boceto dibuja de 8 a 19; si hay turnos fuera de esa franja la grilla se ensancha. */
export const HORAS_BOCETO = { start: 8, end: 19 } as const;
const LUGARES_A_MOSTRAR = 8;
const PASO_MINIMO_MIN = 10;

/** Clases de color del boceto: consultorio, videollamada, sin confirmar, primera vez, hecha, próxima y bloqueo. */
export type ClaseEvento = 'c' | 'v' | 'w' | 'f' | 'd' | 'n' | 'blk';

const esReal = (event: PanelAgendaEvent) => event.tone !== 'bloqueo' && event.tone !== 'pendiente';

export function yaPaso(event: PanelAgendaEvent, ahora: Date) {
  const hoy = agendaDay(ahora);
  return event.day < hoy || (event.day === hoy && event.endMin <= agendaClock(ahora).minutes);
}

/** La próxima consulta confirmada que todavía no empezó a terminar: la única que va en negro. */
export function proximoEvento(events: readonly PanelAgendaEvent[], ahora: Date): PanelAgendaEvent | null {
  return [...events].filter(event => esReal(event) && !yaPaso(event, ahora)).sort((a, b) => a.day.localeCompare(b.day) || a.startMin - b.startMin)[0] ?? null;
}

export function claseDeEvento(event: PanelAgendaEvent, ahora: Date, proximo: PanelAgendaEvent | null): ClaseEvento {
  if (event.tone === 'bloqueo') return 'blk';
  if (event.tone === 'pendiente') return 'w';
  if (yaPaso(event, ahora)) return 'd';
  if (proximo && event.id === proximo.id) return 'n';
  if (event.tone === 'primera') return 'f';
  return event.tone === 'online' ? 'v' : 'c';
}

export function etiquetaDeEvento(event: PanelAgendaEvent, clase: ClaseEvento) {
  const texto = {
    c: 'Consultorio', v: 'Videollamada', w: 'Sin confirmar', f: 'Primera consulta', d: 'Hecha',
    n: `Próxima · ${event.tone === 'online' ? 'videollamada' : 'consultorio'}`, blk: event.subtitle || 'No disponible',
  }[clase];
  return `${formatMinutes(event.startMin)} · ${texto}`;
}

export function plural(cantidad: number, uno: string, varios: string) {
  return `${cantidad} ${cantidad === 1 ? uno : varios}`;
}

export const consultasDelDia = (events: readonly PanelAgendaEvent[], day: string) => events.filter(event => event.day === day && esReal(event)).length;

/** Franja de horas de la grilla: la del boceto, más ancha solo si algún turno cae afuera. */
export function franjaDeHoras(events: readonly PanelAgendaEvent[]) {
  if (!events.length) return { ...HORAS_BOCETO };
  const start = Math.max(0, Math.min(HORAS_BOCETO.start, Math.floor(Math.min(...events.map(event => event.startMin)) / 60)));
  const end = Math.min(24, Math.max(HORAS_BOCETO.end, Math.ceil(Math.max(...events.map(event => event.endMin)) / 60)));
  return { start, end: Math.max(end, start + 1) };
}

export type LugarLibre = { day: string; startMin: number; dia: string; hora: string };

/** Huecos dentro de los días de atención, con la duración de la consulta más corta, que no pisan ningún turno ni bloqueo y no pasaron. */
export function lugaresLibres(config: Pick<SchedulingSettings, 'weekly' | 'types'>, events: readonly PanelAgendaEvent[], ahora: Date, days: readonly string[]): LugarLibre[] {
  const duracion = Math.min(...config.types.map(type => type.duration_min).filter(minutos => minutos >= PASO_MINIMO_MIN));
  if (!Number.isFinite(duracion)) return [];
  const hoy = agendaDay(ahora);
  const minutosAhora = agendaClock(ahora).minutes;
  const huecos = new Map<string, LugarLibre>();
  for (const day of days) {
    if (day < hoy) continue;
    const weekday = new Date(`${day}T15:00:00Z`).getUTCDay();
    const ocupados = events.filter(event => event.day === day);
    for (const fila of config.weekly.filter(row => row.weekday === weekday)) {
      const desde = Number(fila.start.slice(0, 2)) * 60 + Number(fila.start.slice(3));
      const hasta = Number(fila.end.slice(0, 2)) * 60 + Number(fila.end.slice(3));
      for (let inicio = desde; inicio + duracion <= hasta; inicio += duracion) {
        if (day === hoy && inicio <= minutosAhora) continue;
        if (ocupados.some(event => event.startMin < inicio + duracion && event.endMin > inicio)) continue;
        const { name, number } = dayHeading(day);
        huecos.set(`${day}:${inicio}`, { day, startMin: inicio, dia: `${name} ${number}`, hora: formatMinutes(inicio) });
      }
    }
  }
  return [...huecos.values()].sort((a, b) => a.day.localeCompare(b.day) || a.startMin - b.startMin);
}

export function recortarLugares(lugares: readonly LugarLibre[]) {
  return { visibles: lugares.slice(0, LUGARES_A_MOSTRAR), ocultos: Math.max(0, lugares.length - LUGARES_A_MOSTRAR) };
}

export type CeldaMini = { day: string; numero: number; clase: string };

/** Mes chico: días del mes vecino atenuados, la semana que se mira marcada, hoy en lima y un punto donde hay turnos. */
export function miniMes(anchor: string, hoy: string, semana: readonly string[], events: readonly PanelAgendaEvent[]): CeldaMini[] {
  const conTurnos = new Set(events.filter(esReal).map(event => event.day));
  return monthGrid(anchor).map(day => {
    const clases = [day.slice(0, 7) !== anchor.slice(0, 7) ? 'o' : '', day === hoy ? 'td' : semana.includes(day) ? 'wk' : '', conTurnos.has(day) && day !== hoy ? 'has' : ''];
    return { day, numero: Number(day.slice(8)), clase: clases.filter(Boolean).join(' ') };
  });
}

export type EncabezadoAgenda = { sufijo: string; cuando: string };

export function encabezadoAgenda(view: AgendaView, anchor: string, days: readonly string[], events: readonly PanelAgendaEvent[], libres: number, pedidos: number): EncabezadoAgenda {
  const enVista = events.filter(event => esReal(event) && days.includes(event.day));
  const sufijo = view === 'mes' ? monthLabel(anchor).toLowerCase().replace(' de ', ' ') : view === 'dia' ? new Date(`${anchor}T15:00:00Z`).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }) : weekLabel(days).replace(/^Semana del /, '');
  return {
    sufijo: `· ${sufijo}`,
    cuando: `${plural(enVista.length, 'consulta', 'consultas')} · ${plural(libres, 'lugar libre', 'lugares libres')} · ${plural(pedidos, 'pedido de turno', 'pedidos de turno')}`,
  };
}

/** «Pide jueves 23, 17:00 · consultorio»: el horario que eligió la persona al reservar. */
export function textoDelPedido(booking: Pick<SchedulingBooking, 'starts_at' | 'type_id'>, types: SchedulingSettings['types']) {
  const at = new Date(booking.starts_at);
  if (!Number.isFinite(at.getTime())) return 'Horario por revisar';
  const dia = at.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', timeZone: AGENDA_ZONE });
  const hora = at.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: AGENDA_ZONE });
  const canal = types.find(type => type.id === booking.type_id)?.channel === 'video' ? 'videollamada' : 'consultorio';
  return `Pide ${dia}, ${hora} · ${canal}`;
}

export const tituloDelPedido = (booking: Pick<SchedulingBooking, 'contact_name' | 'patient_id'>) => `${booking.contact_name} · ${booking.patient_id ? 'seguimiento' : 'primera vez'}`;

export { shiftDay };
