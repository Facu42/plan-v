// Adjuntar y dictar en «Armar con IA» (Planes 3g). La IA recibe hasta 10 líneas de 80 caracteres, así que
// de una referencia se toman las primeras palabras; el archivo no sale del navegador de la profesional.
import { MAX_DIETARY_PREFERENCE_LENGTH } from '../../types/ai-jobs';
import { PdfInputError, extractPdfText } from '../../lib/pdf-text';

export type Referencia = { nombre: string; texto: string };

export const MAX_REFERENCIAS = 2;
export const LINEAS_POR_REFERENCIA = 2;
const MAX_BYTES_TEXTO = 1024 * 1024;
const PREFIJO_NOMBRE = 18;

export const AVISO_TIPO_REFERENCIA = 'Por ahora se leen PDF con texto y archivos de texto o CSV. Para una foto o una planilla, copiá lo importante en el pedido.';
export const AVISO_SIN_TEXTO = 'No encontré texto para leer en ese archivo. Si es una foto o un PDF escaneado, copiá lo importante en el pedido.';
export const AVISO_DEMASIADAS = `Podés sumar hasta ${MAX_REFERENCIAS} referencias por pedido. Quitá una para elegir otra.`;
export const AVISO_LIMITE_REFERENCIA = 'La IA lee las primeras líneas de cada referencia; el resto no entra en el pedido.';
export const AVISO_SIN_DICTADO = 'Este navegador no permite dictar. Escribí el pedido.';

/** Primeras líneas de la referencia, de a 80 caracteres, con el nombre del archivo en la primera. */
export function lineasDeReferencia({ nombre, texto }: Referencia): string[] {
  const limpio = texto.replace(/\s+/g, ' ').trim();
  if (!limpio) return [];
  const corto = nombre.replace(/\.[^.]+$/, '').slice(0, PREFIJO_NOMBRE).trim();
  const lineas: string[] = [];
  let resto = limpio;
  for (let i = 0; i < LINEAS_POR_REFERENCIA && resto; i += 1) {
    const prefijo = i === 0 ? `Ref. ${corto}: ` : '';
    const lugar = MAX_DIETARY_PREFERENCE_LENGTH - prefijo.length;
    lineas.push(`${prefijo}${resto.slice(0, lugar)}`.trim());
    resto = resto.slice(lugar).trim();
  }
  return lineas;
}

export function agregarTexto(actual: string, nuevo: string): string {
  const base = actual.trim(), suma = nuevo.trim();
  return !suma ? actual : base ? `${base} ${suma}` : suma;
}

const esPdf = (archivo: File) => archivo.type === 'application/pdf' || /\.pdf$/i.test(archivo.name);
const esTexto = (archivo: File) => archivo.type.startsWith('text/') || /\.(txt|csv|md)$/i.test(archivo.name);

/** Lee el texto de un archivo adjunto; lanza `PdfInputError` con un mensaje que se puede mostrar tal cual. */
export async function leerReferencia(archivo: File): Promise<Referencia> {
  let texto: string;
  if (esPdf(archivo)) texto = await extractPdfText(archivo);
  else if (esTexto(archivo)) {
    if (archivo.size > MAX_BYTES_TEXTO) throw new PdfInputError('El archivo pesa más de 1 MB.');
    texto = await archivo.text();
  } else throw new PdfInputError(AVISO_TIPO_REFERENCIA);
  if (!texto.replace(/\s+/g, '').length) throw new PdfInputError(AVISO_SIN_TEXTO);
  return { nombre: archivo.name, texto };
}

type Resultado = { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal?: boolean }> };
export type Reconocimiento = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((evento: Resultado) => void) | null; onerror: ((evento: { error?: string }) => void) | null; onend: (() => void) | null;
  start: () => void; stop: () => void;
};
export type CrearReconocimiento = () => Reconocimiento;

/** El dictado del navegador (Web Speech); `null` si este navegador no lo trae. */
export function reconocimientoDelNavegador(entorno: object = globalThis): CrearReconocimiento | null {
  const clase = (entorno as { SpeechRecognition?: new () => Reconocimiento; webkitSpeechRecognition?: new () => Reconocimiento });
  const Constructor = clase.SpeechRecognition ?? clase.webkitSpeechRecognition;
  return Constructor ? () => new Constructor() : null;
}

export function textoDictado(evento: Resultado): string {
  return Array.from(evento.results as ArrayLike<ArrayLike<{ transcript: string }>>).map(r => r[0]?.transcript ?? '').join(' ').trim();
}

export const AVISO_ERROR_DICTADO: Record<string, string> = {
  'not-allowed': 'Para dictar, permití el micrófono en el navegador.',
  'service-not-allowed': 'Para dictar, permití el micrófono en el navegador.',
  'no-speech': 'No te escuché. Probá de nuevo.',
  'audio-capture': 'No encontré un micrófono.',
};
