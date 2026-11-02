import { useEffect, useState } from 'react';
import { clinicalWorkspaceApi, type BioimpedanceRecord, type BioimpedanceValues } from '../../api/clinical-workspace';
import { careErrorMessage } from '../../api/care';
import { MEDIDAS, MEDIDAS_VACIAS, medidaNumero, pedidoBioimpedancia, type MedidaClave } from './bioimpedancia';
import { FxCurva } from './ficha-fx';

const hoy = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());

export function BioimpedanceReview({ patientId, enabled, onChanged, records: recordsProp, draft: draftProp }: {
  patientId: string;
  enabled: boolean;
  onChanged?: () => void;
  records?: BioimpedanceRecord[];
  draft?: BioimpedanceValues;
}) {
  const [text, setText] = useState('');
  const [values, setValues] = useState<BioimpedanceValues>(draftProp ?? MEDIDAS_VACIAS);
  const [date, setDate] = useState(hoy());
  const [reviewed, setReviewed] = useState(false);
  const [records, setRecords] = useState<BioimpedanceRecord[]>(recordsProp ?? []);
  const [measure, setMeasure] = useState<MedidaClave>('weight_kg');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => { if (recordsProp) setRecords(recordsProp); }, [recordsProp]);
  useEffect(() => {
    if (!enabled || recordsProp) return;
    const controller = new AbortController();
    clinicalWorkspaceApi.bioimpedanceList(patientId, controller.signal).then(result => { if (!controller.signal.aborted) setRecords(result.records); }).catch(() => undefined);
    return () => controller.abort();
  }, [enabled, patientId, recordsProp]);
  if (!enabled) return null;
  const pedido = pedidoBioimpedancia({ id: '00000000-0000-4000-8000-000000000000', recordedOn: date, values, reviewed });
  const serie = [...records].sort((a, b) => a.recorded_on.localeCompare(b.recorded_on)).map(record => record.values[measure]).filter((value): value is number => value !== null);
  const leer = async () => {
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await clinicalWorkspaceApi.bioimpedancePreview(patientId, text);
      setValues(result.values);
      setReviewed(false);
    } catch (caught) { setError(careErrorMessage(caught)); }
    finally { setBusy(false); }
  };
  const guardar = async () => {
    const body = pedidoBioimpedancia({ id: crypto.randomUUID(), recordedOn: date, values, reviewed });
    if (!body) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await clinicalWorkspaceApi.bioimpedanceSave(patientId, body);
      setReviewed(false);
      setNotice('Medidas guardadas con tu revisión.');
      onChanged?.();
      const list = await clinicalWorkspaceApi.bioimpedanceList(patientId);
      setRecords(list.records);
    } catch (caught) { setError(careErrorMessage(caught)); }
    finally { setBusy(false); }
  };
  return <section aria-label="Bioimpedancia">
    <h3>Bioimpedancia</h3>
    <p>Pegá el texto del informe. Corregí las cinco medidas y guardá sólo cuando las hayas revisado. No se diagnostica ni se manda a un servicio externo.</p>
    <label>Texto del informe<textarea value={text} onChange={event => setText(event.target.value)} rows={4} /></label>
    <button type="button" disabled={busy || !text.trim()} onClick={() => void leer()}>Leer texto</button>
    <label>Fecha<input type="date" value={date} max={hoy()} onChange={event => { setDate(event.target.value); setReviewed(false); }} /></label>
    <div className="cw-grid">{MEDIDAS.map(([key, label, unit]) => <label key={key}>{label} ({unit})<input aria-label={label} value={values[key] ?? ''} onChange={event => { setValues(current => ({ ...current, [key]: medidaNumero(event.target.value) })); setReviewed(false); }} /></label>)}</div>
    <label className="cw-check"><input type="checkbox" checked={reviewed} onChange={event => setReviewed(event.target.checked)} />Revisé estas medidas contra el informe</label>
    <button type="button" disabled={busy || !pedido} onClick={() => void guardar()}>Guardar revisado</button>
    <label>Evolución<select aria-label="Medida del gráfico" value={measure} onChange={event => setMeasure(event.target.value as MedidaClave)}>{MEDIDAS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
    {serie.length > 1 ? <FxCurva valores={serie} /> : <p>{serie.length === 1 ? 'Hay una medida revisada. Con la segunda vas a ver la curva.' : 'Todavía no hay medidas revisadas.'}</p>}
    {notice ? <p role="status">{notice}</p> : null}
    {error ? <p role="alert">{error}</p> : null}
  </section>;
}
