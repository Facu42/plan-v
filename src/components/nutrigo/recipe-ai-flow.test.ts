import { describe, expect, it, vi } from 'vitest';
import type { AiJobView } from '../../types/ai-jobs';
import { waitForRecipeProposal } from './recipe-ai-flow';

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
