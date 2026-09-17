import { useMemo, useState, type FormEvent } from 'react';
import { api } from '../../api/client';
import { useAppStore } from '../../store/useAppStore';
import type { GoalStatus, Patient } from '../../types';
import { Icon } from '../shared/Icon';
import {
  filterGoalPatients,
  getGoalSnapshot,
  GOAL_STATUS_LABELS,
  type GoalFilter,
} from './crm-goals';

const FILTERS: Array<{ id: GoalFilter; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'active', label: 'Activos' },
  { id: 'paused', label: 'En pausa' },
  { id: 'completed', label: 'Completados' },
];

function formatDate(value: string | null): string {
  if (!value) return 'Sin actualizaciones registradas';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Actualización registrada';
  return `Actualizado ${new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)}`;
}

function GoalEditor({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  const addPatient = useAppStore((state) => state.addPatient);
  const snapshot = getGoalSnapshot(patient);
  const [goal, setGoal] = useState(patient.goal);
  const [status, setStatus] = useState<GoalStatus>(snapshot.status);
  const [progress, setProgress] = useState(snapshot.progress);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (goal.trim().length < 2) {
      setError('Escribí un objetivo de al menos dos caracteres.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const { patient: updated } = await api.updateGoal(patient.id, {
        goal,
        status,
        progress,
        ...(note.trim() ? { note } : {}),
      });
      addPatient(updated);
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No pudimos guardar el objetivo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop goal-editor-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="goal-editor-panel" role="dialog" aria-modal="true" aria-labelledby="goal-editor-title">
        <header className="goal-editor-head">
          <div>
            <p className="eyebrow">Seguimiento de objetivo</p>
            <h2 id="goal-editor-title">Editar objetivo de {patient.name}</h2>
            <p>Actualizá la meta, su estado y el avance acordado con la paciente.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar editor">×</button>
        </header>

        <form className="goal-editor-form" onSubmit={save}>
          <label>
            Objetivo
            <textarea value={goal} onChange={(event) => setGoal(event.target.value)} maxLength={240} rows={3} required />
            <small>{goal.trim().length}/240 caracteres</small>
          </label>

          <div className="goal-editor-fields">
            <label>
              Estado
              <select value={status} onChange={(event) => setStatus(event.target.value as GoalStatus)}>
                <option value="active">Activo</option>
                <option value="paused">En pausa</option>
                <option value="completed">Completado</option>
              </select>
            </label>
            <label>
              Avance
              <span className="goal-progress-input">
                <input type="range" min="0" max="100" step="5" value={progress} onChange={(event) => setProgress(Number(event.target.value))} />
                <b>{progress}%</b>
              </span>
            </label>
          </div>

          <label>
            Nota de seguimiento <small>Opcional</small>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={3} placeholder="Ej.: acordado en consulta, pausa por viaje o próximo ajuste." />
          </label>

          {error && <p className="goal-editor-error" role="alert">{error}</p>}
          <footer className="goal-editor-actions">
            <button type="button" onClick={onClose}>Cancelar</button>
            <button type="submit" className="command-primary" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar actualización'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export function CrmObjectivesView({ patients, onOpenPatient }: { patients: Patient[]; onOpenPatient: (id: string) => void }) {
  const [filter, setFilter] = useState<GoalFilter>('all');
  const [editing, setEditing] = useState<Patient | null>(null);
  const visiblePatients = useMemo(() => filterGoalPatients(patients, filter), [patients, filter]);
  const summaries = patients.map(getGoalSnapshot);
  const active = summaries.filter(({ status }) => status === 'active').length;
  const paused = summaries.filter(({ status }) => status === 'paused').length;
  const completed = summaries.filter(({ status }) => status === 'completed').length;
  const averageProgress = summaries.length
    ? Math.round(summaries.reduce((total, item) => total + item.progress, 0) / summaries.length)
    : 0;

  return (
    <>
      <section className="module-metrics goal-metrics" aria-label="Resumen de objetivos">
        <article><Icon name="target" size={18} /><small>Objetivos activos</small><strong>{active}</strong></article>
        <article><Icon name="clock" size={18} /><small>En pausa</small><strong>{paused}</strong></article>
        <article><Icon name="check" size={18} /><small>Completados</small><strong>{completed}</strong></article>
        <article><Icon name="trend" size={18} /><small>Avance medio</small><strong>{averageProgress}%</strong></article>
      </section>

      <section className="module-panel-card goal-panel-card">
        <header className="goal-panel-head">
          <div><h3>Seguimiento de objetivos</h3><p>El avance se registra manualmente y queda en el historial.</p></div>
          <nav className="goal-filters" aria-label="Filtrar objetivos">
            {FILTERS.map((item) => (
              <button type="button" key={item.id} className={filter === item.id ? 'active' : ''} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}</button>
            ))}
          </nav>
        </header>

        <div className="goal-list">
          {visiblePatients.map((patient) => {
            const snapshot = getGoalSnapshot(patient);
            return (
              <article className="goal-card" key={patient.id}>
                <div className="goal-card-person">
                  <span className={`crm-avatar person-${patient.tone}`}>{patient.initials}</span>
                  <div><b>{patient.name}</b><small>{formatDate(snapshot.updatedAt)}</small></div>
                  <span className={`goal-status goal-${snapshot.status}`}>{GOAL_STATUS_LABELS[snapshot.status]}</span>
                </div>
                <div className="goal-card-main">
                  <p>{patient.goal}</p>
                  <div className="goal-progress-row">
                    <span><i style={{ width: `${snapshot.progress}%` }} /></span>
                    <b>{snapshot.progress}%</b>
                  </div>
                </div>
                <div className="goal-card-actions">
                  <button type="button" onClick={() => onOpenPatient(patient.id)}>Abrir ficha</button>
                  <button type="button" className="goal-edit-button" onClick={() => setEditing(patient)}><Icon name="edit" size={13} />Actualizar</button>
                </div>
                <details className="goal-history">
                  <summary>Historial ({snapshot.history.length})</summary>
                  {snapshot.history.length ? (
                    <ol>
                      {snapshot.history.map((entry) => (
                        <li key={entry.id}>
                          <span>{new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short' }).format(new Date(entry.updated_at))}</span>
                          <div><b>{entry.goal}</b><small>{GOAL_STATUS_LABELS[entry.status]} · {entry.progress}%{entry.note ? ` · ${entry.note}` : ''}</small></div>
                        </li>
                      ))}
                    </ol>
                  ) : <p>Todavía no hay cambios registrados para este objetivo.</p>}
                </details>
              </article>
            );
          })}
          {!visiblePatients.length && <p className="module-empty">No hay objetivos en este estado.</p>}
        </div>
      </section>

      {editing && <GoalEditor patient={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
