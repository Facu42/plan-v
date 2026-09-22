import { describe, expect, it, vi } from 'vitest';
import { sendShowroomMessage } from './message-send';

const input = { patientId: 'p1', text: '  Hola  ', role: 'patient' as const };
const dependencies = () => ({ send: vi.fn().mockResolvedValue(undefined), refresh: vi.fn().mockResolvedValue(undefined) });

describe('mensajes operativos del diseño Nutrigo', () => {
  it('envía texto limpio al paciente elegido y refresca sólo ese registro', async () => {
    const deps = dependencies();
    expect(await sendShowroomMessage(input, deps)).toBe('sent');
    expect(deps.send).toHaveBeenCalledWith('p1', 'Hola', 'patient', false, undefined);
    expect(deps.refresh).toHaveBeenCalledWith('p1');
  });
  it('la profesional envía como humana, nunca como sugerencia IA', async () => {
    const deps = dependencies();
    await sendShowroomMessage({ ...input, role: 'pro', patientId: 'p2' }, deps);
    expect(deps.send).toHaveBeenCalledWith('p2', 'Hola', 'vero', false, undefined);
  });
  it.each([' ', 'a'.repeat(2001)])('rechaza textos vacíos o demasiado largos', async (text) => {
    const deps = dependencies();
    await expect(sendShowroomMessage({ ...input, text }, deps)).rejects.toThrow();
    expect(deps.send).not.toHaveBeenCalled();
  });
  it('no refresca ni anuncia éxito si el envío falla', async () => {
    const deps = dependencies();
    deps.send.mockRejectedValue(new Error('Sin conexión'));
    await expect(sendShowroomMessage(input, deps)).rejects.toThrow('Sin conexión');
    expect(deps.refresh).not.toHaveBeenCalled();
  });
  it('distingue envío guardado de fallo de refresco para evitar reenvíos duplicados', async () => {
    const deps = dependencies();
    deps.refresh.mockRejectedValue(new Error('Sin conexión'));
    expect(await sendShowroomMessage(input, deps)).toBe('sent-refresh-failed');
    expect(deps.send).toHaveBeenCalledTimes(1);
  });
  it('reenvía el mismo client_id para no duplicar el mensaje', async () => {
    const deps = dependencies();
    const clientId = '11111111-1111-4111-8111-111111111111';
    await sendShowroomMessage({ ...input, client_id: clientId }, deps);
    expect(deps.send).toHaveBeenCalledWith('p1', 'Hola', 'patient', false, clientId);
  });
  it('permite enviar un adjunto autorizado sin texto', async () => {
    const deps = dependencies();
    await sendShowroomMessage({
      patientId: 'p1',
      text: '   ',
      role: 'patient',
      asset_id: '11111111-1111-4111-8111-111111111111',
      filename: 'merienda.png',
    }, deps);
    expect(deps.send).toHaveBeenCalledWith('p1', '', 'patient', false, undefined, {
      asset_id: '11111111-1111-4111-8111-111111111111',
      filename: 'merienda.png',
    });
  });
});
