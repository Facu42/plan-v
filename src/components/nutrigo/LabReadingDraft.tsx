import { useState } from 'react';
import { clinicalWorkspaceApi } from '../../api/clinical-workspace';
import { careErrorMessage } from '../../api/care';
import { clinicalWorkspaceInputSchema } from '../../types/clinical-workspace';
import { parseImportNumber } from '../../lib/patient-import';
import { borradorListo, pedidoLaboratorio, type FilaBorrador } from './lab-borrador';

const hoy = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());

async function huella(text: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map(value => value.toString(16).padStart(2, '0')).join('');
}

export function LabReadingDraft({ patientId, enabled, onSaved, rows: rowsProp }: {
  patientId: string;
  enabled: boolean;
  onSaved?: () => void;
  rows?: FilaBorrador[];
}) {
  const [text, setText] = useState('');
  const [rows, setRows] = useState<FilaBorrador[]>(rowsProp ?? []);
  const [date, setDate] = useState(hoy());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  if (!enabled) return null;
  const listo = borradorListo(rows) && pedidoLaboratorio(rows) !== null;
  const leer = async () => {
    setBusy(true); setError(''); setNotice('');
    try {
      const draft = await clinicalWorkspaceApi.labDraft(patientId, text);
      setRows(draft.values.map(row => ({ ...row, reviewed: false })));
    } catch (caught) { setError(careErrorMessage(caught)); }
    finally { setBusy(false); }
  };
  const guardar = async () => {
    const revisadas = pedidoLaboratorio(rows);
    if (!revisadas) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const source = text.trim() || revisadas.map(row => `${row.name}: ${row.value} ${row.unit}`).join('\n');
      const document = await clinicalWorkspaceApi.document(patientId, {
        id: crypto.randomUUID(),
        filename: 'informe-revisado.txt',
        source_sha256: await huella(source),
        file: `data:text/plain;base64,${btoa(unescape(encodeURIComponent(source)))}`,
      });
      const input = clinicalWorkspaceInputSchema.parse({
        id: crypto.randomUUID(),
        recorded_on: date,
        note: '',
        reviewed: true,
        data: {
          kind: 'laboratory',
          document_id: document.document.id,
          values: revisadas.map(row => ({
            id: crypto.randomUUID(),
            name: row.name,
            value: parseImportNumber(row.value),
            operator: '' as const,
            unit: row.unit,
            range_text: row.range,
            raw_value: row.value,
            source_line: `${row.name}: ${row.value} ${row.unit}`,
            page: 1,
            reviewed: true as const,
          })),
        },
      });
      await clinicalWorkspaceApi.save(patientId, input);
      setNotice('Borrador guardado después de tu revisión.');
      onSaved?.();
    } catch (caught) { setError(careErrorMessage(caught)); }
    finally { setBusy(false); }
  };
  return <section aria-label="Borrador de laboratorio">
    <h3>Borrador del informe</h3>
    <p>La lectura es local. Cada valor queda editable y no se guarda hasta que lo marques como revisado.</p>
    <label>Texto anonimizado<textarea aria-label="Texto del informe" value={text} onChange={event => setText(event.target.value)} rows={4} /></label>
    <label>Fecha del estudio<input type="date" value={date} max={hoy()} onChange={event => setDate(event.target.value)} /></label>
    <button type="button" disabled={busy || !text.trim()} onClick={() => void leer()}>Preparar borrador</button>
    {rows.map((row, index) => <fieldset key={`${row.name}${index}`}><div className="cw-grid">
      <label>Analito<input aria-label={`Analito ${index + 1}`} value={row.name} onChange={event => setRows(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value, reviewed: false } : item))} /></label>
      <label>Resultado<input aria-label={`Resultado ${index + 1}`} value={row.value} onChange={event => setRows(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, value: event.target.value, reviewed: false } : item))} /></label>
      <label>Unidad<input aria-label={`Unidad ${index + 1}`} value={row.unit} onChange={event => setRows(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, unit: event.target.value, reviewed: false } : item))} /></label>
      <label>Rango<input aria-label={`Rango ${index + 1}`} value={row.range} onChange={event => setRows(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, range: event.target.value, reviewed: false } : item))} /></label>
    </div><label className="cw-check"><input type="checkbox" checked={row.reviewed} onChange={event => setRows(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, reviewed: event.target.checked } : item))} />Revisé este valor</label></fieldset>)}
    <button type="button" disabled={busy || !listo} onClick={() => void guardar()}>Guardar revisado</button>
    {notice ? <p role="status">{notice}</p> : null}
    {error ? <p role="alert">{error}</p> : null}
  </section>;
}
