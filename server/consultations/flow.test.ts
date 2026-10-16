import { beforeEach, describe, expect, it } from 'vitest';
import { decodeConsultationWav } from './audio.js';
import { commandMemory, consultationMemoryView, resetConsultationMemory } from './memory.js';

const scope = { patientId: 'patient-a', nutritionistId: 'nutri-a', requestedBy: 'user-a' };
beforeEach(resetConsultationMemory);
describe('consultas: borrador privado y copia compartida', () => {
  it('no comparte notas ni transcripción y conserva la copia al editar', () => {
    const s = commandMemory(scope, { action: 'start', id: 'session-a', source: 'manual' });
    commandMemory(scope, { action: 'draft', id: s.id, expected_revision: 1, draft: 'Privado', transcript: 'Texto privado' });
    expect(consultationMemoryView(scope.patientId, false).sessions).toEqual([]);
    commandMemory(scope, { action: 'publish', id: s.id, expected_revision: 2, summary: 'Revisado' });
    commandMemory(scope, { action: 'draft', id: s.id, expected_revision: 2, draft: 'Cambió el privado', transcript: 'Otro texto' });
    const shared = consultationMemoryView(scope.patientId, false);
    expect(shared.shared[0].summary).toBe('Revisado');
    expect(JSON.stringify(shared)).not.toContain('Texto privado');
    expect(JSON.stringify(shared)).not.toContain('Cambió el privado');
  });
  it('rechaza paciente cruzado y revisión vieja', () => {
    commandMemory(scope, { action: 'start', id: 'session-a', source: 'manual' });
    expect(() => commandMemory({ ...scope, patientId: 'patient-b' }, { action: 'draft', id: 'session-a', expected_revision: 1, draft: 'x' })).toThrow();
    commandMemory(scope, { action: 'draft', id: 'session-a', expected_revision: 1, draft: 'x' });
    expect(() => commandMemory(scope, { action: 'draft', id: 'session-a', expected_revision: 1, draft: 'y' })).toThrow();
  });
  it('marca la captura incompleta sin audio remoto', () => {
    commandMemory(scope, { action: 'start', id: 'session-a', source: 'capture', microphone: true, remote_audio: false });
    const s = commandMemory(scope, { action: 'finish', id: 'session-a', expected_revision: 1, interrupted: false });
    expect(s.incomplete).toBe(true);
    expect(s.status).toBe('finished');
  });
});
describe('audio verificable, sin duración declarada por el cliente', () => {
  it('lee PCM mono 16 bits y rechaza contenedores truncados o inconsistentes', () => {
    const audio = new Uint8Array(44 + 32000); const v = new DataView(audio.buffer);
    const text = (s: string, at: number) => [...s].forEach((c, i) => v.setUint8(at+i, c.charCodeAt(0)));
    text('RIFF', 0); v.setUint32(4,audio.length-8,true); text('WAVEfmt ',8); v.setUint32(16,16,true);
    v.setUint16(20,1,true); v.setUint16(22,1,true); v.setUint32(24,16000,true); v.setUint32(28,32000,true);
    v.setUint16(32,2,true); v.setUint16(34,16,true); text('data',36); v.setUint32(40,32000,true);
    expect(decodeConsultationWav(audio).durationSeconds).toBe(1);
    expect(() => decodeConsultationWav(audio.slice(0,100))).toThrow();
    v.setUint16(22,8,true); expect(() => decodeConsultationWav(audio)).toThrow();
  });
});
