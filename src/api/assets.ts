import { request } from './client';
import { assertChatFile } from './chat-file';
export { assertChatFile, CHAT_ATTACHMENT_ACCEPT, CHAT_ATTACHMENT_MAX_BYTES } from './chat-file';

function audience(professional: boolean) {
  return professional ? '?audience=pro' : '';
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
