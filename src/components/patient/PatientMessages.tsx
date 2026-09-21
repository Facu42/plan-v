import { type FormEvent, useEffect, useRef, useState } from 'react';
import { api } from '../../api/client';
import { useAppStore } from '../../store/useAppStore';
import type { Patient } from '../../types';
import { Icon, Mark } from '../shared/Icon';
import { sortThreadMessages } from '../shared/message-thread';

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
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const captureId = useRef(crypto.randomUUID());
  const messages = sortThreadMessages(patient.messages);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    const cleanText = text.trim();
    if (!cleanText || sending) return;
    setSending(true);
    setError(null);
    try {
      await api.sendMessage(patient.id, cleanText, 'patient', false, captureId.current);
      captureId.current = crypto.randomUUID();
      setText('');
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
            <p>{message.text}</p>
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
        <button type="submit" className="primary-button" disabled={sending || !text.trim()} aria-label={sending ? 'Enviando mensaje' : 'Enviar mensaje'}>
          <Icon name={sending ? 'loader' : 'message'} size={16} className={sending ? 'spin' : undefined} />
        </button>
        {error && <p id="patient-message-error" className="compose-error" role="alert">{error}</p>}
      </form>
    </main>
  );
}