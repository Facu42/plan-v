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
