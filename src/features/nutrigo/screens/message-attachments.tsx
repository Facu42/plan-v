import { useRef, useState, type ReactNode } from 'react';
import { sourceText, type SourceNode } from '../SourceView';
import { openChatAttachment } from '../../../api/assets';
import type { MessageAttachment } from '../../../types';
import { errorText, leaf, objects, source } from './shared';
import { argentinaTime } from './ar-time';
import { fileSize, openedAttachmentUrl } from './message-format';

/** Piezas del archivo que hacen de adjunto: la fila «Item List Docs» y los tiles «Media N» del panel de perfil. */
export type AttachmentKit = { doc?: SourceNode; tiles: SourceNode[] };
export type SharedMessage = { id: string; from: 'vero' | 'patient'; sent_at: string; attachment?: MessageAttachment };

const COVER = 'absolute inset-0 z-[1] flex items-end justify-end rounded-[inherit] p-[6px] text-[10px] text-[#272932]';
const CHIP = 'rounded-[6px] bg-[#fefcfb] px-[6px] py-[2px]';

/** Abre el adjunto real con candado anti doble clic y sólo con una dirección segura. */
function useOpenAttachment(patientId: string, messageId: string) {
  const [url, setUrl] = useState<string | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const lock = useRef(false);
  const open = async () => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { setUrl(openedAttachmentUrl(await openChatAttachment(patientId, messageId))); } catch (caught) { setError(errorText(caught)); } finally { lock.current = false; setBusy(false); }
  };
  return { url, busy, error, open };
}

/** Respaldo si el archivo no trajera la pieza: texto con la acción de abrir. */
export function Attachment({ patientId, messageId, attachment }: { patientId: string; messageId: string; attachment: MessageAttachment }) {
  const { url, busy, error, open } = useOpenAttachment(patientId, messageId);
  if (attachment.available === false) return <p className="text-[12px]">El adjunto ya no está disponible.</p>;
  return <div className="text-[12px]">{url ? <a href={url} target="_blank" rel="noopener noreferrer" className="underline">Abrir {attachment.filename}</a> : <button type="button" disabled={busy} onClick={() => void open()} className="underline">{busy ? 'Preparando…' : `Ver adjunto: ${attachment.filename}`}</button>}{error && <p role="alert">{error}</p>}</div>;
}

/** Capa clickeable sobre una pieza del archivo (tile o fila de documento) que abre el adjunto real. `label` hace único su nombre accesible. */
export function AttachmentCover({ patientId, messageId, attachment, label, preview = false }: { patientId: string; messageId: string; attachment: MessageAttachment; label?: string; preview?: boolean }) {
  const { url, busy, error, open } = useOpenAttachment(patientId, messageId);
  if (attachment.available === false) return <span className={COVER} title="El adjunto ya no está disponible."><span className="sr-only">{attachment.filename}: ya no está disponible</span></span>;
  if (url) return <>{preview && <img src={url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />}<a href={url} target="_blank" rel="noopener noreferrer" aria-label={`Abrir ${attachment.filename}`} className={COVER}><span className={`${CHIP} underline`}>Abrir</span></a></>;
  return <button type="button" disabled={busy} onClick={() => void open()} aria-label={label ?? `Ver adjunto: ${attachment.filename}`} title={error || attachment.filename} className={COVER}>{busy && <span className={CHIP}>Preparando…</span>}{error && <span role="alert" className={`${CHIP} text-[#a32929]`}>No se pudo abrir</span>}</button>;
}

const ownerLabel = (message: SharedMessage) => message.from === 'patient' ? 'enviado por vos' : 'de tu nutricionista';

/** Fila original de documento con el nombre (recortado con puntos suspensivos), el tamaño sin NaN y la acción de abrir. */
export function documentRow(row: SourceNode, message: SharedMessage, patientId: string, key: string | number, label?: string): ReactNode {
  const attachment = message.attachment!; const size = fileSize(attachment.byte_size);
  const gone = attachment.available === false ? { opacity: 0.5 } : undefined;
  return source(row, item => item !== row ? undefined : { props: { style: gone }, children: <>{objects(row).map((piece, order) => source(piece, inner =>
    leaf(inner) && /\.(pdf|xls)$/.test(sourceText(inner)) ? { text: attachment.filename, props: { title: attachment.filename, style: { width: '100%' } } }
      : leaf(inner) && /mb$/.test(sourceText(inner)) ? { text: `${size ? `${size} · ` : ''}${ownerLabel(message)}` } : undefined, order))}
    <AttachmentCover patientId={patientId} messageId={message.id} attachment={attachment} label={label} /></> }, key);
}

/** Tile original «Media N» con el nombre del archivo y la acción de abrir; al abrir, muestra la imagen real. */
export function imageTile(tile: SourceNode, message: SharedMessage, patientId: string, key: string | number, label?: string): ReactNode {
  const attachment = message.attachment!;
  const gone = attachment.available === false ? { opacity: 0.5 } : undefined;
  return source(tile, node => node !== tile ? undefined : { props: { style: gone }, children: <><span className="absolute inset-x-[6px] top-[6px] truncate font-['Poppins:Regular'] text-[10px] leading-[1.3] text-[#52545b]">{attachment.filename}</span><AttachmentCover patientId={patientId} messageId={message.id} attachment={attachment} label={label} preview /></> }, key);
}

/** Primer tile del kit: los tiles del archivo son iguales en tamaño y borde. */
export const kitFromPanel = (rows: readonly SourceNode[], tiles: readonly SourceNode[], current: AttachmentKit): void => { if (rows[0]) current.doc = rows[0]; if (tiles.length) current.tiles = [...tiles]; };

/** Adjunto dentro de la burbuja: documento o imagen con las piezas originales; sin ellas, el texto de respaldo. */
export function BubbleAttachment({ kit, patientId, message }: { kit: { current: AttachmentKit }; patientId: string; message: SharedMessage }) {
  const attachment = message.attachment!;
  const label = `Abrir ${attachment.filename} (mensaje de ${argentinaTime(message.sent_at) || 'fecha desconocida'})`;
  const { doc, tiles } = kit.current;
  if (attachment.kind === 'image' && tiles[0]) return <>{imageTile(tiles[0], message, patientId, `bubble-${message.id}`, label)}</>;
  if (attachment.kind !== 'image' && doc) return <>{documentRow(doc, message, patientId, `bubble-${message.id}`, label)}</>;
  return <Attachment patientId={patientId} messageId={message.id} attachment={attachment} />;
}
