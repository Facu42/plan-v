import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api, type PatientInvite } from '../../api/client';
import type { Patient, Stage } from '../../types';
import { filterDirectoryPatients, getPatientDirectoryMetrics, type PatientDirectoryFilter } from '../crm/crm-patients';
import { Icon } from '../shared/Icon';
import { NvBadge, NvButton, NvCard, NvState } from './primitives';
import { hasFullPatientAccess } from '../../billing';
import { createPatientWithInvitation, invitationReady } from './patient-invite-actions';
import './showroom-patients.css';
import { useUnsavedChanges, canLeaveWorkspace } from './unsaved-changes';
import { buildBoardRows } from './cobranzas-utils';
import { formatPesos } from '../../fees';
import type { BillingBoard } from '../../types/fees';

const STAGE_LABELS: Record<Stage, string> = { ingreso: 'Ingreso', plan: 'Plan', seguimiento: 'Seguimiento', alta: 'Alta' };

export function followFromDirectory(patientId: string) {
  return { patientId, module: 'seguimiento' as const };
}
const FILTERS: Array<{ id: PatientDirectoryFilter; label: string }> = [
  { id: 'active', label: 'Activos' },
  { id: 'attention', label: 'Pendientes de revisión' },
  { id: 'archived', label: 'Archivados' },
];

function useDialogKeys(onClose: () => void, busy: boolean) {
  const latest = useRef({ onClose, busy }); latest.current = { onClose, busy };
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !latest.current.busy && canLeaveWorkspace()) { event.preventDefault(); latest.current.onClose(); }
      if (event.key !== 'Tab') return;
      const dialog = document.querySelector<HTMLElement>('.nv-dialog');
      const controls = [...(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]') ?? [])].filter((element) => element.getClientRects().length);
      if (!controls.length) return;
      const target = event.shiftKey ? controls[controls.length - 1] : controls[0];
      if ((event.shiftKey && document.activeElement === controls[0]) || (!event.shiftKey && document.activeElement === controls[controls.length - 1])) { event.preventDefault(); target.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); if (opener?.isConnected) opener.focus(); };
  }, []);
}

export function inviteLink(inviteId: string, origin = typeof window === 'undefined' ? '' : window.location.origin) {
  return `${origin}/app/inicio?invite=${encodeURIComponent(inviteId)}`;
}

export function inviteMessage(patientName: string, link: string) {
  const first = patientName.trim().split(/\s+/)[0] || '';
  return `Hola ${first}, te invito a Plan V para seguir tu plan conmigo. Creá tu cuenta con este enlace: ${link}`;
}

export function accessLabel(patient: Pick<Patient, 'billing_status' | 'billing_until'>) {
  if (patient.billing_status === 'waived') return 'Acceso sin cargo';
  if (patient.billing_status === 'active') return `Acceso hasta ${patient.billing_until?.split('-').reverse().join('/') ?? ''}`;
  if (patient.billing_status === 'past_due') return 'Acceso vencido';
  return 'Acceso pendiente';
}

export function InviteShare({ name, invite, onClose }: { name: string; invite: PatientInvite; onClose: () => void }) {
  const [current, setCurrent] = useState(invite);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const ready = invitationReady(current);
  const linked = current.status === 'accepted';
  const link = inviteLink(current.id);
  const [copied, setCopied] = useState(false);
  useEffect(() => { setCurrent(invite); setError(''); setCopied(false); }, [invite.id, invite.updated_at]);
  const prepare = async () => {
    if (lock.current) return; lock.current = true; setBusy(true); setError('');
    try { const saved = (await api.patientInvite(current.patient_id)).invite; setCurrent(saved); if (saved.status !== 'accepted' && !invitationReady(saved)) setError('El enlace todavía no está habilitado. Reintentá preparar la invitación.'); }
    catch { setError('La ficha está guardada, pero no pudimos preparar el enlace. Reintentá sin crear otra ficha.'); }
    finally { lock.current = false; setBusy(false); }
  };
  const copy = async () => {
    if (!invitationReady(current)) { setError('La invitación venció. Prepará un enlace vigente antes de compartirlo.'); return; }
    try { await navigator.clipboard.writeText(link); setCopied(true); } catch { setCopied(false); }
  };
  return <div className="nv-directory-notice nv-invite-share" role="status">
    <Icon name={ready || linked ? 'check' : 'clock'} size={15} />
    <span>
      <strong>{linked ? `Cuenta vinculada de ${name}` : ready ? `Invitación lista para ${name}` : `Ficha creada para ${name}; falta preparar su acceso`}</strong>
      {linked ? <small>Esta paciente ya aceptó la invitación. Se recuperó su ficha existente.</small> : ready ? <><small>Mandale este enlace: crea su cuenta con {current.email} y queda vinculada a tu consultorio. Vence el {new Date(current.expires_at!).toLocaleString('es-AR')}.</small><input readOnly value={link} aria-label="Enlace de invitación" onFocus={(event) => event.currentTarget.select()} /></> : <small>El enlace todavía no está habilitado. Podés reintentar sin repetir el alta.</small>}
      {error && <small role="alert">{error}</small>}
    </span>
    {!linked && <span className="nv-invite-actions">
      {ready ? <><NvButton className="nv-soft" onClick={copy}>{copied ? 'Copiado' : 'Copiar enlace'}</NvButton><a className="nv-button nv-ghost" href={`https://wa.me/?text=${encodeURIComponent(inviteMessage(name, link))}`} target="_blank" rel="noreferrer">WhatsApp</a></> : <NvButton className="nv-soft" disabled={busy} onClick={() => void prepare()}>{busy ? 'Preparando…' : 'Reintentar preparar invitación'}</NvButton>}
    </span>}
    <button type="button" disabled={busy} onClick={() => { if (canLeaveWorkspace()) onClose(); }} aria-label="Cerrar aviso">×</button>
  </div>;
}

export function ShowroomPatientCreate({ onClose, onCreated }: { onClose: () => void; onCreated: (patient: Patient, invite: PatientInvite) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [goal, setGoal] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const nameInput = useRef<HTMLInputElement>(null);
  const creationLock = useRef(false);
  useUnsavedChanges(Boolean(name.trim() || email.trim() || goal.trim()), busy);
  useDialogKeys(onClose, busy);
  useEffect(() => { nameInput.current?.focus(); }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (creationLock.current) return;
    creationLock.current = true;
    setBusy(true);
    setError('');
    try {
      const result = await createPatientWithInvitation({ name, email, goal }, { create: api.createPatient, activate: api.sendInvite });
      onCreated(result.patient, result.invite);
    } catch {
      creationLock.current = false;
      setError('No pudimos crear el alta. Revisá los datos o si el email ya está registrado.');
      setBusy(false);
    }
  };

  return <div className="nv-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !busy && canLeaveWorkspace() && onClose()}>
    <section className="nv-dialog" role="dialog" aria-modal="true" aria-labelledby="nv-create-title">
      <header className="nv-dialog-head">
        <div><p className="nv-eyebrow">Ingreso</p><h2 id="nv-create-title">Nuevo paciente</h2><p>Creá la ficha inicial. El acceso comienza pendiente hasta que definas la cobranza.</p></div>
        <button type="button" onClick={() => { if (canLeaveWorkspace()) onClose(); }} disabled={busy} aria-label="Cerrar">×</button>
      </header>
      <form className="nv-dialog-form" onSubmit={submit}>
        <label>Nombre completo<input ref={nameInput} value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80} autoComplete="name" /></label>
        <label>Email para la invitación<input value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={254} type="email" autoComplete="email" /></label>
        <label>Objetivo declarado<textarea value={goal} onChange={(e) => setGoal(e.target.value)} required minLength={2} maxLength={240} rows={3} /></label>
        <p className="nv-dialog-hint"><Icon name="message" size={14} />La invitación es de un uso y vence. En demo no sale un email real.</p>
        {error && <p className="nv-dialog-error" role="alert">{error}</p>}
        <footer className="nv-dialog-actions">
          <NvButton className="nv-ghost" onClick={() => { if (canLeaveWorkspace()) onClose(); }} disabled={busy}>Cancelar</NvButton>
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
  const [access, setAccess] = useState(patient.billing_status);
  const [accessUntil, setAccessUntil] = useState(patient.billing_until ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const nameInput = useRef<HTMLInputElement>(null);
  useUnsavedChanges(name !== patient.name || status !== patient.status || stage !== patient.stage || sensitiveHours !== patient.sensitive_hours || planB !== patient.plan_b || nextFocus !== patient.next_focus || access !== patient.billing_status || accessUntil !== (patient.billing_until ?? ''), busy);
  useDialogKeys(onClose, busy);
  useEffect(() => { nameInput.current?.focus(); }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      let { patient: updated } = await api.updatePatientProfile(patient.id, {
        name, status, stage, sensitive_hours: sensitiveHours, plan_b: planB, next_focus: nextFocus,
      });
      // Sólo si la profesional cambió el acceso; un vencido sin tocar queda como está.
      const accessChanged = access !== patient.billing_status || (access === 'active' && accessUntil !== (patient.billing_until ?? ''));
      if (accessChanged && access !== 'past_due') {
        if (access === 'active' && !accessUntil) throw new Error('Elegí hasta qué fecha tiene acceso.');
        ({ patient: updated } = await api.updateBilling(patient.id, access === 'active' ? { status: 'active', billing_until: accessUntil } : { status: access }));
      }
      onSaved(updated);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No pudimos actualizar la ficha.');
      setBusy(false);
    }
  };

  return <div className="nv-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !busy && canLeaveWorkspace() && onClose()}>
    <section className="nv-dialog" role="dialog" aria-modal="true" aria-labelledby="nv-edit-title">
      <header className="nv-dialog-head">
        <div><p className="nv-eyebrow">Directorio</p><h2 id="nv-edit-title">Editar ficha de {patient.name}</h2><p>Actualizá los datos operativos del acompañamiento.</p></div>
        <button type="button" onClick={() => { if (canLeaveWorkspace()) onClose(); }} disabled={busy} aria-label="Cerrar editor">×</button>
      </header>
      <form className="nv-dialog-form" onSubmit={submit}>
        <div className="nv-dialog-grid">
          <label>Nombre completo<input ref={nameInput} value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={80} required /></label>
          <label>Estado visible<input value={status} onChange={(e) => setStatus(e.target.value)} minLength={2} maxLength={40} required /></label>
          <label>Etapa<select value={stage} onChange={(e) => setStage(e.target.value as Stage)}>{(['ingreso', 'plan', 'seguimiento', 'alta'] as const).map((value) => <option key={value} value={value}>{STAGE_LABELS[value]}</option>)}</select></label>
          <label>Horario sensible<input value={sensitiveHours} onChange={(e) => setSensitiveHours(e.target.value)} maxLength={120} placeholder="Ej.: después de las 20:30" /></label>
        </div>
        <div className="nv-dialog-grid">
          <label>Acceso a la app<select value={access} onChange={(e) => setAccess(e.target.value as typeof access)}>
            {patient.billing_status === 'past_due' && <option value="past_due" disabled>Vencido</option>}
            <option value="pending">Pendiente</option>
            <option value="waived">Sin cargo</option>
            <option value="active">Pagado hasta una fecha</option>
          </select></label>
          {access === 'active' && <label>Pagado hasta<input type="date" value={accessUntil} onChange={(e) => setAccessUntil(e.target.value)} required /></label>}
        </div>
        <label>Plan B<textarea value={planB} onChange={(e) => setPlanB(e.target.value)} maxLength={240} rows={2} /></label>
        <label>Próximo foco<textarea value={nextFocus} onChange={(e) => setNextFocus(e.target.value)} maxLength={240} rows={2} /></label>
        {error && <p className="nv-dialog-error" role="alert">{error}</p>}
        <footer className="nv-dialog-actions">
          <NvButton className="nv-ghost" onClick={() => { if (canLeaveWorkspace()) onClose(); }} disabled={busy}>Cancelar</NvButton>
          <NvButton type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar cambios'}</NvButton>
        </footer>
      </form>
    </section>
  </div>;
}

export type DirectoryAction = 'create' | { share: { name: string; invite: PatientInvite } };

export function ShowroomPatients({ patients, query, initialFilter = 'active', initialAction, onActionConsumed, onChanged, onFollow, onRecord, onPlan }: {
  patients: Patient[];
  query: string;
  initialFilter?: PatientDirectoryFilter;
  initialAction?: DirectoryAction | null;
  onActionConsumed?: () => void;
  onChanged: (patient: Patient) => void;
  onFollow: (id: string) => void;
  onRecord?: (id: string) => void;
  onPlan?: (id: string) => void;
}) {
  const [filter, setFilter] = useState<PatientDirectoryFilter>(initialFilter);
  const [creating, setCreating] = useState(false);
  const [stageFilter, setStageFilter] = useState<Stage | ''>('');
  const [unlinkedOnly, setUnlinkedOnly] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [archiveConfirmation, setArchiveConfirmation] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [share, setShare] = useState<{ name: string; invite: PatientInvite } | null>(null);
  const [billing, setBilling] = useState<BillingBoard | null>(null);
  const [billingError, setBillingError] = useState('');
  useEffect(() => {
    let active = true;
    api.getBillingBoard().then(({ board }) => { if (active) setBilling(board); }).catch(() => { if (active) setBillingError('No pudimos consultar las deudas. Abrí Cobranzas para reintentar.'); });
    return () => { active = false; };
  }, []);
  const feeRows = billing ? buildBoardRows(billing) : [];
  const metrics = getPatientDirectoryMetrics(patients);
  const visible = filterDirectoryPatients(patients, query, filter).filter((person) => (!stageFilter || person.stage === stageFilter) && (!unlinkedOnly || person.has_account === false));

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
    setShare({ name: patient.name, invite });
  };

  const invite = async (patient: Patient) => {
    setBusyId(patient.id);
    setError('');
    try {
      const { invite: ready } = await api.patientInvite(patient.id);
      setShare({ name: patient.name, invite: ready });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No pudimos preparar la invitación.');
    } finally {
      setBusyId(null);
    }
  };

  useEffect(() => {
    if (!initialAction) return;
    if (initialAction === 'create') {
      setCreating(true);
      onActionConsumed?.();
      return;
    }
    setShare(initialAction.share);
    onActionConsumed?.();
  }, [initialAction]);

  return <section className="nv-directory-workspace" aria-label="Gestión de pacientes">
    <div className="pw-work-filters" aria-label="Filtros de gestión"><label>Etapa<select value={stageFilter} onChange={(event) => setStageFilter(event.target.value as Stage | '')}><option value="">Todas las etapas</option>{(Object.keys(STAGE_LABELS) as Stage[]).map((id) => <option key={id} value={id}>{STAGE_LABELS[id]}</option>)}</select></label><label><span>Invitación</span><select value={unlinkedOnly ? 'pending' : 'all'} onChange={(event) => setUnlinkedOnly(event.target.value === 'pending')}><option value="all">Todas las cuentas</option><option value="pending">Pendientes de vincular</option></select></label></div>
    {billingError && <p role="alert">{billingError}</p>}
    <div className="nv-directory-summary" aria-label="Resumen del directorio">
      <button type="button" className="nv-summary-active" aria-label="Filtrar pacientes activos" aria-pressed={filter==='active'} onClick={()=>setFilter('active')}><span><Icon name="users" size={18}/>Pacientes activos</span><strong>{metrics.active}</strong><small>En tu consultorio</small></button>
      <button type="button" className="nv-summary-pending" disabled={metrics.attention===null} aria-label="Filtrar pacientes pendientes de revisión" aria-pressed={filter==='attention'} onClick={()=>setFilter('attention')}><span><Icon name="camera" size={18}/>Pendientes de revisión</span><strong>{metrics.attention ?? '—'}</strong><small>Pacientes con registros por revisar</small></button>
      <div><span><Icon name="calendar" size={18}/>Con próxima consulta</span><strong>{metrics.appointments}</strong><small>Pacientes con turno vigente</small></div>
      <button type="button" className="nv-summary-archived" aria-label="Filtrar pacientes archivados" aria-pressed={filter==='archived'} onClick={()=>setFilter('archived')}><span><Icon name="history" size={18}/>Archivados</span><strong>{metrics.archived}</strong><small>Consultar o restaurar</small></button>
    </div>
    <NvCard className="nv-directory-panel" title="Directorio de pacientes" action={<NvButton className="nv-soft" onClick={() => setCreating(true)}><Icon name="plus" size={14} />Nuevo paciente</NvButton>}>
      <div className="nv-directory-toolbar"><nav className="nv-directory-filters" aria-label="Filtrar pacientes">
        {FILTERS.map((item) => {
          const count = item.id === 'active' ? metrics.active : item.id === 'attention' ? metrics.attention : metrics.archived;
          return <button type="button" key={item.id} disabled={item.id === 'attention' && metrics.attention === null} aria-pressed={filter === item.id} onClick={() => { setFilter(item.id); setArchiveConfirmation(null); }}>{item.label}<span>{count ?? "—"}</span></button>;
        })}
      </nav><span className="nv-directory-results" role="status">{visible.length} {visible.length===1 ? 'paciente' : 'pacientes'}</span></div>
      {metrics.attention === null && <p role="status">No pudimos cargar todos los resúmenes semanales. Recargá para consultar los pendientes.</p>}
      {share && <InviteShare name={share.name} invite={share.invite} onClose={() => setShare(null)} />}
      {error && <p className="nv-dialog-error" role="alert">{error}</p>}
      <div className="nv-directory-scroll"><div className="nv-patient-table nv-directory-table" role="table" aria-label="Pacientes del directorio">
        <div role="row" className="nv-table-head"><span role="columnheader">Paciente</span><span role="columnheader">Estado</span><span role="columnheader">Próximo foco</span><span role="columnheader">Registro semanal</span><span role="columnheader">Acciones</span></div>
        {visible.map((patient) => <div role="row" key={patient.id}>
          <span role="cell"><span className={`nv-avatar nv-directory-avatar person-${patient.tone}`}>{patient.initials}</span><span><strong>{patient.name}</strong><small>{patient.goal}</small></span></span>
          <span role="cell"><strong>{patient.status}</strong><small>{STAGE_LABELS[patient.stage]}</small>{!hasFullPatientAccess(patient) && <NvBadge tone="coral">{accessLabel(patient)}</NvBadge>}{patient.has_account === false && <NvBadge tone="gold">Sin cuenta</NvBadge>}{(() => { const fee = feeRows.find((row) => row.patient.patient_id === patient.id)?.summary; return fee && fee.owed > 0 ? <NvBadge tone="coral">Debe {formatPesos(fee.owed)}</NvBadge> : null; })()}</span>
          <span role="cell"><strong>{patient.next_focus || 'Sin foco cargado'}</strong><small>{patient.appointment?.when ?? 'Sin consulta'}</small></span>
          <span role="cell" className="nv-directory-weekly">{patient.weekly_registration ? <>
            <strong>{patient.weekly_registration.recorded_days} de 7 días</strong>
            <small>{patient.weekly_registration.meals_logged} comidas registradas</small>
            <small>{patient.weekly_registration.water_average===null?'Agua sin registrar':'Promedio: '+patient.weekly_registration.water_average.toLocaleString('es-AR')+' vasos/día registrado'}</small>
            {patient.weekly_registration.water_average!==null&&<small>{patient.weekly_registration.water_days} días con registro de agua</small>}
            {patient.weekly_registration.pending_review>0&&<span className="nv-weekly-pending"><Icon name="clock" size={12}/>{patient.weekly_registration.pending_review} por revisar</span>}
          </> : <small>Resumen no disponible</small>}</span>
          <span role="cell" className="nv-directory-actions">
            {!patient.archived_at && onRecord && <NvButton className="nv-soft" aria-label={`Abrir ficha de ${patient.name}`} onClick={() => onRecord(patient.id)}><Icon name="contact" size={14} />Ficha</NvButton>}
            {!patient.archived_at && onPlan && <NvButton className="nv-soft" aria-label={`Abrir plan de ${patient.name}`} onClick={() => onPlan(patient.id)}><Icon name="list" size={14} />Plan</NvButton>}
            {!patient.archived_at && <NvButton className="nv-soft" aria-label={`Ver seguimiento de ${patient.name}`} onClick={() => onFollow(patient.id)}><Icon name="trend" size={14}/>Seguimiento</NvButton>}
            {!patient.archived_at && patient.has_account === false && <NvButton className="nv-ghost" aria-label={`Invitar a ${patient.name}`} disabled={busyId === patient.id} onClick={() => invite(patient)}><Icon name="message" size={13} />Invitar</NvButton>}
            {!patient.archived_at && <NvButton className="nv-ghost" aria-label={`Editar ficha de ${patient.name}`} onClick={() => setEditing(patient)}><Icon name="edit" size={13} />Editar</NvButton>}
            <NvButton className={`nv-ghost${archiveConfirmation === patient.id ? ' nv-confirm' : ''}`} aria-label={patient.archived_at ? `Restaurar ${patient.name}` : archiveConfirmation === patient.id ? `Confirmar archivo de ${patient.name}` : `Archivar ${patient.name}`} disabled={busyId === patient.id} onClick={() => setArchived(patient, !patient.archived_at)}>
              {busyId === patient.id ? 'Guardando…' : patient.archived_at ? 'Restaurar' : archiveConfirmation === patient.id ? 'Confirmar archivo' : 'Archivar'}
            </NvButton>
          </span>
        </div>)}
      </div></div>
      {!visible.length && <NvState title="Sin coincidencias" description="Probá otra búsqueda o filtro." />}
    </NvCard>
    {creating && <ShowroomPatientCreate onClose={() => setCreating(false)} onCreated={created} />}
    {editing && <ShowroomPatientEdit patient={editing} onClose={() => setEditing(null)} onSaved={(updated) => { onChanged(updated); setEditing(null); }} />}
  </section>;
}
