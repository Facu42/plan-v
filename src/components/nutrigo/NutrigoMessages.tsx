import { useUnsavedChanges } from './unsaved-changes';
// Mensajes — frame 84:2565 (desktop) y 433:19982 (mobile) del archivo Nutrigo.
// Tres columnas: "Section Messages" 198:5969 (búsqueda, filtro, lista y "New
// Message"), "Center Section" 198:5995 (chat en Cream-BG) y el perfil 207:6722
// (275 de ancho). Todo con datos reales: conversaciones, adjuntos y enlaces que
// de verdad se enviaron. Estilos en messages-fig.css.
import { type FormEvent, type KeyboardEvent, type ReactNode, type RefObject, useEffect, useRef, useState } from 'react';
import {
  ArrowClockwise, CalendarDots, Check, Checks, CopySimple, FadersHorizontal, FileText, Globe, ImageSquare, Info,
  LinkSimple, MagnifyingGlass, NotePencil, PaperPlaneRight, Paperclip, Plus, SidebarSimple, Star, VideoCamera, X,
} from '@phosphor-icons/react';
import { api } from '../../api/client';
import { useAppStore } from '../../store/useAppStore';
import type { ShowroomPage } from './ShowroomPanels';
import type { ShowroomPatient } from './showroom-model';
import { sendShowroomMessage } from './message-send';
import { messageReceipt, messageReceiptLabel, unreadCount } from './message-receipts';
import { MESSAGES_READ_EVENT, mergeUnread } from './cartera-unread';
import { CHAT_ATTACHMENT_ACCEPT, assertChatFile, uploadChatAttachment } from '../../api/assets';
import { ChatAttachmentView } from './ChatAttachment';
import {FigmaRecordDialog} from './FigmaPatientFront';
import { NvState } from './primitives';
import { secureMeetUrl } from './ShowroomConsultations';
import {
  dayDividerLabel, extractLinks, lastSeenAt, lastSeenLabel, listStamp, messageTime, sameDay, sharedFiles,
} from './message-panel';
import './messages.css';
import './messages-fig.css';
import {useMessageTools,type MessageToolsState} from './use-message-tools';
import {appendSavedReply,MessageReplyTools} from './MessageReplyTools';
import './panel-accompaniment.css';

type Role = 'patient' | 'pro';
type Props = { embedded?: boolean; initialUnreadOnly?: boolean; initialStarredOnly?:boolean; showSavedReplies?:boolean; patient: ShowroomPatient; patients: ShowroomPatient[]; role: Role; remoteUnread?: ReadonlyMap<string, number> | null; onSelect: (id: string) => void; onNavigate: (page: ShowroomPage) => void };
type ReplyInsertion={patientId:string;body:string;nonce:string};
const ACTIVE_REFRESH_MS = 15000;

const NUTRITIONIST = { name: 'Tu nutricionista', initials: 'N', role: 'Nutricionista' };
const normalized = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const sentMessages = (patient: ShowroomPatient) => patient.messages.filter((m) => Boolean(m.sent_at)).slice().sort((a, b) => Date.parse(a.sent_at) - Date.parse(b.sent_at));
const latestAt = (patient: ShowroomPatient) => {
  const thread = sentMessages(patient);
  return thread.length ? Date.parse(thread[thread.length - 1].sent_at) : -Infinity;
};
const contactOf = (patient: ShowroomPatient, role: Role) => role === 'pro'
  ? { name: patient.name, initials: patient.initials, role: 'Paciente' }
  : NUTRITIONIST;
const narrow = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 760px)').matches;

export function NutrigoMessages({ embedded = false, initialUnreadOnly = false,initialStarredOnly=false,showSavedReplies=false, patient, patients, role, remoteUnread = null, onSelect, onNavigate }: Props) {
  const [query, setQuery] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(initialUnreadOnly);
  const [profileOpen, setProfileOpen] = useState(()=>role==='pro'?showSavedReplies||!narrow():true);
  const [starredOnly,setStarredOnly]=useState(initialStarredOnly),[insertion,setInsertion]=useState<ReplyInsertion|null>(null);
  const tools=useMessageTools(role==='pro');
  useEffect(()=>{setUnreadOnly(initialUnreadOnly);setStarredOnly(initialStarredOnly);if(showSavedReplies)setProfileOpen(true);},[initialUnreadOnly,initialStarredOnly,showSavedReplies]);
  const useReply=(body:string)=>{setInsertion({patientId:patient.id,body,nonce:crypto.randomUUID()});if(role==='pro'&&narrow())setProfileOpen(false);};
  const toggleStar=()=>{if(!tools.data||tools.busy)return;const ids=tools.data.starred_patient_ids,next=ids.includes(patient.id)?ids.filter(id=>id!==patient.id):[...ids,patient.id];void tools.save({expected_revision:tools.data.revision,replies:tools.data.replies,starred_patient_ids:next}).catch(()=>{});};
  const searchRef = useRef<HTMLInputElement>(null);
  const composeRef = useRef<HTMLTextAreaElement>(null);
  const q = normalized(query.trim());
  const people = role === 'pro' ? [...patients].sort((a, b) => latestAt(b) - latestAt(a) || a.name.localeCompare(b.name, 'es')) : [patient];
  const contacts = people.filter((p) => {
    const thread = sentMessages(p);
    if(starredOnly&&!tools.data?.starred_patient_ids.includes(p.id))return false;
    if (unreadOnly && mergeUnread(unreadCount(thread, role), remoteUnread, p.id) === 0) return false;
    if (!q) return true;
    return normalized(contactOf(p, role).name).includes(q) || thread.some((m) => normalized(`${m.text} ${m.attachment?.filename ?? ''}`).includes(q));
  });
  const select = (id: string) => {
    setInsertion(null);
    onSelect(id);
    if (narrow()) requestAnimationFrame(() => document.getElementById('nm-chat')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  const newMessage = () => {
    if (role === 'pro') { setQuery(''); setUnreadOnly(false);setStarredOnly(false); searchRef.current?.focus(); return; }
    composeRef.current?.focus();
  };
  return <section className={`nm-layout nm-${role}${embedded?' pn-record-chat':''}${profileOpen ? '' : ' nmf-profile-closed'}`} aria-label="Mensajería">
    {!embedded&&<aside className="nm-contacts" aria-label="Conversaciones">
      <div className="nmf-list-head">
        <label className="nmf-search">
          <MagnifyingGlass size={18} aria-hidden />
          <input ref={searchRef} type="search" aria-label="Buscar conversaciones" placeholder="Buscar nombre, mensaje…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <button type="button" className="nmf-icon-btn nmf-filter" aria-pressed={unreadOnly} aria-label="Mostrar solo conversaciones sin leer" title="Solo sin leer" onClick={() => setUnreadOnly((value) => !value)}><FadersHorizontal size={22} aria-hidden /></button>
        <button type="button" className="nmf-icon-btn nmf-new-icon" aria-label="Nuevo mensaje" onClick={newMessage}><Plus size={20} aria-hidden /></button>
      </div>
      {role==='pro'&&<div className="pn-message-filters" aria-label="Filtros de conversaciones"><button type="button" aria-pressed={!unreadOnly&&!starredOnly} onClick={()=>{setUnreadOnly(false);setStarredOnly(false);}}>Todas</button><button type="button" aria-pressed={unreadOnly} onClick={()=>{setUnreadOnly(true);setStarredOnly(false);}}>Sin leer</button><button type="button" aria-pressed={starredOnly} disabled={!tools.data} onClick={()=>{setStarredOnly(true);setUnreadOnly(false);}}>Destacadas</button></div>}
      <div className="nm-contact-list">{contacts.map((p) => {
        const thread = sentMessages(p);
        const latest = thread[thread.length - 1];
        const unread = mergeUnread(unreadCount(thread, role), remoteUnread, p.id);
        const contact = contactOf(p, role);
        const preview = latest ? (latest.text || latest.attachment?.filename || 'Adjunto') : 'Iniciar conversación';
        return <button type="button" key={p.id} aria-pressed={p.id === patient.id} aria-label={unread > 0 ? `${contact.name}, ${unread} sin leer` : undefined} onClick={() => select(p.id)}>
          <span className="nv-avatar" aria-hidden>{contact.initials}</span>
          <span className="nmf-item-main">
            <span className="nmf-item-head">
              <span className="nmf-item-user"><strong>{contact.name}</strong>{role==='pro'&&tools.data?.starred_patient_ids.includes(p.id)&&<Star size={12} weight="fill" aria-label="Destacada"/>}<span aria-hidden>-</span><em>{contact.role}</em></span>
              {latest && <time dateTime={latest.sent_at}>{listStamp(latest.sent_at)}</time>}
            </span>
            <span className="nmf-item-body"><small>{preview}</small>{unread > 0 && <span className="nmf-badge" aria-hidden>{unread}</span>}</span>
          </span>
        </button>;
      })}</div>
      {!contacts.length && <p className="nmf-empty">{unreadOnly && !q ? 'No hay conversaciones sin leer.' : 'No hay coincidencias.'}</p>}
      <div className="nm-contacts-footer"><button type="button" className="nmf-new-btn" onClick={newMessage}>Nuevo mensaje</button></div>
    </aside>}
    <MessageConversation key={`${role}:${patient.id}`} patient={patient} role={role} composeRef={composeRef} profileOpen={profileOpen} onToggleProfile={() => setProfileOpen((open) => !open)} onNavigate={onNavigate} tools={tools} onToggleStar={toggleStar} insertion={insertion} onInserted={()=>setInsertion(null)}/>
    {profileOpen && (role==='pro'&&narrow()?<FigmaRecordDialog title="Perfil de la conversación" closeLabel="Cerrar perfil" onClose={()=>setProfileOpen(false)}><ConversationProfile patient={patient} role={role} onNavigate={onNavigate} tools={tools} onUseReply={useReply}/></FigmaRecordDialog>:<ConversationProfile patient={patient} role={role} onNavigate={onNavigate} tools={tools} onUseReply={useReply}/>)}
  </section>;
}

function MessageConversation({ patient, role, composeRef, profileOpen, onToggleProfile, onNavigate,tools,onToggleStar,insertion,onInserted }: Pick<Props, 'patient' | 'role' | 'onNavigate'> & {
  composeRef: RefObject<HTMLTextAreaElement | null>; profileOpen: boolean; onToggleProfile: () => void;
  tools:MessageToolsState;onToggleStar:()=>void;insertion:ReplyInsertion|null;onInserted:()=>void;
}) {
  const refresh = useAppStore((s) => s.refreshPatient);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const inserted=useRef<string|null>(null);
  useEffect(()=>{if(!insertion||insertion.patientId!==patient.id||inserted.current===insertion.nonce)return;inserted.current=insertion.nonce;try{if(busy)throw new Error('Esperá a que termine el envío antes de insertar una respuesta.');setText(appendSavedReply(text,insertion.body));setStatus('Respuesta insertada. Revisala antes de enviarla.');setError('');requestAnimationFrame(()=>composeRef.current?.focus());}catch(error){setError(error instanceof Error?error.message:'No pudimos insertar la respuesta.');}onInserted();},[insertion,patient.id,busy,text,onInserted,composeRef]);
  const fileRef = useRef<HTMLInputElement>(null);
  const clientId = useRef(crypto.randomUUID());
  const list = useRef<HTMLDivElement>(null);
  const messages = sentMessages(patient);
  const unreadIncoming = unreadCount(messages, role);
  const contact = contactOf(patient, role);
  const ownFrom = role === 'pro' ? 'vero' : 'patient';
  const reader = ownFrom;
  const canSend = Boolean(text.trim() || file);
  useUnsavedChanges(canSend, busy);
  const seen = lastSeenAt(messages, ownFrom);
  const meetUrl = patient.appointment?.channel === 'video' ? secureMeetUrl(patient.appointment.meet_url) : null;
  useEffect(() => { if (list.current) list.current.scrollTop = list.current.scrollHeight; }, [messages.length]);
  useEffect(() => {
    if (!unreadIncoming) return;
    void api.markMessagesRead(patient.id, reader).then(() => { window.dispatchEvent(new Event(MESSAGES_READ_EVENT)); return refresh(patient.id); }).catch(() => undefined);
  }, [patient.id, reader, refresh, unreadIncoming]);
  useEffect(() => {
    // La conversación abierta trae mensajes nuevos sin recargar la página.
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void refresh(patient.id).catch(() => undefined); }, ACTIVE_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [patient.id, refresh]);
  const pickFile = (next: File | null) => {
    if (!next) { setFile(null); if (fileRef.current) fileRef.current.value = ''; return; }
    try { assertChatFile(next); setFile(next); setError(''); }
    catch (caught) { setFile(null); setError(caught instanceof Error ? caught.message : 'El archivo no se puede adjuntar.'); if (fileRef.current) fileRef.current.value = ''; }
  };
  const send = async (event?: FormEvent) => {
    event?.preventDefault();
    if (inFlight.current || !canSend) return;
    inFlight.current = true; setBusy(true); setError(''); setStatus('');
    try {
      const uploaded = file ? await uploadChatAttachment(patient.id, file, role === 'pro') : null;
      const result = await sendShowroomMessage({
        patientId: patient.id,
        text,
        role,
        client_id: clientId.current,
        asset_id: uploaded?.asset_id,
        filename: uploaded?.filename,
      }, { send: api.sendMessage, refresh });
      clientId.current = crypto.randomUUID();
      setText('');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      setStatus(result === 'sent' ? 'Mensaje enviado.' : 'Mensaje enviado. No pudimos actualizar la conversación; usá Actualizar, no lo reenvíes.');
    } catch { setError('No pudimos enviar el mensaje. Tu texto y el adjunto se conservan para reintentar.'); }
    finally { inFlight.current = false; setBusy(false); }
  };
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(); }
  };
  const reload = async () => {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError('');
    try { await refresh(patient.id); setStatus('Conversación actualizada.'); }
    catch { setError('No pudimos actualizar. Probá nuevamente.'); }
    finally { inFlight.current = false; setBusy(false); }
  };
  return <section id="nm-chat" className="nm-conversation" aria-label={`Conversación con ${contact.name}`}>
    <div className="nmf-chat-head">
      <header>
        <span className="nv-avatar" aria-hidden>{contact.initials}</span>
        <div><h2>{contact.name}</h2><small>{seen ? lastSeenLabel(seen) : role === 'pro' ? 'Paciente' : 'Tu nutricionista'}</small></div>
        <div className="nmf-chat-actions">
          {role==='pro'&&<button type="button" className="nmf-picker" aria-label={tools.data?.starred_patient_ids.includes(patient.id)?'Quitar conversación de destacadas':'Destacar conversación'} aria-pressed={Boolean(tools.data?.starred_patient_ids.includes(patient.id))} disabled={!tools.data||tools.busy} onClick={onToggleStar}><Star size={20} weight={tools.data?.starred_patient_ids.includes(patient.id)?'fill':'regular'} aria-hidden/></button>}
          {role === 'pro'
            ? <button type="button" className="nmf-picker" onClick={() => onNavigate('consultas')} aria-label="Ver consultas" title="Ver consultas"><CalendarDots size={20} aria-hidden /></button>
            : <button type="button" className="nmf-picker" onClick={() => onNavigate('agenda')} aria-label="Ver mi agenda" title="Ver mi agenda"><CalendarDots size={20} aria-hidden /></button>}
          {meetUrl && <a className="nmf-picker" href={meetUrl} target="_blank" rel="noopener noreferrer" aria-label="Abrir la videollamada de la consulta" title="Videollamada de la consulta"><VideoCamera size={20} aria-hidden /></a>}
          <button type="button" className="nmf-picker nm-picker-btn" onClick={reload} disabled={busy} aria-label="Actualizar conversación" title="Actualizar"><ArrowClockwise size={20} aria-hidden /></button>
          <button type="button" className="nmf-picker nmf-picker-on" onClick={onToggleProfile} aria-pressed={profileOpen} aria-label={profileOpen ? 'Ocultar perfil' : 'Mostrar perfil'} title="Perfil"><SidebarSimple size={20} aria-hidden /></button>
        </div>
      </header>
    </div>
    <div className="nm-thread" ref={list} role="log" aria-live="polite" aria-relevant="additions" aria-label="Mensajes enviados">
      {!messages.length && <NvState title="Empezá la conversación" description="Escribí tu primer mensaje para iniciar el seguimiento." />}
      {messages.map((m, index) => {
        const own = m.from === ownFrom;
        const receipt = messageReceipt(m);
        const sender = m.from === 'vero' ? 'Tu nutricionista' : patient.name;
        const divider = index === 0 || !sameDay(messages[index - 1].sent_at, m.sent_at);
        return <div key={m.id} className="nmf-row-wrap">
          {divider && <p className="nmf-day"><span>{dayDividerLabel(m.sent_at)}</span></p>}
          <article className={`nmf-msg${own ? ' nm-own' : ''}`} aria-label={`Mensaje de ${sender}`}>
            {m.attachment && <ChatAttachmentView patientId={patient.id} messageId={m.id} attachment={m.attachment} />}
            {m.text ? <div className={`nm-bubble${own ? ' nm-own' : ''}`}><p>{m.text}</p></div> : null}
            <footer className="nmf-meta">
              <time dateTime={m.sent_at} title={new Date(m.sent_at).toLocaleString('es-AR')}>{messageTime(m.sent_at)}</time>
              {own && <span className={`nmf-receipt nmf-receipt-${receipt}`}>{receipt === 'sent' ? <Check size={16} aria-hidden /> : <Checks size={16} aria-hidden />}<span className="nmf-sr">{messageReceiptLabel(receipt)}</span></span>}
            </footer>
          </article>
        </div>;
      })}
    </div>
    {role==='pro'&&<div className="pn-message-suggestion"><div><b>Respuesta sugerida</b><p>{tools.data?.replies[0]?.body??'Gracias por escribirme. Voy a revisar tu consulta y te respondo por acá.'}</p><small>{tools.data?.replies[0]?`Respuesta guardada: ${tools.data.replies[0].title}`:'Sugerencia local para revisar · sin IA'}</small></div><button type="button" disabled={busy} onClick={()=>{try{setText(appendSavedReply(text,tools.data?.replies[0]?.body??'Gracias por escribirme. Voy a revisar tu consulta y te respondo por acá.'));setStatus('Respuesta insertada. Revisala antes de enviarla.');setError('');composeRef.current?.focus();}catch(error){setError(error instanceof Error?error.message:'No pudimos insertar la respuesta.');}}}>Usar</button></div>}
    <form className="nm-compose" onSubmit={send}>
      <label htmlFor="nm-message" className="nmf-sr">Mensaje para {contact.name}</label>
      {file && <div className="nmf-file-chip"><Paperclip size={14} aria-hidden /><span>{file.name}</span><button type="button" onClick={() => pickFile(null)} disabled={busy} aria-label={`Quitar ${file.name}`}><X size={14} aria-hidden /></button></div>}
      <div className="nm-compose-row">
        <input ref={fileRef} id="nm-attach" className="nmf-sr" tabIndex={-1} aria-label="Adjuntar archivo" type="file" accept={CHAT_ATTACHMENT_ACCEPT} disabled={busy} onChange={(e) => pickFile(e.target.files?.[0] ?? null)} aria-describedby="nm-attach-hint" />
        <button type="button" className="nmf-attach-btn" onClick={() => fileRef.current?.click()} disabled={busy} aria-label="Adjuntar archivo" aria-describedby="nm-attach-hint" title="Adjuntar archivo"><Paperclip size={18} aria-hidden /></button>
        <span id="nm-attach-hint" className="nmf-sr">JPG, PNG, WebP o PDF de hasta 10 MB.</span>
        <textarea ref={composeRef} id="nm-message" rows={1} maxLength={2000} placeholder="Escribí un mensaje…" value={text} disabled={busy} onChange={(e) => setText(e.target.value)} onKeyDown={onKeyDown} aria-describedby={error ? 'nm-error' : 'nm-status'} />
        <button type="submit" className="nmf-send" disabled={busy || !canSend}>{busy ? 'Enviando…' : 'Enviar'}<PaperPlaneRight size={16} aria-hidden /></button>
      </div>
      <p id="nm-status" role="status" className={status ? 'nmf-note' : 'nmf-sr'}>{status}</p>
      {error && <p id="nm-error" role="alert" className="nmf-note">{error}</p>}
    </form>
  </section>;
}

function FeatureTitle({ icon, title, action }: { icon: ReactNode; title: string; action?: ReactNode }) {
  return <div className="nmf-feature-title">{icon}<h4>{title}</h4>{action}</div>;
}

function ShowAll({ count, limit, open, onToggle, label }: { count: number; limit: number; open: boolean; onToggle: () => void; label: string }) {
  if (count <= limit) return null;
  return <button type="button" className="nmf-show-all" aria-expanded={open} aria-label={`${open ? 'Ver menos' : 'Ver todo'}: ${label}`} onClick={onToggle}>{open ? 'Ver menos' : 'Ver todo'}</button>;
}

function ConversationProfile({ patient, role, onNavigate,tools,onUseReply }: Pick<Props, 'patient' | 'role' | 'onNavigate'>&{tools:MessageToolsState;onUseReply:(body:string)=>void}) {
  const raw = useAppStore((s) => (role === 'pro' ? s.patients.find((p) => p.id === patient.id) : undefined));
  const contact = contactOf(patient, role);
  const messages = sentMessages(patient);
  const { media, documents } = sharedFiles(messages);
  const links = extractLinks(messages);
  const [expanded, setExpanded] = useState({ media: false, docs: false, links: false });
  const [copied, setCopied] = useState('');
  const toggle = (key: keyof typeof expanded) => setExpanded((state) => ({ ...state, [key]: !state[key] }));
  const copy = async (href: string) => {
    try { await navigator.clipboard.writeText(href); setCopied(href); }
    catch { setCopied(''); }
  };
  const appointment = patient.appointment;
  const nextFocus = raw?.next_focus?.trim();
  const shownMedia = expanded.media ? media : media.slice(0, 3);
  const shownDocs = expanded.docs ? documents : documents.slice(0, 3);
  const shownLinks = expanded.links ? links : links.slice(0, 3);
  return <aside className="nm-profile" aria-label="Perfil de la conversación">
    <div className="nmf-profile-head">
      <h2>Perfil</h2>
      {role === 'pro' && <button type="button" className="nmf-more" onClick={() => onNavigate('ficha')} aria-label="Abrir ficha" title="Abrir ficha"><NotePencil size={20} aria-hidden /></button>}
    </div>
    <div className="nmf-profile-id">
      <span className="nv-avatar" aria-hidden>{contact.initials}</span>
      <h3>{contact.name}</h3>
      <span className="nmf-role">{contact.role}</span>
    </div>
    <section className="nmf-feature" aria-label="Acerca de">
      <FeatureTitle icon={<Info size={14} aria-hidden />} title="Acerca de" />
      <div className="nmf-about">
        {role === 'patient' && <p>Tu nutricionista de seguimiento en Plan V.</p>}
        <p><b>{role === 'pro' ? 'Objetivo' : 'Objetivo compartido'}:</b> {patient.goal || 'Todavía no definido'}</p>
        {nextFocus && <p><b>Próximo foco:</b> {nextFocus}</p>}
        <p><b>Próxima consulta:</b> {appointment ? `${appointment.when} · ${appointment.duration} min · ${appointment.channel === 'video' ? 'Videollamada' : appointment.channel === 'presencial' ? 'Presencial' : appointment.channel}` : 'Por coordinar'}</p>
      </div>
    </section>
    {media.length > 0 && <section className="nmf-feature" aria-label="Imágenes compartidas">
      <FeatureTitle icon={<ImageSquare size={14} aria-hidden />} title={`Imágenes (${media.length})`} action={<ShowAll count={media.length} limit={3} open={expanded.media} onToggle={() => toggle('media')} label="imágenes" />} />
      <div className={`nmf-gallery${expanded.media ? ' nmf-gallery-all' : ''}`}>{shownMedia.map((item) => <ChatAttachmentView key={item.messageId} variant="tile" patientId={patient.id} messageId={item.messageId} attachment={item.attachment} />)}</div>
    </section>}
    {documents.length > 0 && <section className="nmf-feature" aria-label="Documentos compartidos">
      <FeatureTitle icon={<FileText size={14} aria-hidden />} title={`Documentos (${documents.length})`} action={<ShowAll count={documents.length} limit={3} open={expanded.docs} onToggle={() => toggle('docs')} label="documentos" />} />
      <div className="nmf-docs">{shownDocs.map((item) => <ChatAttachmentView key={item.messageId} variant="doc" patientId={patient.id} messageId={item.messageId} attachment={item.attachment} />)}</div>
    </section>}
    {links.length > 0 && <section className="nmf-feature" aria-label="Enlaces compartidos">
      <FeatureTitle icon={<LinkSimple size={14} aria-hidden />} title={`Enlaces (${links.length})`} action={<ShowAll count={links.length} limit={3} open={expanded.links} onToggle={() => toggle('links')} label="enlaces" />} />
      <ul className="nmf-links">{shownLinks.map((link) => <li key={link.href}>
        <span className="nmf-link-icon"><Globe size={16} aria-hidden /></span>
        <a href={link.href} target="_blank" rel="noopener noreferrer nofollow">{link.label}</a>
        <button type="button" className="nmf-link-icon" onClick={() => void copy(link.href)} aria-label={copied === link.href ? `Copiado: ${link.label}` : `Copiar ${link.label}`} title={copied === link.href ? 'Copiado' : 'Copiar'}>{copied === link.href ? <Check size={16} aria-hidden /> : <CopySimple size={16} aria-hidden />}</button>
      </li>)}</ul>
    </section>}
    {role==='pro'&&<MessageReplyTools tools={tools} onUse={onUseReply}/>}
    {!media.length && !documents.length && !links.length && <p className="nmf-empty">Todavía no se compartieron imágenes, documentos ni enlaces en esta conversación.</p>}
  </aside>;
}
