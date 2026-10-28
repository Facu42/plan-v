// «Analizar» del Laboratorio (v29): lectura calculada con los valores ya revisados. No usa IA ni manda nada afuera:
// compara con el análisis anterior y nombra lo que sale del rango del informe, sin interpretar causas ni indicar tratamientos.
import { estadoDe, fechaCorta, fechasDeLaboratorio, type EstadoLab } from './ficha-laboratorio';
import type { LabReadingRequest } from '../../api/clinical-workspace';
import { recordLaboratoryText, type RecordLabSeries } from './panel-record-data';

export type FilaLectura = { nombre: string; unidad: string; valor: string; cambio: string; estado: EstadoLab | null };
export type Lectura = { ultima: string | null; previa: string | null; filas: FilaLectura[]; texto: string };

const num = (n: number) => n.toLocaleString('es-AR', { maximumFractionDigits: 2 });

/** «sube 3», «baja 2» o «igual»; sin cifra si alguno de los dos valores no es exacto. */
function cambioDe(serie: RecordLabSeries, ultima: string, previa: string | null): string {
  if (!previa) return 'primera vez';
  const nuevo = serie.values.find(v => v.date === ultima)?.value, viejo = serie.values.find(v => v.date === previa)?.value;
  if (!viejo) return 'sin dato anterior';
  if (!nuevo || nuevo.operator || viejo.operator || nuevo.value === null || viejo.value === null) return `antes ${recordLaboratoryText(viejo)}`;
  const delta = Math.round((nuevo.value - viejo.value) * 100) / 100;
  return delta === 0 ? 'igual que antes' : `${delta > 0 ? 'sube' : 'baja'} ${num(Math.abs(delta))}`;
}

const lista = (items: readonly string[]) => items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;

export function armarLectura(series: readonly RecordLabSeries[]): Lectura {
  const fechas = fechasDeLaboratorio(series, 2);
  const ultima = fechas[fechas.length - 1] ?? null;
  const previa = fechas.length > 1 ? fechas[0]! : null;
  if (!ultima) return { ultima: null, previa: null, filas: [], texto: 'Todavía no hay valores revisados para leer. Cargá un informe y confirmá sus valores.' };
  const filas: FilaLectura[] = series.flatMap(serie => {
    const actual = serie.values.find(v => v.date === ultima)?.value;
    return actual ? [{ nombre: serie.name, unidad: serie.unit, valor: recordLaboratoryText(actual), cambio: cambioDe(serie, ultima, previa), estado: estadoDe(actual) }] : [];
  });
  const fuera = filas.filter(f => f.estado?.fuera), limite = filas.filter(f => f.estado?.texto === 'Límite');
  const partes = [`Análisis del ${fechaCorta(ultima)}: ${filas.length} ${filas.length === 1 ? 'valor' : 'valores'}, ${fuera.length ? `${fuera.length} fuera del rango del informe` : 'ninguno fuera del rango del informe'}.`];
  if (fuera.length) partes.push(`Fuera de rango: ${lista(fuera.map(f => `${f.nombre} ${f.valor} ${f.unidad} (${f.estado!.texto.toLowerCase()})`))}.`);
  if (limite.length) partes.push(`En el límite de abajo: ${lista(limite.map(f => `${f.nombre} ${f.valor} ${f.unidad}`))}.`);
  const cambios = filas.filter(f => /^(sube|baja)/.test(f.cambio));
  if (previa && cambios.length) partes.push(`Desde el ${fechaCorta(previa)}: ${lista(cambios.map(f => `${f.nombre} ${f.cambio}`))}.`);
  partes.push('Es una lectura automática de los valores del informe: no interpreta causas ni indica tratamientos. El criterio clínico es tuyo.');
  return { ultima, previa, filas, texto: partes.join(' ') };
}

/** Lo único que sale hacia la IA: estudio, valor, unidad, rango del informe y fecha. Sin nombre ni contacto. */
export function pedidoParaIA(series: readonly RecordLabSeries[]): LabReadingRequest | null {
  const fechas = fechasDeLaboratorio(series, 2);
  const ultima = fechas[fechas.length - 1], previa = fechas.length > 1 ? fechas[0]! : null;
  if (!ultima) return null;
  const rows = series.flatMap(serie => {
    const actual = serie.values.find(v => v.date === ultima)?.value;
    if (!actual) return [];
    const antes = previa ? serie.values.find(v => v.date === previa)?.value : undefined;
    return [{ name: serie.name, value: recordLaboratoryText(actual), unit: serie.unit, ...(actual.range_text ? { range: actual.range_text } : {}), ...(antes ? { previous: recordLaboratoryText(antes) } : {}) }];
  });
  return rows.length ? { date: ultima, previous_date: previa, rows: rows.slice(0, 60) } : null;
}
