import { createContext, useContext, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { api } from '../../api/client';
import { useAppStore } from '../../store/useAppStore';
import { messageReceipt, messageReceiptLabel, unreadCount } from '../nutrigo/message-receipts';
import { sendShowroomMessage } from '../nutrigo/message-send';
import type { ShowroomPage } from '../nutrigo/ShowroomPanels';
import type { ShowroomPatient } from '../nutrigo/showroom-model';

type PatientMessage = ShowroomPatient['messages'][number];
type ThreadMessage = PatientMessage & { own: boolean; receipt: string; time: string };
type MessageValues = {
  patient: ShowroomPatient;
  contactName: string;
  thread: ThreadMessage[];
  unread: number;
  unreadOnly: boolean;
  toggleUnreadOnly: () => void;
  query: string;
  setQuery: (value: string) => void;
  text: string;
  setText: (value: string) => void;
  busy: boolean;
  status: string;
  error: string;
  send: (event: FormEvent) => Promise<void>;
  refresh: () => Promise<void>;
  focusComposer: () => void;
  onNavigate: (page: ShowroomPage) => void;
};
const context = createContext<MessageValues | null>(null);
export function useFigmaMessages() {
  const value = useContext(context);
  if (!value) throw new Error('La pantalla Figma de Mensajes necesita datos del paciente.');
  return value;
}

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-AR');
const contactName = 'Verónica Trenti';
export function FigmaMessagesProvider({ patient, onNavigate, children }: { patient: ShowroomPatient; onNavigate: (page: ShowroomPage) => void; children: ReactNode }) {
  const refreshPatient = useAppStore((state) => state.refreshPatient);
  const [query, setQuery] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const captureId = useRef(crypto.randomUUID());
  const thread = useMemo(() => patient.messages.filter((message) => Boolean(message.sent_at)).slice()
    .sort((left, right) => Date.parse(left.sent_at) - Date.parse(right.sent_at))
    .map((message) => ({
      ...message,
      own: message.from === 'patient',
      receipt: messageReceiptLabel(messageReceipt(message)),
      time: new Date(message.sent_at).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
    })), [patient.messages]);
  const unread = unreadCount(thread, 'patient');
  useEffect(() => { setText(''); setQuery(''); setUnreadOnly(false); setStatus(''); setError(''); }, [patient.id]);
  useEffect(() => {
    if (!unread) return;
    void api.markMessagesRead(patient.id, 'patient').then(() => refreshPatient(patient.id)).catch(() => undefined);
  }, [patient.id, unread, refreshPatient]);
  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (inFlight.current || !text.trim()) return;
    inFlight.current = true; setBusy(true); setError(''); setStatus('');
    try {
      const result = await sendShowroomMessage({ patientId: patient.id, text, role: 'patient', id: captureId.current }, { send: api.sendMessage, refresh: refreshPatient });
      captureId.current = crypto.randomUUID();
      setText('');
      setStatus(result === 'sent' ? 'Mensaje enviado.' : 'Mensaje enviado. No pudimos actualizar el hilo; usá Actualizar y evitá reenviarlo.');
    } catch { setError('No pudimos enviar el mensaje. Tu texto se conserva para reintentar.'); }
    finally { inFlight.current = false; setBusy(false); }
  };
  const refresh = async () => {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError('');
    try { await refreshPatient(patient.id); setStatus('Conversación actualizada.'); }
    catch { setError('No pudimos actualizar la conversación. Probá de nuevo.'); }
    finally { inFlight.current = false; setBusy(false); }
  };
  const focusComposer = () => {
    const input = document.querySelector<HTMLTextAreaElement>('#figma-pack-root .figma-messages-compose textarea');
    input?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    input?.focus();
  };
  return <context.Provider value={{ patient, contactName, thread, unread, unreadOnly, toggleUnreadOnly: () => setUnreadOnly((value) => !value), query, setQuery, text, setText, busy, status, error, send, refresh, focusComposer, onNavigate }}>{children}</context.Provider>;
}

export function FigmaMessagesSearch({ className, icon }: { className: string; icon: string }) {
  const messages = useFigmaMessages();
  return <label className={className} data-name="Input-search"><img alt="" className="size-[16px] shrink-0" src={icon} /><input type="search" aria-label="Buscar conversaciones" placeholder="Buscar conversación…" value={messages.query} onChange={(event) => messages.setQuery(event.target.value)} /></label>;
}

export function FigmaMessagesList({ variant }: { variant: 'desktop' | 'tablet' | 'mobile' }) {
  const messages = useFigmaMessages();
  if (messages.query && !normalize(messages.contactName).includes(normalize(messages.query))) return <p className="figma-messages-empty-list">No hay coincidencias.</p>;
  if (messages.unreadOnly && !messages.unread) return <p className="figma-messages-empty-list">No hay conversaciones sin leer.</p>;
  const latest = messages.thread[messages.thread.length - 1];
  return <button type="button" className={`figma-messages-contact figma-messages-contact-${variant}`} data-name="Item List Message" aria-current="true" onClick={messages.focusComposer}>
    <span className="figma-messages-avatar" aria-hidden="true">VT</span>
    <span className="figma-messages-contact-copy"><span><strong>{messages.contactName}</strong><small>{latest?.time ?? 'Tu nutricionista'}</small></span><span className="figma-messages-contact-preview">{latest?.text ?? 'Iniciá la conversación'}</span></span>
    {messages.unread > 0 && <span className="figma-messages-unread" aria-label={`${messages.unread} mensajes sin leer`}>{messages.unread}</span>}
  </button>;
}

export function FigmaMessagesEmptyThread() {
  return <div className="figma-messages-empty-thread" role="status"><strong>Empezá la conversación</strong><span>Escribile a tu nutricionista para iniciar el seguimiento.</span></div>;
}

export function FigmaMessagesCompose() {
  const messages = useFigmaMessages();
  return <form className="figma-messages-compose" onSubmit={(event) => void messages.send(event)}>
    <textarea aria-label={`Mensaje para ${messages.contactName}`} placeholder="Escribí un mensaje…" rows={1} maxLength={2000} value={messages.text} disabled={messages.busy} onChange={(event) => messages.setText(event.target.value)} />
    <button type="submit" disabled={messages.busy || !messages.text.trim()}>{messages.busy ? 'Enviando…' : 'Enviar'} <span aria-hidden="true">➤</span></button>
    {(messages.status || messages.error) && <p className="figma-messages-compose-feedback" role={messages.error ? 'alert' : 'status'}>{messages.error || messages.status}</p>}
  </form>;
}

export function FigmaMessagesProfile() {
  const messages = useFigmaMessages();
  return <div className="figma-messages-profile">
    <h2>Perfil</h2>
    <span className="figma-messages-profile-avatar" aria-hidden="true">VT</span>
    <strong>{messages.contactName}</strong>
    <span className="figma-messages-profile-role">Tu nutricionista</span>
    <section><h3>Acerca de</h3><p>Conversación privada de acompañamiento nutricional.</p></section>
    <section><h3>Próxima consulta</h3><p>{messages.patient.appointment?.when ?? 'Por coordinar'}</p><button type="button" onClick={() => messages.onNavigate('agenda')}>Ver mi agenda</button></section>
    <section><h3>Archivos compartidos</h3><p>Todavía no hay adjuntos en esta conversación.</p></section>
    <p className="figma-messages-profile-note">Entregado indica que el mensaje quedó guardado para la otra persona. Leído indica que abrió el hilo.</p>
  </div>;
}
