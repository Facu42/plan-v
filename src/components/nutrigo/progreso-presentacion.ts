import type { Patient } from '../../types';
import type { ProgressSeries } from '../../types/progress';
import type { GlobalPatientProgress, GlobalWeight } from '../../types/progress-global';
import { filterRows, hasRecords, sortRows, type GlobalFilter, type GlobalSort } from '../../lib/progress-global';
import { fondoAvatar, inicialesDe } from './seguimiento-presentacion';

/** A partir de esta cantidad de comidas por revisar, entra en «para mirar». */
export const PENDIENTES_ALTOS = 3;
export type OrdenCartera = GlobalSort | 'adherence';
export type FiltroCartera = GlobalFilter;

const ZONA = 'America/Argentina/Buenos_Aires';
const num = (value: number) => value.toLocaleString('es-AR', { maximumFractionDigits: 1 });

export function pesoTexto(weight: GlobalWeight): string {
  if (weight.state === 'no-consent') return 'Sin permiso';
  if (weight.state === 'none') return 'Sin peso';
  return `${num(weight.last)} ${weight.unit}`;
}

export function cambioTexto(weight: GlobalWeight): string {
  if (weight.state !== 'ok' || weight.delta === null) return weight.state === 'ok' ? 'único registro' : 'Sin dato';
  if (weight.delta === 0) return 'sin cambio';
  const signo = weight.delta > 0 ? '+' : '−';
  return `${signo}${num(Math.abs(weight.delta))} ${weight.unit}`;
}

export type Etiqueta = { texto: 'Sin registros' | 'Baja' | 'Sube' | 'Sin peso' | 'Sin permiso'; clase: 'p-wait' | 'p-conf' | 'p-ok' };

/** Sin registros gana sobre el peso: no es una falta. */
export function etiquetaDe(row: GlobalPatientProgress): Etiqueta {
  if (!hasRecords(row)) return { texto: 'Sin registros', clase: 'p-wait' };
  if (row.weight.state === 'no-consent') return { texto: 'Sin permiso', clase: 'p-ok' };
  if (row.weight.state === 'ok' && row.weight.delta != null && row.weight.delta < 0) return { texto: 'Baja', clase: 'p-conf' };
  if (row.weight.state === 'ok' && row.weight.delta != null && row.weight.delta > 0) return { texto: 'Sube', clase: 'p-wait' };
  return { texto: 'Sin peso', clase: 'p-ok' };
}

export function lineaLista(row: GlobalPatientProgress) {
  return `${pesoTexto(row.weight)} · ${cambioTexto(row.weight)}`;
}

/** La adherencia no existe en la app: el resumen lo dice en vez de un porcentaje. */
export function resumenCartera(rows: readonly GlobalPatientProgress[]) {
  const bajan = rows.filter(fila => fila.weight.state === 'ok' && fila.weight.delta != null && fila.weight.delta < 0).length;
  const suben = rows.filter(fila => fila.weight.state === 'ok' && fila.weight.delta != null && fila.weight.delta > 0).length;
  const sin = rows.filter(fila => !hasRecords(fila)).length;
  return `Sin dato · ${bajan} bajan · ${suben} suben · ${sin} sin registros`;
}

export function filasDe(rows: readonly GlobalPatientProgress[], filtro: FiltroCartera, orden: OrdenCartera) {
  const filtradas = filterRows(rows, filtro);
  return sortRows(filtradas, orden === 'adherence' ? 'name' : orden);
}

export type Mirar = { id: string; nombre: string; porque: string };

/** Suba de peso o muchas comidas por revisar. Quien no registró no entra. */
export function paraMirar(rows: readonly GlobalPatientProgress[]): Mirar[] {
  const lista: Mirar[] = [];
  for (const fila of rows) {
    if (!hasRecords(fila)) continue;
    if (fila.weight.state === 'ok' && fila.weight.delta != null && fila.weight.delta > 0) {
      lista.push({ id: fila.patient_id, nombre: fila.patient_name, porque: `Subió ${num(fila.weight.delta)} ${fila.weight.unit}` });
      continue;
    }
    if (fila.meals.pending >= PENDIENTES_ALTOS) {
      lista.push({ id: fila.patient_id, nombre: fila.patient_name, porque: `${fila.meals.pending} comidas por revisar` });
    }
  }
  return lista;
}

export type Movimiento = { id: string; nombre: string; tipo: 'Alta' | 'Baja'; detalle: string };

function mesDe(iso: string) {
  const clave = claveLocal(iso);
  return clave ? clave.slice(0, 7) : null;
}

function claveLocal(iso: string) {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(fecha);
}

function diaDe(iso: string) {
  const clave = claveLocal(iso);
  if (!clave) return '';
  const [, mes, dia] = clave.split('-');
  return `${Number(dia)}/${Number(mes)}`;
}

export function movimientosDelMes(pacientes: readonly Pick<Patient, 'id' | 'name' | 'created_at' | 'archived_at'>[], ahora = new Date()): Movimiento[] {
  const mes = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(ahora).slice(0, 7);
  const lista: Movimiento[] = [];
  for (const persona of pacientes) {
    if (persona.created_at && mesDe(persona.created_at) === mes) {
      lista.push({ id: persona.id, nombre: persona.name, tipo: 'Alta', detalle: `Entró el ${diaDe(persona.created_at)}.` });
    }
    if (persona.archived_at && mesDe(persona.archived_at) === mes) {
      lista.push({ id: persona.id, nombre: persona.name, tipo: 'Baja', detalle: `Se archivó el ${diaDe(persona.archived_at)}. No es un incumplimiento.` });
    }
  }
  return lista.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

export function alertaDe(row: GlobalPatientProgress): string {
  if (!hasRecords(row)) return 'Falta el dato. No la marques.';
  if (row.weight.state === 'no-consent') return 'No autorizó compartir el peso. No es un incumplimiento.';
  if (row.weight.state !== 'ok') return 'Falta el peso. Tiene comidas. No es un incumplimiento.';
  if (row.weight.delta != null && row.weight.delta > 0) return 'Subió en el período. No es una falta.';
  if (row.weight.delta != null && row.weight.delta < 0) return 'Bajó en el período.';
  return 'Hay un peso en el período.';
}

export function tituloEvolucion(row: GlobalPatientProgress) {
  const etiqueta = etiquetaDe(row);
  if (etiqueta.texto === 'Sin registros' || etiqueta.texto === 'Sin peso' || etiqueta.texto === 'Sin permiso') return etiqueta.texto;
  return cambioTexto(row.weight);
}

/** Sin dos pesos reales no hay curva. Nunca se inventan puntos. */
export function textoCurva(cantidad: number): string | null {
  if (cantidad >= 2) return null;
  if (cantidad === 1) return 'Un solo peso en el período. Sin curva. No es un incumplimiento.';
  return 'No hay peso en este período. Sin curva. Falta el dato y no es un incumplimiento.';
}

export type PuntoPeso = { value: number; on: string; unit: string };

export function puntosDeSerie(series: readonly ProgressSeries[]): PuntoPeso[] {
  const pesos = series.filter(serie => serie.kind === 'weight');
  const serie = pesos.find(item => item.unit === 'kg') ?? pesos[0];
  if (!serie) return [];
  return [...serie.current]
    .sort((a, b) => a.captured_on.localeCompare(b.captured_on) || a.created_at.localeCompare(b.created_at))
    .map(punto => ({ value: punto.value, on: punto.captured_on, unit: serie.unit }));
}

export type Hito = { titulo: string; detalle: string; cuando: string; clase: '' | 'n' };

function diaClave(clave: string) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})/.exec(clave);
  if (!partes) return '—';
  return `${Number(partes[3])}/${Number(partes[2])}`;
}

export function hitosDe(row: GlobalPatientProgress, puntos: readonly PuntoPeso[]): Hito[] {
  if (!puntos.length && !hasRecords(row)) return [{ titulo: 'Sin carga', detalle: 'no hay comidas ni peso', cuando: '—', clase: 'n' }];
  if (!puntos.length) return [{ titulo: 'Registra comidas', detalle: 'el peso no está', cuando: '—', clase: 'n' }];
  const muestra = puntos.length <= 4 ? [...puntos] : [puntos[0]!, ...puntos.slice(-3)];
  return muestra.map((punto, index) => ({
    titulo: index === 0 ? 'Inicio' : index === muestra.length - 1 ? 'Hoy' : 'Peso',
    detalle: `${num(punto.value)} ${punto.unit}`,
    cuando: diaClave(punto.on),
    clase: '',
  }));
}

export function medidasDe(series: readonly ProgressSeries[] | null, row: GlobalPatientProgress): Array<[string, string]> {
  const ultimo = (kind: ProgressSeries['kind']) => {
    const serie = series?.find(item => item.kind === kind);
    const punto = (serie && serie.current.length ? serie.current[serie.current.length - 1] : null) ?? serie?.current_last ?? null;
    return punto && serie ? `${num(punto.value)} ${serie.unit}` : null;
  };
  const peso = row.weight.state === 'ok' ? `${num(row.weight.last)} ${row.weight.unit}` : ultimo('weight') ?? (row.weight.state === 'no-consent' ? 'Sin permiso' : 'Sin dato');
  return [
    ['Peso', peso],
    ['Cintura', ultimo('waist') ?? 'Sin medir'],
    ['Cadera', ultimo('hip') ?? 'Sin medir'],
    ['Grasa', 'Sin dato'],
  ];
}

export function fichaHref(id: string) {
  return `/crm/ficha?paciente=${encodeURIComponent(id)}`;
}

export function registrosHref(id: string) {
  return `/crm/ficha?paciente=${encodeURIComponent(id)}&seccion=registros`;
}

export function primerNombre(nombre: string) {
  return nombre.split(/\s+/).filter(Boolean)[0] || nombre;
}

export function etiquetaCurva(punto: PuntoPeso) {
  return num(punto.value);
}

export { fondoAvatar, inicialesDe };
