// Lo que la Ficha v29 dibuja, armado solo con datos reales. Sin dato dice «Sin dato», «Sin declarar» o «—»; no se inventa nada.
import type { Measurement } from '../../types/care';
import type { LaboratoryValue } from '../../types/clinical-workspace';
import type { RecordTab } from './patient-record-sections';
import { metaEnKg } from './pacientes-presentacion';

export type SolapaFicha = 'resumen' | 'historia' | 'consultas' | 'mediciones' | 'objetivos' | 'plan' | 'alimentario' | 'laboratorio' | 'archivos' | 'cobros';

/** Las diez solapas del boceto, en el orden en que quedó (Consultas tercera), con la sección de la ficha que abre cada una. */
export const FICHA_SOLAPAS: ReadonlyArray<readonly [SolapaFicha, string, RecordTab]> = [
  ['resumen', 'Resumen', 'resumen'],
  ['historia', 'Historia clínica', 'historia'],
  ['consultas', 'Consultas y notas', 'consultas'],
  ['mediciones', 'Mediciones', 'evolucion'],
  ['objetivos', 'Objetivos y hábitos', 'planificacion'],
  ['plan', 'Plan', 'plan'],
  ['alimentario', 'Registro alimentario', 'alimentario'],
  ['laboratorio', 'Laboratorio y estudios', 'laboratorio'],
  ['archivos', 'Archivos', 'archivos'],
  ['cobros', 'Cobros', 'cobros'],
];

const SOLAPA_DE_SECCION: Partial<Record<RecordTab, SolapaFicha>> = {
  evolucion: 'mediciones', planificacion: 'objetivos', notas: 'consultas', semanal: 'plan', compras: 'plan',
};

/** La solapa que queda marcada para una sección de la ficha. El chat no es una solapa: no marca ninguna. */
export function solapaDe(seccion: RecordTab): SolapaFicha | null {
  if (seccion === 'chat') return null;
  return SOLAPA_DE_SECCION[seccion] ?? (FICHA_SOLAPAS.some(([id]) => id === seccion) ? seccion as SolapaFicha : null);
}

export const seccionDe = (solapa: SolapaFicha): RecordTab => FICHA_SOLAPAS.find(([id]) => id === solapa)![2];

export type ConteoSolapa = { n: number; hot: boolean };
export type Pendientes = { comidas: number | null; notaPorAprobar: boolean; alterados: number };

/** Números de las solapas: solo los que se conocen. Archivos y Cobros no traen conteo hasta abrirlos. */
export function conteoDeSolapas({ comidas, notaPorAprobar, alterados }: Pendientes): Partial<Record<SolapaFicha, ConteoSolapa>> {
  const conteo: Partial<Record<SolapaFicha, ConteoSolapa>> = {};
  if (notaPorAprobar) conteo.consultas = { n: 1, hot: true };
  if (comidas) conteo.alimentario = { n: comidas, hot: false };
  if (alterados) conteo.laboratorio = { n: alterados, hot: true };
  return conteo;
}

// ---------------------------------------------------------------- números

const fmt = (valor: number, decimales = 1) => valor.toLocaleString('es-AR', { maximumFractionDigits: decimales, minimumFractionDigits: 0 });
export const numero = fmt;
const signo = (valor: number) => valor > 0 ? '+' : valor < 0 ? '−' : '±';

export type Mosaico = { clave: 'peso' | 'grasa' | 'cintura'; etiqueta: string; valor: string; unidad: string; cambio: string; bueno: boolean; serie: number[] };
const MOSAICOS = [['peso', 'Peso', 'weight', 'kg'], ['grasa', 'Grasa', 'body_fat_pct', '%'], ['cintura', 'Cintura', 'waist', 'cm']] as const;
const SUBE_ES_BUENO = /\b(subir|aument|gan(ar|o)|masa)/i;
export const MEDIDAS_EN_MOSAICO = 7;

/** Último valor, cambio contra la medición anterior y los últimos siete puntos. Sin medidas, «Sin dato» y curva vacía. */
export function mosaicosDeMedidas(medidas: readonly Pick<Measurement, 'kind' | 'captured_on' | 'created_at' | 'value_numeric' | 'unit'>[], hoy: string, objetivo: string): Mosaico[] {
  return MOSAICOS.map(([clave, etiqueta, kind, unidadBase]) => {
    const filas = medidas.filter(m => m.kind === kind && m.captured_on <= hoy).sort((a, b) => a.captured_on.localeCompare(b.captured_on) || a.created_at.localeCompare(b.created_at));
    const ultima = filas[filas.length - 1];
    if (!ultima) return { clave, etiqueta, valor: 'Sin dato', unidad: '', cambio: '—', bueno: true, serie: [] };
    const unidad = ultima.unit || unidadBase;
    const mismas = filas.filter(m => (m.unit || unidadBase) === unidad);
    const anterior = mismas.length > 1 ? mismas[mismas.length - 2] : null;
    const delta = anterior ? Math.round((ultima.value_numeric - anterior.value_numeric) * 10) / 10 : null;
    const sube = SUBE_ES_BUENO.test(objetivo);
    return {
      clave, etiqueta, valor: fmt(ultima.value_numeric), unidad,
      cambio: delta === null ? 'primera medición' : `${signo(delta)}${fmt(Math.abs(delta))}`,
      bueno: delta === null || delta === 0 || (sube ? delta > 0 : delta < 0),
      serie: mismas.slice(-MEDIDAS_EN_MOSAICO).map(m => m.value_numeric),
    };
  });
}

// ---------------------------------------------------------------- curvas y medio círculo (misma geometría del boceto)

export type CurvaFicha = {
  ancho: number; alto: number; curva: string; area: string; puntos: Array<[number, number]>; ultimo: [number, number] | null;
  meta: { y: number; etiqueta: string; xTexto: number } | null; etiquetas: Array<{ x: number; texto: string }>; texto: string;
};

export function curvaFicha(valores: readonly number[], rotulos: readonly string[] | null, opciones: { ancho?: number; alto?: number; mini?: boolean; meta?: number | null; rotuloMeta?: string } = {}): CurvaFicha {
  const W = opciones.ancho ?? 300, H = opciones.alto ?? 110, mini = Boolean(opciones.mini);
  const pl = 6, pr = mini ? 4 : 30, pt = mini ? 4 : 18, pb = rotulos ? 20 : mini ? 3 : 8;
  const meta = opciones.meta ?? null;
  const bajo = Math.min(...valores, meta ?? Infinity), alto = Math.max(...valores, meta ?? -Infinity);
  const holgura = (alto - bajo) * 0.15 || 1, mn = bajo - holgura, mx = alto + holgura;
  const X = (k: number) => valores.length < 2 ? W - pr : pl + k * (W - pl - pr) / (valores.length - 1);
  const Y = (v: number) => pt + (mx - v) / (mx - mn) * (H - pt - pb);
  const P = valores.map((v, k): [number, number] => [X(k), Y(v)]);
  let curva = '';
  P.forEach(([x, y], k) => {
    if (!k) { curva = `M${x.toFixed(1)} ${y.toFixed(1)}`; return; }
    const [x0, y0] = P[k - 1]!, m = (x - x0) / 2;
    curva += ` C${(x0 + m).toFixed(1)} ${y0.toFixed(1)} ${(x - m).toFixed(1)} ${y.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
  });
  const ultimo = P[P.length - 1] ?? null;
  return {
    ancho: W, alto: H, curva, ultimo, puntos: P.slice(0, -1),
    area: ultimo ? `${curva} L${ultimo[0].toFixed(1)} ${H - pb} L${P[0]![0].toFixed(1)} ${H - pb}Z` : '',
    meta: meta === null ? null : { y: Y(meta), etiqueta: opciones.rotuloMeta ?? fmt(meta), xTexto: W - pr + 7 },
    etiquetas: rotulos ? rotulos.map((texto, k) => ({ x: X(k), texto })) : [],
    texto: valores.length ? fmt(valores[valores.length - 1]!) : '',
  };
}

export type MedioCirculo = { arco: string; marcas: Array<[number, number, number, number]>; fin: [number, number] | null };
export function medioCirculo(pct: number): MedioCirculo {
  const R = 62, cx = 80, cy = 78, angulo = Math.PI * (1 - pct / 100);
  return {
    arco: `M${cx - R} ${cy}A${R} ${R} 0 0 1 ${cx + R} ${cy}`,
    marcas: [0, 25, 50, 75, 100].map((t): [number, number, number, number] => {
      const a = Math.PI * (1 - t / 100);
      return [cx + (R + 8) * Math.cos(a), cy - (R + 8) * Math.sin(a), cx + (R + 12) * Math.cos(a), cy - (R + 12) * Math.sin(a)];
    }),
    fin: pct ? [cx + R * Math.cos(angulo), cy - R * Math.sin(angulo)] : null,
  };
}

/** Avance al objetivo en kilos: de lo que bajó (o subió) sobre lo que había que recorrer. Sin primera medición o sin meta en kilos, null. */
export function avanceEnKilos(primero: number | null, actual: number | null, objetivo: string): { pct: number; faltan: number; meta: number } | null {
  const meta = metaEnKg(objetivo);
  if (primero === null || actual === null || meta === null || primero === meta) return null;
  const pct = Math.max(0, Math.min(100, Math.round((primero - actual) / (primero - meta) * 100)));
  return { pct, faltan: Math.round(Math.abs(actual - meta) * 10) / 10, meta };
}

// ---------------------------------------------------------------- laboratorio

export type ValorAlterado = { nombre: string; valor: string; rango: string; sentido: 'baja' | 'alta' };
const NUMERO = '(\\d+(?:[.,]\\d+)?)';
const aNumero = (texto: string) => parseFloat(texto.replace(',', '.'));

/** Solo cuando el informe trae el rango en un formato inequívoco («30 - 400», «< 5», «hasta 200», «mín. 30»). Si no, no interpreta. */
export function limitesDeRango(rango: string): { min: number | null; max: number | null } | null {
  const texto = rango.trim();
  const entre = texto.match(new RegExp(`^${NUMERO}\\s*(?:-|–|—|a)\\s*${NUMERO}(?:\\s*[A-Za-zµ%/.]+)*$`, 'i'));
  if (entre) return { min: aNumero(entre[1]!), max: aNumero(entre[2]!) };
  const menor = texto.match(new RegExp(`^(?:<|<=|≤|hasta|menor a|máx\\.?|máximo)\\s*${NUMERO}`, 'i'));
  if (menor) return { min: null, max: aNumero(menor[1]!) };
  const mayor = texto.match(new RegExp(`^(?:>|>=|≥|desde|mayor a|mín\\.?|mínimo)\\s*${NUMERO}`, 'i'));
  if (mayor) return { min: aNumero(mayor[1]!), max: null };
  return null;
}

export function valoresAlterados(series: ReadonlyArray<{ name: string; unit: string; latest: Pick<LaboratoryValue, 'value' | 'operator' | 'raw_value' | 'range_text'> }>): ValorAlterado[] {
  const alterados: ValorAlterado[] = [];
  for (const { name, unit, latest } of series) {
    if (latest.operator !== '' || latest.value === null || !latest.range_text) continue;
    const limites = limitesDeRango(latest.range_text);
    if (!limites) continue;
    const sentido = limites.min !== null && latest.value < limites.min ? 'baja' : limites.max !== null && latest.value > limites.max ? 'alta' : null;
    if (sentido) alterados.push({ nombre: name, valor: `${latest.raw_value}${unit ? ` ${unit}` : ''}`, rango: latest.range_text, sentido });
  }
  return alterados;
}

// ---------------------------------------------------------------- encabezado

export const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/** «2026-10-14» → «14/10». */
export const diaMes = (id: string) => `${Number(id.slice(8, 10))}/${Number(id.slice(5, 7))}`;

export const PUNTOS_DEL_INGRESO = 5;
/** Qué tanto del ingreso está completo, según los puntos que ya revisa la ficha (consentimiento, nombre, alergias, restricciones y envío). */
export function avanceDeIngreso(faltantes: number) {
  const completos = Math.max(0, Math.min(PUNTOS_DEL_INGRESO, PUNTOS_DEL_INGRESO - faltantes));
  return { completos, total: PUNTOS_DEL_INGRESO, pct: Math.round(completos / PUNTOS_DEL_INGRESO * 100) };
}
