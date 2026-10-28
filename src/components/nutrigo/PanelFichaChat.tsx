// Cajón de chat de la Ficha (`aside.chatd` de design/panel-nutri/v29/panel-trabajo.html): mismas clases y orden,
// con los mensajes reales de la paciente. La solapa Chat completa sigue en ?seccion=chat.
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { api } from '../../api/client';
import { assertChatFile, uploadChatAttachment } from '../../api/assets';
import { useAppStore } from '../../store/useAppStore';
import type { Patient } from '../../types';
import { ChatAttachmentView } from './ChatAttachment';
import { MESSAGES_READ_EVENT } from './cartera-unread';
import { dayDividerLabel, messageTime, sameDay } from './message-panel';
import { messageReceipt, messageReceiptLabel, unreadCount } from './message-receipts';
import { sendShowroomMessage } from './message-send';

const ACTIVE_REFRESH_MS = 15000;

/** Solo los mensajes que se enviaron, del más viejo al más nuevo. */
/** Respuesta que el copiloto ya dejó preparada para esta paciente (la misma del Inicio), si hay una vigente. */
export const sugerenciaDe = (patient: Pick<Patient, 'brief' | 'briefDismissed'>) =>
  !patient.briefDismissed && patient.brief?.suggested_action === 'mensaje' ? patient.brief.draft_message?.trim() || null : null;

export const enviadosDe = (patient: Pick<Patient, 'messages'>) =>
  (patient.messages ?? []).filter(m => Boolean(m.sent_at)).slice().sort((a, b) => Date.parse(a.sent_at) - Date.parse(b.sent_at));

export function PanelFichaChat({ patient, open, onClose }: { patient: Patient; open: boolean; onClose: () => void }) {
  const refresh = useAppStore(s => s.refreshPatient);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pidiendo, setPidiendo] = useState(false);
  const inFlight = useRef(false);
  const clientId = useRef(crypto.randomUUID());
  const lista = useRef<HTMLDivElement>(null);
  const archivo = useRef<HTMLInputElement>(null);
  const mensajes = enviadosDe(patient);
  const sugerida = sugerenciaDe(patient);
  const sinLeer = unreadCount(mensajes, 'pro');

  useEffect(() => { if (lista.current) lista.current.scrollTop = lista.current.scrollHeight; }, [mensajes.length, open]);
  useEffect(() => {
    if (!open || !sinLeer) return;
    void api.markMessagesRead(patient.id, 'vero')
      .then(() => { window.dispatchEvent(new Event(MESSAGES_READ_EVENT)); return refresh(patient.id); })
      .catch(() => undefined);
  }, [open, patient.id, refresh, sinLeer]);
  useEffect(() => {
    if (!open) return;
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void refresh(patient.id).catch(() => undefined); }, ACTIVE_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [open, patient.id, refresh]);
  useEffect(() => {
    if (!open) return;
    const cerrar = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', cerrar);
    return () => window.removeEventListener('keydown', cerrar);
  }, [open, onClose]);

  const enviar = async (event?: FormEvent, adjunto?: File) => {
    event?.preventDefault();
    if (inFlight.current || (!text.trim() && !adjunto)) return;
    inFlight.current = true; setBusy(true); setError('');
    try {
      const subido = adjunto ? await uploadChatAttachment(patient.id, adjunto, true) : null;
      await sendShowroomMessage({
        patientId: patient.id, text, role: 'pro', client_id: clientId.current, suggestedByAi: Boolean(sugerida) && text.trim() === sugerida,
        asset_id: subido?.asset_id, filename: subido?.filename,
      }, { send: api.sendMessage, refresh });
      clientId.current = crypto.randomUUID();
      setText('');
    } catch { setError('No pudimos enviar el mensaje. Se conserva lo que escribiste para reintentar.'); }
    finally { inFlight.current = false; setBusy(false); if (archivo.current) archivo.current.value = ''; }
  };
  const pedirSugerencia = async () => {
    if (pidiendo) return;
    setPidiendo(true); setError('');
    try { await api.generateBrief(patient.id); await refresh(patient.id); }
    catch { setError('No pudimos preparar una respuesta sugerida. Puede faltar el permiso de la paciente para el seguimiento con IA.'); }
    finally { setPidiendo(false); }
  };
  const elegirArchivo = (siguiente: File | null) => {
    if (!siguiente) return;
    try { assertChatFile(siguiente); } catch (caught) { setError(caught instanceof Error ? caught.message : 'El archivo no se puede adjuntar.'); if (archivo.current) archivo.current.value = ''; return; }
    void enviar(undefined, siguiente);
  };

  return <aside className={`chatd${open ? ' open' : ''}`} id="chatd" aria-label={`Chat con ${patient.name}`} aria-hidden={!open} inert={!open}>
    <div className="ch" style={{ borderBottom: '1px solid var(--line)' }}>
      <span className="av" style={{ background: 'var(--lima)', width: 28, height: 28, fontSize: 11 }}>{patient.initials}</span>
      <h2>{patient.name}</h2><span className="sp" />
      <button className="ibtn" type="button" onClick={onClose} aria-label="Cerrar chat" style={{ width: 28, height: 28 }}>
        <svg viewBox="0 0 24 24" className="i" style={{ width: 13, height: 13 }}><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
    </div>
    <div className="chat" ref={lista} role="log" aria-live="polite" aria-label="Mensajes enviados">
      {!mensajes.length ? <span className="day">Todavía no hay mensajes</span> : null}
      {mensajes.map((m, k) => {
        const propio = m.from === 'vero';
        const recibo = messageReceipt(m);
        return <div key={m.id} style={{ display: 'contents' }}>
          {k === 0 || !sameDay(mensajes[k - 1].sent_at, m.sent_at) ? <span className="day">{dayDividerLabel(m.sent_at)}</span> : null}
          <div className={`bub ${propio ? 'out' : 'in'}`}>
            {m.attachment ? <ChatAttachmentView patientId={patient.id} messageId={m.id} attachment={m.attachment} /> : null}
            {m.text}
            <small>{messageTime(m.sent_at)}{propio ? ` · ${messageReceiptLabel(recibo).toLowerCase()}` : ''}</small>
          </div>
        </div>;
      })}
    </div>
    <div className="sug">
      <span>{sugerida ? <>Respuesta sugerida: «{sugerida}»</> : 'Sin respuesta sugerida por ahora.'}</span><span className="sp" />
      {sugerida
        ? <button type="button" className="sbtn k" disabled={busy} onClick={() => setText(sugerida)}>Usar</button>
        : <button type="button" className="sbtn k" disabled={pidiendo} onClick={() => void pedirSugerencia()}>{pidiendo ? 'Preparando…' : 'Pedir una'}</button>}
    </div>
    {error ? <p role="alert" className="sug" style={{ borderStyle: 'solid' }}>{error}</p> : null}
    <form className="compose" onSubmit={enviar}>
      <input ref={archivo} type="file" hidden accept="image/jpeg,image/png,image/webp,application/pdf" aria-label="Adjuntar archivo" disabled={busy} onChange={e => elegirArchivo(e.target.files?.[0] ?? null)} />
      <button className="ibtn" type="button" aria-label="Adjuntar archivo" disabled={busy} onClick={() => archivo.current?.click()}>
        <svg viewBox="0 0 24 24" className="i"><path d="M20 11.5l-8 8a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7L9.7 17.2a1.7 1.7 0 0 1-2.4-2.4L15 7" /></svg>
      </button>
      <div>
        <input type="text" value={text} maxLength={2000} disabled={busy} placeholder="Escribí un mensaje…" aria-label={`Mensaje para ${patient.name}`}
          onChange={e => setText(e.target.value)} style={{ all: 'unset', width: '100%', color: 'var(--ink)' }} />
      </div>
      <button className="ibtn go" type="submit" aria-label="Enviar" disabled={busy || !text.trim()}>
        <svg viewBox="0 0 24 24" className="i"><path d="M20.5 3.5L10 14M20.5 3.5l-6.5 17-4-6.5-6.5-4z" /></svg>
      </button>
    </form>
  </aside>;
}
