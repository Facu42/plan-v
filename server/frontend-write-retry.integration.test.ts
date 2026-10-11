import { beforeEach, expect, it, vi } from 'vitest';
import { app } from './index.js';
import { getPatient, resetStore } from './store.js';
import { resetPrivateAssets } from './assets/repository.js';
import { createMessageWrite } from '../src/features/nutrigo/screens/message-write';
import { createPendingWrite } from '../src/features/nutrigo/screens/pending-write';
import { assertChatFile } from '../src/api/chat-file';

const patientId = 'pat-sofia';
const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3uoAAAAASUVORK5CYII=';
const call = (path: string, data: unknown, method = 'POST') => app.request(path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
beforeEach(() => { resetStore(); resetPrivateAssets(); });

it('recupera un mensaje con adjunto realmente guardado cuya respuesta se perdió, sin subir otro archivo', async () => {
  const upload = vi.fn(async () => {
    const reserved = await call('/api/assets/upload-intents', { patient_id: patientId, category: 'chat_attachment', mime_declared: 'image/png' });
    expect(reserved.status).toBe(201); const { intent } = await reserved.json();
    expect((await call(`/api/assets/${intent.id}/content`, { patient_id: patientId, file: png }, 'PUT')).status).toBe(200);
    const completed = await call(`/api/assets/${intent.id}/complete`, { patient_id: patientId });
    expect(completed.status).toBe(200); const { asset } = await completed.json();
    return { asset_id: asset.id as string, filename: 'merienda.png' };
  });
  let first = true;
  const send = vi.fn(async (_patient: string, text: string, from: string, _ai: boolean, client_id?: string, attachment?: { asset_id: string; filename: string }) => {
    const response = await call(`/api/patients/${patientId}/messages`, { text, from, client_id, ...attachment });
    expect(response.status).toBe(200);
    if (first) { first = false; throw new TypeError('Respuesta perdida después del guardado'); }
    return response.json();
  });
  const refresh = vi.fn().mockResolvedValue(undefined);
  const write = createMessageWrite(patientId, { upload, send, refresh });
  const original = { text: 'Archivo ficticio', file: new File(['fixture'], 'merienda.png', { type: 'image/png' }), client_id: '55555555-5555-4555-8555-555555555555' };
  await expect(write.run(original)).rejects.toThrow('Respuesta perdida');
  expect(write.pending).toBe(true);
  expect(await write.run({ text: 'No reemplazar el mensaje pendiente', file: null, client_id: '66666666-6666-4666-8666-666666666666' })).toBe('sent');
  expect(upload).toHaveBeenCalledTimes(1); expect(send.mock.calls[1]).toEqual(send.mock.calls[0]);
  expect(refresh).toHaveBeenCalledTimes(1); expect(write.pending).toBe(false);
  expect(getPatient(patientId)!.messages.filter(message => message.text === original.text)).toHaveLength(1);
});

it('reintenta Compras con el producto y el identificador originales después de perder la respuesta guardada', async () => {
  let first = true;
  type Input = { name: string; quantity: number; unit: string; client_id: string };
  const write = createPendingWrite(async (input: Input) => {
    const response = await call(`/api/patients/${patientId}/shopping/items`, input);
    expect(response.status).toBe(201);
    if (first) { first = false; throw new TypeError('Respuesta perdida'); }
    return response.json();
  });
  const original = { name: 'Tomate ficticio', quantity: 2, unit: 'u', client_id: '77777777-7777-4777-8777-777777777777' };
  await expect(write.run(original)).rejects.toThrow('Respuesta perdida');
  const saved = await write.run({ ...original, name: 'Edición posterior', quantity: 9, client_id: '88888888-8888-4888-8888-888888888888' });
  expect(saved.list.items.filter((item: { name: string }) => item.name === original.name)).toHaveLength(1);
  expect(saved.list.items.some((item: { name: string }) => item.name === 'Edición posterior')).toBe(false);
  expect(write.pending).toBe(false);
});

it('dos clics mientras se guarda comparten la misma operación; sólo el próximo guardado usa otro contenido', async () => {
  let release!: (value: string) => void;
  const execute = vi.fn((input: string) => new Promise<string>(resolve => { release = () => resolve(input); }));
  const write = createPendingWrite(execute);
  const first = write.run('Primero'); const duplicate = write.run('Segundo');
  expect(duplicate).toBe(first); await Promise.resolve(); expect(execute).toHaveBeenCalledTimes(1);
  release('Primero'); expect(await first).toBe('Primero'); expect(write.pending).toBe(false);
  const next = write.run('Tercero'); await Promise.resolve(); release('Tercero');
  expect(await next).toBe('Tercero'); expect(execute.mock.calls).toEqual([['Primero'], ['Tercero']]);
});

it('un fallo al preparar el archivo permite corregirlo porque aún no comenzó la escritura del mensaje', async () => {
  const upload = vi.fn().mockRejectedValueOnce(new Error('Archivo rechazado')).mockResolvedValue({ asset_id: 'asset-corrected', filename: 'correcto.png' });
  const send = vi.fn().mockResolvedValue(undefined); const refresh = vi.fn().mockResolvedValue(undefined);
  const write = createMessageWrite(patientId, { upload, send, refresh });
  const file = new File(['fixture'], 'incorrecto.png', { type: 'image/png' });
  await expect(write.run({ text: 'Conservar texto', file, client_id: 'first' })).rejects.toThrow('Archivo rechazado');
  expect(write.pending).toBe(false); expect(send).not.toHaveBeenCalled();
  expect(await write.run({ text: 'Texto corregido', file, client_id: 'corrected' })).toBe('sent');
  expect(send).toHaveBeenCalledWith(patientId, 'Texto corregido', 'patient', false, 'corrected', { asset_id: 'asset-corrected', filename: 'correcto.png' });
});

it('un nombre de archivo fuera del contrato se rechaza antes del envío y permite quitarlo o corregirlo', async () => {
  const file = new File(['fixture'], 'a'.repeat(81) + '.png', { type: 'image/png' });
  expect(() => assertChatFile(file)).toThrow('80 caracteres');
  const upload = vi.fn().mockResolvedValue({ asset_id: 'asset', filename: file.name });
  const send = vi.fn().mockResolvedValue(undefined); const refresh = vi.fn().mockResolvedValue(undefined);
  const write = createMessageWrite(patientId, { upload, send, refresh });
  await expect(write.run({ text: 'Conservar texto', file, client_id: 'original' })).rejects.toThrow('80 caracteres');
  expect(send).not.toHaveBeenCalled(); expect(write.pending).toBe(false);
  expect(await write.run({ text: 'Sin adjunto', file: null, client_id: 'corrected' })).toBe('sent');
  expect(send).toHaveBeenCalledWith(patientId, 'Sin adjunto', 'patient', false, 'corrected');
});
