import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { careApi, careErrorMessage, notifyCareChanged } from '../../api/care';
import { careInputSchema } from '../../types/care';
import type { ShowroomPatient } from '../nutrigo/showroom-model';
import { CareConsent } from '../nutrigo/CarePanel';
import { useCare } from '../nutrigo/useCare';
import './figma-dashboard-check-in.css';

export type DashboardMetricKind = 'weight' | 'steps' | 'sleep' | 'water';
export type DashboardHabitPatch = { steps?: number; sleep_minutes?: number; hydration?: number };

const titles: Record<DashboardMetricKind, string> = {
  weight: 'Registrar peso y cintura',
  steps: 'Registrar pasos',
  sleep: 'Registrar sueño',
  water: 'Registrar agua',
};
const todayId = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

export function FigmaDashboardCheckIn({ kind, patient, onClose, onUpdateHabits }: {
  kind: DashboardMetricKind;
  patient: ShowroomPatient;
  onClose: () => void;
  onUpdateHabits?: (patch: DashboardHabitPatch) => Promise<void>;
}) {
  const care = useCare(patient.id);
  const [measure, setMeasure] = useState<'weight' | 'waist'>('weight');
  const [date, setDate] = useState(todayId);
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState<'kg' | 'lb' | 'cm' | 'in'>('kg');
  const [note, setNote] = useState('');
  const [steps, setSteps] = useState(patient.steps == null ? '' : String(patient.steps));
  const [sleep, setSleep] = useState(patient.sleepMinutes === null ? '' : (Math.round(patient.sleepMinutes / 6) / 10).toLocaleString('es-AR'));
  const [water, setWater] = useState(patient.hydration);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const recordId = useRef(crypto.randomUUID());
  const saving = useRef(false);
  const consented = care.data?.consented.includes('measurement') ?? false;
  const isDemo = care.data?.source === 'memory';
  const latest = (type: 'weight' | 'waist') => care.data?.records.filter((record) => record.data.kind === type)
    .sort((a, b) => b.recorded_on.localeCompare(a.recorded_on) || b.created_at.localeCompare(a.created_at))[0];
  const latestWeight = latest('weight');
  const latestWaist = latest('waist');

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape' && !saving.current) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const changeMeasure = (next: 'weight' | 'waist') => {
    setMeasure(next);
    setUnit(next === 'weight' ? 'kg' : 'cm');
    setValue('');
    setError('');
    setSuccess('');
    recordId.current = crypto.randomUUID();
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving.current) return;
    setError(''); setSuccess('');
    saving.current = true; setBusy(true);
    try {
      if (kind === 'weight') {
        if (!consented) throw new Error('Activá el permiso opcional de peso y medidas para guardar el registro.');
        const input = careInputSchema.safeParse({
          id: recordId.current,
          recorded_on: date,
          data: { kind: measure, value: Number(value.replace(',', '.')), unit, origin: 'patient', note },
        });
        if (!input.success) throw new Error('Revisá la fecha y el valor antes de guardar.');
        await careApi.save(patient.id, input.data);
        notifyCareChanged();
        recordId.current = crypto.randomUUID();
        setValue(''); setNote('');
        setSuccess(measure === 'weight' ? 'Peso registrado. Ya aparece en tu seguimiento.' : 'Cintura registrada. Ya aparece en tu seguimiento.');
      } else {
        if (!onUpdateHabits) throw new Error('El registro no está disponible en esta vista.');
        const hours = Number(sleep.replace(',', '.'));
        if (kind === 'sleep' && (!Number.isFinite(hours) || hours < 0 || hours > 24)) throw new Error('Ingresá entre 0 y 24 horas de sueño.');
        const patch: DashboardHabitPatch = kind === 'steps'
            ? { steps: Number(steps) }
          : kind === 'sleep'
            ? { sleep_minutes: Math.round(hours * 60) }
            : { hydration: water };
        await onUpdateHabits(patch);
        setSuccess(kind === 'steps' ? 'Pasos guardados.' : kind === 'sleep' ? 'Sueño guardado.' : 'Agua guardada.');
      }
    } catch (cause) {
      setError(careErrorMessage(cause));
    } finally {
      saving.current = false; setBusy(false);
    }
  };

  return createPortal(<div className="figma-checkin-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <section className="figma-checkin-dialog" role="dialog" aria-modal="true" aria-labelledby="figma-checkin-title" onKeyDown={(event) => {
      if (event.key !== 'Tab') return;
      const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),summary')].filter((item) => item.getClientRects().length > 0);
      const first = controls[0]; const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}>
      <header><div><span className="figma-checkin-eyebrow">MI SEGUIMIENTO {isDemo ? '· DATOS DE MUESTRA' : ''}</span><h2 id="figma-checkin-title">{titles[kind]}</h2></div><button type="button" aria-label="Cerrar registro" disabled={busy} onClick={onClose}>×</button></header>
      <p className="figma-checkin-intro">{kind === 'weight' ? 'Registrá sólo las medidas que quieras compartir con tu nutricionista.' : 'Anotá el dato de hoy. Podés corregirlo si te equivocaste.'}</p>
      {kind === 'weight' && <div className="figma-checkin-last"><span>Último peso <strong>{latestWeight?.data.kind === 'weight' ? `${latestWeight.data.value.toLocaleString('es-AR')} ${latestWeight.data.unit}` : 'Sin registro'}</strong></span><span>Última cintura <strong>{latestWaist?.data.kind === 'waist' ? `${latestWaist.data.value.toLocaleString('es-AR')} ${latestWaist.data.unit}` : 'Sin registro'}</strong></span></div>}
      <form onSubmit={(event) => void submit(event)}>
        {kind === 'weight' && <>
          {care.error && <p role="alert">{care.error} <button type="button" onClick={care.reload}>Reintentar</button></p>}
          {!care.data && !care.error && <p role="status">Cargando permisos y mediciones…</p>}
          {care.data && !consented && <CareConsent patientId={patient.id} snapshot={care.data} measurementOnly />}
          <div className="figma-checkin-tabs" role="group" aria-label="Tipo de medida"><button type="button" className={measure === 'weight' ? 'active' : ''} aria-pressed={measure === 'weight'} onClick={() => changeMeasure('weight')}>Peso</button><button type="button" className={measure === 'waist' ? 'active' : ''} aria-pressed={measure === 'waist'} onClick={() => changeMeasure('waist')}>Cintura</button></div>
          <label>Fecha<input autoFocus type="date" max={todayId()} value={date} onChange={(event) => { setDate(event.target.value); recordId.current = crypto.randomUUID(); }} required /></label>
          <div className="figma-checkin-fields"><label>{measure === 'weight' ? 'Peso' : 'Cintura'}<input type="text" inputMode="decimal" pattern="[0-9]+([,.][0-9]{1,2})?" value={value} onChange={(event) => { setValue(event.target.value); recordId.current = crypto.randomUUID(); }} placeholder={measure === 'weight' ? 'Ej. 77,5' : 'Ej. 82'} required /></label><label>Unidad<select value={unit} onChange={(event) => { setUnit(event.target.value as typeof unit); recordId.current = crypto.randomUUID(); }}>{(measure === 'weight' ? ['kg', 'lb'] : ['cm', 'in']).map((option) => <option key={option}>{option}</option>)}</select></label></div>
          <label>Nota opcional<textarea maxLength={500} value={note} onChange={(event) => { setNote(event.target.value); recordId.current = crypto.randomUUID(); }} placeholder="Algo que quieras recordar" /></label>
          <small>Dato autodeclarado y opcional. No calculamos una meta a partir de este registro.</small>
        </>}
        {kind === 'steps' && <><p className="figma-checkin-current">Hoy: <strong>{patient.steps == null ? 'Sin registro' : `${patient.steps.toLocaleString('es-AR')} pasos`}</strong></p><label>Pasos de hoy<input autoFocus type="number" inputMode="numeric" min={0} max={100000} step={1} value={steps} onChange={(event) => setSteps(event.target.value)} placeholder="Ej. 6250" required /></label><small>Ingresá el total que marque tu teléfono, reloj o podómetro. Es un dato declarado; no se estima automáticamente.</small></>}
        {kind === 'sleep' && <><p className="figma-checkin-current">Último registro: <strong>{patient.sleepMinutes === null ? 'Sin registro' : `${(Math.round(patient.sleepMinutes / 6) / 10).toLocaleString('es-AR')} h`}</strong></p><label>Horas que dormiste<input autoFocus type="text" inputMode="decimal" pattern="[0-9]+([,.][0-9]{1,2})?" value={sleep} onChange={(event) => setSleep(event.target.value)} placeholder="Ej. 7,5" required /></label><small>Registrá la duración aproximada. No inferimos fases ni calidad del sueño.</small></>}
        {kind === 'water' && <><p className="figma-checkin-current">Hoy: <strong>{patient.hydration} vasos</strong></p><label>Vasos de agua<input autoFocus type="number" inputMode="numeric" min={0} max={8} step={1} value={water} onChange={(event) => setWater(Number(event.target.value))} required /></label><div className="figma-checkin-water-actions"><button type="button" disabled={water <= 0} onClick={() => setWater((current) => Math.max(0, current - 1))}>− Un vaso</button><button type="button" disabled={water >= 8} onClick={() => setWater((current) => Math.min(8, current + 1))}>+ Un vaso</button></div><small>Seguimiento de 0 a 8 vasos, sin convertirlo a litros ni sugerir una meta clínica.</small></>}
        {error && <p className="figma-checkin-error" role="alert">{error}</p>}
        {success && <p className="figma-checkin-success" role="status">{success}</p>}
        <footer><button type="button" onClick={onClose} disabled={busy}>Cerrar</button><button type="submit" disabled={busy || (kind === 'weight' && (!care.data || !consented))}>{busy ? 'Guardando…' : 'Guardar registro'}</button></footer>
      </form>
    </section>
  </div>, document.body);
}
