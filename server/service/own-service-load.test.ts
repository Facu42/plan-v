import { describe, expect, it, vi } from 'vitest';

const rows = vi.hoisted(() => ({ nutritionists: { id: 'n1' } as Record<string, unknown> | null, nutritionist_subscriptions: { trial_ends_on: '2026-10-30', paid_until: null, override: 'none', note: 'nota interna' } as Record<string, unknown> | null, platform_settings: { monthly_price: 20000 } }));
vi.mock('../db/supabase-client.js', () => ({
  isSupabaseEnabled: () => true,
  privilegedDb: () => ({
    from: (table: keyof typeof rows) => {
      const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: rows[table], error: null }) };
      return query;
    },
  }),
}));
const { loadOwnService } = await import('./own-service.js');

describe('loadOwnService', () => {
  it('en prueba vigente puede escribir y no expone la nota interna', async () => {
    const result = await loadOwnService('user', new Date('2026-10-15T15:00:00Z'));
    expect(result).toEqual({ state: 'prueba', until: '2026-10-30', days_left: 15, monthly_price: 20000, read_only: false });
  });
  it('vencida hace semanas sigue pudiendo escribir: el corte no es automático', async () => {
    expect(await loadOwnService('user', new Date('2026-12-30T15:00:00Z'))).toMatchObject({ state: 'cortada', read_only: false });
  });
  it('suspendida por el administrador queda en solo lectura', async () => {
    rows.nutritionist_subscriptions = { trial_ends_on: '2026-10-30', paid_until: null, override: 'suspended' };
    expect(await loadOwnService('user', new Date('2026-10-15T15:00:00Z'))).toMatchObject({ state: 'suspendida', read_only: true });
  });
  it('sin cargo nunca queda en solo lectura', async () => {
    rows.nutritionist_subscriptions = { trial_ends_on: '2026-01-01', paid_until: null, override: 'waived' };
    expect(await loadOwnService('user', new Date('2026-11-30T15:00:00Z'))).toMatchObject({ state: 'sin_cargo', read_only: false });
  });
  it('quien no es nutricionista no tiene servicio', async () => {
    rows.nutritionists = null;
    expect(await loadOwnService('user')).toBeNull();
  });
});
