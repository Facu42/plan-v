import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';

const call = vi.hoisted(() => vi.fn());
vi.mock('./repository.js', () => ({ call: (...args: unknown[]) => call(...args) }));
const log = vi.hoisted(() => vi.fn());
vi.mock('../ops/log.js', () => ({ writeOpsLog: (...args: unknown[]) => log(...args) }));
const { registerAdminAudit } = await import('./audit.js');

function app(persistent = true) {
  const instance = new Hono();
  registerAdminAudit(instance, async () => persistent);
  instance.post('/api/admin/nutritionists', c => c.json({ nutritionist: { id: '00000000-0000-4000-a000-000000000001' } }, 201));
  instance.put('/api/admin/nutritionists/:id/override', c => c.json({ ok: true }));
  instance.post('/api/admin/nutritionists/:id/trial', c => c.json({ ok: true }));
  instance.get('/api/admin/me', c => c.json({ admin: true }));
  return instance;
}

beforeEach(() => { call.mockReset(); call.mockResolvedValue(null); });

describe('auditoría de acciones administrativas', () => {
  it.each([
    ['POST', '/api/admin/nutritionists', 'nutritionist.create'],
    ['PUT', '/api/admin/nutritionists/00000000-0000-4000-a000-000000000001/override', 'nutritionist.suspend'],
    ['POST', '/api/admin/nutritionists/00000000-0000-4000-a000-000000000001/trial', 'nutritionist.trial'],
  ])('registra inicio y resultado de %s %s sin copiar el cuerpo', async (method, path, action) => {
    const response = await app().request(path, { method, body: JSON.stringify({ override: 'suspended', note: 'dato clínico', password: 'clave secreta', email: 'privado@example.test' }) });
    expect(response.ok).toBe(true);
    expect(call).toHaveBeenCalledTimes(2);
    expect(call.mock.calls[0]).toEqual(['admin_record_audit', expect.objectContaining({ input_action: action, input_outcome: 'started' })]);
    expect(call.mock.calls[1][1]).toMatchObject({ request_id: call.mock.calls[0][1].request_id, input_outcome: 'succeeded' });
    expect(JSON.stringify(call.mock.calls)).not.toMatch(/clínico|secreta|privado@example/);
  });

  it('no ejecuta una acción si no se pudo registrar el inicio', async () => {
    call.mockRejectedValue(new Error('audit unavailable'));
    expect((await app().request('/api/admin/nutritionists', { method: 'POST' })).status).toBe(500);
    expect(call).toHaveBeenCalledTimes(1);
  });

  it('conserva la respuesta si falla el cierre, porque la acción ya pudo ocurrir', async () => {
    call.mockResolvedValueOnce(null).mockRejectedValueOnce(new Error('no copiar este error'));
    expect((await app().request('/api/admin/nutritionists', { method: 'POST' })).status).toBe(201);
    expect(log).toHaveBeenCalledWith('warn', 'admin_audit_incomplete', expect.objectContaining({ action: 'nutritionist.create' }));
    expect(JSON.stringify(log.mock.calls)).not.toContain('no copiar este error');
  });

  it('no persiste datos demo ni audita las lecturas', async () => {
    await app(false).request('/api/admin/nutritionists', { method: 'POST' });
    await app().request('/api/admin/me');
    expect(call).not.toHaveBeenCalled();
  });

  it('registra como fallida una acción que responde error', async () => {
    const instance = new Hono();
    registerAdminAudit(instance, async () => true);
    instance.post('/api/admin/nutritionists', c => c.json({ error: 'sin datos privados' }, 422));
    await instance.request('/api/admin/nutritionists', { method: 'POST' });
    expect(call.mock.calls[1][1]).toMatchObject({ input_outcome: 'failed' });
  });
});
