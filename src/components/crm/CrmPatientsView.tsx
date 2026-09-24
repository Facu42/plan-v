import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api } from '../../api/client';
import { useAppStore } from '../../store/useAppStore';
import type { Patient, Stage } from '../../types';
import { Icon } from '../shared/Icon';
import {
  filterDirectoryPatients,
  getPatientDirectoryMetrics,
  type PatientDirectoryFilter,
} from './crm-patients';

const FILTERS: Array<{ id: PatientDirectoryFilter; label: string }> = [
  { id: 'active', label: 'Activos' },
  { id: 'attention', label: 'Necesitan atención' },
  { id: 'archived', label: 'Archivados' },
];

const STAGE_LABELS: Record<Stage, string> = {
  ingreso: 'Ingreso',
  plan: 'Plan',
  seguimiento: 'Seguimiento',
  alta: 'Alta',
};

function PatientProfileEditor({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  const addPatient = useAppStore((state) => state.addPatient);
  const nameInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(patient.name);
  const [status, setStatus] = useState(patient.status);
  const [stage, setStage] = useState<Stage>(patient.stage);
  const [sensitiveHours, setSensitiveHours] = useState(patient.sensitive_hours);
  const [planB, setPlanB] = useState(patient.plan_b);
  const [nextFocus, setNextFocus] = useState(patient.next_focus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    nameInput.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, saving]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { patient: updated } = await api.updatePatientProfile(patient.id, {
        name,
        status,
        stage,
        sensitive_hours: sensitiveHours,
        plan_b: planB,
        next_focus: nextFocus,
      });
      addPatient(updated);
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No pudimos actualizar la ficha.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop patient-profile-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !saving && onClose()}>
      <section className="patient-profile-panel" role="dialog" aria-modal="true" aria-labelledby="patient-profile-title">
        <header className="patient-create-head">
          <div>
            <p className="eyebrow">Directorio</p>
            <h2 id="patient-profile-title">Editar ficha de {patient.name}</h2>
            <p>Actualizá los datos operativos del acompañamiento.</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Cerrar editor">×</button>
        </header>

        <form className="patient-profile-form" onSubmit={save}>
          <div className="patient-profile-grid">
            <label>Nombre completo<input ref={nameInput} value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={80} required /></label>
            <label>Estado visible<input value={status} onChange={(event) => setStatus(event.target.value)} minLength={2} maxLength={40} required /></label>
            <label>Etapa<select value={stage} onChange={(event) => setStage(event.target.value as Stage)}><option value="ingreso">Ingreso</option><option value="plan">Plan</option><option value="seguimiento">Seguimiento</option><option value="alta">Alta</option></select></label>
            <label>Horario sensible<input value={sensitiveHours} onChange={(event) => setSensitiveHours(event.target.value)} maxLength={120} placeholder="Ej.: después de las 20:30" /></label>
          </div>
          <label>Plan B<textarea value={planB} onChange={(event) => setPlanB(event.target.value)} maxLength={240} rows={2} /></label>
          <label>Próximo foco<textarea value={nextFocus} onChange={(event) => setNextFocus(event.target.value)} maxLength={240} rows={2} /></label>
          {error && <p className="patient-profile-error" role="alert">{error}</p>}
          <footer className="patient-create-actions">
            <button type="button" onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" className="command-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export function CrmPatientsView({
  patients,
  onOpenPatient,
  onCreatePatient,
}: {
  patients: Patient[];
  onOpenPatient: (id: string) => void;
  onCreatePatient: () => void;
}) {
  const addPatient = useAppStore((state) => state.addPatient);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<PatientDirectoryFilter>('active');
  const [editing, setEditing] = useState<Patient | null>(null);
  const [archiveConfirmation, setArchiveConfirmation] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const metrics = getPatientDirectoryMetrics(patients);
  const visiblePatients = filterDirectoryPatients(patients, query, filter);

  const setArchived = async (patient: Patient, archived: boolean) => {
    if (archived && archiveConfirmation !== patient.id) {
      setArchiveConfirmation(patient.id);
      return;
    }
    setBusyId(patient.id);
    setError('');
    try {
      const { patient: updated } = await api.setPatientArchived(patient.id, archived);
      addPatient(updated);
      setArchiveConfirmation(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No pudimos actualizar el archivo.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <section className="module-metrics patient-directory-metrics" aria-label="Resumen del directorio">
        <article><Icon name="users" size={18} /><small>Pacientes activos</small><strong>{metrics.active}</strong></article>
        <article><Icon name="sparkle" size={18} /><small>Necesitan atención</small><strong>{metrics.attention}</strong></article>
        <article><Icon name="calendar" size={18} /><small>Con próxima consulta</small><strong>{metrics.appointments}</strong></article>
        <article><Icon name="history" size={18} /><small>Archivados</small><strong>{metrics.archived}</strong></article>
      </section>

      <section className="module-panel-card patient-directory-card">
        <header className="patient-directory-head">
          <div><h3>Directorio de pacientes</h3><p>Buscá, editá o archivá fichas sin borrar su historial.</p></div>
          <button type="button" className="patient-directory-new" onClick={onCreatePatient}><Icon name="plus" size={13} />Nuevo paciente</button>
        </header>
        <div className="patient-directory-toolbar">
          <label className="patient-search"><Icon name="users" size={14} /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, estado u objetivo" aria-label="Buscar pacientes" /></label>
          <nav className="patient-directory-filters" aria-label="Filtrar pacientes">
            {FILTERS.map((item) => {
              const count = item.id === 'active' ? metrics.active : item.id === 'attention' ? metrics.attention : metrics.archived;
              return <button type="button" key={item.id} className={filter === item.id ? 'active' : ''} aria-label={`${item.label} (${count})`} aria-pressed={filter === item.id} onClick={() => { setFilter(item.id); setArchiveConfirmation(null); }}>{item.label}<span>{count}</span></button>;
            })}
          </nav>
        </div>
        {error && <p className="patient-directory-error" role="alert">{error}</p>}

        <div className="patient-directory-list">
          {visiblePatients.map((patient) => (
            <article className="patient-directory-row" key={patient.id}>
              <div className="directory-person"><span className={`crm-avatar person-${patient.tone}`}>{patient.initials}</span><div><b>{patient.name}</b><small>{patient.goal}</small></div></div>
              <div className="directory-meta"><small>Estado</small><b>{patient.status}</b><span>{STAGE_LABELS[patient.stage]}</span></div>
              <div className="directory-meta"><small>Próximo foco</small><b>{patient.next_focus || 'Sin foco cargado'}</b><span>{patient.appointment?.when ?? 'Sin consulta'}</span></div>
              <div className="directory-adherence"><small>Adherencia</small><strong>{patient.adherence_score}%</strong></div>
              <div className="directory-actions">
                {!patient.archived_at && <button type="button" aria-label={`Abrir ficha de ${patient.name}`} onClick={() => onOpenPatient(patient.id)}>Abrir ficha</button>}
                {!patient.archived_at && <button type="button" aria-label={`Editar ${patient.name}`} onClick={() => setEditing(patient)}><Icon name="edit" size={12} />Editar</button>}
                <button type="button" aria-label={patient.archived_at ? `Restaurar ${patient.name}` : archiveConfirmation === patient.id ? `Confirmar archivo de ${patient.name}` : `Archivar ${patient.name}`} className={archiveConfirmation === patient.id ? 'confirm-archive' : ''} disabled={busyId === patient.id} onClick={() => setArchived(patient, !patient.archived_at)}>
                  {busyId === patient.id ? 'Guardando…' : patient.archived_at ? 'Restaurar' : archiveConfirmation === patient.id ? 'Confirmar archivo' : 'Archivar'}
                </button>
              </div>
            </article>
          ))}
          {!visiblePatients.length && <p className="module-empty">No encontramos pacientes para este filtro.</p>}
        </div>
      </section>

      {editing && <PatientProfileEditor patient={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
