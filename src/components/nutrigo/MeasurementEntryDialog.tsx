import { useRef, useState, type FormEvent } from 'react';
import { careApi, careErrorMessage, notifyCareChanged } from '../../api/care';
import { METRIC_GROUPS, METRIC_KINDS, metricDefinition, type MetricKind } from '../../lib/body-metrics';
import { planMeasurementEntry } from '../../lib/measurement-entry';
import { careDateConstraintMessage } from '../../types/care';
import { FigmaRecordDialog } from './FigmaPatientFront';
import { NvButton } from './primitives';
import { useUnsavedChanges } from './unsaved-changes';

const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());

/** Formulario por fecha con todas las métricas. Lo que queda vacío no se guarda ni se toma como cero. */
export interface MeasurementEntryInitial { date: string | null; values: Partial<Record<MetricKind, string>>; imported?: boolean }

export function MeasurementEntryDialog({ patientId, patientName, onClose, initial }: { patientId: string; patientName: string; onClose: () => void; initial?: MeasurementEntryInitial }) {
  const [date, setDate] = useState(initial?.date ?? today());
  const [values, setValues] = useState<Partial<Record<MetricKind, string>>>(initial?.values ?? {});
  const [saved, setSaved] = useState<ReadonlySet<string>>(new Set());
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const ids = useRef(new Map<MetricKind, string>());
  const idFor = (kind: MetricKind) => {
    const known = ids.current.get(kind);
    if (known) return known;
    const created = crypto.randomUUID();
    ids.current.set(kind, created);
    return created;
  };
  const dirty = Object.entries(values).some(([kind, value]) => Boolean(value?.trim()) && !saved.has(kind));
  useUnsavedChanges(dirty, busy);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const plan = planMeasurementEntry({ date, values, idFor, alreadySaved: saved });
    if (!plan.ok) { setErrors(plan.errors); return; }
    setErrors([]); setBusy(true);
    const done = new Set(saved);
    try {
      if (plan.batch) {
        await careApi.bodyMetrics(patientId, plan.batch);
        for (const item of plan.batch.items) done.add(item.kind);
      }
      for (const entry of plan.legacy) {
        await careApi.save(patientId, { id: entry.id, recorded_on: date, data: entry.kind === 'weight' ? { kind: 'weight', value: entry.value, unit: 'kg', source: 'professional', note: '' } : { kind: entry.kind, value: entry.value, unit: 'cm', source: 'professional', note: '' } });
        done.add(entry.kind);
      }
      setSaved(done); notifyCareChanged(); onClose();
    } catch (error) {
      setSaved(done);
      const stored = done.size > saved.size;
      setErrors([stored ? `${careErrorMessage(error)} Lo que ya se guardó queda marcado; reintentá con el resto.` : careErrorMessage(error)]);
      if (stored) notifyCareChanged();
    } finally { setBusy(false); }
  };

  return <FigmaRecordDialog title="Cargar mediciones" closeLabel="Cerrar carga de mediciones" onClose={onClose} className="pm-dialog">
    <form onSubmit={submit} noValidate lang="es-AR">
      <p className="pm-hint"><b>{patientName}</b> · {initial?.imported ? 'Valores leídos del informe: revisalos y corregí lo que haga falta antes de guardar.' : 'Completá sólo lo que mediste. Lo que dejes vacío no se guarda.'}</p>
      <fieldset disabled={busy} className="pm-fields">
        <label className="pm-date">Fecha de la medición
          <input type="date" max={today()} value={date} required onChange={(event) => { event.currentTarget.setCustomValidity(''); setDate(event.target.value); }}
            onInvalid={(event) => { event.preventDefault(); setErrors([careDateConstraintMessage(event.currentTarget.validity)]); }} />
        </label>
        {METRIC_GROUPS.map((group) => <fieldset key={group.id} className="pm-group">
          <legend>{group.label}</legend>
          <div className="pm-inputs">
            {METRIC_KINDS.filter((kind) => metricDefinition(kind).group === group.id).map((kind) => {
              const definition = metricDefinition(kind);
              const done = saved.has(kind);
              return <label key={kind}>
                <span>{definition.label}{done && <b className="pm-saved"> · Guardado</b>}</span>
                <span className="pm-input"><input inputMode="decimal" autoComplete="off" disabled={done} value={values[kind] ?? ''} aria-describedby={`pm-unit-${kind}`}
                  onChange={(event) => setValues((current) => ({ ...current, [kind]: event.target.value }))} /><small id={`pm-unit-${kind}`}>{definition.unit}</small></span>
              </label>;
            })}
          </div>
        </fieldset>)}
      </fieldset>
      {errors.length > 0 && <ul role="alert" className="pm-errors">{errors.map((message) => <li key={message}>{message}</li>)}</ul>}
      <footer className="pm-actions">
        <NvButton type="button" className="nv-ghost" disabled={busy} onClick={onClose}>Cancelar</NvButton>
        <NvButton type="submit" disabled={busy} aria-busy={busy}>{busy ? 'Guardando…' : saved.size ? 'Reintentar guardado' : 'Guardar mediciones'}</NvButton>
      </footer>
    </form>
  </FigmaRecordDialog>;
}
