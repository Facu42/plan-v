import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../api/client';
import { careErrorMessage } from '../../api/care';
import { resourcesApi } from '../../api/resources';
import { useAppStore } from '../../store/useAppStore';
import type { Patient } from '../../types';
import type { EditorialResource } from '../../types/resources';
import { assignedReaders, assignablePatients, LIBRARY_RESOURCE_TYPES, libraryResourceDraft, libraryResourceType, type LibraryResourceType } from './biblioteca-model';
import { PanelV29Icon } from './PanelV29Icon';
import { canLeaveWorkspace, useUnsavedChanges } from './unsaved-changes';

type Dialog = 'new' | 'assign' | null;

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
  const [draft, setDraft] = useState({ slug: '', title: '', type: 'Guía' as LibraryResourceType, summary: '' });
  const savedResource = useRef<EditorialResource | null>(null);
  const lock = useRef(false);
  const messageIds = useRef(new Map<string, string>());
  const pendingNotices = useRef<{ resourceId: string; patientIds: string[] } | null>(null);
  const addPatient = useAppStore(state => state.addPatient);
  const selected = catalog.find(r => r.id === selectedId || r.slug === selectedId) ?? catalog[0] ?? null;
  const readers = assignedReaders(selected, patients);
  const newlyChosen = assignablePatients(selected, patients).filter(patient => chosen.includes(patient.id));
  useUnsavedChanges(dialog === 'new' ? Boolean(draft.title || draft.summary || draft.type !== 'Guía') : dialog === 'assign' && newlyChosen.length > 0, busy);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    resourcesApi.catalog(controller.signal).then(result => {
      if (!controller.signal.aborted) { setCatalog(result.resources); setLoading(false); }
    }).catch(e => { if (!controller.signal.aborted) { setError(careErrorMessage(e)); setLoading(false); } });
    return () => controller.abort();
  }, [revision]);

  const openNew = useCallback(() => { if (canLeaveWorkspace()) {
    savedResource.current = null;
    setDraft({ slug: `recurso-${crypto.randomUUID()}`, title: '', type: 'Guía', summary: '' });
    setDialog('new'); setFeedback('');
  } }, []);
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

  function openRecipients() {
    if (!selected || !canLeaveWorkspace()) return;
    setChosen(readers.map(row => row.patient.id)); setFeedback(''); setDialog('assign');
  }

  async function saveResource(event: FormEvent) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true; setBusy(true); setFeedback('');
    try {
      // Guardar deja el material disponible para asignar, sin un segundo flujo editorial.
      // Conservamos el id si falla publicar: reintentar no crea otra copia.
      const saved = savedResource.current ?? (await resourcesApi.save(libraryResourceDraft(draft.slug, draft.title, draft.type, draft.summary))).resource;
      savedResource.current = saved;
      const resource = (await resourcesApi.publish(saved.id)).resource;
      setCatalog(current => [resource, ...current.filter(item => item.id !== resource.id)]);
      setSelectedId(resource.id); setDialog(null); setChosen([]); setFeedback('Recurso guardado.');
    } catch (e) { setFeedback(careErrorMessage(e)); }
    finally { lock.current = false; setBusy(false); }
  }

  async function assign() {
    if (!selected || lock.current || !newlyChosen.length) return;
    lock.current = true; setBusy(true); setFeedback('');
    try {
      // Una solicitud por paciente: una asignación concurrente ya existente no debe
      // silenciar el push de las demás. El servidor avisa solo cuando assigned_count > 0.
      const results = await Promise.allSettled(newlyChosen.map(person => api.assignResource(selected.slug, [person.id])));
      const failed: string[] = [];
      let assigned = 0;
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          result.value.patients.forEach(addPatient); assigned += result.value.assigned_count;
        } else failed.push(newlyChosen[index].id);
      });
      setChosen(failed);
      if (!failed.length) setDialog(null);
      setFeedback(failed.length ? `${assigned} asignaciones creadas. No se pudieron asignar ${failed.length}; reintentá las pendientes.` : `${assigned} asignaciones creadas.`);
    } catch (e) { setFeedback(careErrorMessage(e)); }
    finally { lock.current = false; setBusy(false); }
  }

  async function notifyAssigned() {
    if (!selected || lock.current || !canLeaveWorkspace()) return;
    if (!readers.length) { setFeedback('Primero asignalo a alguien.'); return; }
    const pending = pendingNotices.current;
    const recipients = pending?.resourceId === selected.id ? readers.filter(row => pending.patientIds.includes(row.patient.id)) : readers;
    if (pending?.resourceId !== selected.id) messageIds.current.clear();
    lock.current = true; setBusy(true); setFeedback('');
    const failed: string[] = [];
    for (const { patient } of recipients) {
      let clientId = messageIds.current.get(patient.id);
      if (!clientId) { clientId = crypto.randomUUID(); messageIds.current.set(patient.id, clientId); }
      try {
        const result = await api.sendMessage(patient.id, `Tenés un recurso para revisar: «${selected.title}». Abrilo en /app/recursos#recurso=${selected.slug}`, 'vero', false, clientId);
        addPatient(result.patient);
      } catch { failed.push(patient.id); }
    }
    pendingNotices.current = failed.length ? { resourceId: selected.id, patientIds: failed } : null;
    if (!failed.length) messageIds.current.clear();
    setFeedback(failed.length ? `Se enviaron ${recipients.length - failed.length} avisos. No se pudieron enviar ${failed.length}; tocá «Avisar por la app» para reintentar los pendientes.` : `${recipients.length} avisos enviados por el chat de la app.`);
    lock.current = false; setBusy(false);
  }

  const panel = dialog && <LibraryDrawer title={dialog === 'new' ? 'Nuevo recurso' : `Asignar «${selected?.title}»`} onClose={close} busy={busy}>
    {dialog === 'new' ? <form onSubmit={saveResource}>
      <p className="sxsub">Guía, video o PDF del consultorio</p>
      <fieldset disabled={busy || Boolean(savedResource.current)} style={{ border: 0, padding: 0, margin: '0 0 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <label className="af"><span>Título</span><input className="ai" required minLength={2} maxLength={150} value={draft.title} onChange={event => setDraft(current => ({ ...current, title: event.target.value }))} /></label>
        <label className="af"><span id="library-resource-type-label">Tipo</span><select className="ai" aria-labelledby="library-resource-type-label" value={draft.type} onChange={event => setDraft(current => ({ ...current, type: event.target.value as LibraryResourceType }))}>{LIBRARY_RESOURCE_TYPES.map(type => <option key={type}>{type}</option>)}</select></label>
        <label className="af"><span>De qué se trata</span><textarea className="ai" required rows={1} minLength={2} maxLength={400} placeholder="Una línea" value={draft.summary} onChange={event => setDraft(current => ({ ...current, summary: event.target.value }))} /></label>
      </fieldset>
      {feedback && <p role="status">{feedback}</p>}
      <button type="submit" className="cta" disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button>
    </form> : <>
      <p className="sxsub">Se lo das a una o varias pacientes</p>
      {patients.map(person => {
        const assigned = readers.some(row => row.patient.id === person.id);
        return <label className="ach" key={person.id}><input type="checkbox" disabled={busy || assigned} checked={assigned || chosen.includes(person.id)} onChange={() => setChosen(current => current.includes(person.id) ? current.filter(id => id !== person.id) : [...current, person.id])} />{person.name}</label>;
      })}
      {feedback && <p role="status">{feedback}</p>}
      <button type="button" className="cta" disabled={busy || !newlyChosen.length} onClick={() => void assign()}>{busy ? 'Guardando…' : 'Asignar'}</button>
    </>}
  </LibraryDrawer>;

  return <div id="s-biblioteca" className="sxw">
    <div className="fx" data-mk="1" style={{ gridTemplateColumns: '1.25fr .85fr' }}>
      <div className="c"><section className="fxp g">
        <header><h3>Para compartir</h3><span className="m">{loading ? 'Cargando…' : `${catalog.length} recursos del consultorio`}</span><span className="sp" /><button type="button" className="chip" onClick={() => onOpen('/crm/biblioteca?biblioteca=recetas')}>Ver recetas</button></header>
        {error ? <p role="alert" className="sxsub">{error} <button type="button" className="chip" onClick={() => setRevision(n => n + 1)}>Reintentar</button></p> : loading ? <p className="sxsub" role="status">Cargando los recursos…</p> : <div className="sxlib">{catalog.length ? catalog.map(resource => <button type="button" disabled={busy} className={`sxcard${resource.id === selected?.id ? ' on' : ''}`} aria-pressed={resource.id === selected?.id} key={resource.id} onClick={() => { setSelectedId(resource.id); setFeedback(''); }}>
          <span className="sxk">{libraryResourceType(resource.category)}</span><b>{resource.title}</b><p>{resource.summary}</p>
          <span className="sxavs">{assignedReaders(resource, patients).length ? assignedReaders(resource, patients).map(({ patient }) => <span className="av" title={patient.name} key={patient.id}>{patient.initials}</span>) : <span className="sxsub">Sin asignar</span>}</span>
        </button>) : <p className="sxsub">Todavía no hay recursos. Creá el primero con «Nuevo recurso».</p>}</div>}
      </section></div>
      <div className="c"><section className="fxp g">
        <header><h3>Quién lo abrió</h3><span className="m">{readers.filter(r => r.assignment.read_at).length} de {readers.length}</span><span className="sp" /><button type="button" className="chip" disabled={!selected?.published || loading || busy || Boolean(error)} onClick={openRecipients}>Asignar</button><button type="button" className="chip" disabled={!selected?.published || loading || busy || Boolean(error)} onClick={() => void notifyAssigned()}>Avisar por la app</button></header>
        <div className="fxs">{selected && !loading && !error ? <>
          <p style={{ margin: 0, fontWeight: 500 }}>{selected.title}</p><p className="sxsub">{libraryResourceType(selected.category)} · {selected.summary}</p>
          <div className="fxr">{readers.length ? readers.map(({ patient, assignment }) => <div className="l" key={patient.id}><span className="av">{patient.initials}</span><span className="sxwho"><b>{patient.name}</b><small>{assignment.read_at ? 'Lo abrió' : 'Todavía no lo abrió'}</small></span><span className={`pill ${assignment.read_at ? 'p-conf' : 'p-wait'}`}>{assignment.read_at ? 'Abierto' : 'Pendiente'}</span></div>) : <p className="sxsub">Todavía no se lo diste a nadie.</p>}</div>
        </> : <p className="sxsub">{loading ? 'Cargando…' : 'Elegí o creá un recurso.'}</p>}
          <p className="sxsub">Las recetas están en esta Biblioteca.</p>
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
