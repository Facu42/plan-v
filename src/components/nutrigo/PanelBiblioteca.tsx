import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../api/client';
import { careErrorMessage } from '../../api/care';
import { resourcesApi } from '../../api/resources';
import { useAppStore } from '../../store/useAppStore';
import type { Patient } from '../../types';
import type { EditorialResource } from '../../types/resources';
import { assignedReaders, assignablePatients } from './biblioteca-model';
import { ProfessionalResourceEditor } from './ProfessionalResourceEditor';
import { PanelV29Icon } from './PanelV29Icon';
import { canLeaveWorkspace, useUnsavedChanges } from './unsaved-changes';

type Dialog = 'new' | 'content' | 'assign' | 'notify' | null;

/** sxBiblioteca del boceto v29; las recetas conservan su ruta y su catálogo. */
export function PanelBiblioteca({ patients, onOpen, onHeader }: {
  patients: Patient[]; onOpen: (href: string) => void; onHeader?: (actions: ReactNode) => void;
}) {
  const [catalog, setCatalog] = useState<EditorialResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [selectedId, setSelectedId] = useState(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.hash.slice(1)).get('recurso') ?? '';
  });
  const [dialog, setDialog] = useState<Dialog>(null);
  const [chosen, setChosen] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const lock = useRef(false);
  const messageIds = useRef(new Map<string, string>());
  const addPatient = useAppStore(state => state.addPatient);
  const selected = catalog.find(r => r.id === selectedId || r.slug === selectedId) ?? catalog[0] ?? null;
  const readers = assignedReaders(selected, patients);
  const available = dialog === 'notify' ? readers.map(row => row.patient) : assignablePatients(selected, patients);
  useUnsavedChanges(chosen.length > 0, busy);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    resourcesApi.catalog(controller.signal).then(result => {
      if (!controller.signal.aborted) { setCatalog(result.resources); setLoading(false); }
    }).catch(e => { if (!controller.signal.aborted) { setError(careErrorMessage(e)); setLoading(false); } });
    return () => controller.abort();
  }, [revision]);

  const openNew = useCallback(() => { if (canLeaveWorkspace()) { setDialog('new'); setFeedback(''); } }, []);
  useEffect(() => { onHeader?.(<button className="cta" type="button" onClick={openNew}>Nuevo recurso</button>); }, [onHeader, openNew]);
  useEffect(() => () => onHeader?.(null), [onHeader]);
  const close = useCallback(() => {
    if (lock.current || !canLeaveWorkspace()) return;
    setDialog(null); setChosen([]);
  }, []);
  useEffect(() => {
    if (!dialog) return;
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [dialog, close]);

  function openRecipients(kind: 'assign' | 'notify') {
    if (!selected || !canLeaveWorkspace()) return;
    setChosen([]); setFeedback(''); messageIds.current.clear(); setDialog(kind);
  }

  async function submit() {
    if (!selected || lock.current || !chosen.length) return;
    const recipients = available.filter(p => chosen.includes(p.id));
    if (!recipients.length) return;
    lock.current = true; setBusy(true); setFeedback('');
    try {
      if (dialog === 'assign') {
        const result = await api.assignResource(selected.slug, recipients.map(p => p.id));
        result.patients.forEach(addPatient);
        setFeedback(`${result.assigned_count} asignaciones creadas. ${result.existing_count} ya existían.`);
        setChosen([]); setDialog(null);
      } else if (dialog === 'notify') {
        const failed: string[] = [];
        for (const person of recipients) {
          let clientId = messageIds.current.get(person.id);
          if (!clientId) { clientId = crypto.randomUUID(); messageIds.current.set(person.id, clientId); }
          try {
            const result = await api.sendMessage(person.id, `Tenés un recurso para revisar en tu Biblioteca: «${selected.title}».`, 'vero', false, clientId);
            addPatient(result.patient);
          } catch { failed.push(person.id); }
        }
        setChosen(failed);
        setFeedback(failed.length ? `Se enviaron ${recipients.length - failed.length} avisos. No se pudieron enviar ${failed.length}; podés reintentar los pendientes.` : `${recipients.length} avisos enviados por el chat de la app.`);
        if (!failed.length) setDialog(null);
      }
    } catch (e) { setFeedback(careErrorMessage(e)); }
    finally { lock.current = false; setBusy(false); }
  }

  const panel = dialog && <LibraryDrawer title={dialog === 'new' ? 'Nuevo recurso' : dialog === 'content' ? selected?.title ?? 'Recurso' : dialog === 'assign' ? 'Asignar recurso' : 'Avisar por la app'} onClose={close} busy={busy}>
    {dialog === 'new' || dialog === 'content' ? <>
      <p className="sxsub">Guías de texto. Adjuntar videos o PDF: próximamente.</p>
      <ProfessionalResourceEditor key={dialog === 'new' ? 'new' : selected?.id} initialResource={dialog === 'new' ? 'new' : selected ?? undefined} compact onCatalog={setCatalog} />
    </> : <>
      <p>{selected?.title}</p>
      <p className="sxsub">{dialog === 'assign' ? 'Elegí una o varias pacientes. Las asignaciones existentes se conservan.' : 'Se envía un mensaje a las pacientes que elijas. Solo aparecen quienes tienen este recurso asignado.'}</p>
      {available.length ? available.map(person => <label className="ach" key={person.id}><input type="checkbox" disabled={busy} checked={chosen.includes(person.id)} onChange={() => setChosen(current => current.includes(person.id) ? current.filter(id => id !== person.id) : [...current, person.id])} />{person.name}</label>) : <p className="sxsub">{dialog === 'assign' ? selected?.published ? 'Todas las pacientes ya tienen este recurso.' : 'Publicá el recurso antes de asignarlo.' : 'Primero asignalo a alguien.'}</p>}
      {feedback && <p role="status">{feedback}</p>}
      <button type="button" className="cta" disabled={busy || !chosen.length} onClick={() => void submit()}>{busy ? 'Guardando…' : dialog === 'assign' ? 'Asignar' : 'Enviar aviso'}</button>
    </>}
  </LibraryDrawer>;

  return <div id="s-biblioteca" className="sxw">
    <div className="fx" data-mk="1" style={{ gridTemplateColumns: '1.25fr .85fr' }}>
      <div className="c"><section className="fxp g">
        <header><h3>Para compartir</h3><span className="m">{loading ? 'Cargando…' : `${catalog.length} recursos del consultorio`}</span><span className="sp" /><button type="button" className="chip" onClick={() => onOpen('/crm/biblioteca?biblioteca=recetas')}>Ver recetas</button></header>
        {error ? <p role="alert" className="sxsub">{error} <button type="button" className="chip" onClick={() => setRevision(n => n + 1)}>Reintentar</button></p> : loading ? <p className="sxsub" role="status">Cargando los recursos…</p> : <div className="sxlib">{catalog.length ? catalog.map(resource => <button type="button" className={`sxcard${resource.id === selected?.id ? ' on' : ''}`} aria-pressed={resource.id === selected?.id} key={resource.id} onClick={() => setSelectedId(resource.id)}>
          <span className="sxk">{resource.category} · {resource.published ? 'Publicado' : 'Borrador privado'}</span><b>{resource.title}</b><p>{resource.summary}</p>
          <span className="sxavs">{assignedReaders(resource, patients).length ? assignedReaders(resource, patients).map(({ patient }) => <span className="av" title={patient.name} key={patient.id}>{patient.initials}</span>) : <span className="sxsub">Sin asignar</span>}</span>
        </button>) : <p className="sxsub">Todavía no hay recursos. Creá el primero con «Nuevo recurso».</p>}</div>}
      </section></div>
      <div className="c"><section className="fxp g">
        <header><h3>Quién lo abrió</h3><span className="m">{readers.filter(r => r.assignment.read_at).length} de {readers.length}</span><span className="sp" /><button type="button" className="chip" disabled={!selected?.published || loading || Boolean(error)} onClick={() => openRecipients('assign')}>Asignar</button><button type="button" className="chip" disabled={!selected?.published || !readers.length || loading || Boolean(error)} onClick={() => openRecipients('notify')}>Avisar por la app</button></header>
        <div className="fxs">{selected && !loading && !error ? <>
          <p style={{ margin: 0, fontWeight: 500 }}>{selected.title}</p><p className="sxsub">{selected.category} · {selected.summary}</p>
          <div className="fxr">{readers.length ? readers.map(({ patient, assignment }) => <div className="l" key={patient.id}><span className="av">{patient.initials}</span><span className="sxwho"><b>{patient.name}</b><small>{assignment.read_at ? 'Lo abrió' : 'Todavía no lo abrió'}</small></span><span className={`pill ${assignment.read_at ? 'p-conf' : 'p-wait'}`}>{assignment.read_at ? 'Abierto' : 'Pendiente'}</span></div>) : <p className="sxsub">Todavía no se lo diste a nadie.</p>}</div>
          <button type="button" className="chip" onClick={() => { if (canLeaveWorkspace()) setDialog('content'); }}>Ver contenido</button>
        </> : <p className="sxsub">{loading ? 'Cargando…' : 'Elegí o creá un recurso.'}</p>}
          <p className="sxsub">Las recetas no están acá. Siguen en Planes.</p>
          {feedback && !dialog && <p role="status" className="sxsub">{feedback}</p>}
        </div>
      </section></div>
    </div>{panel}
  </div>;
}

function LibraryDrawer({ title, onClose, busy, children }: { title: string; onClose: () => void; busy: boolean; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    return () => previous?.focus();
  }, []);
  const node = <div id="actw" className="on"><div className="ascrim" onClick={onClose} /><aside ref={ref} tabIndex={-1} id="act" role="dialog" aria-modal="true" aria-labelledby="actt" onKeyDown={event => {
    if (event.key !== 'Tab') return;
    const targets = Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), summary, [tabindex="0"]') ?? []).filter(el => el.getClientRects().length);
    const first = targets[0], last = targets[targets.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }}><header><div><h2 id="actt">{title}</h2></div><button type="button" className="ibtn" aria-label="Cerrar" disabled={busy} onClick={onClose}><PanelV29Icon name="x" size={13} /></button></header><div className="abody" id="actb">{children}</div></aside></div>;
  const host = typeof document === 'undefined' ? null : document.querySelector('#pv-panel-v29 .app');
  return host ? createPortal(node, host) : node;
}
