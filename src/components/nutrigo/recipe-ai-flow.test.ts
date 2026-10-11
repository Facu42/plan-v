import { describe, expect, it, vi } from 'vitest';
import type { AiJobView } from '../../types/ai-jobs';
import { recoverableRecipeJob, waitForRecipeProposal } from './recipe-ai-flow';

const job = (status: AiJobView['status'], extra: Partial<AiJobView> = {}) => ({
  id: 'proposal-1', status, error_code: null, artifact: status === 'succeeded'
    ? { kind: 'recipe_draft', payload: { id: 'recipe-1' } } : null, ...extra,
} as AiJobView);

describe('Espera de propuestas de recetas', () => {
  it('espera la cola y la ejecución sin volver a generar', async () => {
    const get = vi.fn().mockResolvedValueOnce({ job: job('running') }).mockResolvedValueOnce({ job: job('succeeded') });
    const progress = vi.fn();
    const result = await waitForRecipeProposal(job('queued'), { get, onProgress: progress, pause: async () => {}, maxPolls: 3 });
    expect(result.artifact?.payload.id).toBe('recipe-1');
    expect(get).toHaveBeenCalledTimes(2);
    expect(progress.mock.calls.map(([j]) => j.status)).toEqual(['queued', 'running', 'succeeded']);
  });
  it('no consulta de nuevo una propuesta completa', async () => {
    const get = vi.fn();
    await waitForRecipeProposal(job('succeeded'), { get });
    expect(get).not.toHaveBeenCalled();
  });
  it.each(['failed', 'cancelled', 'stale'] as const)('impide usar una propuesta %s', async status => {
    await expect(waitForRecipeProposal(job(status), { get: vi.fn() })).rejects.toThrow();
  });
  it('explica un cambio de contexto y rechaza un resultado de otro tipo', async () => {
    await expect(waitForRecipeProposal(job('failed', { error_code: 'stale_context' }), { get: vi.fn() })).rejects.toThrow('información');
    await expect(waitForRecipeProposal(job('succeeded', { artifact: { kind: 'menu_draft', payload: {}, id: 'a', created_at: '' } }), { get: vi.fn() })).rejects.toThrow('receta');
  });
  it('una espera agotada conserva la propuesta para consultarla, sin éxito falso', async () => {
    const get = vi.fn().mockResolvedValue({ job: job('running') });
    await expect(waitForRecipeProposal(job('queued'), { get, pause: async () => {}, maxPolls: 2 })).rejects.toThrow('Consultar propuesta');
    expect(get).toHaveBeenCalledTimes(2);
  });
  it('detiene las consultas si se cierra la vista', async () => {
    const controller = new AbortController(); controller.abort();
    const get = vi.fn();
    await expect(waitForRecipeProposal(job('queued'), { get, signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
    expect(get).not.toHaveBeenCalled();
  });
});

describe('Recuperar una propuesta de receta después de recargar', () => {
  const at = (status: AiJobView['status'], id: string, created_at: string, extra: Partial<AiJobView> = {}) => job(status, { id, created_at, job_type: 'recipe_draft', applied_at: null, ...extra });
  it('elige la propuesta de receta más reciente que todavía se puede abrir', () => {
    expect(recoverableRecipeJob([
      at('succeeded', 'vieja', '2026-10-09T10:00:00Z'),
      at('running', 'nueva', '2026-10-10T10:00:00Z'),
      job('queued', { id: 'menu', created_at: '2026-10-10T11:00:00Z', job_type: 'menu_draft', applied_at: null }),
    ])?.id).toBe('nueva');
  });
  it('ignora las ya abiertas, fallidas, canceladas o hechas con datos viejos', () => {
    expect(recoverableRecipeJob([
      at('succeeded', 'abierta', '2026-10-10T10:00:00Z', { applied_at: '2026-10-10T10:01:00Z' }),
      at('failed', 'fallida', '2026-10-10T10:00:00Z'),
      at('cancelled', 'cancelada', '2026-10-10T10:00:00Z'),
      at('stale', 'vieja', '2026-10-10T10:00:00Z'),
    ])).toBeNull();
  });
});
