import { type FormEvent, useEffect, useRef, useState } from 'react';
import { api } from '../../api/client';
import { CHAT_ATTACHMENT_ACCEPT, assertChatFile, uploadChatAttachment } from '../../api/assets';
import { useAppStore } from '../../store/useAppStore';
import type { Patient } from '../../types';
import { Icon } from '../shared/Icon';
import { sortThreadMessages } from '../shared/message-thread';
import { ChatAttachmentView } from '../nutrigo/ChatAttachment';

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
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const clientId = useRef(crypto.randomUUID());
  const fileRef = useRef<HTMLInputElement>(null);
  const recentMessages = sortThreadMessages(patient.messages).slice(-3);

  useEffect(() => {
    setText('');
    setFile(null);
    setStatus(null);
    clientId.current = crypto.randomUUID();
  }, [patient.id]);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    const cleanText = text.trim();
    if ((!cleanText && !file) || sending) return;
    setSending(true);
    setStatus(null);
    try {
      const uploaded = file ? await uploadChatAttachment(patient.id, file, true) : null;
      await api.sendMessage(
        patient.id,
        cleanText,
        'vero',
        false,
        clientId.current,
        uploaded ? { asset_id: uploaded.asset_id, filename: uploaded.filename } : undefined,
      );
      clientId.current = crypto.randomUUID();
      setText('');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
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
              {message.text ? <p>{message.text}</p> : null}
              {message.attachment && <ChatAttachmentView patientId={patient.id} messageId={message.id} attachment={message.attachment} />}
              <time dateTime={message.sent_at}>{messageTime(message.sent_at)}</time>
            </div>
          ))}
        </div>
        <form className="contact-compose" onSubmit={send}>
          <label htmlFor={`crm-message-${patient.id}`}>Escribir mensaje propio</label>
          <textarea id={`crm-message-${patient.id}`} rows={2} maxLength={2000} value={text} onChange={(event) => setText(event.target.value)} placeholder={`Mensaje para ${patient.name}`} />
          <input ref={fileRef} id={`crm-attach-${patient.id}`} type="file" accept={CHAT_ATTACHMENT_ACCEPT} onChange={(event) => {
            const next = event.target.files?.[0] ?? null;
            if (!next) { setFile(null); return; }
            try { assertChatFile(next); setFile(next); setStatus(null); }
            catch (caught) { setFile(null); setStatus(caught instanceof Error ? caught.message : 'El archivo no se puede adjuntar.'); }
          }} />
          <label htmlFor={`crm-attach-${patient.id}`}>Adjuntar archivo</label>
          <button type="submit" disabled={sending || (!text.trim() && !file)}>{sending ? 'Enviando…' : 'Enviar mensaje'}</button>
        </form>
        {status && <p className="contact-message-status" role="status">{status}</p>}
      </section>
    </article>
  );
}
