// Solapa Laboratorio y estudios de la Ficha v29: lo que se calcula con los valores revisados, sin interpretar más de lo que dice el informe.
import type { ClinicalWorkspaceRecord, ClinicalWorkspaceSnapshot, LaboratoryValue } from '../../types/clinical-workspace';
import { limitesDeRango } from './ficha-presentacion';
import { diaMesDe } from './ficha-mediciones';
import { recordLaboratoryText, type RecordLabSeries } from './panel-record-data';

export type EstadoLab = { texto: 'Bajo' | 'Alto' | 'Límite' | 'Normal'; clase: 'p-bad' | 'p-wait' | 'p-conf'; fuera: boolean };
type ValorRango = Pick<LaboratoryValue, 'value' | 'operator' | 'range_text'>;
export const COLUMNAS_LAB = 3;
/** Un valor dentro de este tramo (de 0 a 1) del límite de abajo se marca «Límite». */
const TRAMO_LIMITE = 0.1;

/** Solo con valor exacto y un rango inequívoco del informe; si no, no hay estado. */
export function estadoDe(valor: ValorRango): EstadoLab | null {
  if (valor.operator !== '' || valor.value === null || !valor.range_text) return null;
  const limites = limitesDeRango(valor.range_text);
  if (!limites) return null;
  const { min, max } = limites;
  if (min !== null && valor.value < min) return { texto: 'Bajo', clase: 'p-bad', fuera: true };
  if (max !== null && valor.value > max) return { texto: 'Alto', clase: 'p-bad', fuera: true };
  if (min !== null && max !== null && max > min && (valor.value - min) / (max - min) < TRAMO_LIMITE) return { texto: 'Límite', clase: 'p-wait', fuera: false };
  return { texto: 'Normal', clase: 'p-conf', fuera: false };
}

export const fueraDeRango = (valor: ValorRango) => estadoDe(valor)?.fuera ?? false;
export const fechaCorta = (fecha: string) => `${fecha.slice(8, 10)}/${fecha.slice(5, 7)}/${fecha.slice(2, 4)}`;

const todasLasFechas = (series: readonly RecordLabSeries[]) => [...new Set(series.flatMap(s => s.values.map(v => v.date)))].sort();
/** Las últimas fechas con análisis, de la más vieja a la más nueva. */
export const fechasDeLaboratorio = (series: readonly RecordLabSeries[], cuantas = COLUMNAS_LAB) => todasLasFechas(series).slice(-cuantas);

export function metaDeAnalisis(series: readonly RecordLabSeries[]) {
  const fechas = todasLasFechas(series);
  return fechas.length ? `${fechas.length} análisis · el último el ${diaMesDe(fechas[fechas.length - 1]!)}` : 'sin análisis cargados';
}

export const valoresPorFecha = (serie: RecordLabSeries, fechas: readonly string[]) =>
  fechas.map(fecha => { const v = serie.values.find(x => x.date === fecha)?.value; return v ? { texto: recordLaboratoryText(v), fuera: fueraDeRango(v) } : { texto: '—', fuera: false }; });

export type FilaFecha = { fecha: string; archivo: string; documentoId: string | null; valores: number; fuera: number };
/** Un renglón por informe cargado: cuántos valores trae y cuántos salen fuera del rango. */
export function analisisPorFecha(snapshot: ClinicalWorkspaceSnapshot, pacienteId: string, hoy: string): FilaFecha[] {
  const filas: FilaFecha[] = [];
  for (const r of snapshot.records) {
    const datos = r.data;
    if (r.patient_id !== pacienteId || datos.kind !== 'laboratory' || r.recorded_on > hoy) continue;
    const documento = snapshot.documents.find(d => d.id === datos.document_id);
    filas.push({ fecha: r.recorded_on, archivo: documento?.filename ?? 'Informe de laboratorio', documentoId: documento?.id ?? null, valores: datos.values.length, fuera: datos.values.filter(fueraDeRango).length });
  }
  return filas.sort((a, b) => b.fecha.localeCompare(a.fecha) || a.archivo.localeCompare(b.archivo));
}

export type FilaComparada = { nombre: string; unidad: string; valor: string; fuera: boolean; antes: string };
/** Todos los valores de una fecha, con cómo cambiaron contra el análisis anterior de cada uno. */
export function analisisDeFecha(series: readonly RecordLabSeries[], fecha: string): FilaComparada[] {
  return series.flatMap(serie => {
    const actual = serie.values.find(v => v.date === fecha);
    if (!actual) return [];
    const previo = serie.values.filter(v => v.date < fecha).sort((a, b) => a.date.localeCompare(b.date)).pop();
    const nuevo = actual.value.value, viejo = previo?.value.value ?? null;
    const flecha = nuevo === null || viejo === null || actual.value.operator || previo?.value.operator ? '' : nuevo > viejo ? '↑ ' : nuevo < viejo ? '↓ ' : '= ';
    return [{ nombre: serie.name, unidad: serie.unit, valor: recordLaboratoryText(actual.value), fuera: fueraDeRango(actual.value), antes: previo ? `${flecha}antes ${recordLaboratoryText(previo.value)}` : 'primera vez' }];
  });
}

export type HistorialValor = { fecha: string; valor: string; unidad: string; fuera: boolean; archivo: string };
export function historialDeValor(serie: RecordLabSeries, snapshot: ClinicalWorkspaceSnapshot, pacienteId: string): HistorialValor[] {
  const archivoDe = (fecha: string, valorId: string) => {
    const registro = snapshot.records.find(r => r.patient_id === pacienteId && r.recorded_on === fecha && r.data.kind === 'laboratory' && r.data.values.some(v => v.id === valorId));
    const datos = registro?.data;
    const documento = datos?.kind === 'laboratory' ? snapshot.documents.find(d => d.id === datos.document_id) : null;
    return documento?.filename ?? 'Informe de laboratorio';
  };
  return [...serie.values].sort((a, b) => b.date.localeCompare(a.date)).map(({ date, value }) => ({ fecha: date, valor: recordLaboratoryText(value), unidad: value.unit, fuera: fueraDeRango(value), archivo: archivoDe(date, value.id) }));
}

export type GraficoLab = { ancho: number; alto: number; banda: { y: number; alto: number; x: number; ancho: number; texto: string; textoY: number } | null; linea: string; puntos: Array<{ x: number; y: number; texto: string; fuera: boolean }>; anios: Array<{ x: number; texto: string }> };
const DIA = 86_400_000;
/** La curva del valor sobre una línea de tiempo real, con la banda del rango del informe cuando se entiende. */
export function graficoDeValor(serie: RecordLabSeries): GraficoLab | null {
  const exactos = serie.values.filter(v => v.value.operator === '' && v.value.value !== null).sort((a, b) => a.date.localeCompare(b.date));
  if (!exactos.length) return null;
  const ancho = 340, alto = 124, izq = 8, der = 44, arriba = 22, abajo = 20;
  const t = (f: string) => Date.parse(`${f}T12:00:00Z`);
  const primero = t(exactos[0]!.date), ultimo = t(exactos[exactos.length - 1]!.date);
  const tramo = Math.max(ultimo - primero, 90 * DIA);
  const t0 = primero - tramo * 0.15, t1 = ultimo + tramo * 0.25;
  const valores = exactos.map(v => v.value.value!);
  const limites = serie.latest.range_text ? limitesDeRango(serie.latest.range_text) : null;
  const piso = limites?.min ?? 0, techo = limites?.max ?? null;
  const bajo = Math.min(...valores, piso), alta = Math.max(...valores, piso);
  const margen = (alta - bajo) * 0.25 || 1;
  const mn = Math.max(0, bajo - margen);
  const mx = techo === null ? alta + margen : Math.min(techo + margen, Math.max(alta + margen, piso * 1.4));
  const X = (f: string) => izq + (t(f) - t0) / (t1 - t0) * (ancho - izq - der);
  const Y = (v: number) => arriba + (mx - Math.min(v, mx)) / (mx - mn) * (alto - arriba - abajo);
  let banda: GraficoLab['banda'] = null;
  if (limites) {
    const arribaBanda = Y(Math.min(techo ?? mx, mx)), abajoBanda = Y(Math.max(piso, mn));
    banda = { x: izq, ancho: ancho - izq - der, y: arribaBanda, alto: Math.max(0, abajoBanda - arribaBanda), texto: serie.latest.range_text.replace(/\s*-\s*/, '–'), textoY: abajoBanda - 2 };
  }
  const puntos = exactos.map(v => ({ x: X(v.date), y: Y(v.value.value!), texto: recordLaboratoryText(v.value), fuera: fueraDeRango(v.value) }));
  const anios: GraficoLab['anios'] = [];
  for (let a = new Date(t0).getUTCFullYear(); a <= new Date(t1).getUTCFullYear(); a++) { const medio = `${a}-07-01`; if (t(medio) >= t0 && t(medio) <= t1) anios.push({ x: X(medio), texto: String(a) }); }
  if (!anios.length) anios.push({ x: X(exactos[0]!.date), texto: exactos[0]!.date.slice(0, 4) });
  return { ancho, alto, banda, linea: puntos.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' '), puntos, anios };
}

export type PedidoEstudios = { id: string; titulo: string; sub: string };
export function pedidosDeEstudios(registros: readonly ClinicalWorkspaceRecord[], pacienteId: string): PedidoEstudios[] {
  return registros.filter(r => r.patient_id === pacienteId && r.data.kind === 'study_order')
    .sort((a, b) => b.recorded_on.localeCompare(a.recorded_on) || b.created_at.localeCompare(a.created_at))
    .map(r => {
      const estudios = r.data.kind === 'study_order' ? r.data.studies : [];
      const motivo = r.data.kind === 'study_order' ? r.data.reason.trim() : '';
      return { id: r.id, titulo: estudios.join(', '), sub: `pedido el ${diaMesDe(r.recorded_on)}${motivo ? ` · ${motivo}` : ''}` };
    });
}
