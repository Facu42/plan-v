// Tiempos del boceto v29 (panel-trabajo.html, moveTo / aClose / toast). No se inventan curvas.

export const UMBRAL_PASTILLA_PX = 1;
export const ESTIRAR_MS = 180;
export const LIMPIAR_MS = 320;
export const SEGUIR_PLEGADO_MS = 450;
export const CERRAR_PANEL_MS = 220;
export const TOAST_MS = 3600;
export const TOAST_SALIDA_MS = 260;
export const TOAST_DESMONTE_MS = TOAST_MS + TOAST_SALIDA_MS;
export const TRANSICION_ESTIRAR = 'transform .18s ease-in,height .18s ease-in';
export const TRANSICION_SOLTAR = 'transform .3s cubic-bezier(.2,1.4,.4,1),height .3s cubic-bezier(.2,1.4,.4,1)';

export type PosicionPastilla = { y: number; h: number };

export type PasoPastilla =
  | { tipo: 'directo'; y: number; h: number }
  | { tipo: 'igual' }
  | { tipo: 'estirar'; top: number; alto: number; y: number; h: number };

export function movimientoReducido(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Misma decisión que `moveTo`: directo si no hay posición previa, si piden instantáneo o si el salto es menor a 1 px. */
export function pasoPastilla(cur: PosicionPastilla | null, y: number, h: number, instantaneo: boolean): PasoPastilla {
  if (!cur || instantaneo) return { tipo: 'directo', y, h };
  if (Math.abs(cur.y - y) < UMBRAL_PASTILLA_PX && Math.abs(cur.h - h) < UMBRAL_PASTILLA_PX) return { tipo: 'igual' };
  const top = Math.min(cur.y, y);
  const bot = Math.max(cur.y + cur.h, y + h);
  return { tipo: 'estirar', top, alto: bot - top, y, h };
}

export type PendientePastilla = { id: number | null };

/**
 * Aplica el estirado de la pastilla. En el camino directo corta un estirado a medias
 * para que el seguimiento del plegado no pelee con el temporizador (el boceto no lo corta).
 */
export function aplicarPastilla(
  pill: HTMLElement,
  cur: PosicionPastilla | null,
  y: number,
  h: number,
  instantaneo: boolean,
  pendiente: PendientePastilla,
  luego: (fn: () => void, ms: number) => number,
  cancelar: (id: number) => void,
): PosicionPastilla | null {
  const paso = pasoPastilla(cur, y, h, instantaneo);
  if (paso.tipo === 'igual') return cur;
  if (pendiente.id != null) {
    cancelar(pendiente.id);
    pendiente.id = null;
  }
  if (paso.tipo === 'directo') {
    pill.classList.remove('go');
    pill.style.transition = '';
    pill.style.transform = `translateY(${paso.y}px)`;
    pill.style.height = `${paso.h}px`;
    return { y: paso.y, h: paso.h };
  }
  pill.classList.add('go');
  pill.style.transition = TRANSICION_ESTIRAR;
  pill.style.transform = `translateY(${paso.top}px)`;
  pill.style.height = `${paso.alto}px`;
  const finalY = paso.y;
  const finalH = paso.h;
  pendiente.id = luego(() => {
    pill.style.transition = TRANSICION_SOLTAR;
    pill.style.transform = `translateY(${finalY}px)`;
    pill.style.height = `${finalH}px`;
    pill.classList.remove('go');
    pendiente.id = luego(() => {
      pill.style.transition = '';
      pendiente.id = null;
    }, LIMPIAR_MS);
  }, ESTIRAR_MS);
  return { y: finalY, h: finalH };
}
