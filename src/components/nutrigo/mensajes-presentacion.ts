// Bandeja de Mensajes del panel (v29): qué conversaciones se muestran, en qué orden y qué dice cada renglón.
// Destacar y archivar se guardan en este navegador: todavía no hay dónde guardarlos para todo el consultorio.
import { listStamp } from './message-panel';
import type { ShowroomPatient } from './showroom-model';

export type FiltroBandeja = 'all' | 'un' | 'star' | 'arch';
export type Marcas = { destacadas: ReadonlySet<string>; archivadas: ReadonlySet<string> };

const CLAVE = 'planv:mensajes-marcas';

const normalizar = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const enviadosDe = (paciente: Pick<ShowroomPatient, 'messages'>) =>
  paciente.messages.filter(m => Boolean(m.sent_at)).slice().sort((a, b) => Date.parse(a.sent_at) - Date.parse(b.sent_at));

export function ultimoMensaje(paciente: Pick<ShowroomPatient, 'messages'>) {
  const hilo = enviadosDe(paciente);
  return hilo[hilo.length - 1] ?? null;
}

/** «Vos: …» si lo escribió la nutri; si es un archivo, su nombre. */
export function vistaPrevia(paciente: Pick<ShowroomPatient, 'messages'>): string {
  const ultimo = ultimoMensaje(paciente);
  if (!ultimo) return 'Todavía no hay mensajes';
  const texto = ultimo.text?.trim() || ultimo.attachment?.filename || 'Adjunto';
  return `${ultimo.from === 'vero' ? 'Vos: ' : ''}${texto}`;
}

export const horaDeLista = (paciente: Pick<ShowroomPatient, 'messages'>, ahora = new Date()) => {
  const ultimo = ultimoMensaje(paciente);
  return ultimo ? listStamp(ultimo.sent_at, ahora) : '';
};

const instante = (paciente: Pick<ShowroomPatient, 'messages'>) => {
  const ultimo = ultimoMensaje(paciente);
  return ultimo ? Date.parse(ultimo.sent_at) : -Infinity;
};

export function conversacionesDe(
  pacientes: readonly ShowroomPatient[], filtro: FiltroBandeja, consulta: string, marcas: Marcas, sinLeer: (paciente: ShowroomPatient) => number,
): ShowroomPatient[] {
  const q = normalizar(consulta.trim());
  return pacientes
    .filter(p => (filtro === 'arch') === marcas.archivadas.has(p.id))
    .filter(p => filtro !== 'un' || sinLeer(p) > 0)
    .filter(p => filtro !== 'star' || marcas.destacadas.has(p.id))
    .filter(p => !q || normalizar(p.name).includes(q) || normalizar(vistaPrevia(p)).includes(q))
    .sort((a, b) => instante(b) - instante(a) || a.name.localeCompare(b.name, 'es'));
}

export function textoVacio(filtro: FiltroBandeja, consulta: string): string {
  if (consulta.trim()) return 'No hay conversaciones con ese nombre.';
  if (filtro === 'un') return 'No tenés mensajes sin leer.';
  if (filtro === 'star') return 'Todavía no destacaste ninguna conversación.';
  if (filtro === 'arch') return 'No hay conversaciones archivadas.';
  return 'Todavía no hay pacientes para escribirles.';
}

export function leerMarcas(): Marcas {
  try {
    const guardado = JSON.parse(window.localStorage.getItem(CLAVE) ?? 'null') as { destacadas?: unknown; archivadas?: unknown } | null;
    const ids = (valor: unknown) => new Set(Array.isArray(valor) ? valor.filter((id): id is string => typeof id === 'string') : []);
    return { destacadas: ids(guardado?.destacadas), archivadas: ids(guardado?.archivadas) };
  } catch {
    return { destacadas: new Set(), archivadas: new Set() };
  }
}

export function guardarMarcas(marcas: Marcas) {
  try { window.localStorage.setItem(CLAVE, JSON.stringify({ destacadas: [...marcas.destacadas], archivadas: [...marcas.archivadas] })); } catch { /* sin almacenamiento: queda hasta cerrar la página */ }
}

/** Agrega o saca un id sin tocar el conjunto original. */
export function alternar(ids: ReadonlySet<string>, id: string): Set<string> {
  const siguiente = new Set(ids);
  if (siguiente.has(id)) siguiente.delete(id); else siguiente.add(id);
  return siguiente;
}
