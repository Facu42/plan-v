import { BODY_METRIC_KINDS, LEGACY_METRIC_KINDS, bodyMetricBatchSchema, parseMetricValue, type BodyMetricBatch, type LegacyMetricKind, type MetricKind } from './body-metrics';
import { careDate } from '../types/care';

export interface LegacyEntry { kind: LegacyMetricKind; value: number; id: string }
export type MeasurementEntryPlan =
  | { ok: true; batch: BodyMetricBatch | null; legacy: LegacyEntry[] }
  | { ok: false; errors: string[] };

/**
 * Convierte lo escrito en el formulario por fecha en lo que hay que guardar.
 * Las métricas nuevas viajan juntas; peso, cintura y cadera siguen su camino de registros de seguimiento.
 */
export function planMeasurementEntry({ date, values, idFor, alreadySaved = new Set() }: {
  date: string;
  values: Partial<Record<MetricKind, string>>;
  idFor: (kind: MetricKind) => string;
  alreadySaved?: ReadonlySet<string>;
}): MeasurementEntryPlan {
  const errors: string[] = [];
  if (!date) errors.push('Elegí una fecha.');
  else if (!careDate.safeParse(date).success) errors.push('La fecha no puede ser futura.');
  const items: BodyMetricBatch['items'] = [];
  const legacy: LegacyEntry[] = [];
  for (const kind of [...BODY_METRIC_KINDS, ...LEGACY_METRIC_KINDS] as MetricKind[]) {
    if (alreadySaved.has(kind)) continue;
    const parsed = parseMetricValue(kind, values[kind] ?? '');
    if (!parsed.ok) { errors.push(parsed.message); continue; }
    if (parsed.empty) continue;
    if ((LEGACY_METRIC_KINDS as readonly string[]).includes(kind)) legacy.push({ kind: kind as LegacyMetricKind, value: parsed.value, id: idFor(kind) });
    else items.push({ id: idFor(kind), kind: kind as BodyMetricBatch['items'][number]['kind'], value: parsed.value });
  }
  if (!errors.length && !items.length && !legacy.length) errors.push('Completá al menos una medición.');
  if (errors.length) return { ok: false, errors };
  const batch = items.length ? bodyMetricBatchSchema.safeParse({ captured_on: date, items }) : null;
  if (batch && !batch.success) return { ok: false, errors: ['Revisá los valores cargados.'] };
  return { ok: true, batch: batch?.data ?? null, legacy };
}
