import { describe, expect, it, vi } from 'vitest';
import { schedulingApi, type SchedulingWorkspaceSnapshot } from '../../api/scheduling';
import { loadHomeScheduling } from './use-home-data';
vi.mock('../../api/scheduling', () => ({ schedulingApi: { workspace: vi.fn() } }));
const page = (ids: string[], more: boolean) => ({ bookings: ids.map(id => ({ id })), transfers: [], has_more: more }) as unknown as SchedulingWorkspaceSnapshot;
describe('reservas de Inicio sin conteos truncados', () => {
  it('agota las páginas antes de presentar el total y propaga la cancelación', async () => {
    const signal = new AbortController().signal;
    vi.mocked(schedulingApi.workspace).mockReset().mockResolvedValueOnce(page(['a','b'], true)).mockResolvedValueOnce(page(['c'], false));
    expect((await loadHomeScheduling(signal)).bookings.map(b => b.id)).toEqual(['a','b','c']);
    expect(schedulingApi.workspace).toHaveBeenNthCalledWith(2, 50, signal);
  });
  it('no convierte una página que falta en cero reservas', async () => {
    vi.mocked(schedulingApi.workspace).mockReset().mockResolvedValueOnce(page(['a'], true)).mockResolvedValueOnce(page([], true));
    await expect(loadHomeScheduling(new AbortController().signal)).rejects.toThrow('todas las reservas');
  });
  it('tolera páginas adicionales de transferencias sin ocultar las reservas ya leídas', async () => {
    vi.mocked(schedulingApi.workspace).mockReset().mockResolvedValueOnce(page(['a'], true)).mockResolvedValueOnce({ ...page([], true), transfers: [{ id: 't' }] } as SchedulingWorkspaceSnapshot).mockResolvedValueOnce(page([], false));
    expect((await loadHomeScheduling(new AbortController().signal)).bookings.map(b => b.id)).toEqual(['a']);
    expect(schedulingApi.workspace).toHaveBeenNthCalledWith(3, 100, expect.any(AbortSignal));
  });
});
