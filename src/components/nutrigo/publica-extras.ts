// Cuentas de la Página pública que no dependen de la pantalla: horarios escritos como en el boceto («9 a 13 · 15 a 19»), valores de arranque y el QR.
import qrcode from 'qrcode-generator';
import type { PageExtras, SchedulingSettings } from '../../types/scheduling';

export type Franja = SchedulingSettings['weekly'][number];
export type ModoObraSocial = NonNullable<PageExtras['insurers']>[number]['mode'];

export const MODOS_OBRA_SOCIAL: ReadonlyArray<readonly [ModoObraSocial, string]> = [['copago', 'Copago'], ['reintegro', 'Reintegro'], ['completo', 'Precio completo'], ['no', 'No la acepto']];
export const OBRAS_SUGERIDAS = ['OSDE', 'Swiss Medical', 'Galeno', 'OMINT', 'Medifé', 'Sancor Salud', 'Accord Salud', 'IOMA'] as const;
export const ESPECIALIDADES_SUGERIDAS = ['Celiaquía', 'Descenso de peso', 'Deportistas', 'Hipotiroidismo', 'Embarazo', 'Diabetes', 'Vegetariana'] as const;
export const PEDIDOS_AL_RESERVAR = ['Nombre, teléfono y mail', 'Obra social y número de afiliada', 'Motivo de la consulta', 'Formulario «Primera consulta» antes del turno', 'Foto del último análisis', 'Fecha de nacimiento'] as const;
/** Hoy la página de reservas pide solo nombre, mail y teléfono; lo demás arranca apagado hasta que la nutri lo elija. */
export const PEDIDO_ACTUAL = 'Nombre, teléfono y mail';
export const AVISOS_DE_RESERVA = ['confirm', 'unconfirmed', 'reopen', 'review'] as const;
export type AvisoReserva = (typeof AVISOS_DE_RESERVA)[number];

export const textoModo = (modo: ModoObraSocial, nota: string) => (modo === 'copago' ? (nota ? `Copago ${nota}` : 'Copago') : modo === 'reintegro' ? 'Reintegro' : modo === 'completo' ? 'Precio completo' : 'No la acepto');
/** Clase de color que usa el boceto: `l` copago, `b` reintegro, `n` precio completo. */
export const claseModo = (modo: ModoObraSocial) => (modo === 'copago' ? 'l' : modo === 'reintegro' ? 'b' : 'n');

export function pedidosAlReservar(extras: PageExtras | undefined) {
  const guardados = extras?.intake;
  return PEDIDOS_AL_RESERVAR.map(text => ({ text, on: guardados?.find(item => item.text === text)?.on ?? text === PEDIDO_ACTUAL }));
}

const HORA = /^(\d{1,2})(?::(\d{2}))?$/;
const aReloj = (texto: string) => {
  const m = HORA.exec(texto.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2] ?? '0');
  return h > 23 || min > 59 ? null : `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
};

/** «9 a 13 · 15 a 19» → franjas. `[]` si no atiende ese día; `null` si el texto no se entiende. */
export function leerHorario(texto: string): Array<{ start: string; end: string }> | null {
  const limpio = texto.trim();
  if (!limpio || /^no\s+atiendo$/i.test(limpio)) return [];
  const franjas: Array<{ start: string; end: string }> = [];
  for (const parte of limpio.split(/\s*[·,;]\s*|\s+y\s+/)) {
    if (!/\d/.test(parte)) continue; // una palabra suelta («videollamada») no es una franja
    const m = /^(\d{1,2}(?::\d{2})?)\s*(?:a|-|–)\s*(\d{1,2}(?::\d{2})?)(?:\s+.*)?$/i.exec(parte.trim());
    const start = m ? aReloj(m[1]) : null;
    const end = m ? aReloj(m[2]) : null;
    if (!start || !end || start >= end) return null;
    franjas.push({ start, end });
  }
  if (!franjas.length) return null;
  franjas.sort((a, b) => a.start.localeCompare(b.start));
  return franjas.some((franja, i) => i > 0 && franja.start < franjas[i - 1].end) ? null : franjas;
}

/** Cambia solo las franjas de un día; el resto de la semana queda igual. */
export function conHorarioDelDia(semana: SchedulingSettings['weekly'], dia: number, franjas: Array<{ start: string; end: string }>, calendarioPorDefecto: string): SchedulingSettings['weekly'] {
  const calendario = semana.find(franja => franja.weekday === dia)?.calendar_id ?? calendarioPorDefecto;
  return [...semana.filter(franja => franja.weekday !== dia), ...franjas.map(franja => ({ calendar_id: calendario, weekday: dia, start: franja.start, end: franja.end }))];
}

export type CeldasQr = { lado: number; celdas: ReadonlyArray<readonly [number, number]> };
/** Matriz real del código QR de un link (la que se puede escanear). */
export function celdasQr(link: string): CeldasQr {
  const qr = qrcode(0, 'M');
  qr.addData(link);
  qr.make();
  const lado = qr.getModuleCount();
  const celdas: Array<readonly [number, number]> = [];
  for (let y = 0; y < lado; y += 1) for (let x = 0; x < lado; x += 1) if (qr.isDark(y, x)) celdas.push([x, y]);
  return { lado, celdas };
}

/** SVG listo para guardar como archivo, con margen blanco. */
export function qrComoSvg(link: string, lado = 600): string {
  const { lado: n, celdas } = celdasQr(link);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}" viewBox="-2 -2 ${n + 4} ${n + 4}" style="background:#fff" fill="#141519">${celdas.map(([x, y]) => `<rect x="${x}" y="${y}" width="1" height="1"/>`).join('')}</svg>`;
}
