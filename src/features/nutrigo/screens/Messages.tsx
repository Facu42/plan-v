import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { FramePair } from '../FramePair';
import { nodeName, sourceText, type SourceBinding, type SourceNode, type SourceResolver } from '../SourceView';
import { api } from '../../../api/client';
import { assertChatFile, CHAT_ATTACHMENT_ACCEPT, uploadChatAttachment } from '../../../api/assets';
import { useAppStore } from '../../../store/useAppStore';
import { messageReceipt, messageReceiptLabel, unreadCount } from '../../../components/nutrigo/message-receipts';
import { FigmaRecordDialog } from '../../../components/nutrigo/FigmaPatientFront';
import { createMessageWrite } from './message-write';
import { useUnsavedChanges } from '../../../components/nutrigo/unsaved-changes';
import { descendants, EmptyState, errorText, idEnds, leaf, objects, safeUrl, searchBinding, source, Stateful, type ScreenProps } from './shared';
import { argentinaDay, argentinaTime } from './ar-time';
import { BubbleAttachment, Attachment, documentRow, imageTile, kitFromPanel, type AttachmentKit } from './message-attachments';
import { dayLabel, fileSize, hasDate, listTime, orderedMessages } from './message-format';
import { ATTACH_ICON, MESSAGE_LABELS, headerActions } from './header-actions';
import { unreadBadge } from '../patient-navigation';

type Message = ScreenProps['patient']['messages'][number];
type Shared = { kind: 'media' | 'docs' | 'links'; title: string };

const has = (node: SourceNode, name: string) => descendants(node).some(child => nodeName(child) === name);
/** Estilo para anunciar algo sólo a lectores de pantalla (el mensaje ya se ve en el chat). */
const SR_ONLY = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' } as const;

export function NutrigoMessages({ patient, onNavigate, onSignOut, now = new Date() }: ScreenProps) {
  const refresh = useAppStore(state => state.refreshPatient); const [search, setSearch] = useState(''); const [text, setText] = useState(''); const [file, setFile] = useState<File | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [notice, setNotice] = useState({ text: '', loud: false });
  const announce = (text: string, loud = false) => setNotice({ text, loud });
  const kit = useRef<AttachmentKit>({ tiles: [] }); const compose = useRef<HTMLTextAreaElement | null>(null); const picker = useRef<HTMLInputElement | null>(null); const chat = useRef<HTMLDivElement | null>(null); const lock = useRef(false); const [unreadOnly, setUnreadOnly] = useState(false);
  const [pending, setPending] = useState(false); const [showAll, setShowAll] = useState<Shared | null>(null);
  const [delivery] = useState(() => createMessageWrite(patient.id, { upload: selected => uploadChatAttachment(patient.id, selected, false), send: api.sendMessage, refresh }));
  useUnsavedChanges(Boolean(text.trim() || file || pending), busy);
  const all = orderedMessages(patient.messages); const messages = all.filter(item => `${item.text} ${item.attachment?.filename ?? ''}`.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es'))); const unread = unreadCount(all, 'patient'); const dated = all.filter(hasDate); const latest = dated[dated.length - 1] ?? all[all.length - 1];
  const images = all.filter(item => item.attachment?.kind === 'image'); const documents = all.filter(item => item.attachment && item.attachment.kind !== 'image');
  // Normaliza primero (sin puntuación final) y después quita repetidos, para que cada enlace tenga una clave única.
  const links = [...new Set(all.slice().reverse().flatMap(message => message.text.match(/https:\/\/[^\s<>]+/g) ?? []).map(value => safeUrl(value.replace(/[.,;:!?)\]]+$/, ''))).filter((value): value is string => !!value))];
  useEffect(() => { if (chat.current) chat.current.scrollTop = chat.current.scrollHeight; }, [all.length]);
  useEffect(() => { if (!unread) return; let active = true; void api.markMessagesRead(patient.id, 'patient').then(() => { if (active) return refresh(patient.id); }).catch(() => { if (active) setError('No se pudo actualizar la confirmación de lectura.'); }); return () => { active = false; }; }, [patient.id, unread, refresh]);
  const pick = (next: File | null) => { if (!next) { setFile(null); return; } try { assertChatFile(next); setFile(next); setError(''); } catch (caught) { setFile(null); setError(errorText(caught)); if (picker.current) picker.current.value = ''; } };
  const clearFile = () => { setFile(null); if (picker.current) picker.current.value = ''; };
  const send = async () => { if (lock.current || (!text.trim() && !file)) return; lock.current = true; setBusy(true); setError(''); announce(''); try { const result = await delivery.run({ text, file, client_id: crypto.randomUUID() }); setText(''); clearFile(); announce(result === 'sent' ? 'Mensaje enviado.' : 'Mensaje enviado. Actualizá la conversación para verlo; no hace falta reenviarlo.', result !== 'sent'); } catch (caught) { setError(errorText(caught)); announce(delivery.pending ? 'Conservamos este mensaje y su adjunto. Reintentá enviarlo para confirmar el resultado.' : 'El mensaje todavía no se envió. Podés corregir el archivo y reintentar.', true); } finally { setPending(delivery.pending); lock.current = false; setBusy(false); } };
  const keyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(); } };
  const reload = () => void refresh(patient.id).catch(() => setError('No se pudo actualizar la conversación.'));
  const write = () => { setSearch(''); compose.current?.focus(); };
  const writeToNutritionist: SourceBinding = { onClick: write, label: MESSAGE_LABELS.newMessage };
  const actions = headerActions({ write, agenda: () => onNavigate('agenda'), reload });
  const toggleUnread: SourceBinding = { onClick: () => setUnreadOnly(value => !value), label: 'Mostrar sólo conversaciones sin leer', props: { 'aria-pressed': unreadOnly } };

  /** Mensaje: el mismo bloque del archivo (burbuja recibida en blanco, propia en Saffron) con el texto real. */
  const renderMessage = (prototype: SourceNode, message: Message) => {
    const receipt = message.from === 'patient' ? messageReceipt(message) : null;
    const resolve: SourceResolver = child => {
      if (nodeName(child) === 'Bubble') {
        const body = objects(child)[0];
        return { props: { 'aria-label': message.from === 'patient' ? 'Mensaje enviado' : 'Mensaje de tu nutricionista', style: message.attachment ? { flexDirection: 'column', alignItems: 'flex-start', gap: 6 } : undefined }, children: <>{body && (message.text.trim() || !message.attachment) && source(body, () => ({ text: message.text, props: { style: { whiteSpace: 'pre-wrap', width: '100%' } } }), 'text')}{message.attachment && <BubbleAttachment kit={kit} patientId={patient.id} message={message} />}</> };
      }
      if (nodeName(child) === 'Checks') return { props: { 'aria-hidden': true, style: { opacity: receipt === 'read' ? 1 : 0.35 } } };
      if (leaf(child) && /^\d{1,2}:\d{2} (AM|PM)$/.test(sourceText(child))) return { text: receipt ? `${argentinaTime(message.sent_at)} · ${messageReceiptLabel(receipt)}` : argentinaTime(message.sent_at) };
      return undefined;
    };
    return source(prototype, resolve, message.id);
  };

  /** Secciones del perfil (imágenes, archivos, enlaces) con las piezas del archivo repetidas por cada dato real. */
  const feature = (node: SourceNode, content: string): SourceBinding | undefined => {
    const titleNode = (label: string, kind: Shared['kind'] | null, total: number): SourceResolver => child => {
      if (leaf(child) && /^(About|Media \(\d+\)|Documents \(\d+\)|Links)$/.test(sourceText(child))) return { text: label };
      if (nodeName(child) === 'Button' && kind) return { onClick: () => setShowAll({ kind, title: label.replace(/ \(\d+\)$/, '') }), label: `Ver todos: ${label.replace(/ \(\d+\)$/, '').toLocaleLowerCase('es')}`, props: { disabled: !total, style: { opacity: total ? 1 : 0.5 } } };
      return undefined;
    };
    if (content.startsWith('About')) return { children: objects(node).map((child, index) => source(child, part => titleNode('Acerca de', null, 0)(part) ?? (leaf(part) && sourceText(part).startsWith('A certified') ? { text: 'Este hilo privado con tu nutricionista conserva tus consultas, indicaciones y archivos. Si necesitás cambiar un turno, escribilo acá.' } : undefined), index)) };
    if (content.startsWith('Media')) return { children: objects(node).map((child, index) => source(child, part => {
      const title = titleNode(`Imágenes (${images.length})`, 'media', images.length)(part); if (title) return title;
      if (nodeName(part) === 'Row') {
        const tiles = objects(part).filter(tile => /^Media \d$/.test(nodeName(tile))); kitFromPanel([], tiles, kit.current); const fade = objects(part).find(tile => !/^Media \d$/.test(nodeName(tile)));
        if (!images.length) return { children: <EmptyState text="Todavía no compartieron imágenes." /> };
        return { children: <>{images.slice(-tiles.length).reverse().map((message, position) => imageTile(tiles[position % tiles.length], message, patient.id, message.id))}{images.length > tiles.length && fade && source(fade, () => undefined, 'fade')}</> };
      }
      return undefined;
    }, index)) };
    if (content.startsWith('Documents')) return { children: objects(node).map((child, index) => source(child, part => {
      const title = titleNode(`Archivos (${documents.length})`, 'docs', documents.length)(part); if (title) return title;
      if (nodeName(part) === 'List Docs') {
        const rows = objects(part); kitFromPanel(rows, [], kit.current);
        if (!documents.length) return { children: <EmptyState text="Todavía no compartieron archivos." /> };
        return { children: documents.slice(-rows.length).reverse().map((message, position) => documentRow(rows[position % rows.length], message, patient.id, message.id)) };
      }
      return undefined;
    }, index)) };
    if (content.startsWith('Links')) return { children: objects(node).map((child, index) => source(child, part => {
      const title = titleNode('Enlaces', 'links', links.length)(part); if (title) return title;
      if (nodeName(part) === 'List Docs') {
        const rows = objects(part);
        if (!links.length) return { children: <EmptyState text="Todavía no compartieron enlaces." /> };
        return { children: links.slice(0, rows.length).map((url, position) => linkRow(rows[position % rows.length], url)) };
      }
      return undefined;
    }, index)) };
    return undefined;
  };
  const linkRow = (row: SourceNode, url: string): ReactNode => {
    const icons = objects(row).filter(piece => nodeName(piece) === 'Icon');
    return source(row, item => {
      if (leaf(item) && objects(row).some(piece => nodeName(piece) === 'Main' && descendants(piece).includes(item))) return { tag: 'a', text: url.replace(/^https:\/\//, ''), props: { href: url, title: url, target: '_blank', rel: 'noopener noreferrer', style: { maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' } } };
      if (item === icons[1]) return { onClick: () => { void navigator.clipboard?.writeText(url).then(() => announce('Enlace copiado.')).catch(() => setError('No se pudo copiar el enlace.')); }, label: `Copiar ${url}` };
      return undefined;
    }, url);
  };

  const resolver: SourceResolver = node => {
    const name = nodeName(node); const content = sourceText(node);
    // Los tres botones del archivo son teléfono, videollamada y panel. Cada ícono lleva la acción que mejor le queda:
    // contactar (escribir), la consulta por video y el panel (actualizar). Adjuntar queda sólo en el campo de texto.
    if (name === 'Buttons' && objects(node).length === 3) return { children: objects(node).map((child, index) => source(child, current => current === child ? {
      onClick: actions[index].onClick, label: actions[index].label, props: { disabled: busy || pending },
    } : undefined, index)) };
    if (name === 'Section Messages') return { props: { style: { alignSelf: 'stretch' } } };
    if (name === 'List Messages') {
      const items = objects(node).filter(child => nodeName(child) === 'Item List Message');
      const prototype = (unread ? items.find(child => has(child, 'Div Red')) : items.find(child => /bg-\[#f9f4f2\]/.test(String(child.props.className)))) ?? items[0];
      const style = { flex: '1 1 auto' };
      if (!prototype || (unreadOnly && !unread)) return { props: { style }, children: <EmptyState text="No hay conversaciones sin leer." /> };
      return { props: { style }, children: source(prototype, child => {
        if (child === prototype) return { ...writeToNutritionist, label: `Conversación con mi nutricionista${unread ? `, ${unread} sin leer` : ''}`, props: { style: { background: '#f9f4f2', textAlign: 'left' } } };
        if (nodeName(child) === 'User Info') return { children: objects(child).map((part, index) => source(part, () => ({ text: index === 0 ? 'Tu nutricionista' : index === 1 ? '-' : 'Nutricionista' }), index)) };
        if (leaf(child) && /^(\d{1,2}:\d{2} (AM|PM)|Yesterday)$/.test(sourceText(child))) return { text: latest ? listTime(latest.sent_at, now) : '' };
        if (leaf(child) && /^\d+$/.test(sourceText(child))) return { text: unreadBadge(Math.floor(unread)) ?? '0' };
        if (leaf(child) && sourceText(child).length > 20) return { text: latest ? (latest.text || latest.attachment?.filename || 'Adjunto') : 'Todavía no hay mensajes. Escribile a tu nutricionista.' };
        return undefined;
      }, 'conversation') };
    }
    if (name === 'Chat Area') {
      const parts = objects(node);
      const badge = parts.find(child => nodeName(child) === 'Section Badge');
      const incoming = parts.find(child => has(child, 'Bubble') && !has(child, 'Footer'));
      const outgoing = parts.find(child => has(child, 'Bubble') && has(child, 'Footer'));
      const desktop = idEnds(node, '198:6007'); const dayKeys = messages.map(item => argentinaDay(new Date(item.sent_at)));
      return { props: { ref: chat, role: 'log', 'aria-label': 'Conversación', style: { overflowY: 'auto', justifyContent: 'flex-start', ...(desktop ? { maxHeight: 674 } : {}) } }, children: messages.length ? <>
        <div aria-hidden="true" style={{ marginTop: 'auto' }} />
        {messages.map((message, index) => {
          const day = dayKeys[index];
          const prototype = message.from === 'patient' ? outgoing : incoming;
          const newDay = Boolean(day) && (index === 0 || dayKeys[index - 1] !== day);
          return <div key={message.id} className="contents">{newDay && badge && source(badge, child => leaf(child) ? { text: dayLabel(message.sent_at, now) } : undefined, `day-${message.id}`)}{prototype && renderMessage(prototype, message)}</div>;
        })}
      </> : <EmptyState text={search ? 'No hay mensajes que coincidan.' : 'Todavía no hay mensajes. Escribile a tu nutricionista.'} /> };
    }
    if (name === 'Input-search' && content === 'Type a message..') {
      const [icon, textArea] = objects(node); const originalText = descendants(node).find(child => leaf(child) && sourceText(child) === 'Type a message..');
      return { children: <>
        {/* El archivo dibuja una lupa; adjuntar usa el «+» del propio archivo (Icon/Plus) en el mismo marco del ícono. */}
        {icon && source(icon, child => child === icon ? { onClick: () => picker.current?.click(), label: MESSAGE_LABELS.attach, props: { disabled: busy || pending }, children: objects(icon).map((piece, order) => source(piece, inner => inner.tag === 'img' ? { props: { src: ATTACH_ICON } } : undefined, order)) } : undefined, 'attach')}
        {textArea && source(textArea, child => child === textArea ? { props: { style: { flexDirection: 'column', alignItems: 'stretch' } }, children: <>
          <textarea disabled={busy || pending} ref={compose} aria-label="Escribir mensaje" placeholder="Escribí un mensaje…" maxLength={2000} rows={1} value={text} onChange={event => setText(event.target.value)} onKeyDown={keyDown} className={String(originalText?.props.className ?? '')} style={{ flex: 'none', width: '100%', border: 0, background: 'transparent', resize: 'none', color: '#272932', outlineOffset: 3 }} />
          {file && <span className="flex items-center gap-[6px] font-['Poppins:Regular'] text-[11px] leading-[1.3] text-[#52545b]">Adjunto: {file.name}<button type="button" disabled={busy || pending} onClick={clearFile} className="underline">Quitar</button></span>}
        </> } : undefined, 'text')}
      </> };
    }
    const input = searchBinding(node, search, setSearch, 'Buscar mensajes'); if (input && content !== 'Type a message..') return input;
    if (/Button/.test(name) && content === 'Send') return { onClick: () => void send(), label: 'Enviar mensaje', props: { disabled: busy || pending || (!text.trim() && !file) } };
    if (/Button/.test(name) && content === 'New Message') return writeToNutritionist;
    if (name === 'Button Icon' && (idEnds(node, '198:5973') || idEnds(node, '433:20363'))) return toggleUnread;
    if (name === 'Button Icon' && idEnds(node, '445:8570')) return writeToNutritionist;
    // El lápiz del perfil es «escribir»: abre el campo de texto.
    if (name === 'Button More' && idEnds(node, '2:4233')) return { onClick: write, label: MESSAGE_LABELS.compose };
    if (name === 'Section Features') return feature(node, content);
    if (leaf(node) && content === 'Alex Foster') return { text: 'Tu nutricionista' };
    if (leaf(node) && content === 'Personal Trainer') return { text: 'Nutricionista' };
    if (leaf(node) && content === 'last seen recently') return { text: latest?.from === 'vero' ? `Último mensaje: ${listTime(latest.sent_at, now)}` : 'Conversación privada' };
    return undefined;
  };
  return <FramePair nodes={['84:2565', '433:19982']} resolve={resolver} patientName={patient.name} onNavigate={onNavigate} onSignOut={onSignOut} unread={unread}>
    <input disabled={busy || pending} ref={picker} type="file" accept={CHAT_ATTACHMENT_ACCEPT} onChange={event => pick(event.target.files?.[0] ?? null)} className="hidden" aria-label="Archivo adjunto" />
    {error && <Stateful error={error} />}{notice.text && <p role="status" className={notice.loud ? 'mx-[24px] p-[16px] text-[#272932]' : undefined} style={notice.loud ? undefined : SR_ONLY}>{notice.text}</p>}
    {showAll && <FigmaRecordDialog title={showAll.title} onClose={() => setShowAll(null)}>
      {showAll.kind === 'links' ? <ul className="flex flex-col gap-[8px]">{links.map(url => <li key={url}><a href={url} target="_blank" rel="noopener noreferrer" className="break-all text-[14px] underline">{url}</a></li>)}</ul>
        : <ul className="flex flex-col gap-[8px]">{(showAll.kind === 'media' ? images : documents).slice().reverse().map(message => <li key={message.id}><Attachment patientId={patient.id} messageId={message.id} attachment={message.attachment!} /><span className="text-[11px] text-[#8a8c90]">{fileSize(message.attachment!.byte_size) ? `${fileSize(message.attachment!.byte_size)} · ` : ''}{listTime(message.sent_at, now)}</span></li>)}</ul>}
    </FigmaRecordDialog>}
  </FramePair>;
}
