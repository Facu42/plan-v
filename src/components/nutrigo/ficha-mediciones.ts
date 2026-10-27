// Lo que la solapa Mediciones de la Ficha v29 dibuja, armado solo con medidas reales. Sin dato dice «Sin dato»; nada se inventa.
import type { Measurement } from '../../types/care';
import type { ClinicalWorkspaceRecord } from '../../types/clinical-workspace';
import { SEGMENT_LABELS } from '../../types/clinical-workspace';
import { summarizeMetric, type MetricKind, type MetricSummary } from '../../lib/body-metrics';
import { kerrSummary } from '../../lib/clinical-workspace';
import { numero, avanceEnKilos } from './ficha-presentacion';

type Medida = Pick<Measurement, 'kind' | 'captured_on' | 'created_at' | 'value_numeric' | 'unit' | 'source'>;

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export const mesDe = (fecha: string) => MESES[Number(fecha.slice(5, 7)) - 1] ?? fecha.slice(5, 7);
export const diaMesDe = (fecha: string) => `${Number(fecha.slice(8, 10))}/${Number(fecha.slice(5, 7))}`;
const con = (valor: number, decimales = 1) => numero(valor, decimales);
export const conSigno = (valor: number, decimales = 1) => valor === 0 ? '0' : `${valor > 0 ? '+' : '−'}${con(Math.abs(valor), decimales)}`;
const limitar = (valor: number) => Math.max(0, Math.min(100, Math.round(valor)));

/** Resumen de una medida hasta hoy (las del futuro no cuentan). */
export function resumenDe(medidas: readonly Medida[], kind: MetricKind, hoy: string): MetricSummary | null {
  return summarizeMetric(medidas.filter(m => m.kind === kind && m.captured_on <= hoy).map(m => ({ value: m.value_numeric, unit: m.unit, captured_on: m.captured_on, created_at: m.created_at })));
}

export type Medidor = { clave: 'imc' | 'grasa' | 'musculo' | 'cintura' | 'icc'; etiqueta: string; valor: string; nota: string; pct: number };

/** Categoría del IMC según la OMS para adultos; no se calcula sin altura. */
export const categoriaImc = (imc: number) => imc < 18.5 ? 'Bajo peso' : imc < 25 ? 'Normal' : imc < 30 ? 'Sobrepeso' : 'Obesidad';

/** Dentro del medidor va un guion; el «Sin dato» va debajo, en la nota. */
const SIN_DATO = (clave: Medidor['clave'], etiqueta: string, nota = 'Sin dato'): Medidor => ({ clave, etiqueta, valor: '—', nota, pct: 0 });
const desde = (resumen: MetricSummary, decimales = 1) => resumen.changeFromFirst === null ? 'Primer registro' : `${conSigno(resumen.changeFromFirst, decimales)} desde ${mesDe(resumen.first.date)}`;

/** Los cinco medidores de arriba. La escala de cada uno es fija (IMC 15–40, grasa 0–50 %, cintura 50–130 cm, ICC 0,6–1,2). */
export function medidoresDe(medidas: readonly Medida[], hoy: string): Medidor[] {
  const peso = resumenDe(medidas, 'weight', hoy), altura = resumenDe(medidas, 'height', hoy);
  const grasa = resumenDe(medidas, 'body_fat_pct', hoy), musculo = resumenDe(medidas, 'muscle_mass', hoy);
  const cintura = resumenDe(medidas, 'waist', hoy), cadera = resumenDe(medidas, 'hip', hoy);
  const kilos = peso && peso.unit === 'kg' ? peso.last.value : null, metros = altura && altura.unit === 'cm' ? altura.last.value / 100 : null;
  const imc = kilos && metros ? kilos / (metros * metros) : null;
  const icc = cintura && cadera && cintura.unit === cadera.unit ? cintura.last.value / cadera.last.value : null;
  return [
    imc === null ? SIN_DATO('imc', 'IMC', altura ? 'Falta el peso en kg' : 'Falta la altura') : { clave: 'imc', etiqueta: 'IMC', valor: con(imc), nota: categoriaImc(imc), pct: limitar((imc - 15) / 25 * 100) },
    grasa ? { clave: 'grasa', etiqueta: 'Grasa', valor: `${con(grasa.last.value)}${grasa.unit === '%' ? '%' : ` ${grasa.unit}`}`, nota: desde(grasa), pct: limitar(grasa.last.value / 50 * 100) } : SIN_DATO('grasa', 'Grasa'),
    musculo ? { clave: 'musculo', etiqueta: 'Músculo', valor: `${con(musculo.last.value)} ${musculo.unit}`, nota: musculo.changeFromPrevious === null ? 'Primer registro' : conSigno(musculo.changeFromPrevious), pct: limitar(musculo.last.value / 60 * 100) } : SIN_DATO('musculo', 'Músculo'),
    cintura ? { clave: 'cintura', etiqueta: 'Cintura', valor: `${con(cintura.last.value)} ${cintura.unit}`, nota: desde(cintura), pct: limitar((cintura.last.value - 50) / 80 * 100) } : SIN_DATO('cintura', 'Cintura'),
    icc === null ? SIN_DATO('icc', 'Cintura/cadera', cintura ? 'Falta la cadera' : '—') : { clave: 'icc', etiqueta: 'Cintura/cadera', valor: con(icc, 2), nota: 'cintura ÷ cadera', pct: limitar((icc - 0.6) / 0.6 * 100) },
  ];
}

/** «última 14/10 · consultorio»: la fecha de la última medida y quién la cargó. */
export function ultimaMedicion(medidas: readonly Medida[], hoy: string): string {
  const hasta = medidas.filter(m => m.captured_on <= hoy);
  if (!hasta.length) return 'sin mediciones';
  const fecha = hasta.reduce((a, m) => m.captured_on > a ? m.captured_on : a, '');
  const quienes = [...new Set(hasta.filter(m => m.captured_on === fecha).map(m => m.source === 'professional' ? 'consultorio' : 'paciente'))];
  return `última ${diaMesDe(fecha)} · ${quienes.join(' y ')}`;
}

export type SolapaMedida = 'pliegues' | 'perimetros' | 'composicion' | 'segmental';
export const SOLAPAS_MEDIDA: ReadonlyArray<readonly [SolapaMedida, string]> = [['pliegues', 'Pliegues'], ['perimetros', 'Perímetros'], ['composicion', 'Composición'], ['segmental', 'Segmental']];
const UNIDAD_DE_SOLAPA: Record<SolapaMedida, string> = { pliegues: 'mm', perimetros: 'cm', composicion: '', segmental: '' };
export const unidadDeSolapa = (solapa: SolapaMedida) => UNIDAD_DE_SOLAPA[solapa];

const POR_SOLAPA: Partial<Record<SolapaMedida, ReadonlyArray<readonly [MetricKind, string]>>> = {
  perimetros: [['waist', 'Cintura'], ['hip', 'Cadera'], ['abdomen', 'Abdominal'], ['shoulders', 'Hombros'], ['chest', 'Pectoral'], ['arm', 'Brazo'], ['thigh', 'Muslo']],
  composicion: [['weight', 'Peso'], ['body_fat_pct', 'Grasa corporal'], ['fat_mass', 'Masa grasa'], ['muscle_mass', 'Masa muscular'], ['muscle_pct', 'Músculo'], ['body_water_pct', 'Agua corporal'], ['protein_mass', 'Proteína'], ['visceral_fat', 'Grasa visceral'], ['bmr', 'Metabolismo basal'], ['metabolic_age', 'Edad metabólica']],
};

export type FilaMedida = { sitio: string; ultimo: string; fecha: string; anterior: string; cambio: string };

/** Una fila por medida que tenga datos: último valor, su fecha, el valor anterior y el cambio. */
export function filasDeMedidas(medidas: readonly Medida[], solapa: 'perimetros' | 'composicion', hoy: string): FilaMedida[] {
  const filas: FilaMedida[] = [];
  for (const [kind, sitio] of POR_SOLAPA[solapa] ?? []) {
    const r = resumenDe(medidas, kind, hoy);
    if (!r) continue;
    const previa = r.history[1];
    filas.push({ sitio, ultimo: `${con(r.last.value)} ${r.unit}`, fecha: diaMesDe(r.last.date), anterior: previa ? `${con(previa.value)} ${r.unit}` : '—', cambio: r.changeFromPrevious === null ? '—' : conSigno(r.changeFromPrevious) });
  }
  return filas;
}

const COMPONENTE: Record<string, string> = { muscle: 'Músculo', fat: 'Grasa', water: 'Agua', impedance: 'Impedancia' };
export type FilaSegmental = { sitio: string; ultimo: string; fecha: string; anterior: string; cambio: string };

/** La última evaluación segmental contra la anterior, por segmento y componente. */
export function filasSegmentales(registros: readonly ClinicalWorkspaceRecord[], hoy: string): FilaSegmental[] {
  const evaluaciones = registros.filter(r => r.data.kind === 'segmental' && r.recorded_on <= hoy).sort((a, b) => b.recorded_on.localeCompare(a.recorded_on) || b.created_at.localeCompare(a.created_at));
  const [ultima, previa] = evaluaciones;
  if (!ultima || ultima.data.kind !== 'segmental') return [];
  const anteriores = previa && previa.data.kind === 'segmental' ? previa.data.values : [];
  return ultima.data.values.map(v => {
    const antes = anteriores.find(a => a.segment === v.segment && a.component === v.component && a.unit === v.unit);
    return { sitio: `${SEGMENT_LABELS[v.segment]} · ${COMPONENTE[v.component] ?? v.component}`, ultimo: `${con(v.value, 2)} ${v.unit}`, fecha: diaMesDe(ultima.recorded_on), anterior: antes ? `${con(antes.value, 2)} ${v.unit}` : '—', cambio: antes ? conSigno(Math.round((v.value - antes.value) * 100) / 100, 2) : '—' };
  });
}

export type ComponenteKerr = { clave: string; etiqueta: string; kg: number; pct: number; clase: string };
export type ResumenKerr = { fecha: string; peso: number; componentes: ComponenteKerr[]; suma: number | null; diferencia: number | null; completo: boolean };
/** La clase de color es la de `fxStk` del boceto: o (adiposa), vacía (muscular), k (ósea), n (residual), p (piel). */
const KERR: ReadonlyArray<readonly [string, string, string]> = [['adipose', 'Adiposa', 'o'], ['muscle', 'Muscular', ''], ['bone', 'Ósea', 'k'], ['residual', 'Residual', 'n'], ['skin', 'Piel', 'p']];

/** La última evaluación Kerr cargada por la profesional. No se calcula nada: son sus resultados. */
export function ultimaKerr(registros: readonly ClinicalWorkspaceRecord[], hoy: string): ResumenKerr | null {
  const ultima = registros.filter(r => r.data.kind === 'kerr' && r.recorded_on <= hoy).sort((a, b) => b.recorded_on.localeCompare(a.recorded_on) || b.created_at.localeCompare(a.created_at))[0];
  if (!ultima || ultima.data.kind !== 'kerr') return null;
  const { components_kg: masas, weight_kg: peso } = ultima.data;
  const resumen = kerrSummary(masas, peso);
  const componentes = KERR.flatMap(([clave, etiqueta, clase]) => { const kg = masas[clave as keyof typeof masas]; return typeof kg === 'number' ? [{ clave, etiqueta, kg, pct: Math.round(kg / peso * 100), clase }] : []; });
  return { fecha: ultima.recorded_on, peso, componentes, suma: resumen.total_kg, diferencia: resumen.difference_kg, completo: resumen.complete };
}

export type SerieEvolucion = { clave: 'peso' | 'grasa' | 'cintura'; etiqueta: string; valores: number[]; fechas: string[]; unidad: string; meta: number | null };
const SERIES: ReadonlyArray<readonly ['peso' | 'grasa' | 'cintura', string, MetricKind]> = [['peso', 'Peso', 'weight'], ['grasa', 'Grasa', 'body_fat_pct'], ['cintura', 'Cintura', 'waist']];
export const PUNTOS_DE_EVOLUCION = 6;

/** Los últimos seis valores de cada serie. La meta en kilos sale del objetivo escrito, si trae kilos. */
export function seriesDeEvolucion(medidas: readonly Medida[], objetivo: string, hoy: string): SerieEvolucion[] {
  return SERIES.map(([clave, etiqueta, kind]) => {
    const r = resumenDe(medidas, kind, hoy);
    const historia = r ? [...r.history].reverse().slice(-PUNTOS_DE_EVOLUCION) : [];
    const primero = r?.first.value ?? null, actual = r?.last.value ?? null;
    return { clave, etiqueta, valores: historia.map(h => h.value), fechas: historia.map(h => diaMesDe(h.date)), unidad: r?.unit ?? '', meta: clave === 'peso' && r?.unit === 'kg' ? avanceEnKilos(primero, actual, objetivo)?.meta ?? null : null };
  });
}
