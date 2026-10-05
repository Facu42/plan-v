export const CHAT_ATTACHMENT_ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf';
export const CHAT_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
const CHAT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const;

export function assertChatFilename(filename: string) {
  if (!filename.trim() || filename.trim().length > 80) throw new Error('Usá un nombre de archivo de hasta 80 caracteres.');
}

export function assertChatFile(file: File) {
  assertChatFilename(file.name);
  if (file.size > CHAT_ATTACHMENT_MAX_BYTES) throw new Error('El adjunto debe pesar menos de 10 MB.');
  if (!CHAT_TYPES.includes(file.type as (typeof CHAT_TYPES)[number])) throw new Error('Usá un archivo JPG, PNG, WebP o PDF.');
}
