import { useState, type FormEvent } from 'react';
import { api } from '../../api/client';
import { chargeLinkText, formatPesos } from '../../fees';
import { localBillingDate } from '../../billing';
import type { BillingProgram, PatientLedger } from '../../types/fees';
import { NvButton } from './primitives';
import { FeeError } from './cobranzas-shared';
import { feeErrorMessage, parsePesos } from './cobranzas-utils';
import { useUnsavedChanges } from './unsaved-changes';

const CONCEPT_MAX = 80;
const PROGRAM_NAME_MAX = 60;
const COPIED_MS = 2000;

/** Nuevo cobro: un cobro suelto (consulta, taller, etc.) con su concepto, monto y vencimiento. */
export function NewChargeForm({ patientId, onLedger, onDone }: { patientId: string; onLedger: (ledger: PatientLedger) => void; onDone: () => void }) {
  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState('');
  const [dueOn, setDueOn] = useState(() => localBillingDate());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useUnsavedChanges(Boolean(concept.trim() || amount.trim()), busy);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const pesos = parsePesos(amount);
    if (!concept.trim()) { setError('Escribí de qué es el cobro.'); return; }
    if (!pesos) { setError('Escribí el monto en pesos, sin decimales.'); return; }
    if (!dueOn) { setError('Elegí cuándo vence.'); return; }
    setBusy(true); setError('');
    try {
      onLedger((await api.addPatientCharge(patientId, { amount: pesos, due_on: dueOn, concept: concept.trim() })).ledger);
      setConcept(''); setAmount(''); onDone();
    } catch (reason) { setError(feeErrorMessage(reason, 'No pudimos crear el cobro.')); } finally { setBusy(false); }
  };

  return <form className="cbz-form" onSubmit={submit} noValidate aria-label="Nuevo cobro">
    <label htmlFor="cbz-charge-concept">Concepto<input id="cbz-charge-concept" value={concept} maxLength={CONCEPT_MAX} onChange={(event) => setConcept(event.target.value)} placeholder="Ej. Consulta de control" disabled={busy} /></label>
    <div className="cbz-grid cbz-grid-2">
      <label htmlFor="cbz-charge-amount">Monto ($)<input id="cbz-charge-amount" inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} disabled={busy} /></label>
      <label htmlFor="cbz-charge-due">Vence el<input id="cbz-charge-due" type="date" value={dueOn} onChange={(event) => setDueOn(event.target.value)} disabled={busy} /></label>
    </div>
    <FeeError message={error} />
    <NvButton type="submit" disabled={busy}>{busy ? 'Creando…' : 'Crear cobro'}</NvButton>
  </form>;
}

/** Asignar programa: elegir uno guardado (o armar uno nuevo) y dejarlo como cuota mensual de la paciente. */
export function ProgramAssigner({ patientId, currentName, programs, onPrograms, onLedger, onDone }: {
  patientId: string; currentName: string; programs: BillingProgram[];
  onPrograms: (programs: BillingProgram[]) => void; onLedger: (ledger: PatientLedger) => void; onDone: () => void;
}) {
  const [selectedId, setSelectedId] = useState(() => programs.find((program) => program.name === currentName)?.id ?? programs[0]?.id ?? '');
  const [firstDue, setFirstDue] = useState(() => localBillingDate());
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useUnsavedChanges(Boolean(newName.trim() || newAmount.trim()), busy);

  const run = async (action: () => Promise<void>, fallback: string) => {
    setBusy(true); setError('');
    try { await action(); } catch (reason) { setError(feeErrorMessage(reason, fallback)); } finally { setBusy(false); }
  };
  const assign = (programId: string | null) => run(async () => {
    onLedger((await api.assignPatientProgram(patientId, programId, programId ? firstDue : undefined)).ledger);
    onDone();
  }, 'No pudimos asignar el programa.');
  const saveProgram = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const pesos = parsePesos(newAmount);
    if (!newName.trim()) { setError('Escribí el nombre del programa.'); return; }
    if (!pesos) { setError('Escribí el monto mensual en pesos, sin decimales.'); return; }
    void run(async () => {
      const saved = (await api.saveBillingProgram({ name: newName.trim(), amount: pesos })).programs;
      onPrograms(saved);
      setSelectedId(saved.find((program) => program.name.toLowerCase() === newName.trim().toLowerCase())?.id ?? '');
      setNewName(''); setNewAmount('');
    }, 'No pudimos guardar el programa.');
  };
  const removeProgram = () => run(async () => {
    const left = (await api.deleteBillingProgram(selectedId)).programs;
    onPrograms(left); setSelectedId(left[0]?.id ?? '');
  }, 'No pudimos borrar el programa.');

  return <div className="cbz-form cbz-programs">
    {programs.length ? <div className="cbz-grid cbz-grid-2">
      <label htmlFor="cbz-program-select">Programa<select id="cbz-program-select" value={selectedId} onChange={(event) => setSelectedId(event.target.value)} disabled={busy}>
        {programs.map((program) => <option key={program.id} value={program.id}>{program.name} · {formatPesos(program.amount)} por mes</option>)}
      </select></label>
      <label htmlFor="cbz-program-due">Primer vencimiento<input id="cbz-program-due" type="date" value={firstDue} onChange={(event) => setFirstDue(event.target.value)} disabled={busy} /></label>
    </div> : <p className="cbz-muted">Todavía no armaste programas. Creá el primero acá abajo.</p>}
    <div className="cbz-actions">
      <NvButton disabled={busy || !selectedId} onClick={() => void assign(selectedId)}>{busy ? 'Guardando…' : 'Asignar'}</NvButton>
      {currentName && <NvButton className="nv-soft" disabled={busy} onClick={() => void assign(null)}>Quitar programa</NvButton>}
      {selectedId && <NvButton className="nv-ghost" disabled={busy} onClick={() => void removeProgram()}>Borrar programa</NvButton>}
    </div>
    <form className="cbz-form cbz-program-new" onSubmit={saveProgram} noValidate aria-label="Nuevo programa">
      <div className="cbz-grid cbz-grid-2">
        <label htmlFor="cbz-program-name">Nombre del programa<input id="cbz-program-name" value={newName} maxLength={PROGRAM_NAME_MAX} onChange={(event) => setNewName(event.target.value)} placeholder="Ej. Plan trimestral" disabled={busy} /></label>
        <label htmlFor="cbz-program-amount">Monto por mes ($)<input id="cbz-program-amount" inputMode="numeric" value={newAmount} onChange={(event) => setNewAmount(event.target.value)} disabled={busy} /></label>
      </div>
      <NvButton type="submit" className="nv-soft" disabled={busy}>Guardar programa</NvButton>
    </form>
    <FeeError message={error} />
  </div>;
}

/** Copiar link: copia el mensaje con el link (y alias) de pago que la nutricionista ya cargó. */
export function CopyLinkButton({ input, label = 'Copiar link', className }: {
  input: Parameters<typeof chargeLinkText>[0]; label?: string; className?: string;
}) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const text = chargeLinkText(input);
  const copy = async () => {
    if (!text) return;
    try { await navigator.clipboard.writeText(text); setState('copied'); window.setTimeout(() => setState('idle'), COPIED_MS); }
    catch { setState('failed'); }
  };
  return <span className="cbz-copy">
    <NvButton className={className ?? 'nv-soft'} disabled={!text} onClick={() => void copy()}>{state === 'copied' ? 'Copiado' : label}</NvButton>
    {state === 'failed' && text && <span role="status" className="cbz-muted">No pudimos copiar. Seleccioná el texto: <input readOnly value={text} aria-label="Mensaje con el link de pago" onFocus={(event) => event.currentTarget.select()} /></span>}
  </span>;
}
