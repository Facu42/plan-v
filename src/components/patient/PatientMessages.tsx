import { type FormEvent, useEffect, useRef, useState } from 'react';
import { api } from '../../api/client';
import { CHAT_ATTACHMENT_ACCEPT, assertChatFile, uploadChatAttachment } from '../../api/assets';
import { useAppStore } from '../../store/useAppStore';
import type { Patient } from '../../types';
import { Icon, Mark } from '../shared/Icon';
import { sortThreadMessages } from '../shared/message-thread';
import { unreadCount } from '../nutrigo/message-receipts';
import { ChatAttachmentView } from '../nutrigo/ChatAttachment';

function formatMessageTime(value: string): string {
  const date = new Date(value);
  const today = new Date();
  const sameDay = date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate();
  return new Intl.DateTimeFormat('es-AR', sameDay
    ? { hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
}

export function PatientMessages({ patient }: { patient: Patient }) {
  const refreshPatient = useAppStore((state) => state.refreshPatient);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const clientId = useRef(crypto.randomUUID());
  const messages = sortThreadMessages(patient.messages);
  const unreadIncoming = unreadCount(messages, 'patient');

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  useEffect(() => {
    if (!unreadIncoming) return;
    void api.markMessagesRead(patient.id, 'patient').then(() => refreshPatient(patient.id)).catch(() => undefined);
  }, [patient.id, refreshPatient, unreadIncoming]);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    const cleanText = text.trim();
    if ((!cleanText && !file) || sending) return;
    setSending(true);
    setError(null);
    try {
      const uploaded = file ? await uploadChatAttachment(patient.id, file, false) : null;
      await api.sendMessage(
        patient.id,
        cleanText,
        'patient',
        false,
        clientId.current,
        uploaded ? { asset_id: uploaded.asset_id, filename: uploaded.filename } : undefined,
      );
      clientId.current = crypto.randomUUID();
      setText('');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      await refreshPatient(patient.id);
    } catch {
      setError('No pudimos enviar el mensaje. Probá nuevamente.');
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="patient-shell patient-subpage messages-page">
      <header className="patient-topbar">
        <div className="brand-lockup"><Mark /><span>Mensajes</span></div>
      </header>

      <section className="subpage-hero compact">
        <div className="avatar avatar-vero large">VT</div>
        <h1>Verónica Trenti</h1>
        <p>Tu nutricionista. Este espacio es para conversar directamente con ella.</p>
      </section>

      <div className="thread" aria-live="polite" aria-label="Conversación con Verónica">
        {messages.length === 0 && (
          <p className="empty-state">Todavía no hay mensajes. Podés iniciar la conversación cuando lo necesites.</p>
        )}
        {messages.map((message) => (
          <article key={message.id} className={`bubble ${message.from === 'vero' ? 'from-vero' : 'from-patient'}`}>
            <span className="bubble-label">{message.from === 'vero' ? 'Verónica' : 'Vos'}</span>
            {message.text ? <p>{message.text}</p> : null}
            {message.attachment && <ChatAttachmentView patientId={patient.id} messageId={message.id} attachment={message.attachment} />}
            <time dateTime={message.sent_at}>{formatMessageTime(message.sent_at)}</time>
          </article>
        ))}
        <div ref={endRef} />
      </div>

      <form className="compose-bar" onSubmit={send}>
        <label htmlFor="patient-message" className="visually-hidden">Mensaje para Verónica</label>
        <input
          id="patient-message"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Escribí un mensaje…"
          maxLength={2000}
          aria-describedby={error ? 'patient-message-error' : undefined}
        />
        <input ref={fileRef} id="patient-attach" type="file" accept={CHAT_ATTACHMENT_ACCEPT} className="visually-hidden" onChange={(event) => {
          const next = event.target.files?.[0] ?? null;
          if (!next) { setFile(null); return; }
          try { assertChatFile(next); setFile(next); setError(null); }
          catch (caught) { setFile(null); setError(caught instanceof Error ? caught.message : 'El archivo no se puede adjuntar.'); }
        }} />
        <label htmlFor="patient-attach">Adjuntar</label>
        <button type="submit" className="primary-button" disabled={sending || (!text.trim() && !file)} aria-label={sending ? 'Enviando mensaje' : 'Enviar mensaje'}>
          <Icon name={sending ? 'loader' : 'message'} size={16} className={sending ? 'spin' : undefined} />
        </button>
        {error && <p id="patient-message-error" className="compose-error" role="alert">{error}</p>}
      </form>
    </main>
  );
}