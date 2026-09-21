import { request } from './client';

export const CHAT_ATTACHMENT_ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf';
export const CHAT_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
const CHAT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const;

function audience(professional: boolean) {
  return professional ? '?audience=pro' : '';
}

export function assertChatFile(file: File) {
  if (file.size > CHAT_ATTACHMENT_MAX_BYTES) throw new Error('El adjunto debe pesar menos de 10 MB.');
  if (!CHAT_TYPES.includes(file.type as (typeof CHAT_TYPES)[number])) {
    throw new Error('Usá un archivo JPG, PNG, WebP o PDF.');
  }
}

function readDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('No pudimos leer el archivo.'));
    reader.readAsDataURL(file);
  });
}

export async function uploadChatAttachment(patientId: string, file: File, professional: boolean) {
  assertChatFile(file);
  const dataUrl = await readDataUrl(file);
  const suffix = audience(professional);
  const reserved = await request<{ intent: { id: string } }>(`/api/assets/upload-intents${suffix}`, {
    method: 'POST',
    body: JSON.stringify({
      patient_id: patientId,
      category: 'chat_attachment',
      mime_declared: file.type,
    }),
  });
  await request(`/api/assets/${reserved.intent.id}/content${suffix}`, {
    method: 'PUT',
    body: JSON.stringify({ patient_id: patientId, file: dataUrl }),
  });
  const completed = await request<{ asset: { id: string; mime: string } }>(
    `/api/assets/${reserved.intent.id}/complete${suffix}`,
    { method: 'POST', body: JSON.stringify({ patient_id: patientId }) },
  );
  return { asset_id: completed.asset.id, filename: file.name, mime: completed.asset.mime };
}

export function openChatAttachment(patientId: string, messageId: string) {
  return request<{ url: string; expires_in: number; mime: string; filename: string }>(
    `/api/patients/${encodeURIComponent(patientId)}/messages/${encodeURIComponent(messageId)}/attachment`,
    { method: 'POST' },
  );
}
