import { writeWasRejected } from '../../../api/write-outcome';
import { useRef, useState, type FormEvent } from 'react';
import { FramePair } from '../FramePair';
import { nodeName, sourceText, type SourceNode, type SourceResolver } from '../SourceView';
import { exerciseApi } from '../../../api/exercise';
import { api } from '../../../api/client';
import { useAppStore } from '../../../store/useAppStore';
import type { ExerciseIntensity, RoutineAssignmentView } from '../../../types/exercise';
import { dateLabel, errorText, formatNumber, objects, searchBinding, source, RecordDialog, Stateful, useRemote, type ScreenProps } from './shared';

type Row = { id: string; title: string; sets: number | null; reps: number | null; rest: number | null; duration?: number; note: string; recorded: boolean; assignment?: RoutineAssignmentView };
export function NutrigoExercise({ patient, query = '', onNavigate, onSignOut }: ScreenProps) {
  const remote = useRemote(patient.id, signal => exerciseApi.get(patient.id, false, signal).then(result => result.exercise));
  const refresh = useAppStore(state => state.refreshPatient);
  const pending = useRef<Parameters<typeof api.logActivity>[1] | null>(null);
  const [search, setSearch] = useState(query); const [recordedOnly, setRecordedOnly] = useState(false); const [alphabetical, setAlphabetical] = useState(false);
  const [editing, setEditing] = useState(false); const [feedback, setFeedback] = useState<RoutineAssignmentView | null>(null);
  const [activity, setActivity] = useState(''); const [minutes, setMinutes] = useState('30'); const [intensity, setIntensity] = useState<ExerciseIntensity>('moderada'); const [note, setNote] = useState('');
  const [sets, setSets] = useState('0'); const [reps, setReps] = useState('0');
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [status, setStatus] = useState(''); const lock = useRef(false);
  const all: Row[] = [
    ...(remote.data?.assignments ?? []).flatMap(assignment => assignment.items.map(item => ({ id: item.id, title: item.name, sets: item.sets, reps: item.reps, rest: item.rest_seconds, note: `${assignment.title}${item.note ? ` · ${item.note}` : ''}`, recorded: !!assignment.feedback, assignment }))),
    ...(remote.data?.activities ?? []).map(item => ({ id: item.id, title: item.activity, sets: item.sets, reps: item.reps, rest: null, duration: item.duration_minutes, note: `${dateLabel(item.logged_at)} · ${item.intensity}${item.note ? ` · ${item.note}` : ''}`, recorded: true })),
  ];
  const rows = all.filter(row => (!recordedOnly || row.recorded) && `${row.title} ${row.note}`.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es'))).sort((a, b) => alphabetical ? a.title.localeCompare(b.title, 'es') : 0);
  const submit = async (event: FormEvent) => { event.preventDefault(); if (lock.current) return; if (!feedback && activity.trim().length < 2) { setError('Escribí el nombre de la actividad.'); return; } lock.current = true; setBusy(true); setError(''); setStatus(''); try { if (feedback) { const saved = await exerciseApi.feedback(patient.id, feedback.id, { sets_completed: Number(sets), reps_completed: Number(reps), note }); remote.setData(saved.exercise); } else { pending.current ??= { client_id: crypto.randomUUID(), activity: activity.trim(), duration_minutes: Number(minutes), intensity, note: note.trim() }; await api.logActivity(patient.id, pending.current); pending.current = null; remote.reload(); try { await refresh(patient.id); } catch { /* Saved activity remains visible on the next reload. */ } } setStatus(feedback ? 'Registro de rutina guardado.' : 'Actividad guardada.'); setFeedback(null); setEditing(false); setActivity(''); setNote(''); } catch (caught) { if (writeWasRejected(caught)) pending.current = null; setError(errorText(caught)); } finally { lock.current = false; setBusy(false); } };
  const showFeedback = (assignment: RoutineAssignmentView) => { setFeedback(assignment); setSets(String(assignment.feedback?.sets_completed ?? 0)); setReps(String(assignment.feedback?.reps_completed ?? 0)); setNote(assignment.feedback?.note ?? ''); setError(''); setEditing(true); };
  const renderRow = (prototype: SourceNode, item: Row) => source(prototype, child => {
    const name = nodeName(child);
    if (name === 'Cell-Name') return { children: <div><strong>{item.title}</strong><p className="text-[12px] text-[#8a8c90]">{item.note}</p></div> };
    if (name === 'Cell-Sets') return { text: formatNumber(item.sets) };
    if (name === 'Cell-Reps') return { text: item.duration ? `${item.duration} min` : `${formatNumber(item.reps)} rep.` };
    if (name === 'Cell-Rest') return { text: item.rest == null ? '—' : `${item.rest} seg` };
    if (name === 'Cell-Weight' || name === 'Cell-Calories') return { text: '—' };
    if (name === 'Cell-Status') return { children: item.assignment ? <button type="button" onClick={() => showFeedback(item.assignment!)} className="rounded-[4px] bg-[#f3f2eb] px-[8px] py-[4px] text-[#272932]">{item.recorded ? 'Ver mi registro' : 'Registrar rutina'}</button> : <span>Registrada</span> };
    if (/Image|Checkbox|Button/.test(name)) return { hidden: true };
    return undefined;
  }, item.id);
  const resolver: SourceResolver = node => {
    const name = nodeName(node); const text = sourceText(node);
    if (name === 'Pagination') return { hidden: true };
    const input = searchBinding(node, search, setSearch, 'Buscar actividad'); if (input) return input;
    if (name === 'Table') { const parts = objects(node); const prototype = parts.find(child => nodeName(child) === 'Table-Row-Exercises' && !sourceText(child).includes('Exercise Name')); return { children: <>{parts[0] && source(parts[0], () => undefined)}{remote.error ? <Stateful error={remote.error} onRetry={remote.reload} /> : !remote.data ? <Stateful loading /> : !rows.length ? <Stateful empty="Todavía no hay actividades ni rutinas indicadas." /> : prototype && rows.map(item => renderRow(prototype, item))}</> }; }
    if (/Button/.test(name) && text === 'Add Exercise') return { onClick: () => { setFeedback(null); setNote(''); setError(''); setEditing(true); }, label: 'Registrar actividad' };
    if (/Button/.test(name) && text === 'Status') return { onClick: () => setRecordedOnly(value => !value), text: recordedOnly ? 'Registradas' : 'Todos los estados', props: { 'aria-pressed': recordedOnly } };
    if (/Button/.test(name) && text === 'Popular') return { onClick: () => setAlphabetical(value => !value), text: alphabetical ? 'Por nombre' : 'Orden original' };
    if (/Button/.test(name) && text === 'This Week') return { hidden: true };
    if (name === 'Section Result') return { text: `${rows.length} actividades y ejercicios` };
    return undefined;
  };
  return <FramePair nodes={['105:2931', '501:22824']} resolve={resolver} patientName={patient.name} onNavigate={onNavigate} onSignOut={onSignOut}>
    {error && !editing && <Stateful error={error} />}{status && <p role="status" className="mx-[24px] p-[16px] text-[#272932]">{status}</p>}
    {editing && <RecordDialog title={feedback ? 'Registrar rutina' : 'Registrar actividad'} onClose={() => setEditing(false)} busy={busy || Boolean(pending.current)}><form onSubmit={event => void submit(event)} className="flex max-h-[90vh] w-full max-w-[440px] flex-col gap-[16px] overflow-auto rounded-[16px] bg-white p-[24px]"><fieldset disabled={busy || Boolean(pending.current)} className="flex flex-col gap-[16px]"><h2 className="text-[22px] font-medium">{feedback ? feedback.title : 'Registrar actividad'}</h2>{feedback ? <><p className="text-[14px]">Contá las series y repeticiones que realizaste. El registro corresponde a la rutina.</p><label>Series realizadas<input required type="number" min="0" max="20" value={sets} onChange={event => setSets(event.target.value)} className="mt-[4px] w-full rounded-[8px] border border-[#e1e1e2] p-[10px]" /></label><label>Repeticiones realizadas<input required type="number" min="0" max="200" value={reps} onChange={event => setReps(event.target.value)} className="mt-[4px] w-full rounded-[8px] border border-[#e1e1e2] p-[10px]" /></label></> : <><label>Actividad<input required minLength={2} maxLength={80} value={activity} onChange={event => setActivity(event.target.value)} className="mt-[4px] w-full rounded-[8px] border border-[#e1e1e2] p-[10px]" /></label><label>Minutos<input required type="number" min="1" max="600" value={minutes} onChange={event => setMinutes(event.target.value)} className="mt-[4px] w-full rounded-[8px] border border-[#e1e1e2] p-[10px]" /></label><label>Intensidad<select value={intensity} onChange={event => setIntensity(event.target.value as ExerciseIntensity)} className="mt-[4px] w-full rounded-[8px] border border-[#e1e1e2] p-[10px]"><option value="suave">Suave</option><option value="moderada">Moderada</option><option value="intensa">Intensa</option></select></label></>}<label>Nota<textarea maxLength={500} value={note} onChange={event => setNote(event.target.value)} className="mt-[4px] w-full rounded-[8px] border border-[#e1e1e2] p-[10px]" /></label></fieldset>{error && <Stateful error={error} />}{pending.current && !busy && <p>Reintentá para confirmar el mismo registro, sin duplicarlo.</p>}<div className="flex gap-[8px]"><button type="submit" disabled={busy} className="rounded-[8px] bg-[#c2e66e] px-[16px] py-[10px] text-[#272932]">{busy ? 'Guardando…' : 'Guardar'}</button><button type="button" disabled={busy || Boolean(pending.current)} onClick={() => setEditing(false)} className="rounded-[8px] border border-[#e1e1e2] px-[16px] py-[10px]">Cancelar</button></div></form></RecordDialog>}
  </FramePair>;
}
