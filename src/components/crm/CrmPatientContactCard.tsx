import { type FormEvent, useEffect, useRef, useState } from 'react';
import { api } from '../../api/client';
import { useAppStore } from '../../store/useAppStore';
import type { Patient } from '../../types';
import { Icon } from '../shared/Icon';
import { sortThreadMessages } from '../shared/message-thread';

function messageTime(value: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function CrmPatientContactCard({ patient }: { patient: Patient }) {
  const refreshPatient = useAppStore((state) => state.refreshPatient);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const clientId = useRef(crypto.randomUUID());
  const recentMessages = sortThreadMessages(patient.messages).slice(-3);

  useEffect(() => {
    setText('');
    setStatus(null);
    clientId.current = crypto.randomUUID();
  }, [patient.id]);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    const cleanText = text.trim();
    if (!cleanText || sending) return;
    setSending(true);
    setStatus(null);
    try {
      await api.sendMessage(patient.id, cleanText, 'vero', false, clientId.current);
      clientId.current = crypto.randomUUID();
      setText('');
      await refreshPatient(patient.id);
      setStatus('Mensaje enviado.');
    } catch {
      setStatus('No se pudo enviar. Probá nuevamente.');
    } finally {
      setSending(false);
    }
  };

  return (
    <article className="crm-card contact-card">
      <h3>Ficha breve</h3>
      <dl>
        <div><dt>Objetivo actual</dt><dd>{patient.goal}</dd></div>
        <div><dt>Horario sensible</dt><dd>{patient.sensitive_hours}</dd></div>
        <div><dt>Plan B favorito</dt><dd>{patient.plan_b}</dd></div>
        <div><dt>Próximo foco</dt><dd>{patient.next_focus}</dd></div>
      </dl>

      <section className="contact-messages" aria-label={`Mensajes con ${patient.name}`}>
        <div className="contact-messages-heading"><b>Mensajes recientes</b><Icon name="message" size={14} /></div>
        <div className="contact-thread">
          {recentMessages.length === 0 && <p>Sin mensajes enviados.</p>}
          {recentMessages.map((message) => (
            <div key={message.id} className={message.from === 'vero' ? 'from-vero' : 'from-patient'}>
              <span>{message.from === 'vero' ? 'Verónica' : patient.name}</span>
              <p>{message.text}</p>
              <time dateTime={message.sent_at}>{messageTime(message.sent_at)}</time>
            </div>
          ))}
        </div>
        <form className="contact-compose" onSubmit={send}>
          <label htmlFor={`crm-message-${patient.id}`}>Escribir mensaje propio</label>
          <textarea id={`crm-message-${patient.id}`} rows={2} maxLength={2000} value={text} onChange={(event) => setText(event.target.value)} placeholder={`Mensaje para ${patient.name}`} />
          <button type="submit" disabled={sending || !text.trim()}>{sending ? 'Enviando…' : 'Enviar mensaje'}</button>
        </form>
        {status && <p className="contact-message-status" role="status">{status}</p>}
      </section>
    </article>
  );
}
