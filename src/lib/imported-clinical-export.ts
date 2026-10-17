import type { ImportedHistory, ImportOrigin } from '../types/patient-import';
import type { ImportedMeasurement } from '../types/import-authorization';
import type { PdfSection } from './clinical-pdf';
function date(value: string) {
  const day = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day.split('-').reverse().join('/') : 'Sin fecha registrada';
}
function provenance(origin: ImportOrigin) {
  return [`Archivo original: ${origin.file}`, ...(origin.sheet ? [`Hoja: ${origin.sheet}`] : []),
    ...(origin.page !== undefined ? [`Página: ${origin.page}`] : []), ...(origin.row !== undefined ? [`Fila: ${origin.row}`] : []),
    `Huella SHA-256 del archivo: ${origin.fingerprint}`];
}
/** Original values stay historical; this helper neither creates charts nor transforms units. */
export function importedClinicalSections(history: readonly ImportedHistory[], measurements: readonly ImportedMeasurement[]): PdfSection[] {
  const notice = 'Datos originales históricos: no se incorporan a estadísticas ni cálculos actuales.';
  return [
    { title: 'Antecedentes, estudios y planes históricos importados', lines: [notice, ...history.flatMap(item => [
      `${({ history: 'Antecedente histórico', study: 'Estudio histórico', plan: 'Plan histórico privado, sin publicar' })[item.category]}`,
      item.body, `Incorporado a la ficha: ${date(item.created_at)}; la fecha clínica original es la que consta en el texto.`, ...provenance(item.origin),
    ])] },
    { title: 'Mediciones históricas importadas (datos originales)', lines: [notice, ...measurements.flatMap(item => [
      `${date(item.recorded_on)} · ${({ weight: 'Peso', waist: 'Cintura', hip: 'Cadera' })[item.kind]}: ${item.value.toLocaleString('es-AR', { maximumFractionDigits: 20 })} ${item.unit}`,
      `Incorporado a la ficha: ${date(item.created_at)}`, ...provenance(item.origin),
    ])] },
  ];
}
