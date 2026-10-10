import { z } from 'zod';
import { careDate } from '../types/care';

/** Mediciones de la ficha: básicas, composición corporal y perímetros (Nutriboost 1:10–1:30, ver docs/mediciones-dashboard-2026-10-10.md). */
export const METRIC_GROUPS = [
  { id: 'basicas', label: 'Básicas' },
  { id: 'composicion', label: 'Composición corporal' },
  { id: 'perimetros', label: 'Perímetros' },
] as const;
export type MetricGroup = (typeof METRIC_GROUPS)[number]['id'];

export interface MetricDefinition {
  label: string;
  group: MetricGroup;
  unit: string;
  min: number;
  max: number;
  /** Cantidad de decimales que se aceptan; 0 pide un número entero. */
  decimals: 0 | 1 | 2;
}

/** Peso, cintura y cadera ya existían y siguen su camino anterior (registros de seguimiento). */
export const LEGACY_METRIC_KINDS = ['weight', 'waist', 'hip'] as const;
export const BODY_METRIC_KINDS = [
  'height',
  'body_fat_pct', 'fat_mass', 'muscle_pct', 'muscle_mass', 'body_water_pct', 'protein_mass', 'visceral_fat', 'bmr', 'metabolic_age',
  'abdomen', 'shoulders', 'chest', 'arm', 'thigh',
] as const;
export type BodyMetricKind = (typeof BODY_METRIC_KINDS)[number];
export type LegacyMetricKind = (typeof LEGACY_METRIC_KINDS)[number];
export type MetricKind = BodyMetricKind | LegacyMetricKind;

const definitions: Record<MetricKind, MetricDefinition> = {
  height: { label: 'Altura', group: 'basicas', unit: 'cm', min: 50, max: 260, decimals: 1 },
  weight: { label: 'Peso', group: 'basicas', unit: 'kg', min: 1, max: 500, decimals: 2 },
  waist: { label: 'Cintura', group: 'basicas', unit: 'cm', min: 10, max: 300, decimals: 1 },
  hip: { label: 'Cadera', group: 'basicas', unit: 'cm', min: 10, max: 300, decimals: 1 },
  body_fat_pct: { label: 'Grasa corporal', group: 'composicion', unit: '%', min: 1, max: 80, decimals: 1 },
  fat_mass: { label: 'Masa grasa', group: 'composicion', unit: 'kg', min: 0.5, max: 300, decimals: 1 },
  muscle_pct: { label: 'Músculo', group: 'composicion', unit: '%', min: 5, max: 80, decimals: 1 },
  muscle_mass: { label: 'Masa muscular', group: 'composicion', unit: 'kg', min: 1, max: 200, decimals: 1 },
  body_water_pct: { label: 'Agua corporal', group: 'composicion', unit: '%', min: 20, max: 80, decimals: 1 },
  protein_mass: { label: 'Proteína', group: 'composicion', unit: 'kg', min: 1, max: 60, decimals: 1 },
  visceral_fat: { label: 'Grasa visceral', group: 'composicion', unit: 'nivel', min: 1, max: 60, decimals: 0 },
  bmr: { label: 'Metabolismo basal', group: 'composicion', unit: 'kcal', min: 300, max: 6000, decimals: 0 },
  metabolic_age: { label: 'Edad metabólica', group: 'composicion', unit: 'años', min: 5, max: 120, decimals: 0 },
  abdomen: { label: 'Abdominal', group: 'perimetros', unit: 'cm', min: 10, max: 300, decimals: 1 },
  shoulders: { label: 'Hombros', group: 'perimetros', unit: 'cm', min: 10, max: 300, decimals: 1 },
  chest: { label: 'Pectoral', group: 'perimetros', unit: 'cm', min: 10, max: 300, decimals: 1 },
  arm: { label: 'Brazo', group: 'perimetros', unit: 'cm', min: 10, max: 300, decimals: 1 },
  thigh: { label: 'Muslo', group: 'perimetros', unit: 'cm', min: 10, max: 300, decimals: 1 },
};

export const METRIC_KINDS = Object.keys(definitions) as MetricKind[];

export function metricDefinition(kind: MetricKind): MetricDefinition {
  return definitions[kind];
}
export function isMetricKind(kind: string): kind is MetricKind {
  return Object.prototype.hasOwnProperty.call(definitions, kind);
}
export function isBodyMetricKind(kind: string): kind is BodyMetricKind {
  return (BODY_METRIC_KINDS as readonly string[]).includes(kind);
}
export function metricLabel(kind: string): string {
  return isMetricKind(kind) ? definitions[kind].label : kind;
}

function withinDecimals(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.abs(Math.round(value * factor) - value * factor) < 1e-6;
}
function rangeText(definition: MetricDefinition) {
  return `entre ${definition.min.toLocaleString('es-AR')} y ${definition.max.toLocaleString('es-AR')} ${definition.unit}`;
}
export type MetricValueResult = { ok: true; empty: true } | { ok: true; empty: false; value: number } | { ok: false; message: string };

/** Lee lo que se escribió a mano. Un campo vacío queda vacío: nunca se convierte en cero. */
export function parseMetricValue(kind: MetricKind, raw: string): MetricValueResult {
  const text = raw.trim();
  if (text === '') return { ok: true, empty: true };
  const definition = definitions[kind];
  const value = Number(text.replace(',', '.'));
  if (!Number.isFinite(value) || !/^-?\d+([.,]\d+)?$/.test(text)) return { ok: false, message: `${definition.label}: escribí un número.` };
  if (value < definition.min || value > definition.max) return { ok: false, message: `${definition.label}: ingresá un valor ${rangeText(definition)}.` };
  if (!withinDecimals(value, definition.decimals)) {
    return { ok: false, message: definition.decimals === 0 ? `${definition.label}: usá un número entero.` : `${definition.label}: usá hasta ${definition.decimals} ${definition.decimals === 1 ? 'decimal' : 'decimales'}.` };
  }
  return { ok: true, empty: false, value };
}

const bodyMetricItem = z.object({
  id: z.uuid(),
  kind: z.enum(BODY_METRIC_KINDS),
  value: z.number(),
}).strict().superRefine((item, context) => {
  const definition = definitions[item.kind];
  if (item.value < definition.min || item.value > definition.max || !withinDecimals(item.value, definition.decimals)) {
    context.addIssue({ code: 'custom', message: `${definition.label} fuera de rango.`, path: ['value'] });
  }
});
export const MAX_BODY_METRIC_ITEMS = BODY_METRIC_KINDS.length;
/** Carga de varias métricas nuevas con una misma fecha. Las unidades las fija el catálogo. */
export const bodyMetricBatchSchema = z.object({
  captured_on: careDate,
  items: z.array(bodyMetricItem).min(1).max(MAX_BODY_METRIC_ITEMS),
}).strict().superRefine((batch, context) => {
  if (new Set(batch.items.map((item) => item.kind)).size !== batch.items.length) context.addIssue({ code: 'custom', message: 'Hay una métrica repetida.', path: ['items'] });
  if (new Set(batch.items.map((item) => item.id)).size !== batch.items.length) context.addIssue({ code: 'custom', message: 'Hay un identificador repetido.', path: ['items'] });
});
export type BodyMetricBatch = z.infer<typeof bodyMetricBatchSchema>;

export interface MetricRow { value: number; unit: string; captured_on: string; created_at: string }
export interface MetricHistoryEntry { value: number; date: string; change: number | null; isLatest: boolean }
export interface MetricSummary {
  unit: string;
  count: number;
  min: number;
  max: number;
  average: number;
  first: { value: number; date: string };
  last: { value: number; date: string };
  changeFromPrevious: number | null;
  changeFromFirst: number | null;
  trend: 'up' | 'down' | 'flat' | 'none';
  /** De lo nuevo a lo viejo, con la diferencia contra el registro inmediato anterior. */
  history: MetricHistoryEntry[];
  /** Registros en otra unidad, que no se mezclan con el resto. */
  otherUnits: number;
}

const round1 = (value: number) => Math.round(value * 10 + (value >= 0 ? 1e-7 : -1e-7)) / 10;

export function summarizeMetric(rows: readonly MetricRow[]): MetricSummary | null {
  if (!rows.length) return null;
  const chronological = [...rows].sort((a, b) => a.captured_on.localeCompare(b.captured_on) || a.created_at.localeCompare(b.created_at));
  const unit = chronological[chronological.length - 1].unit;
  const sameUnit = chronological.filter((row) => row.unit === unit);
  const values = sameUnit.map((row) => row.value);
  const last = sameUnit[sameUnit.length - 1];
  const first = sameUnit[0];
  const previous = sameUnit.length > 1 ? sameUnit[sameUnit.length - 2] : null;
  const changeFromPrevious = previous ? round1(last.value - previous.value) : null;
  const history = sameUnit.map((row, index): MetricHistoryEntry => ({
    value: row.value,
    date: row.captured_on,
    change: index > 0 ? round1(row.value - sameUnit[index - 1].value) : null,
    isLatest: index === sameUnit.length - 1,
  })).reverse();
  return {
    unit,
    count: sameUnit.length,
    min: Math.min(...values),
    max: Math.max(...values),
    average: round1(values.reduce((sum, value) => sum + value, 0) / values.length),
    first: { value: first.value, date: first.captured_on },
    last: { value: last.value, date: last.captured_on },
    changeFromPrevious,
    changeFromFirst: sameUnit.length > 1 ? round1(last.value - first.value) : null,
    trend: changeFromPrevious === null ? 'none' : changeFromPrevious > 0 ? 'up' : changeFromPrevious < 0 ? 'down' : 'flat',
    history,
    otherUnits: chronological.length - sameUnit.length,
  };
}
