import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { api } from '../../api/client';
import type { GoalStatus, Patient } from '../../types';
import { Icon } from '../shared/Icon';
import { filterGoalPatients, getGoalSnapshot, GOAL_STATUS_LABELS, type GoalFilter } from '../crm/crm-goals';
import { NvBadge, NvButton } from './primitives';
import './showroom-goals.css';

const FILTERS: Array<{ id: GoalFilter; label: string }> = [
  { id: 'all', label: 'Todos' }, { id: 'active', label: 'Activos' },
  { id: 'paused', label: 'En pausa' }, { id: 'completed', label: 'Completados' },
];

export function buildGoalSummary(patients: Patient[]) {
  const snapshots = patients.map(getGoalSnapshot);
  return {
    active: snapshots.filter(({ status }) => status === 'active').length,
    paused: snapshots.filter(({ status }) => status === 'paused').length,
    completed: snapshots.filter(({ status }) => status === 'completed').length,
    averageProgress: snapshots.length ? Math.round(snapshots.reduce((total, item) => total + item.progress, 0) / snapshots.length) : 0,
  };
}

function formatGoalDate(value: string | null): string {
  if (!value) return 'Sin actualizaciones';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Actualización registrada' : new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function GoalEditor({ patient, onClose, onSaved }: { patient: Patient; onClose: () => void; onSaved: (patient: Patient) => void }) {
  const snapshot = getGoalSnapshot(patient);
  const [goal, setGoal] = useState(patient.goal);
  const [status, setStatus] = useState<GoalStatus>(snapshot.status);
  const [progress, setProgress] = useState(snapshot.progress);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const goalInput = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    goalInput.current?.focus();
    const closeWithEscape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !busy) onClose(); };
    document.addEventListener('keydown', closeWithEscape);
    return () => document.removeEventListener('keydown', closeWithEscape);
  }, [busy, onClose]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (goal.trim().length < 2) { setError('Escribí un objetivo de al menos dos caracteres.'); return; }
    setBusy(true); setError('');
    try {
      const result = await api.updateGoal(patient.id, { goal: goal.trim(), status, progress, ...(note.trim() ? { note: note.trim() } : {}) });
      onSaved(result.patient);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No pudimos guardar el objetivo.');
    } finally { setBusy(false); }
  };

  return <div className="nv-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !busy && onClose()}>
    <section className="nv-dialog nvg-dialog" role="dialog" aria-modal="true" aria-labelledby="nvg-editor-title">
      <header className="nv-dialog-head"><div><p className="nv-eyebrow">Seguimiento profesional</p><h2 id="nvg-editor-title">Actualizar objetivo de {patient.name}</h2><p>Registrá la meta, el estado y el avance acordado con la paciente.</p></div><button type="button" onClick={onClose} disabled={busy} aria-label="Cerrar editor">×</button></header>
      <form className="nv-dialog-form" onSubmit={save}>
        <label>Objetivo<textarea ref={goalInput} value={goal} onChange={(event) => setGoal(event.target.value)} minLength={2} maxLength={240} rows={3} required /><small>{goal.trim().length}/240 caracteres</small></label>
        <div className="nv-dialog-grid"><label>Estado<select value={status} onChange={(event) => setStatus(event.target.value as GoalStatus)}><option value="active">Activo</option><option value="paused">En pausa</option><option value="completed">Completado</option></select></label><label>Avance<span className="nvg-range"><input aria-label="Avance del objetivo" type="range" min="0" max="100" step="5" value={progress} onChange={(event) => setProgress(Number(event.target.value))} /><b>{progress}%</b></span></label></div>
        <label>Nota profesional <small>Opcional · no visible para el paciente</small><textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={3} placeholder="Acuerdo de consulta o próximo ajuste." /></label>
        {error && <p className="nv-dialog-error" role="alert">{error}</p>}
        <footer className="nv-dialog-actions"><NvButton className="nv-ghost" onClick={onClose} disabled={busy}>Cancelar</NvButton><NvButton type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar actualización'}</NvButton></footer>
      </form>
    </section>
  </div>;
}

export function ShowroomGoals({ patient, patients, onSelect, onChanged, onOpenPatient }: {
  patient: Patient; patients: Patient[]; onSelect: (id: string) => void; onChanged: (patient: Patient) => void; onOpenPatient: (id: string) => void;
}) {
  const [filter, setFilter] = useState<GoalFilter>('all');
  const [editing, setEditing] = useState<Patient | null>(null);
  const summary = useMemo(() => buildGoalSummary(patients), [patients]);
  const visible = useMemo(() => filterGoalPatients(patients, filter), [patients, filter]);
  const selectedSnapshot = getGoalSnapshot(patient);
  const progressStyle = { '--nvg-progress': `${selectedSnapshot.progress}%` } as CSSProperties;

  return <section className="nvg-goals" aria-label={`Objetivos de ${patient.name}`}>
    <header className="nvg-context"><div><span className={`nv-avatar person-${patient.tone}`}>{patient.initials}</span><div><strong>Objetivos de {patient.name}</strong><small>Seguimiento individual dentro del consultorio multipaciente.</small></div></div><label>Paciente en seguimiento<select aria-label="Paciente en seguimiento" value={patient.id} onChange={(event) => onSelect(event.target.value)}>{patients.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label></header>
    <dl className="nvg-stats" aria-label="Resumen de objetivos"><div className="nvg-stat"><span className="nv-icon-tile"><Icon name="target" size={18} /></span><dt>Activos</dt><dd>{summary.active}</dd></div><div className="nvg-stat"><span className="nv-icon-tile"><Icon name="clock" size={18} /></span><dt>En pausa</dt><dd>{summary.paused}</dd></div><div className="nvg-stat"><span className="nv-icon-tile"><Icon name="check" size={18} /></span><dt>Completados</dt><dd>{summary.completed}</dd></div><div className="nvg-stat"><span className="nv-icon-tile"><Icon name="trend" size={18} /></span><dt>Avance medio</dt><dd>{summary.averageProgress}%</dd></div></dl>
    <div className="nvg-layout">
      <section className="nvg-directory"><header><div><h2>Seguimiento de objetivos</h2><p>El avance es manual y cada actualización queda registrada.</p></div><nav aria-label="Filtrar objetivos">{FILTERS.map((item) => <button type="button" key={item.id} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}</button>)}</nav></header><div className="nvg-list">{visible.map((person) => { const snapshot = getGoalSnapshot(person); return <article key={person.id} className={person.id === patient.id ? 'nvg-selected' : ''}><header><button type="button" className="nvg-person" onClick={() => onSelect(person.id)}><span className={`nv-avatar person-${person.tone}`}>{person.initials}</span><span><strong>{person.name}</strong><small>{formatGoalDate(snapshot.updatedAt)}</small></span></button><NvBadge tone={snapshot.status === 'active' ? 'green' : snapshot.status === 'paused' ? 'gold' : undefined}>{GOAL_STATUS_LABELS[snapshot.status]}</NvBadge></header><p>{person.goal}</p><div className="nvg-progress" aria-label={`Avance ${snapshot.progress}%`}><span><i style={{ width: `${snapshot.progress}%` }} /></span><b>{snapshot.progress}%</b></div><footer><button type="button" onClick={() => onOpenPatient(person.id)}>Abrir ficha</button><button type="button" onClick={() => { onSelect(person.id); setEditing(person); }}><Icon name="edit" size={13} />Actualizar objetivo</button></footer></article>; })}{!visible.length && <p className="nvg-empty" role="status">No hay objetivos en este estado.</p>}</div></section>
      <aside className="nvg-focus"><section><header><div><p className="nv-eyebrow">Objetivo seleccionado</p><h2>{patient.name}</h2></div><NvBadge tone={selectedSnapshot.status === 'active' ? 'green' : selectedSnapshot.status === 'paused' ? 'gold' : undefined}>{GOAL_STATUS_LABELS[selectedSnapshot.status]}</NvBadge></header><div className="nvg-ring" style={progressStyle}><span><strong>{selectedSnapshot.progress}%</strong><small>avance</small></span></div><h3>{patient.goal}</h3><p>Última actualización: {formatGoalDate(selectedSnapshot.updatedAt)}</p><NvButton onClick={() => setEditing(patient)}>Actualizar objetivo</NvButton></section><section className="nvg-history"><header><h2>Historial profesional</h2><NvBadge>{selectedSnapshot.history.length}</NvBadge></header>{selectedSnapshot.history.length ? <ol>{selectedSnapshot.history.map((entry) => <li key={entry.id}><time dateTime={entry.updated_at}>{formatGoalDate(entry.updated_at)}</time><strong>{entry.goal}</strong><small>{GOAL_STATUS_LABELS[entry.status]} · {entry.progress}%</small>{entry.note && <p>{entry.note}</p>}</li>)}</ol> : <p className="nvg-empty">Todavía no hay cambios registrados.</p>}<small className="nvg-private"><Icon name="pin" size={12} />Sólo visible para profesionales.</small></section></aside>
    </div>
    {editing && <GoalEditor patient={editing} onClose={() => setEditing(null)} onSaved={(updated) => { onChanged(updated); onSelect(updated.id); setEditing(null); }} />}
  </section>;
}
