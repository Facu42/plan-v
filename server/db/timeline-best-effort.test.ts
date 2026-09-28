import { describe, expect, it, vi } from 'vitest';

const insert = vi.fn();
vi.mock('./supabase-client.ts', () => ({
  getRequestDb: () => ({ from: () => ({ insert }) }),
  privilegedDb: () => null,
}));

const { sbAddTimelineEvent, sbAddTimelineEventBestEffort } = await import('./supabase-repo.js');

describe('línea de tiempo en acciones de la paciente', () => {
  it('no corta la acción si RLS rechaza el evento (antes: comida guardada y error 500)', async () => {
    insert.mockResolvedValue({ error: { code: '42501', message: 'new row violates row-level security policy' } });
    await expect(sbAddTimelineEvent('pat-1', { kind: 'meal_logged', title: 'Almuerzo', body: '' })).rejects.toMatchObject({ code: '42501' });
    await expect(sbAddTimelineEventBestEffort('pat-1', { kind: 'meal_logged', title: 'Almuerzo', body: '' })).resolves.toBeUndefined();
  });
});
