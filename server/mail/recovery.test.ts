import { describe, expect, it, vi } from 'vitest';
import { requestAccountRecovery } from './recovery.js';

describe('recuperación sin filtrar cuentas ni errores sensibles', () => {
  it('usa un destino explícito y registra sólo el estado operativo', async () => {
    const send = vi.fn().mockResolvedValue({ error: null });
    const log = vi.fn();
    await requestAccountRecovery('ana@example.test', 'https://planv.test/', send, log);
    expect(send).toHaveBeenCalledWith('ana@example.test', { redirectTo: 'https://planv.test/' });
    expect(log).toHaveBeenCalledWith('info', 'auth_recovery_requested', { status: 'accepted' });
  });
  it('no publica ni registra el mail, mensaje, contraseña o enlace cuando SMTP falla', async () => {
    const log = vi.fn();
    await requestAccountRecovery('ana@example.test', undefined, async () => ({ error: { code: 'email_address_not_authorized', message: 'ana@example.test token=secret' } }), log);
    expect(log).toHaveBeenCalledWith('warn', 'auth_recovery_failed', { status: 'delivery_unavailable' });
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/ana|secret|token=/);
  });
  it('conserva respuesta genérica ante error de transporte y límite del proveedor', async () => {
    const log = vi.fn();
    await expect(requestAccountRecovery('ana@example.test', undefined, async () => { throw Error('secret'); }, log)).resolves.toBeUndefined();
    expect(log).toHaveBeenLastCalledWith('warn', 'auth_recovery_failed', { status: 'transport_failed' });
    await requestAccountRecovery('ana@example.test', undefined, async () => ({ error: { status: 429 } }), log);
    expect(log).toHaveBeenLastCalledWith('warn', 'auth_recovery_failed', { status: 'rate_limited' });
  });
});
