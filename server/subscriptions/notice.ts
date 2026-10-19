import { webhookSignatureOk } from './logic.js';

export type NoticeInput = {
  dataId: string;
  requestId: string;
  signature: string;
  secret: string | undefined;
  now: number;
  topic: string;
  action: string | null;
  notificationId: string | null;
  userId: string | null;
  liveMode: boolean | null;
};

export type StoredNotice = NoticeInput & { signatureValid: boolean; status: 'queued' | 'ignored' };

/** Guarda el aviso y contesta enseguida. La firma inválida no se procesa. */
export async function acceptNotice(
  input: NoticeInput,
  save: (row: StoredNotice) => Promise<'saved' | 'duplicate'>,
): Promise<200 | 401 | 501> {
  if (!input.secret) return 501;
  const signatureValid = webhookSignatureOk({
    id: input.dataId,
    requestId: input.requestId,
    signature: input.signature,
    secret: input.secret,
    now: input.now,
  });
  if (!signatureValid) {
    if (input.topic && input.dataId) await save({ ...input, signatureValid: false, status: 'ignored' });
    return 401;
  }
  await save({ ...input, signatureValid: true, status: 'queued' });
  return 200;
}
