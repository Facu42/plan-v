import { useState, type ChangeEvent } from 'react';
import { metricLabel, metricDefinition, type MetricKind } from '../../lib/body-metrics';
import { PdfInputError, extractPdfText } from '../../lib/pdf-text';
import { parseScaleReport, type ScaleReading } from '../../lib/scale-report';
import type { Measurement } from '../../types/care';
import { FigmaRecordDialog } from './FigmaPatientFront';
import { formatNumber } from './measurement-format';
import { NvBadge, NvButton } from './primitives';
import type { MeasurementEntryInitial } from './MeasurementEntryDialog';

const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());
const STATUS_LABEL = { ready: 'Para cargar', duplicate: 'Ya cargada', invalid: 'No se puede cargar' } as const;
const STATUS_TONE = { ready: 'green', duplicate: 'gold', invalid: 'coral' } as const;

/** Importa un informe de balanza: lee el PDF en el navegador, muestra lo reconocido y recién después abre la carga para confirmar. */
export function ScaleImportView({ reading, onReview }: { reading: ScaleReading; onReview: (initial: MeasurementEntryInitial) => void }) {
  const ready = reading.candidates.filter((candidate) => candidate.status === 'ready');
  const review = () => onReview({
    date: reading.date,
    imported: true,
    values: Object.fromEntries(ready.map((candidate) => [candidate.kind, String(candidate.value).replace('.', ',')])) as Partial<Record<MetricKind, string>>,
  });
  if (!reading.candidates.length) return <p role="status" className="pm-hint">No reconocimos mediciones en este informe. Probá con otro archivo o cargalas a mano.</p>;
  return <>
    <p className="pm-hint">Fecha del informe: <b>{reading.date ? reading.date.split('-').reverse().join('/') : 'no reconocida (la elegís en el paso siguiente)'}</b>. Nada se guarda todavía.</p>
    <ul className="pm-import-list" aria-label="Mediciones reconocidas">
      {reading.candidates.map((candidate) => <li key={candidate.kind}>
        <span><strong>{metricLabel(candidate.kind)}</strong> {formatNumber(candidate.value)} {metricDefinition(candidate.kind).unit}<small>Del informe: «{candidate.source}»</small>{candidate.note && <small>{candidate.note}</small>}</span>
        <NvBadge tone={STATUS_TONE[candidate.status]}>{STATUS_LABEL[candidate.status]}</NvBadge>
      </li>)}
    </ul>
    <footer className="pm-actions"><NvButton type="button" disabled={!ready.length} onClick={review}>{ready.length ? `Revisar y cargar ${ready.length}` : 'Nada nuevo para cargar'}</NvButton></footer>
  </>;
}

export function ScaleImportDialog({ measurements, onClose, onReview }: { measurements: readonly Measurement[]; onClose: () => void; onReview: (initial: MeasurementEntryInitial) => void }) {
  const [reading, setReading] = useState<ScaleReading | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const choose = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true); setError(''); setReading(null);
    try {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) throw new PdfInputError('Elegí un archivo PDF.');
      setReading(parseScaleReport(await extractPdfText(file), measurements, today()));
    } catch (reason) {
      setError(reason instanceof PdfInputError ? reason.message : 'No pudimos leer el PDF. Si es una foto o un escaneo, cargá los valores a mano.');
    } finally { setBusy(false); }
  };
  return <FigmaRecordDialog title="Importar informe de balanza" closeLabel="Cerrar importación" onClose={onClose} className="pm-dialog">
    <p className="pm-hint">Elegí el PDF del informe (InBody, femmto u otra). Se lee en tu computadora, no se sube a ningún lado, y vas a revisar los valores antes de guardar. No todos los formatos se reconocen.</p>
    <label className="pm-date">Archivo PDF<input type="file" accept="application/pdf,.pdf" disabled={busy} onChange={(event) => void choose(event)} /></label>
    {busy && <p role="status" className="pm-hint">Leyendo el informe…</p>}
    {error && <p role="alert" className="pm-errors">{error}</p>}
    {reading && <ScaleImportView reading={reading} onReview={onReview} />}
  </FigmaRecordDialog>;
}
