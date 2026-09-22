import { type FormEvent, useEffect, useRef, useState } from 'react';
import { api } from '../../api/client';
import { useAppStore } from '../../store/useAppStore';
import { Icon } from '../shared/Icon';
import type { ShowroomPage } from './ShowroomPanels';
import type { ShowroomPatient } from './showroom-model';
import { sendShowroomMessage } from './message-send';
import { messageReceipt, messageReceiptLabel, unreadCount } from './message-receipts';
import { CHAT_ATTACHMENT_ACCEPT, assertChatFile, uploadChatAttachment } from '../../api/assets';
import { ChatAttachmentView } from './ChatAttachment';
import { NvBadge, NvButton, NvState } from './primitives';
import './messages.css';

type Props = { patient: ShowroomPatient; patients: ShowroomPatient[]; role: 'patient' | 'pro'; onSelect: (id: string) => void; onNavigate: (page: ShowroomPage) => void };
const normalized = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const sentMessages = (patient: ShowroomPatient) => patient.messages.filter((m) => Boolean(m.sent_at)).slice().sort((a, b) => Date.parse(a.sent_at) - Date.parse(b.sent_at));

export function NutrigoMessages({ patient, patients, role, onSelect, onNavigate }: Props) {
  const [query, setQuery] = useState('');
  const contacts = role === 'pro' ? patients.filter((p) => normalized(p.name).includes(normalized(query))) : [patient];
  return <section className={`nm-layout nm-${role}`} aria-label="Mensajería">
    <aside className="nm-contacts" aria-label="Conversaciones">
      <h2>Conversaciones</h2>
      {role === 'pro' && <input type="search" aria-label="Buscar conversaciones" placeholder="Buscar paciente…" value={query} onChange={(e) => setQuery(e.target.value)} />}
      {role === 'pro' && <label className="nm-mobile-picker">Paciente<select aria-label="Seleccionar conversación" value={patient.id} onChange={(e) => onSelect(e.target.value)}>{patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>}
      <div className="nm-contact-list">{contacts.map((p) => {
        const thread = sentMessages(p);
        const latest = thread[thread.length - 1];
        const unread = unreadCount(thread, role);
        const preview = latest?.text || latest?.attachment?.filename || 'Iniciar conversación';
        return <button type="button" key={p.id} aria-pressed={p.id === patient.id} onClick={() => onSelect(p.id)}>
          <span className="nv-avatar">{role === 'pro' ? p.initials : 'VT'}</span><span><strong>{role === 'pro' ? p.name : 'Verónica Trenti'}</strong><small>{preview}</small></span>
          {unread > 0 && <NvBadge>{unread} sin leer</NvBadge>}
        </button>;
      })}</div>
      {!contacts.length && <p className="nv-caption">No hay coincidencias.</p>}
    </aside>
    <MessageConversation key={`${role}:${patient.id}`} patient={patient} role={role} />
    <aside className="nm-profile" aria-label="Contexto de la conversación"><span className="nv-avatar">{role === 'pro' ? patient.initials : 'VT'}</span><h2>{role === 'pro' ? patient.name : 'Verónica Trenti'}</h2><p>{role === 'pro' ? 'Paciente en seguimiento' : 'Tu nutricionista'}</p><hr /><h3>Objetivo compartido</h3><p>{patient.goal || 'Todavía no definido'}</p><h3>Próxima consulta</h3><p>{patient.appointment?.when ?? 'Por coordinar'}</p><div className="nm-profile-actions">{role === 'pro' ? <><NvButton className="nv-soft" onClick={() => onNavigate('ficha')}>Abrir ficha <Icon name="arrow" size={14} /></NvButton><NvButton className="nv-ghost" onClick={() => onNavigate('consultas')}>Ver consultas <Icon name="calendar" size={14} /></NvButton></> : <NvButton className="nv-soft" onClick={() => onNavigate('agenda')}>Ver mi agenda <Icon name="calendar" size={14} /></NvButton>}</div><hr /><p className="nv-caption">Conversación privada de acompañamiento. Entrega y lectura se marcan por persona, no por dispositivo. Reintentar con el mismo identificador no duplica el mensaje. Los adjuntos son archivos autorizados (JPG, PNG, WebP o PDF de hasta 10 MB); la vista previa dura 60 segundos y queda registrada.</p></aside>
  </section>;
}

function MessageConversation({ patient, role }: Pick<Props, 'patient' | 'role'>) {
  const refresh = useAppStore((s) => s.refreshPatient);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const clientId = useRef(crypto.randomUUID());
  const list = useRef<HTMLDivElement>(null);
  const messages = sentMessages(patient);
  const unreadIncoming = unreadCount(messages, role);
  const contact = role === 'pro' ? patient.name : 'Verónica Trenti';
  const reader = role === 'pro' ? 'vero' : 'patient';
  const canSend = Boolean(text.trim() || file);
  useEffect(() => { if (list.current) list.current.scrollTop = list.current.scrollHeight; }, [messages.length]);
  useEffect(() => {
    if (!unreadIncoming) return;
    void api.markMessagesRead(patient.id, reader).then(() => refresh(patient.id)).catch(() => undefined);
  }, [patient.id, reader, refresh, unreadIncoming]);
  const pickFile = (next: File | null) => {
    if (!next) { setFile(null); return; }
    try { assertChatFile(next); setFile(next); setError(''); }
    catch (caught) { setFile(null); setError(caught instanceof Error ? caught.message : 'El archivo no se puede adjuntar.'); if (fileRef.current) fileRef.current.value = ''; }
  };
  const send = async (event: FormEvent) => {
    event.preventDefault();
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
  const reload = async () => {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError('');
    try { await refresh(patient.id); setStatus('Conversación actualizada.'); }
    catch { setError('No pudimos actualizar. Probá nuevamente.'); }
    finally { inFlight.current = false; setBusy(false); }
  };
  return <section className="nm-conversation" aria-label={`Conversación con ${contact}`}>
    <header><span className="nv-avatar">{role === 'pro' ? patient.initials : 'VT'}</span><div><h2>{contact}</h2><small>Mensajes de acompañamiento</small></div><NvButton className="nv-ghost" onClick={reload} disabled={busy} aria-label="Actualizar conversación"><Icon name="history" size={18} /></NvButton></header>
    <div className="nm-thread" ref={list} role="log" aria-live="polite" aria-relevant="additions" aria-label="Mensajes enviados">
      <p className="nm-demo-note">Entrega y leído se confirman al abrir el hilo (por persona, no por dispositivo). Un reintento con el mismo id no crea otro mensaje.</p>
      {!messages.length && <NvState title="Empezá la conversación" description="Escribí tu primer mensaje para iniciar el seguimiento." />}
      {messages.map((m) => {
        const own = m.from === (role === 'pro' ? 'vero' : 'patient');
        const receipt = messageReceipt(m);
        return <article key={m.id} className={`nm-bubble${own ? ' nm-own' : ''}`}><small>{m.from === 'vero' ? 'Verónica' : patient.name}</small>{m.text ? <p>{m.text}</p> : null}{m.attachment && <ChatAttachmentView patientId={patient.id} messageId={m.id} attachment={m.attachment} />}<time dateTime={m.sent_at}>{new Date(m.sent_at).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}{own ? ` · ${messageReceiptLabel(receipt)}` : ''}</time></article>;
      })}
    </div>
    <form className="nm-compose" onSubmit={send}><label htmlFor="nm-message">Mensaje para {contact}</label><div><textarea id="nm-message" rows={2} maxLength={2000} placeholder="Escribí un mensaje…" value={text} disabled={busy} onChange={(e) => setText(e.target.value)} aria-describedby={error ? 'nm-error' : 'nm-status'} /><NvButton type="submit" className="nv-soft" disabled={busy || !canSend}>{busy ? 'Enviando…' : 'Enviar mensaje'}</NvButton></div><div className="nm-attach-row"><input ref={fileRef} id="nm-attach" type="file" accept={CHAT_ATTACHMENT_ACCEPT} disabled={busy} onChange={(e) => pickFile(e.target.files?.[0] ?? null)} /><label htmlFor="nm-attach">Adjuntar archivo</label>{file && <span>{file.name}<button type="button" className="nv-button nv-ghost" onClick={() => pickFile(null)} disabled={busy}>Quitar</button></span>}</div><p id="nm-status" role="status">{status}</p>{error && <p id="nm-error" role="alert">{error}</p>}</form>
  </section>;
}
