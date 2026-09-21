import { useEffect, useState } from 'react';
import { openChatAttachment } from '../../api/assets';
import type { MessageAttachment } from '../../types';

export function ChatAttachmentView({
  patientId,
  messageId,
  attachment,
}: {
  patientId: string;
  messageId: string;
  attachment: MessageAttachment;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setUrl(null);
    setError('');
  }, [messageId, attachment.asset_id]);
  if (attachment.available === false) {
    return <p className="nm-attach-missing">El adjunto ya no está disponible.</p>;
  }
  const open = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const grant = await openChatAttachment(patientId, messageId);
      if (attachment.kind === 'pdf') {
        window.open(grant.url, '_blank', 'noopener,noreferrer');
      } else {
        setUrl(grant.url);
      }
    } catch {
      setError('No pudimos abrir el adjunto.');
    } finally {
      setBusy(false);
    }
  };
  return <div className="nm-attach">
    <p className="nm-attach-name">{attachment.filename}</p>
    {url && attachment.kind === 'image' && <img src={url} alt={attachment.filename} />}
    {!url && <button type="button" className="nv-button nv-ghost" onClick={() => void open()} disabled={busy}>
      {busy ? 'Abriendo…' : attachment.kind === 'pdf' ? 'Abrir PDF' : 'Ver adjunto'}
    </button>}
    {error && <p role="alert">{error}</p>}
  </div>;
}
