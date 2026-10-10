import { useEffect, useMemo, useState } from 'react';
import { bodyDataApi } from '../../api/nutrition-target';
import { ageFromBirthDate } from '../../lib/nutrition-target';
import { latestBmi } from '../../lib/measurement-bmi';
import { METRIC_GROUPS, METRIC_KINDS, metricDefinition, summarizeMetric, type MetricKind, type MetricSummary } from '../../lib/body-metrics';
import type { Measurement } from '../../types/care';
import { MeasurementEntryDialog, type MeasurementEntryInitial } from './MeasurementEntryDialog';
import { ScaleImportDialog } from './ScaleImportDialog';
import { MetricChart, MetricSparkline } from './MetricChart';
import { cardNote, formatChange, formatNumber, formatMetricDate, formatMetricValue, trendText } from './measurement-format';
import { NvBadge, NvButton, NvMetric, NvState } from './primitives';
import { useCare } from './useCare';
import './professional-measurements.css';

const RANGES = [{ id: 'all', label: 'Todo el historial', days: null }, { id: '90', label: 'Últimos 90 días', days: 90 }, { id: '30', label: 'Últimos 30 días', days: 30 }] as const;
type RangeId = (typeof RANGES)[number]['id'];

function rowsFor(measurements: readonly Measurement[], kind: MetricKind, rangeId: RangeId, today: string) {
  const days = RANGES.find((range) => range.id === rangeId)?.days ?? null;
  const cutoff = days === null ? '' : new Date(Date.parse(`${today}T12:00:00Z`) - days * 86_400_000).toISOString().slice(0, 10);
  return measurements
    .filter((row) => row.kind === kind && row.captured_on >= cutoff)
    .map((row) => ({ value: row.value_numeric, unit: row.unit, captured_on: row.captured_on, created_at: row.created_at }));
}
const argentinaToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());

function MetricDetail({ kind, measurements, onClose }: { kind: MetricKind; measurements: readonly Measurement[]; onClose: () => void }) {
  const [range, setRange] = useState<RangeId>('all');
  const definition = metricDefinition(kind);
  const summary = useMemo(() => summarizeMetric(rowsFor(measurements, kind, range, argentinaToday())), [measurements, kind, range]);
  return <section className="pm-detail" aria-label={`Detalle de ${definition.label}`}>
    <header>
      <div><p className="nv-eyebrow">{METRIC_GROUPS.find((group) => group.id === definition.group)?.label}</p><h3>{definition.label}</h3></div>
      <div className="pm-detail-tools">
        <label>Período<select value={range} onChange={(event) => setRange(event.target.value as RangeId)}>{RANGES.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
        <NvButton type="button" className="nv-ghost" onClick={onClose}>Cerrar detalle</NvButton>
      </div>
    </header>
    {!summary ? <NvState title="Sin registros en este período" description="Probá con un período más largo o cargá una medición nueva." /> : <>
      <div className="pm-stats">
        <div><small>Mínimo</small><strong>{formatMetricValue(summary.min, summary.unit)}</strong></div>
        <div><small>Promedio</small><strong>{formatMetricValue(summary.average, summary.unit)}</strong></div>
        <div><small>Máximo</small><strong>{formatMetricValue(summary.max, summary.unit)}</strong></div>
        <div><small>Registros</small><strong>{summary.count}</strong></div>
      </div>
      <p className="pm-note">{trendText(summary.trend, summary.changeFromPrevious, summary.unit)}.{summary.changeFromFirst !== null && ` Desde el primer registro: ${formatChange(summary.changeFromFirst, summary.unit).replace('Sin cambios', 'sin cambios')}.`}</p>
      <MetricChart points={[...summary.history].reverse().map((entry) => ({ date: entry.date, value: entry.value }))} unit={summary.unit} label={`Evolución de ${definition.label}`} />
      {summary.otherUnits > 0 && <p className="pm-note">Hay {summary.otherUnits} {summary.otherUnits === 1 ? 'registro' : 'registros'} en otra unidad que no se mezclan con estos.</p>}
      <table className="pm-history">
        <caption>Historial de {definition.label.toLowerCase()}</caption>
        <thead><tr><th scope="col">Fecha</th><th scope="col">Valor</th><th scope="col">Diferencia con el registro anterior</th></tr></thead>
        <tbody>{summary.history.map((entry, index) => <tr key={`${entry.date}-${index}`}>
          <th scope="row">{formatMetricDate(entry.date)}{entry.isLatest && <> <NvBadge>Última</NvBadge></>}</th>
          <td>{formatMetricValue(entry.value, summary.unit)}</td>
          <td>{formatChange(entry.change, summary.unit)}</td>
        </tr>)}</tbody>
      </table>
    </>}
  </section>;
}

function MetricCard({ kind, summary, onOpen }: { kind: MetricKind; summary: MetricSummary | null; onOpen: () => void }) {
  const definition = metricDefinition(kind);
  return <NvMetric label={definition.label} icon="trend" tone="green" value={summary ? formatMetricValue(summary.last.value, summary.unit) : 'Sin dato'} note={summary ? cardNote(summary) : 'Todavía sin medir'} onOpen={onOpen}>{summary && <MetricSparkline values={[...summary.history].reverse().map((entry) => entry.value)} />}</NvMetric>;
}

/** Evolución del peso: diferencia desde la primera medición, cantidad de registros y fecha del último. */
function WeightEvolution({ summary }: { summary: MetricSummary | null }) {
  const change = summary?.changeFromFirst ?? null;
  const value = !summary ? 'Sin dato' : change === null ? 'Primer registro' : change === 0 ? 'Sin cambios' : formatChange(change, summary.unit);
  const note = summary ? `${summary.count} ${summary.count === 1 ? 'registro' : 'registros'} · último ${formatMetricDate(summary.last.date)}` : 'Todavía sin medir';
  return <NvMetric label="Evolución del peso" icon="trend" tone="green" value={value} note={note} />;
}

/** Mediciones de la ficha: tres grupos, tendencia, detalle con mínimo, promedio y máximo, y carga por fecha. */
export function MeasurementsBoard({ measurements, allowed, patientName, onEnter, onImport, initialOpen = null, age = null }: {
  measurements: readonly Measurement[]; allowed: boolean; patientName: string; onEnter: () => void; onImport?: () => void; initialOpen?: MetricKind | null; age?: number | null;
}) {
  const [open, setOpen] = useState<MetricKind | null>(initialOpen);
  const summaries = useMemo(() => {
    const result = new Map<MetricKind, MetricSummary | null>();
    for (const kind of METRIC_KINDS) result.set(kind, summarizeMetric(rowsFor(measurements, kind, 'all', argentinaToday())));
    return result;
  }, [measurements]);
  const bmi = useMemo(() => latestBmi(measurements, age), [measurements, age]);
  return <>
    <header className="pm-head">
      <div><p className="nv-eyebrow">Mediciones</p><h2>Cuerpo y evolución</h2><p>Valores cargados a mano, con fecha y origen. Lo que no se midió se muestra sin dato, nunca como cero.</p></div>
      {allowed && <div className="pm-head-actions">{onImport && <NvButton type="button" className="nv-soft" onClick={onImport}>Importar informe de balanza</NvButton>}<NvButton type="button" onClick={onEnter}>Cargar mediciones</NvButton></div>}
    </header>
    {!allowed ? <NvState title="Falta el permiso de medidas" description={`${patientName} todavía no autorizó compartir sus medidas. Cuando lo haga, aparecen acá.`} /> : METRIC_GROUPS.map((group) => <section key={group.id} className="pm-group-view" aria-label={group.label}>
      <h3>{group.label}</h3>
      <div className="pm-cards">{METRIC_KINDS.filter((kind) => metricDefinition(kind).group === group.id).map((kind) => <MetricCard key={kind} kind={kind} summary={summaries.get(kind) ?? null} onOpen={() => setOpen(kind)} />)}{group.id === 'basicas' && <WeightEvolution summary={summaries.get('weight') ?? null} />}{group.id === 'basicas' && <NvMetric label="IMC" icon="target" tone="gold" value={bmi ? formatNumber(Math.round(bmi.bmi * 10) / 10) : 'Sin dato'} note={bmi ? (bmi.category ?? 'Referencia adulta desde los 20 años') : 'Necesita peso (kg) y altura'} />}</div>
      {open && metricDefinition(open).group === group.id && <MetricDetail kind={open} measurements={measurements} onClose={() => setOpen(null)} />}
    </section>)}
  </>;
}

export function ProfessionalMeasurements({ patientId, patientName }: { patientId: string; patientName: string }) {
  const { data, error, reload } = useCare(patientId, true);
  const [entering, setEntering] = useState<MeasurementEntryInitial | null>(null);
  const [importing, setImporting] = useState(false);
  const [age, setAge] = useState<number | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setAge(null);
    bodyDataApi.get(patientId, true, controller.signal).then((view) => { if (!controller.signal.aborted) setAge(view.data ? ageFromBirthDate(view.data.birth_date) : null); }).catch(() => undefined);
    return () => controller.abort();
  }, [patientId]);
  if (error && !data) return <section className="pm-panel" aria-label="Mediciones"><NvState kind="error" title="No pudimos cargar las mediciones" description={error} action={<NvButton type="button" onClick={reload}>Reintentar</NvButton>} /></section>;
  if (!data) return <section className="pm-panel" aria-label="Mediciones"><NvState kind="loading" title="Cargando mediciones…" description="Estamos consultando las medidas de la ficha." /></section>;
  return <section className="pm-panel" aria-label={`Mediciones de ${patientName}`}>
    {error && <p role="alert" className="pm-note">{error}</p>}
    <MeasurementsBoard measurements={data.measurements} allowed={data.consented.includes('measurement')} patientName={patientName} onEnter={() => setEntering({ date: null, values: {} })} onImport={() => setImporting(true)} age={age} />
    {importing && <ScaleImportDialog measurements={data.measurements} onClose={() => setImporting(false)} onReview={(initial) => { setImporting(false); setEntering(initial); }} />}
    {entering && <MeasurementEntryDialog patientId={patientId} patientName={patientName} initial={entering} onClose={() => setEntering(null)} />}
  </section>;
}
