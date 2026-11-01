import { describe, expect, it, vi } from 'vitest';
import { recordCallWithConsent, recordingAllowed, shouldQueueSummary, summaryCommand, summaryPhase } from './call-recording';

const audio = new Uint8Array([1, 2, 3]);

describe('audio de la llamada por la consulta existente', () => {
  it('sin permiso no abre la consulta ni manda audio', async () => {
    const start = vi.fn();
    const upload = vi.fn();
    const finish = vi.fn();
    const blocked = await recordCallWithConsent({ consented: ['care_relationship'], chunks: [audio], start, upload, finish });
    expect(blocked).toEqual({ recorded: false, reason: 'Sin permiso de grabación o de IA no se guarda el audio.' });
    expect(start).not.toHaveBeenCalled();
    expect(upload).not.toHaveBeenCalled();
    expect(recordingAllowed(['consultation_recording'])).toBe(false);
  });

  it('con permiso guarda el audio en la consulta y no resume antes de la transcripción', async () => {
    const start = vi.fn(async () => ({ id: 'sesion-1', revision: 1 }));
    const upload = vi.fn(async () => undefined);
    const finish = vi.fn(async () => undefined);
    const saved = await recordCallWithConsent({
      consented: ['consultation_recording', 'ai_consultation'],
      chunks: [audio],
      sessionId: '11111111-1111-4111-8111-111111111111',
      start, upload, finish,
    });
    expect(saved).toEqual({ recorded: true, sessionId: 'sesion-1' });
    expect(start).toHaveBeenCalledWith(expect.objectContaining({ action: 'start', source: 'capture', recording_version: 'consultation_recording.v1' }));
    expect(upload).toHaveBeenCalledWith('sesion-1', 0, audio);
    expect(finish).toHaveBeenCalledWith('sesion-1', 1, 1);
    expect(summaryPhase({ transcript: '', draft: '', tasks: [{ kind: 'chunk', status: 'running' }] })).toBe('working');
    expect(shouldQueueSummary({ transcript: '', draft: '', tasks: [{ kind: 'chunk', status: 'running' }] })).toBe(false);
    expect(shouldQueueSummary({ transcript: 'hola', draft: '', tasks: [{ kind: 'chunk', status: 'succeeded' }] })).toBe(true);
    expect(summaryCommand('11111111-1111-4111-8111-111111111111', 2).action).toBe('summarize');
    expect(summaryPhase({ transcript: 'hola', draft: 'Resumen privado', tasks: [] })).toBe('ready');
  });
});
