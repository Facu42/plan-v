import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api, type PatientInvite } from '../../api/client';
import type { Patient, Stage } from '../../types';
import { filterDirectoryPatients, getPatientDirectoryMetrics, type PatientDirectoryFilter } from '../crm/crm-patients';
import { Icon } from '../shared/Icon';
import { NvBadge, NvButton, NvCard, NvProgress, NvState } from './primitives';
import './showroom-patients.css';

const STAGE_LABELS: Record<Stage, string> = { ingreso: 'Ingreso', plan: 'Plan', seguimiento: 'Seguimiento', alta: 'Alta' };

export function followFromDirectory(patientId: string) {
  return { patientId, module: 'seguimiento' as const };
}
const FILTERS: Array<{ id: PatientDirectoryFilter; label: string }> = [
  { id: 'active', label: 'Activos' },
  { id: 'attention', label: 'Necesitan atención' },
  { id: 'archived', label: 'Archivados' },
];

function useDialogKeys(onClose: () => void, busy: boolean) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape' && !busy) onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, busy]);
}

export function ShowroomPatientCreate({ onClose, onCreated }: { onClose: () => void; onCreated: (patient: Patient, invite: PatientInvite) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [goal, setGoal] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const nameInput = useRef<HTMLInputElement>(null);
  useDialogKeys(onClose, busy);
  useEffect(() => { nameInput.current?.focus(); }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await api.createPatient({ name, email, goal });
      try {
        result.invite = (await api.sendInvite(result.invite.id)).invite;
      } catch {
        // The patient exists even if the one-use window could not start.
      }
      onCreated(result.patient, result.invite);
    } catch {
      setError('No pudimos crear el alta. Revisá los datos o si el email ya está registrado.');
      setBusy(false);
    }
  };

  return <div className="nv-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !busy && onClose()}>
    <section className="nv-dialog" role="dialog" aria-modal="true" aria-labelledby="nv-create-title">
      <header className="nv-dialog-head">
        <div><p className="nv-eyebrow">Ingreso</p><h2 id="nv-create-title">Nuevo paciente</h2><p>Creá la ficha inicial. El acceso comienza pendiente hasta que definas la cobranza.</p></div>
        <button type="button" onClick={onClose} disabled={busy} aria-label="Cerrar">×</button>
      </header>
      <form className="nv-dialog-form" onSubmit={submit}>
        <label>Nombre completo<input ref={nameInput} value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80} autoComplete="name" /></label>
        <label>Email para la invitación<input value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={254} type="email" autoComplete="email" /></label>
        <label>Objetivo declarado<textarea value={goal} onChange={(e) => setGoal(e.target.value)} required minLength={2} maxLength={240} rows={3} /></label>
        <p className="nv-dialog-hint"><Icon name="message" size={14} />La invitación es de un uso y vence. En demo no sale un email real.</p>
        {error && <p className="nv-dialog-error" role="alert">{error}</p>}
        <footer className="nv-dialog-actions">
          <NvButton className="nv-ghost" onClick={onClose} disabled={busy}>Cancelar</NvButton>
          <NvButton type="submit" disabled={busy}><Icon name={busy ? 'loader' : 'plus'} size={14} className={busy ? 'spin' : ''} />{busy ? 'Creando…' : 'Crear alta'}</NvButton>
        </footer>
      </form>
    </section>
  </div>;
}

export function ShowroomPatientEdit({ patient, onClose, onSaved }: { patient: Patient; onClose: () => void; onSaved: (patient: Patient) => void }) {
  const [name, setName] = useState(patient.name);
  const [status, setStatus] = useState(patient.status);
  const [stage, setStage] = useState<Stage>(patient.stage);
  const [sensitiveHours, setSensitiveHours] = useState(patient.sensitive_hours);
  const [planB, setPlanB] = useState(patient.plan_b);
  const [nextFocus, setNextFocus] = useState(patient.next_focus);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const nameInput = useRef<HTMLInputElement>(null);
  useDialogKeys(onClose, busy);
  useEffect(() => { nameInput.current?.focus(); }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { patient: updated } = await api.updatePatientProfile(patient.id, {
        name, status, stage, sensitive_hours: sensitiveHours, plan_b: planB, next_focus: nextFocus,
      });
      onSaved(updated);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No pudimos actualizar la ficha.');
      setBusy(false);
    }
  };

  return <div className="nv-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !busy && onClose()}>
    <section className="nv-dialog" role="dialog" aria-modal="true" aria-labelledby="nv-edit-title">
      <header className="nv-dialog-head">
        <div><p className="nv-eyebrow">Directorio</p><h2 id="nv-edit-title">Editar ficha de {patient.name}</h2><p>Actualizá los datos operativos del acompañamiento.</p></div>
        <button type="button" onClick={onClose} disabled={busy} aria-label="Cerrar editor">×</button>
      </header>
      <form className="nv-dialog-form" onSubmit={submit}>
        <div className="nv-dialog-grid">
          <label>Nombre completo<input ref={nameInput} value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={80} required /></label>
          <label>Estado visible<input value={status} onChange={(e) => setStatus(e.target.value)} minLength={2} maxLength={40} required /></label>
          <label>Etapa<select value={stage} onChange={(e) => setStage(e.target.value as Stage)}>{(['ingreso', 'plan', 'seguimiento', 'alta'] as const).map((value) => <option key={value} value={value}>{STAGE_LABELS[value]}</option>)}</select></label>
          <label>Horario sensible<input value={sensitiveHours} onChange={(e) => setSensitiveHours(e.target.value)} maxLength={120} placeholder="Ej.: después de las 20:30" /></label>
        </div>
        <label>Plan B<textarea value={planB} onChange={(e) => setPlanB(e.target.value)} maxLength={240} rows={2} /></label>
        <label>Próximo foco<textarea value={nextFocus} onChange={(e) => setNextFocus(e.target.value)} maxLength={240} rows={2} /></label>
        {error && <p className="nv-dialog-error" role="alert">{error}</p>}
        <footer className="nv-dialog-actions">
          <NvButton className="nv-ghost" onClick={onClose} disabled={busy}>Cancelar</NvButton>
          <NvButton type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar cambios'}</NvButton>
        </footer>
      </form>
    </section>
  </div>;
}

export function ShowroomPatients({ patients, query, initialFilter = 'active', onChanged, onFollow }: {
  patients: Patient[];
  query: string;
  initialFilter?: PatientDirectoryFilter;
  onChanged: (patient: Patient) => void;
  onFollow: (id: string) => void;
}) {
  const [filter, setFilter] = useState<PatientDirectoryFilter>(initialFilter);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [archiveConfirmation, setArchiveConfirmation] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [inviteNotice, setInviteNotice] = useState('');
  const metrics = getPatientDirectoryMetrics(patients);
  const visible = filterDirectoryPatients(patients, query, filter);

  const setArchived = async (patient: Patient, archived: boolean) => {
    if (archived && archiveConfirmation !== patient.id) { setArchiveConfirmation(patient.id); return; }
    setBusyId(patient.id);
    setError('');
    try {
      const { patient: updated } = await api.setPatientArchived(patient.id, archived);
      onChanged(updated);
      setArchiveConfirmation(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No pudimos actualizar el archivo.');
    } finally {
      setBusyId(null);
    }
  };

  const created = (patient: Patient, invite: PatientInvite) => {
    onChanged(patient);
    setCreating(false);
    setInviteNotice(`${patient.name} fue incorporada. Invitación de un uso a ${invite.email}${invite.expires_at ? ' con vencimiento' : ' guardada'}.`);
  };

  return <>
    <dl className="nv-directory-summary" aria-label="Resumen del directorio">
      <div><dt>Pacientes activos</dt><dd>{metrics.active}</dd></div>
      <div><dt>Necesitan atención</dt><dd>{metrics.attention}</dd></div>
      <div><dt>Con próxima consulta</dt><dd>{metrics.appointments}</dd></div>
      <div><dt>Archivados</dt><dd>{metrics.archived}</dd></div>
    </dl>
    <NvCard title="Directorio de pacientes" action={<NvButton className="nv-soft" onClick={() => setCreating(true)}><Icon name="plus" size={14} />Nuevo paciente</NvButton>}>
      <nav className="nv-directory-filters" aria-label="Filtrar pacientes">
        {FILTERS.map((item) => {
          const count = item.id === 'active' ? metrics.active : item.id === 'attention' ? metrics.attention : metrics.archived;
          return <button type="button" key={item.id} aria-pressed={filter === item.id} onClick={() => { setFilter(item.id); setArchiveConfirmation(null); }}>{item.label}<span>{count}</span></button>;
        })}
      </nav>
      {inviteNotice && <p className="nv-directory-notice" role="status"><Icon name="check" size={15} /><span>{inviteNotice}</span><button type="button" onClick={() => setInviteNotice('')} aria-label="Cerrar aviso">×</button></p>}
      {error && <p className="nv-dialog-error" role="alert">{error}</p>}
      <div className="nv-patient-table nv-directory-table" role="table" aria-label="Pacientes del directorio">
        <div role="row" className="nv-table-head"><span role="columnheader">Paciente</span><span role="columnheader">Estado</span><span role="columnheader">Próximo foco</span><span role="columnheader">Adherencia</span><span role="columnheader">Acciones</span></div>
        {visible.map((patient) => <div role="row" key={patient.id}>
          <span role="cell"><span className="nv-avatar">{patient.initials}</span><span><strong>{patient.name}</strong><small>{patient.goal}</small></span></span>
          <span role="cell"><strong>{patient.status}</strong><small>{STAGE_LABELS[patient.stage]}</small></span>
          <span role="cell"><strong>{patient.next_focus || 'Sin foco cargado'}</strong><small>{patient.appointment?.when ?? 'Sin consulta'}</small></span>
          <span role="cell"><NvProgress value={patient.adherence_score} label={`Adherencia de ${patient.name}`} /><strong>{patient.adherence_score}%</strong></span>
          <span role="cell" className="nv-directory-actions">
            {!patient.archived_at && <NvButton className="nv-soft" aria-label={`Ver seguimiento de ${patient.name}`} onClick={() => onFollow(patient.id)}>Ver seguimiento</NvButton>}
            {!patient.archived_at && <NvButton className="nv-ghost" aria-label={`Editar ficha de ${patient.name}`} onClick={() => setEditing(patient)}><Icon name="edit" size={13} />Editar</NvButton>}
            <NvButton className={`nv-ghost${archiveConfirmation === patient.id ? ' nv-confirm' : ''}`} aria-label={patient.archived_at ? `Restaurar ${patient.name}` : archiveConfirmation === patient.id ? `Confirmar archivo de ${patient.name}` : `Archivar ${patient.name}`} disabled={busyId === patient.id} onClick={() => setArchived(patient, !patient.archived_at)}>
              {busyId === patient.id ? 'Guardando…' : patient.archived_at ? 'Restaurar' : archiveConfirmation === patient.id ? 'Confirmar archivo' : 'Archivar'}
            </NvButton>
          </span>
        </div>)}
      </div>
      {!visible.length && <NvState title="Sin coincidencias" description="Probá otra búsqueda o filtro." />}
    </NvCard>
    {creating && <ShowroomPatientCreate onClose={() => setCreating(false)} onCreated={created} />}
    {editing && <ShowroomPatientEdit patient={editing} onClose={() => setEditing(null)} onSaved={(updated) => { onChanged(updated); setEditing(null); }} />}
  </>;
}
