import type { PublicSchedulingPage } from '../types/scheduling';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] as const;
const ORDEN = [1, 2, 3, 4, 5, 6, 0] as const;

export type FilaHorario = { dia: string; tramos: string };

/** Horarios de atención de lunes a domingo; los días sin atención dicen «Cerrado». */
export function filasHorarios(hours: PublicSchedulingPage['hours']): FilaHorario[] {
  const lista = hours ?? [];
  if (!lista.length) return [];
  return ORDEN.map(dia => {
    const tramos = lista.filter(h => h.weekday === dia).sort((a, b) => a.start.localeCompare(b.start));
    const unidos: string[] = [];
    for (const t of tramos) {
      const previo = unidos.length ? unidos[unidos.length - 1].split('–') : null;
      if (previo && previo[1] === t.start) unidos[unidos.length - 1] = `${previo[0]}–${t.end}`;
      else unidos.push(`${t.start}–${t.end}`);
    }
    return { dia: DIAS[dia], tramos: unidos.length ? unidos.map(t => `${t.replace('–', ' a ')} h`).join(' · ') : 'Cerrado' };
  });
}

/** Mapa sin clave: Google Maps embebido con la dirección que escribió la nutri. */
export function urlMapa(direccion: string, incrustado: boolean): string {
  const q = encodeURIComponent(direccion.trim());
  return incrustado ? `https://www.google.com/maps?q=${q}&output=embed` : `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export const dineroPublico = (centavos: number) => centavos > 0 ? `$${Math.round(centavos / 100).toLocaleString('es-AR')}` : 'Consultar';

/** Argentina no cambia de hora: UTC-3 todo el año. */
function ahoraArgentina(ahora: Date): { dia: number; minutos: number } {
  const a = new Date(ahora.getTime() - 3 * 3600000);
  return { dia: a.getUTCDay(), minutos: a.getUTCHours() * 60 + a.getUTCMinutes() };
}
const aMinutos = (hora: string) => Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5));

/** «Abierto ahora» según los horarios publicados; con el cierre del tramo o la próxima apertura. Vacío si no hay horarios. */
export function estadoAtencion(hours: PublicSchedulingPage['hours'], ahora = new Date()): { abierto: boolean; texto: string } | null {
  const lista = hours ?? [];
  if (!lista.length) return null;
  const { dia, minutos } = ahoraArgentina(ahora);
  const hoy = lista.filter(h => h.weekday === dia);
  const actual = hoy.find(h => aMinutos(h.start) <= minutos && minutos < aMinutos(h.end));
  if (actual) return { abierto: true, texto: `Abierto ahora · atiende hasta las ${actual.end}` };
  const luego = hoy.filter(h => aMinutos(h.start) > minutos).sort((a, b) => a.start.localeCompare(b.start))[0];
  if (luego) return { abierto: false, texto: `Cerrado ahora · abre hoy a las ${luego.start}` };
  for (let i = 1; i <= 7; i++) {
    const d = (dia + i) % 7;
    const primero = lista.filter(h => h.weekday === d).sort((a, b) => a.start.localeCompare(b.start))[0];
    if (primero) return { abierto: false, texto: `Cerrado ahora · abre ${i === 1 ? 'mañana' : DIAS[d].toLowerCase()} a las ${primero.start}` };
  }
  return { abierto: false, texto: 'Cerrado ahora' };
}

/** «mañana 10:00», «hoy 16:30» o «lunes 9 10:00» para el próximo turno libre. */
export function etiquetaTurno(inicioIso: string, ahora = new Date()): string {
  const f = (d: Date) => new Date(d.getTime() - 3 * 3600000).toISOString().slice(0, 10);
  const inicio = new Date(inicioIso);
  const hora = new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit', hour12: false }).format(inicio);
  const dia = f(inicio), hoy = f(ahora), manana = f(new Date(ahora.getTime() + 86400000));
  if (dia === hoy) return `hoy ${hora}`;
  if (dia === manana) return `mañana ${hora}`;
  const nombre = DIAS[new Date(`${dia}T12:00:00Z`).getUTCDay()].toLowerCase();
  return `${nombre} ${Number(dia.slice(8))} ${hora}`;
}

export const esReseñaGoogle = (url: string | undefined) => Boolean(url && url.startsWith('https://'));
