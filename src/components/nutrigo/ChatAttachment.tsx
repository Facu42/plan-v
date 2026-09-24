import { useEffect, useState } from 'react';
import { FileText, FilePdf, FileXls, ImageSquare } from '@phosphor-icons/react';
import { openChatAttachment } from '../../api/assets';
import type { MessageAttachment } from '../../types';
import { fileExtension, formatBytes } from './message-panel';

type Props = {
  patientId: string;
  messageId: string;
  attachment: MessageAttachment;
  /** bubble: dentro del hilo (Image 148 / fila de documento). tile: miniatura de 92 del perfil. doc: fila "Item List Docs" del perfil. */
  variant?: 'bubble' | 'tile' | 'doc';
};

/** Abre el adjunto con un permiso de 60 s: PDF en otra pestaña, imagen en el lugar. */
function useAttachmentGrant(patientId: string, messageId: string, attachment: MessageAttachment) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setUrl(null);
    setError('');
  }, [messageId, attachment.asset_id]);
  const open = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const grant = await openChatAttachment(patientId, messageId);
      if (attachment.kind === 'pdf') window.open(grant.url, '_blank', 'noopener,noreferrer');
      else setUrl(grant.url);
    } catch {
      setError('No pudimos abrir el adjunto.');
    } finally {
      setBusy(false);
    }
  };
  return { url, error, busy, open };
}

export function DocGlyph({ filename, size = 24 }: { filename: string; size?: number }) {
  const ext = fileExtension(filename);
  const Glyph = ext === 'pdf' ? FilePdf : ext === 'xls' || ext === 'xlsx' || ext === 'csv' ? FileXls : FileText;
  return <Glyph size={size} aria-hidden />;
}

export function ChatAttachmentView({ patientId, messageId, attachment, variant = 'bubble' }: Props) {
  const { url, error, busy, open } = useAttachmentGrant(patientId, messageId, attachment);
  if (attachment.available === false) {
    return <p className="nm-attach-missing">El adjunto ya no está disponible.</p>;
  }
  const size = formatBytes(attachment.byte_size);
  if (attachment.kind !== 'image') {
    return <div className={`nm-attach nmf-doc${variant === 'bubble' ? ' nmf-doc-bubble' : ''}`}>
      <button type="button" onClick={() => void open()} disabled={busy} aria-label={`${busy ? 'Abriendo…' : 'Abrir PDF'}: ${attachment.filename}`}>
        <span className="nmf-doc-icon"><DocGlyph filename={attachment.filename} /></span>
        <span className="nmf-doc-main"><strong>{attachment.filename}</strong>{size && <small>{busy ? 'Abriendo…' : size}</small>}</span>
      </button>
      {error && <p role="alert">{error}</p>}
    </div>;
  }
  return <div className={`nm-attach nmf-image nmf-image-${variant}`}>
    {url
      ? <a href={url} target="_blank" rel="noopener noreferrer" className="nmf-image-frame" aria-label={`Abrir ${attachment.filename} en otra pestaña`}><img src={url} alt={attachment.filename} /></a>
      : <button type="button" className="nmf-image-frame" onClick={() => void open()} disabled={busy} aria-label={`${busy ? 'Abriendo…' : 'Ver adjunto'}: ${attachment.filename}`}>
        <ImageSquare size={variant === 'tile' ? 24 : 28} aria-hidden />
        <span>{busy ? 'Abriendo…' : 'Ver adjunto'}</span>
      </button>}
    {variant === 'bubble' && <p className="nm-attach-name">{attachment.filename}</p>}
    {error && <p role="alert">{error}</p>}
  </div>;
}
