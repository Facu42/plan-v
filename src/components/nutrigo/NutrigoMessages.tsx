import { type FormEvent, useEffect, useRef, useState } from 'react';
import { api } from '../../api/client';
import { useAppStore } from '../../store/useAppStore';
import { Icon } from '../shared/Icon';
import type { ShowroomPage } from './ShowroomPanels';
import type { ShowroomPatient } from './showroom-model';
import { sendShowroomMessage } from './message-send';
import { messageReceipt, messageReceiptLabel, unreadCount } from './message-receipts';
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
        return <button type="button" key={p.id} aria-pressed={p.id === patient.id} onClick={() => onSelect(p.id)}>
          <span className="nv-avatar">{role === 'pro' ? p.initials : 'VT'}</span><span><strong>{role === 'pro' ? p.name : 'Verónica Trenti'}</strong><small>{latest?.text ?? 'Iniciar conversación'}</small></span>
          {unread > 0 && <NvBadge>{unread} sin leer</NvBadge>}
        </button>;
      })}</div>
      {!contacts.length && <p className="nv-caption">No hay coincidencias.</p>}
    </aside>
    <MessageConversation key={`${role}:${patient.id}`} patient={patient} role={role} />
    <aside className="nm-profile" aria-label="Contexto de la conversación"><span className="nv-avatar">{role === 'pro' ? patient.initials : 'VT'}</span><h2>{role === 'pro' ? patient.name : 'Verónica Trenti'}</h2><p>{role === 'pro' ? 'Paciente en seguimiento' : 'Tu nutricionista'}</p><hr /><h3>Objetivo compartido</h3><p>{patient.goal || 'Todavía no definido'}</p><h3>Próxima consulta</h3><p>{patient.appointment?.when ?? 'Por coordinar'}</p><div className="nm-profile-actions">{role === 'pro' ? <><NvButton className="nv-soft" onClick={() => onNavigate('ficha')}>Abrir ficha <Icon name="arrow" size={14} /></NvButton><NvButton className="nv-ghost" onClick={() => onNavigate('consultas')}>Ver consultas <Icon name="calendar" size={14} /></NvButton></> : <NvButton className="nv-soft" onClick={() => onNavigate('agenda')}>Ver mi agenda <Icon name="calendar" size={14} /></NvButton>}</div><hr /><p className="nv-caption">Conversación privada de acompañamiento. En demo, la entrega es inmediata y leído se marca al abrir el hilo. Los archivos adjuntos todavía no están disponibles.</p></aside>
  </section>;
}

function MessageConversation({ patient, role }: Pick<Props, 'patient' | 'role'>) {
  const refresh = useAppStore((s) => s.refreshPatient);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const list = useRef<HTMLDivElement>(null);
  const messages = sentMessages(patient);
  const unreadIncoming = unreadCount(messages, role);
  const contact = role === 'pro' ? patient.name : 'Verónica Trenti';
  const reader = role === 'pro' ? 'vero' : 'patient';
  useEffect(() => { if (list.current) list.current.scrollTop = list.current.scrollHeight; }, [messages.length]);
  useEffect(() => {
    if (!unreadIncoming) return;
    void api.markMessagesRead(patient.id, reader).then(() => refresh(patient.id)).catch(() => undefined);
  }, [patient.id, reader, refresh, unreadIncoming]);
  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (inFlight.current || !text.trim()) return;
    inFlight.current = true; setBusy(true); setError(''); setStatus('');
    try {
      const result = await sendShowroomMessage({ patientId: patient.id, text, role }, { send: api.sendMessage, refresh });
      setText('');
      setStatus(result === 'sent' ? 'Mensaje enviado.' : 'Mensaje enviado. No pudimos actualizar la conversación; usá Actualizar, no lo reenvíes.');
    } catch { setError('No pudimos enviar el mensaje. Tu texto se conserva para reintentar.'); }
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
      <p className="nm-demo-note">Demo local · entrega inmediata en memoria. Leído se marca al abrir la conversación.</p>
      {!messages.length && <NvState title="Empezá la conversación" description="Escribí tu primer mensaje para iniciar el seguimiento." />}
      {messages.map((m) => {
        const own = m.from === (role === 'pro' ? 'vero' : 'patient');
        const receipt = messageReceipt(m);
        return <article key={m.id} className={`nm-bubble${own ? ' nm-own' : ''}`}><small>{m.from === 'vero' ? 'Verónica' : patient.name}</small><p>{m.text}</p><time dateTime={m.sent_at}>{new Date(m.sent_at).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}{own ? ` · ${messageReceiptLabel(receipt)}` : ''}</time></article>;
      })}
    </div>
    <form className="nm-compose" onSubmit={send}><label htmlFor="nm-message">Mensaje para {contact}</label><div><textarea id="nm-message" rows={2} maxLength={2000} placeholder="Escribí un mensaje…" value={text} disabled={busy} onChange={(e) => setText(e.target.value)} aria-describedby={error ? 'nm-error' : 'nm-status'} /><NvButton type="submit" className="nv-soft" disabled={busy || !text.trim()}>{busy ? 'Enviando…' : 'Enviar mensaje'}</NvButton></div><p id="nm-status" role="status">{status}</p>{error && <p id="nm-error" role="alert">{error}</p>}</form>
  </section>;
}
