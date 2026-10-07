import { writeWasRejected } from '../../../api/write-outcome';
import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { FramePair } from '../FramePair';
import { nodeName, sourceText, type SourceBinding, type SourceNode, type SourceResolver } from '../SourceView';
import { exerciseApi } from '../../../api/exercise';
import { api } from '../../../api/client';
import { useAppStore } from '../../../store/useAppStore';
import { canLeaveWorkspace,useUnsavedChanges } from '../../../components/nutrigo/unsaved-changes';
import type { ExerciseIntensity, RoutineAssignmentView } from '../../../types/exercise';
import { dateLabel, descendants, EmptyState, errorText, leaf, objects, searchBinding, source, RecordDialog, Stateful, useRemote, type ScreenProps } from './shared';

type Row = { id: string; title: string; sets: number | null; reps: number | null; rest: number | null; duration?: number; note: string; recorded: boolean; date?: string; assignment?: RoutineAssignmentView };
const is = (node: SourceNode, ...samples: string[]) => leaf(node) && samples.includes(sourceText(node));
const inner = (node: SourceNode, resolve: SourceResolver): ReactNode[] => node.children.map((child, index) => typeof child === 'object' ? source(child, resolve, index) : child);
/** Celda con número y unidad (dos textos del archivo). */
const pair = (cell: SourceNode, value: string, unit: string): SourceBinding => { const texts = descendants(cell).filter(leafNode => leafNode !== cell && leafNode.tag === 'p'); return { children: inner(cell, child => child === texts[0] ? { text: value } : child === texts[1] ? { text: unit } : undefined) }; };
export function NutrigoExercise({ patient, query = '', onNavigate, onSignOut }: ScreenProps) {
  const remote = useRemote(patient.id, signal => exerciseApi.get(patient.id, false, signal).then(result => result.exercise));
  const refresh = useAppStore(state => state.refreshPatient);
  const pending = useRef<Parameters<typeof api.logActivity>[1] | null>(null);
  const [search, setSearch] = useState(query); const [recordedOnly, setRecordedOnly] = useState(false); const [alphabetical, setAlphabetical] = useState(false); const [lastWeek, setLastWeek] = useState(false);
  const [page, setPage] = useState(0); const [pageSize, setPageSize] = useState(12);
  const [editing, setEditing] = useState(false); const [feedback, setFeedback] = useState<RoutineAssignmentView | null>(null);
  const [activity, setActivity] = useState(''); const [minutes, setMinutes] = useState('30'); const [intensity, setIntensity] = useState<ExerciseIntensity>('moderada'); const [note, setNote] = useState('');
  const [sets, setSets] = useState('0'); const [reps, setReps] = useState('0');
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [status, setStatus] = useState(''); const lock = useRef(false);
  const closeEditor=()=>{if(canLeaveWorkspace())setEditing(false);};
  const dirty=feedback?sets!==String(feedback.feedback?.sets_completed??0)||reps!==String(feedback.feedback?.reps_completed??0)||note!==(feedback.feedback?.note??''):Boolean(activity.trim()||note.trim()||minutes!=='30'||intensity!=='moderada');
  useUnsavedChanges(Boolean(pending.current)||editing&&dirty,busy);
  const all: Row[] = [
    ...(remote.data?.assignments ?? []).flatMap(assignment => assignment.items.map(item => ({ id: item.id, title: item.name, sets: item.sets, reps: item.reps, rest: item.rest_seconds, note: `${assignment.title}${item.note ? ` · ${item.note}` : ''}`, recorded: !!assignment.feedback, assignment }))),
    ...(remote.data?.activities ?? []).map(item => ({ id: item.id, title: item.activity, sets: item.sets, reps: item.reps, rest: null, duration: item.duration_minutes, note: `${dateLabel(item.logged_at)} · ${item.intensity}${item.note ? ` · ${item.note}` : ''}`, recorded: true, date: item.logged_at })),
  ];
  const weekAgo = Date.now() - 7 * 86400000;
  const rows = all.filter(row => (!recordedOnly || row.recorded) && (!lastWeek || !row.date || Date.parse(row.date) >= weekAgo) && `${row.title} ${row.note}`.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es'))).sort((a, b) => alphabetical ? a.title.localeCompare(b.title, 'es') : 0);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pages - 1);
  const shown = rows.slice(current * pageSize, (current + 1) * pageSize);
  const submit = async (event: FormEvent) => { event.preventDefault(); if (lock.current) return; if (!feedback && activity.trim().length < 2) { setError('Escribí el nombre de la actividad.'); return; } lock.current = true; setBusy(true); setError(''); setStatus(''); try { if (feedback) { const saved = await exerciseApi.feedback(patient.id, feedback.id, { sets_completed: Number(sets), reps_completed: Number(reps), note }); remote.setData(saved.exercise); } else { pending.current ??= { client_id: crypto.randomUUID(), activity: activity.trim(), duration_minutes: Number(minutes), intensity, note: note.trim() }; await api.logActivity(patient.id, pending.current); pending.current = null; remote.reload(); try { await refresh(patient.id); } catch { /* Saved activity remains visible on the next reload. */ } } setStatus(feedback ? 'Registro de rutina guardado.' : 'Actividad guardada.'); setFeedback(null); setEditing(false); setActivity(''); setNote(''); } catch (caught) { if (writeWasRejected(caught)) pending.current = null; setError(errorText(caught)); } finally { lock.current = false; setBusy(false); } };
  const showFeedback = (assignment: RoutineAssignmentView) => { setFeedback(assignment); setSets(String(assignment.feedback?.sets_completed ?? 0)); setReps(String(assignment.feedback?.reps_completed ?? 0)); setNote(assignment.feedback?.note ?? ''); setError(''); setEditing(true); };
  const openActivity = () => { setFeedback(null); setNote(''); setError(''); setEditing(true); };
  const filter = (apply: () => void) => () => { apply(); setPage(0); };

  /** Repite las filas del archivo (con sus íconos y colores en ciclo) y usa la insignia de estado que corresponde. */
  const table = (node: SourceNode): SourceBinding => {
    const parts = objects(node);
    const header = parts.find(child => !nodeName(child) || sourceText(child).includes('Exercise Name'));
    const prototypes = parts.filter(child => nodeName(child) === 'Table-Row-Exercises' && child !== header);
    const trailing = parts.filter(child => child !== header && !prototypes.includes(child));
    const badges = descendants(node).filter(child => nodeName(child) === 'Cell-Status').flatMap(objects);
    // El celular usa columnas angostas («reps»): rótulos cortos para que nada se pise.
    const compact = descendants(node).some(child => is(child, 'reps'));
    const badge = (sample: string) => badges.find(child => sourceText(child) === sample) ?? badges[0];
    const renderRow = (prototype: SourceNode, item: Row) => source(prototype, child => {
      const name = nodeName(child);
      if (name === 'Cell-Name') return { children: inner(child, part => leaf(part) ? { children: <>{item.title}<span title={item.note} className="block max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap text-[11px] leading-[1.3] text-[#8a8c90]">{item.note}</span></> } : undefined) };
      if (name === 'Cell-Sets') return { children: inner(child, part => leaf(part) ? { text: item.sets == null ? '-' : String(item.sets) } : undefined) };
      if (name === 'Cell-Reps') return pair(child, item.duration ? String(item.duration) : item.reps == null ? '-' : String(item.reps), item.duration ? 'min' : item.reps == null ? '' : compact ? 'rep.' : item.reps === 1 ? 'repetición' : 'repeticiones');
      if (name === 'Cell-Rest') return pair(child, item.rest == null ? '-' : String(item.rest), item.rest == null ? '' : 'seg');
      // Plan V no registra peso levantado ni calorías por ejercicio: la celda queda en «-», como el archivo cuando no aplica.
      if (name === 'Cell-Weight' || name === 'Cell-Calories') return pair(child, '-', '');
      if (name === 'Cell-Status') {
        const done = item.recorded;
        const chip = badge(done ? 'Completed' : 'In Progress');
        const text = done ? 'Registrada' : 'Pendiente';
        return { children: chip && source(chip, part => {
          if (part === chip && item.assignment) return { onClick: () => showFeedback(item.assignment!), label: `${done ? 'Ver mi registro de' : 'Registrar'} ${item.title}` };
          return leaf(part) ? { text } : undefined;
        }, 'status') };
      }
      return undefined;
    }, item.id);
    const body = remote.error ? <Stateful error={remote.error} onRetry={remote.reload} /> : !remote.data ? <EmptyState text="Cargando…" /> : !rows.length ? <EmptyState text={all.length ? 'No hay actividades con este filtro.' : 'Todavía no hay actividades ni rutinas indicadas.'} /> : shown.map((item, index) => renderRow(prototypes[index % prototypes.length], item));
    return { children: <>{header && source(header, child => compact && is(child, 'Reps') ? { text: 'Rep.' } : compact && is(child, 'Rest') ? { text: 'Pausa' } : undefined, 'header')}{prototypes.length ? body : null}{trailing.map((child, index) => source(child, () => undefined, `end-${index}`))}</> };
  };
  const pagination = (node: SourceNode): SourceBinding => {
    const parts = objects(node);
    const [previous, next] = [parts[0], parts[parts.length - 1]];
    const numbers = parts.filter(child => nodeName(child) === 'Button');
    const active = numbers.find(child => /bg-\[#c2e66e\]/.test(String(child.props.className))) ?? numbers[0];
    const idle = numbers.find(child => child !== active) ?? active;
    const first = Math.max(0, Math.min(current - 1, pages - 3));
    const visible = Array.from({ length: Math.min(3, pages) }, (_, index) => first + index);
    return { children: <>
      {previous && source(previous, child => child === previous ? { onClick: () => setPage(Math.max(0, current - 1)), label: 'Página anterior', props: { disabled: current === 0, style: current === 0 ? { background: '#f6f6f7' } : { background: '#ffffff' } } } : undefined, 'previous')}
      {active && visible.map(number => source(number === current ? active : idle!, child => child === active || child === idle ? { onClick: () => setPage(number), label: `Página ${number + 1}`, props: { 'aria-current': number === current ? 'page' : undefined } } : leaf(child) ? { text: String(number + 1) } : undefined, number))}
      {next && next !== previous && source(next, child => child === next ? { onClick: () => setPage(Math.min(pages - 1, current + 1)), label: 'Página siguiente', props: { disabled: current >= pages - 1, style: current >= pages - 1 ? { background: '#f6f6f7' } : { background: '#ffffff' } } } : undefined, 'next')}
    </> };
  };
  const picker = (node: SourceNode, text: string, onClick: () => void, extra: Record<string, unknown> = {}): SourceBinding => ({ onClick, props: extra, children: inner(node, child => leaf(child) ? { text } : undefined) });
  const resolver: SourceResolver = node => {
    const name = nodeName(node); const text = sourceText(node);
    const input = searchBinding(node, search, value => { setSearch(value); setPage(0); }, 'Buscar actividad'); if (input) return input;
    if (name === 'Table') return table(node);
    if (name === 'Pagination') return pagination(node);
    if (name === 'Button CTA' && text === 'Add Exercise') return { onClick: openActivity, label: 'Registrar actividad', children: inner(node, child => is(child, 'Add Exercise') ? { text: 'Registrar actividad' } : undefined) };
    if (name === 'Button Picker' && text === 'Status') return picker(node, recordedOnly ? 'Registradas' : 'Todos los estados', filter(() => setRecordedOnly(value => !value)), { 'aria-pressed': recordedOnly });
    if (name === 'Button Picker' && text === 'This Week') return picker(node, lastWeek ? 'Últimos 7 días' : 'Todo el historial', filter(() => setLastWeek(value => !value)), { 'aria-pressed': lastWeek });
    if (name === 'Button Picker' && text === 'Popular') return picker(node, alphabetical ? 'Por nombre' : 'Más recientes', () => setAlphabetical(value => !value), { 'aria-pressed': alphabetical });
    if (name === 'Button More' && !text) return { onClick: filter(() => setRecordedOnly(value => !value)), label: recordedOnly ? 'Mostrar todas las actividades' : 'Mostrar sólo las registradas', props: { 'aria-pressed': recordedOnly } };
    if (name === 'Section Result') return { children: inner(node, child => {
      if (is(child, 'Showing')) return { text: 'Mostrando' };
      if (nodeName(child) === 'Button') return { onClick: filter(() => setPageSize(value => value === 12 ? 24 : value === 24 ? 48 : 12)), label: `Filas por página: ${pageSize}. Cambiar`, children: inner(child, part => leaf(part) ? { text: String(Math.min(pageSize, Math.max(rows.length, 0)) || pageSize) } : undefined) };
      if (is(child, 'out of 28')) return { text: `de ${rows.length}` };
      return undefined;
    }) };
    return undefined;
  };
  return <FramePair nodes={['105:2931', '501:22824']} resolve={resolver} patientName={patient.name} onNavigate={onNavigate} onSignOut={onSignOut}>
    {error && !editing && <Stateful error={error} />}{status && <p role="status" className="mx-[24px] p-[16px] text-[#272932]">{status}</p>}
    {editing && <RecordDialog title={feedback ? 'Registrar rutina' : 'Registrar actividad'} onClose={closeEditor} busy={busy} dirty={dirty || Boolean(pending.current)}><form onSubmit={event => void submit(event)} className="flex max-h-[90vh] w-full max-w-[440px] flex-col gap-[16px] overflow-auto rounded-[16px] bg-white p-[24px]"><fieldset disabled={busy || Boolean(pending.current)} className="flex flex-col gap-[16px]"><h2 className="text-[22px] font-medium">{feedback ? feedback.title : 'Registrar actividad'}</h2>{feedback ? <><p className="text-[14px]">Contá las series y repeticiones que realizaste. El registro corresponde a la rutina.</p><label>Series realizadas<input required type="number" min="0" max="20" value={sets} onChange={event => setSets(event.target.value)} className="mt-[4px] w-full rounded-[8px] border border-[#e1e1e2] p-[10px]" /></label><label>Repeticiones realizadas<input required type="number" min="0" max="200" value={reps} onChange={event => setReps(event.target.value)} className="mt-[4px] w-full rounded-[8px] border border-[#e1e1e2] p-[10px]" /></label></> : <><label>Actividad<input required minLength={2} maxLength={80} value={activity} onChange={event => setActivity(event.target.value)} className="mt-[4px] w-full rounded-[8px] border border-[#e1e1e2] p-[10px]" /></label><label>Minutos<input required type="number" min="1" max="600" value={minutes} onChange={event => setMinutes(event.target.value)} className="mt-[4px] w-full rounded-[8px] border border-[#e1e1e2] p-[10px]" /></label><label>Intensidad<select value={intensity} onChange={event => setIntensity(event.target.value as ExerciseIntensity)} className="mt-[4px] w-full rounded-[8px] border border-[#e1e1e2] p-[10px]"><option value="suave">Suave</option><option value="moderada">Moderada</option><option value="intensa">Intensa</option></select></label></>}<label>Nota<textarea maxLength={500} value={note} onChange={event => setNote(event.target.value)} className="mt-[4px] w-full rounded-[8px] border border-[#e1e1e2] p-[10px]" /></label></fieldset>{error && <Stateful error={error} />}{pending.current && !busy && <p>Reintentá para confirmar el mismo registro, sin duplicarlo.</p>}<div className="flex gap-[8px]"><button type="submit" disabled={busy} className="rounded-[8px] bg-[#c2e66e] px-[16px] py-[10px] text-[#272932]">{busy ? 'Guardando…' : 'Guardar'}</button><button type="button" disabled={busy || Boolean(pending.current)} onClick={closeEditor} className="rounded-[8px] border border-[#e1e1e2] px-[16px] py-[10px]">Cancelar</button></div></form></RecordDialog>}
  </FramePair>;
}
