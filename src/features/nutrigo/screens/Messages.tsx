import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { FramePair } from '../FramePair';
import { nodeName, sourceText, type SourceNode, type SourceResolver } from '../SourceView';
import { api } from '../../../api/client';
import { assertChatFile, CHAT_ATTACHMENT_ACCEPT, openChatAttachment, uploadChatAttachment } from '../../../api/assets';
import { useAppStore } from '../../../store/useAppStore';
import { messageReceipt, messageReceiptLabel, unreadCount } from '../../../components/nutrigo/message-receipts';
import type { MessageAttachment } from '../../../types';
import { createMessageWrite } from './message-write';
import { useUnsavedChanges } from '../../../components/nutrigo/unsaved-changes';
import { dateLabel, descendants, errorText, fields, idEnds, leaf, objects, safeUrl, searchBinding, source, Stateful, timeLabel, type ScreenProps } from './shared';

function Attachment({ patientId, messageId, attachment }: { patientId: string; messageId: string; attachment: MessageAttachment }) {
  const [url, setUrl] = useState<string | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const open = async () => { if (busy) return; setBusy(true); setError(''); try { const result = await openChatAttachment(patientId, messageId); setUrl(result.url); } catch (caught) { setError(errorText(caught)); } finally { setBusy(false); } };
  if (attachment.available === false) return <p className="text-[12px]">El adjunto ya no está disponible.</p>;
  return <div className="my-[8px] text-[13px]">{url ? <a href={url} target="_blank" rel="noopener noreferrer" className="underline">Abrir {attachment.filename}</a> : <button type="button" disabled={busy} onClick={() => void open()} className="underline">{busy ? 'Preparando…' : `Ver adjunto: ${attachment.filename}`}</button>}{error && <p role="alert">{error}</p>}</div>;
}
export function NutrigoMessages({ patient, onNavigate, onSignOut }: ScreenProps) {
  const refresh = useAppStore(state => state.refreshPatient); const [search, setSearch] = useState(''); const [text, setText] = useState(''); const [file, setFile] = useState<File | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [status, setStatus] = useState('');
  const compose = useRef<HTMLTextAreaElement | null>(null); const picker = useRef<HTMLInputElement | null>(null); const chat = useRef<HTMLDivElement | null>(null); const lock = useRef(false); const [unreadOnly, setUnreadOnly] = useState(false);
  const [pending, setPending] = useState(false);
  const [delivery] = useState(() => createMessageWrite(patient.id, { upload: selected => uploadChatAttachment(patient.id, selected, false), send: api.sendMessage, refresh }));
  useUnsavedChanges(Boolean(text.trim()||file||pending),busy);
  const all = patient.messages.filter(item => item.sent_at).slice().sort((a, b) => a.sent_at.localeCompare(b.sent_at)); const messages = all.filter(item => `${item.text} ${item.attachment?.filename ?? ''}`.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es'))); const unread = unreadCount(all, 'patient'); const files = all.filter(item => item.attachment); const latest = all[all.length - 1];
  const links = [...new Set(all.flatMap(message => message.text.match(/https:\/\/[^\s<>]+/g) ?? []))].map(value => safeUrl(value)).filter((value): value is string => !!value);
  useEffect(() => { if (chat.current) chat.current.scrollTop = chat.current.scrollHeight; }, [all.length]);
  useEffect(() => { if (!unread) return; let active = true; void api.markMessagesRead(patient.id, 'patient').then(() => { if (active) return refresh(patient.id); }).catch(() => { if (active) setError('No se pudo actualizar la confirmación de lectura.'); }); return () => { active = false; }; }, [patient.id, unread, refresh]);
  const pick = (next: File | null) => { if (!next) { setFile(null); return; } try { assertChatFile(next); setFile(next); setError(''); } catch (caught) { setFile(null); setError(errorText(caught)); if (picker.current) picker.current.value = ''; } };
  const send = async () => { if (lock.current || (!text.trim() && !file)) return; lock.current = true; setBusy(true); setError(''); setStatus(''); try { const result = await delivery.run({ text, file, client_id: crypto.randomUUID() }); setText(''); setFile(null); if (picker.current) picker.current.value = ''; setStatus(result === 'sent' ? 'Mensaje enviado.' : 'Mensaje enviado. Actualizá la conversación para verlo; no hace falta reenviarlo.'); } catch (caught) { setError(errorText(caught)); setStatus(delivery.pending ? 'Conservamos este mensaje y su adjunto. Reintentá enviarlo para confirmar el resultado.' : 'El mensaje todavía no se envió. Podés corregir el archivo y reintentar.'); } finally { setPending(delivery.pending); lock.current = false; setBusy(false); } };
  const keyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(); } };
  const renderMessage = (prototype: SourceNode, message: typeof all[number]) => source(prototype, child => {
    if (nodeName(child) === 'Bubble') return { children: <><p className="whitespace-pre-wrap">{message.text}</p>{message.attachment && <Attachment patientId={patient.id} messageId={message.id} attachment={message.attachment} />}</> };
    if (nodeName(child) === 'Footer') return { text: `${timeLabel(message.sent_at)}${message.from === 'patient' ? ` · ${messageReceiptLabel(messageReceipt(message))}` : ''}` };
    if (leaf(child) && /\d{1,2}:\d{2} AM/.test(sourceText(child))) return { text: timeLabel(message.sent_at) };
    return undefined;
  }, message.id);
  const resolver: SourceResolver = node => {
    const name = nodeName(node); const content = sourceText(node);
    if (name === 'Buttons') return { children: objects(node).map((child,index)=>source(child,current=>current===child?{
      onClick:index===0?()=>onNavigate('agenda'):index===1?()=>picker.current?.click():()=>void refresh(patient.id).catch(()=>setError('No se pudo actualizar la conversación.')),
      label:index===0?'Ver mi próxima consulta':index===1?'Adjuntar archivo':'Actualizar conversación',props:{disabled:busy || pending},
    }:undefined,index)) };
    if (name === 'List Messages') { const prototype = objects(node).find(child => nodeName(child) === 'Item List Message'); if (!prototype || (unreadOnly && !unread)) return { children: <Stateful empty="No hay conversaciones sin leer." /> }; return { children: fields(prototype, { '210:6310': 'Tu nutricionista', '210:6312': 'Nutricionista', '2:4308': latest ? timeLabel(latest.sent_at) : '', '2:4310': latest?.text || latest?.attachment?.filename || 'Iniciar conversación', '2:3263': unread || '' }, child => child === prototype ? { onClick: () => { setSearch(''); compose.current?.focus(); }, label: 'Conversación con mi nutricionista' } : /Avatar|Badge/.test(nodeName(child)) ? { hidden: true } : undefined) }; }
    if (name === 'Chat Area') { const parts = objects(node); const incoming = parts.find(child => descendants(child).some(descendant => nodeName(descendant) === 'Bubble') && sourceText(child).startsWith('Hey Adam')); const outgoing = parts.find(child => sourceText(child).startsWith('Thanks, Alex!')); return { props: { ref: chat, style: { overflowY: 'auto' }, role: 'log', 'aria-label': 'Conversación' }, children: messages.length ? messages.map(message => { const prototype = message.from === 'patient' ? outgoing : incoming; return prototype ? <div key={message.id} className="w-full"><p className="mb-[4px] text-center text-[10px] text-[#8a8c90]">{dateLabel(message.sent_at)}</p>{renderMessage(prototype, message)}</div> : null; }) : <Stateful empty={search ? 'No hay mensajes que coincidan.' : 'Todavía no hay mensajes. Escribile a tu nutricionista.'} /> }; }
    if (name === 'Input-search' && content === 'Type a message..') { const originalText = descendants(node).find(child => nodeName(child) === 'Text'); return { children: <><textarea disabled={busy || pending} ref={compose} aria-label="Escribir mensaje" placeholder="Escribí un mensaje…" maxLength={2000} rows={2} value={text} onChange={event => setText(event.target.value)} onKeyDown={keyDown} className={String(originalText?.props.className ?? '')} style={{ width: '100%', border: 0, background: 'transparent', resize: 'vertical' }} /><button type="button" disabled={busy || pending} aria-label="Adjuntar archivo" onClick={() => picker.current?.click()} className="px-[8px] text-[12px] underline">Adjuntar</button></> }; }
    const input = searchBinding(node, search, setSearch, 'Buscar mensajes'); if (input && content !== 'Type a message..') return input;
    if (/Button/.test(name) && content === 'Send') return { onClick: () => void send(), label: 'Enviar mensaje', props: { disabled: busy || (!text.trim() && !file) } };
    if (/Button/.test(name) && content === 'New Message') return { onClick: () => compose.current?.focus(), label: 'Escribir a mi nutricionista' };
    if (name === 'Section Features') {
      if (content.startsWith('About')) return { children: <><h3 className="text-[16px]">Tu nutricionista</h3><p className="text-[14px] text-[#8a8c90]">Este hilo privado conserva tus consultas, indicaciones y archivos.</p><button type="button" onClick={() => onNavigate('agenda')} className="text-[14px] underline">Ver mi próxima consulta</button></> };
      if (content.startsWith('Media') || content.startsWith('Documents')) { const selected = files.filter(item => content.startsWith('Media') ? item.attachment?.kind === 'image' : item.attachment?.kind !== 'image'); return { children: <><h3 className="text-[16px]">{content.startsWith('Media') ? 'Imágenes' : 'Documentos'} ({selected.length})</h3>{selected.length ? selected.map(message => <Attachment key={message.id} patientId={patient.id} messageId={message.id} attachment={message.attachment!} />) : <p className="text-[12px] text-[#8a8c90]">No hay archivos compartidos.</p>}</> }; }
      if (content.startsWith('Links')) return { children: <><h3 className="text-[16px]">Enlaces</h3>{links.length ? links.map(url => <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="break-all text-[12px] underline">{url}</a>) : <p className="text-[12px] text-[#8a8c90]">No hay enlaces compartidos.</p>}</> };
    }
    if (name === 'Avatar') return { children: <span aria-hidden="true" className="flex h-full w-full items-center justify-center rounded-full bg-[#c2e66e] text-[#272932]">N</span> };
    if (leaf(node) && content === 'Alex Foster') return { text: 'Tu nutricionista' };
    if (leaf(node) && content === 'Personal Trainer') return { text: 'Nutricionista' };
    if (leaf(node) && content === 'last seen recently') return { text: latest?.from === 'vero' ? `Último mensaje: ${dateLabel(latest.sent_at)}` : 'Conversación privada' };
    if (name === 'Button Filter') return { onClick: () => setUnreadOnly(value => !value), label: 'Sólo sin leer', props: { 'aria-pressed': unreadOnly } };
    if (idEnds(node, '198:6020')) return undefined;
    return undefined;
  };
  return <FramePair nodes={['84:2565', '433:19982']} resolve={resolver} patientName={patient.name} onNavigate={onNavigate} onSignOut={onSignOut} unread={unread}>
    <input disabled={busy || pending} ref={picker} type="file" accept={CHAT_ATTACHMENT_ACCEPT} onChange={event => pick(event.target.files?.[0] ?? null)} className="hidden" aria-label="Archivo adjunto" />
    {file && <p className="mx-[24px] text-[14px]">Adjunto: {file.name}<button type="button" disabled={busy || pending} onClick={() => { setFile(null); if (picker.current) picker.current.value = ''; }} className="ml-[8px] underline">Quitar</button></p>}
    {error && <Stateful error={error} />}{status && <p role="status" className="mx-[24px] p-[16px] text-[#272932]">{status}</p>}<button type="button" disabled={busy} onClick={() => void refresh(patient.id).catch(() => setError('No se pudo actualizar la conversación.'))} className="mx-[24px] mb-[16px] rounded-[8px] border border-[#e1e1e2] px-[16px] py-[8px]">Actualizar conversación</button>
  </FramePair>;
}
