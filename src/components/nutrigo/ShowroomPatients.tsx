import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { api, isAbortError, type InviteEmailDelivery, type PatientInvite } from '../../api/client';
import { useAppStore } from '../../store/useAppStore';
import { PatientImportDialog } from './PatientImportDialog';
import { patientImportApi } from '../../api/patient-import';
import { ApiError } from '../../api/error';
import { careErrorMessage } from '../../api/care';
import type { Patient, Stage } from '../../types';
import type { PatientDirectoryFilter } from '../crm/crm-patients';
import { Icon } from '../shared/Icon';
import { NvButton } from './primitives';
import { hasFullPatientAccess } from '../../billing';
import { createPatientWithInvitation, invitationReady } from './patient-invite-actions';
import './showroom-patients.css';
import { useUnsavedChanges, canLeaveWorkspace } from './unsaved-changes';
import type { BillingBoard } from '../../types/fees';
import { DEFAULT_WATER_GOAL, WATER_GOAL_OPTIONS } from '../../types/water';
import { PanelPacientes, usePreviews } from './PanelPacientes';
import { PanelV29Icon } from './PanelV29Icon';
import { FILTROS, ETIQUETA_SIN_VINCULAR, ORDENES, SIGUIENTE_ORDEN, contarFiltros, encabezadoPacientes, filtrarPacientes, type FiltroPacientes } from './pacientes-presentacion';
import { homeDay } from '../../lib/panel-home';
import { sortDirectoryPatients, type DirectoryOrder } from './directory-sort';

const STAGE_LABELS: Record<Stage, string> = { ingreso: 'Ingreso', plan: 'Plan', seguimiento: 'Seguimiento', alta: 'Alta' };

export function followFromDirectory(patientId: string) {
  return { patientId, module: 'seguimiento' as const };
}
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

export function inviteEmailNotice(delivery: InviteEmailDelivery, email: string) {
  if (delivery === 'demo') return 'En la demostración no se mandan mails reales.';
  if (delivery === 'magic_link') return `Ya tenía cuenta: le mandamos a ${email} un enlace para entrar y vincularse.`;
  return `Le mandamos la invitación a ${email}.`;
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
  const [mailed, setMailed] = useState('');
  useEffect(() => { setCurrent(invite); setError(''); setCopied(false); setMailed(''); }, [invite.id, invite.updated_at]);
  const email = async () => {
    if (lock.current) return; lock.current = true; setBusy(true); setError(''); setMailed('');
    try { setMailed(inviteEmailNotice((await api.emailInvite(current.id)).delivery, current.email)); }
    catch (caught) { setError(careErrorMessage(caught)); }
    finally { lock.current = false; setBusy(false); }
  };
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
      {mailed && <small>{mailed}</small>}
      {error && <small role="alert">{error}</small>}
    </span>
    {!linked && <span className="nv-invite-actions">
      {ready ? <><NvButton className="nv-soft" onClick={copy}>{copied ? 'Copiado' : 'Copiar enlace'}</NvButton><NvButton className="nv-ghost" disabled={busy} onClick={() => void email()}>{busy ? 'Mandando…' : 'Mandar por mail'}</NvButton></> : <NvButton className="nv-soft" disabled={busy} onClick={() => void prepare()}>{busy ? 'Preparando…' : 'Reintentar preparar invitación'}</NvButton>}
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
  const initialPhone = (patient as Patient & { phone?: string | null }).phone ?? '';
  const [phone, setPhone] = useState(initialPhone);
  const [status, setStatus] = useState(patient.status);
  const [stage, setStage] = useState<Stage>(patient.stage);
  const [sensitiveHours, setSensitiveHours] = useState(patient.sensitive_hours);
  const [planB, setPlanB] = useState(patient.plan_b);
  const [nextFocus, setNextFocus] = useState(patient.next_focus);
  const savedWaterGoal = patient.water_goal_glasses == null ? '' : String(patient.water_goal_glasses);
  const [waterGoal, setWaterGoal] = useState(savedWaterGoal);
  const [access, setAccess] = useState(patient.billing_status);
  const [accessUntil, setAccessUntil] = useState(patient.billing_until ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const nameInput = useRef<HTMLInputElement>(null);
  useUnsavedChanges(name !== patient.name || phone !== initialPhone || status !== patient.status || stage !== patient.stage || sensitiveHours !== patient.sensitive_hours || planB !== patient.plan_b || nextFocus !== patient.next_focus || waterGoal !== savedWaterGoal || access !== patient.billing_status || accessUntil !== (patient.billing_until ?? ''), busy);
  useDialogKeys(onClose, busy);
  useEffect(() => { nameInput.current?.focus(); }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      let { patient: updated } = await api.updatePatientProfile(patient.id, {
        name, phone: phone.trim() || null, status, stage, sensitive_hours: sensitiveHours, plan_b: planB, next_focus: nextFocus,
        // Solo si la cambió: así la ficha se guarda igual en una base sin la meta de agua.
        ...(waterGoal !== savedWaterGoal ? { water_goal_glasses: waterGoal ? Number(waterGoal) : null } : {}),
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
          <label>Teléfono<input type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={40} /></label>
          <label>Estado visible<input value={status} onChange={(e) => setStatus(e.target.value)} minLength={2} maxLength={40} required /></label>
          <label>Etapa<select value={stage} onChange={(e) => setStage(e.target.value as Stage)}>{(['ingreso', 'plan', 'seguimiento', 'alta'] as const).map((value) => <option key={value} value={value}>{STAGE_LABELS[value]}</option>)}</select></label>
          <label>Horario sensible<input value={sensitiveHours} onChange={(e) => setSensitiveHours(e.target.value)} maxLength={120} placeholder="Ej.: después de las 20:30" /></label>
          <label>Meta de agua<select value={waterGoal} onChange={(e) => setWaterGoal(e.target.value)}><option value="">{DEFAULT_WATER_GOAL} vasos por día (la de siempre)</option>{WATER_GOAL_OPTIONS.filter((value) => value !== DEFAULT_WATER_GOAL).map((value) => <option key={value} value={value}>{value} vasos por día</option>)}</select></label>
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
/** Lo que Pacientes le pasa al encabezado del panel: el sufijo del título, la línea de abajo y los botones. */
export type PacientesHeader = { sufijo: string; cuando: string; actions: ReactNode };

const FILTRO_INICIAL: Record<PatientDirectoryFilter, FiltroPacientes> = { all: 'todas', active: 'todas', attention: 'atencion', unlinked: 'sinvincular', archived: 'inactivas' };

export function ShowroomPatients({ patients, query, initialFilter = 'all', initialUnlinked = false, initialAction, onActionConsumed, onChanged, onFollow, onRecord, onPlan, onMessage, onOpenHref, onHeader }: {
  patients: Patient[];
  query: string;
  initialFilter?: PatientDirectoryFilter;
  initialUnlinked?: boolean;
  initialAction?: DirectoryAction | null;
  onActionConsumed?: () => void;
  onChanged: (patient: Patient) => void;
  onFollow: (id: string) => void;
  onRecord?: (id: string) => void;
  onPlan?: (id: string) => void;
  onMessage?: (id: string) => void;
  onOpenHref?: (href: string) => void;
  onHeader?: (header: PacientesHeader | null) => void;
}) {
  const [filter, setFilter] = useState<FiltroPacientes>(initialUnlinked ? 'sinvincular' : FILTRO_INICIAL[initialFilter]);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [order, setOrder] = useState<DirectoryOrder>('appointment');
  const [editing, setEditing] = useState<Patient | null>(null);
  const [archiveConfirmation, setArchiveConfirmation] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [share, setShare] = useState<{ name: string; invite: PatientInvite } | null>(null);
  const [billing, setBilling] = useState<BillingBoard | null>(null);
  const [billingError, setBillingError] = useState('');
  const now = new Date();
  const today = homeDay(now);
  const { previews, error: previewError, reintentar } = usePreviews(patients);
  useEffect(() => {
    let active = true;
    api.getBillingBoard().then(({ board }) => { if (active) setBilling(board); }).catch(() => { if (active) setBillingError('No pudimos consultar las deudas. Abrí Cobranzas para reintentar.'); });
    return () => { active = false; };
  }, []);
  const counts = contarFiltros(patients, previews, today);
  const visible = filtrarPacientes(patients, query, filter, previews, today, order, now);

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
      const { invite: ready } = await api.patientInvite(patient.id).catch(error=>{if(error instanceof ApiError&&error.status===409)return patientImportApi.invite(patient.id);throw error;});
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

  const heading = encabezadoPacientes(patients, now);
  const headingKey = `${heading.sufijo}|${heading.cuando}`;
  useEffect(() => {
    onHeader?.({ sufijo: heading.sufijo, cuando: heading.cuando, actions: <>
      <button className="chip" type="button" onClick={() => setImporting(true)}><PanelV29Icon name="up" />Importar</button>
      <button className="cta" type="button" onClick={() => setCreating(true)}><PanelV29Icon name="plus" />Nueva paciente</button></> });
  }, [headingKey]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => onHeader?.(null), []); // eslint-disable-line react-hooks/exhaustive-deps

  const open = (href: string) => (onOpenHref ?? ((to: string) => window.location.assign(to)))(href);
  const tabs = [...FILTROS, ...(counts.sinvincular || filter === 'sinvincular' ? [{ id: 'sinvincular' as const, label: ETIQUETA_SIN_VINCULAR }] : [])];

  return <div className="scr" id="s-pacientes" aria-label="Gestión de pacientes">
    {billingError && <p role="alert">{billingError}</p>}
    {previewError && <p role="alert">No pudimos cargar plan y peso. <button type="button" className="lnk" onClick={reintentar}>Reintentar</button></p>}
    {share && <InviteShare name={share.name} invite={share.invite} onClose={() => setShare(null)} />}
    {error && <p className="nv-dialog-error" role="alert">{error}</p>}
    {!onHeader && <div className="top"><div className="sp" /><button className="chip" type="button" onClick={() => setImporting(true)}>Importar</button><button className="cta" type="button" onClick={() => setCreating(true)}>Nueva paciente</button></div>}
    <div className="card pt">
      <div className="ch"><div className="tabs" id="pfil" role="group" aria-label="Filtrar pacientes">
        {tabs.map(tab => <button key={tab.id} type="button" className={filter === tab.id ? 'on' : undefined} aria-pressed={filter === tab.id} onClick={() => { setFilter(tab.id); setArchiveConfirmation(null); }}>{tab.label} · {counts[tab.id] ?? '—'}</button>)}</div>
        <span className="sp" /><span className="meta">Ordenar por</span>
        <button className="chip" type="button" style={{ padding: '5px 10px' }} aria-label={`Ordenar pacientes por ${ORDENES[order].toLowerCase()}`} onClick={() => setOrder(SIGUIENTE_ORDEN[order])}>{ORDENES[order]}</button></div>
      <div className="scroll">
        <PanelPacientes pacientes={visible} ahora={now} board={billing} billingError={Boolean(billingError)} previews={previews} onOpen={open}
          acciones={{ onFollow, onRecord, onPlan, onMessage, onAgenda: () => open('/crm/agenda'), onEdit: setEditing, onInvite: invite, onArchive: setArchived, archiveConfirmation, busyId }} />
        {!visible.length && <p className="meta" role="status" style={{ padding: '24px 18px' }}>{patients.length ? 'Sin coincidencias. Probá otra búsqueda o solapa.' : 'Sin coincidencias. Todavía no hay pacientes: creá la primera con «Nueva paciente».'}</p>}
      </div>
    </div>
    {creating && <ShowroomPatientCreate onClose={() => setCreating(false)} onCreated={created} />}
    {importing && <PatientImportDialog onClose={()=>setImporting(false)} onImported={()=>{void useAppStore.getState().refreshDirectory().catch(error=>{if(!isAbortError(error))setError('La importación se guardó, pero no pudimos actualizar el directorio. Recargá para verlo.');});}}/>}
    {editing && <ShowroomPatientEdit patient={editing} onClose={() => setEditing(null)} onSaved={(updated) => { onChanged(updated); setEditing(null); }} />}
  </div>;
}
