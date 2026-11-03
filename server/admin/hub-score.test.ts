import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { ServiceBoard, ServiceNutritionist } from '../../src/types/service.js';
import { armarInicio, healthScore, mrrDesdeSuscripciones } from './hub-score.js';

const TODAY = '2026-10-31';

const nutri = (over: Partial<ServiceNutritionist> & { id: string }): ServiceNutritionist => ({
  display_name: 'Nutri',
  email: 'n@x.test',
  created_at: '2026-10-20T10:00:00Z',
  last_sign_in_at: '2026-10-28T10:00:00Z',
  is_test: false,
  patients_active: 3,
  patients_total: 4,
  subscription: { trial_ends_on: '2026-10-15', paid_until: '2027-01-15', override: 'none', note: '' },
  payments: [],
  ...over,
});

const board: ServiceBoard = {
  settings: { monthly_price: 25000, trial_days: 30 },
  nutritionists: [
    nutri({ id: 'ana', display_name: 'Ana', patients_active: 4, payments: [{ id: 'p1', amount: 25000, months: 1, paid_on: '2026-10-12', method: 'transferencia', note: '', status: 'confirmed', created_at: '2026-10-12T10:00:00Z' }] }),
    nutri({ id: 'bea', created_at: '2026-10-28T10:00:00Z', subscription: { trial_ends_on: '2026-11-05', paid_until: null, override: 'none', note: '' }, patients_active: 1 }),
    nutri({ id: 'cla', subscription: { trial_ends_on: '2026-09-01', paid_until: '2026-10-01', override: 'none', note: '' } }),
    nutri({ id: 'demo', is_test: true, patients_active: 99 }),
  ],
  events: [],
};

const salud = { api: { status: 'ok' }, jobs: { dead: 0 } };
const seguridad = { mfa_enforce: false, advertencias: [{ tone: 'gold' as const, title: 'El segundo paso es obligatorio solo en /admin', sub: 'MFA_ENFORCE ya no obliga a todo el consultorio.' }] };

describe('métricas del hub', () => {
  it('arma el inicio con el servicio cuando Mercado Pago no responde', () => {
    const inicio = armarInicio({
      board,
      today: TODAY,
      mpDisponible: false,
      suscripciones: [],
      pagos: [],
      webhooksFallidos: null,
      salud,
      seguridad,
    });
    expect(inicio.mrr_pesos).toBe(25000);
    expect(inicio.cobrado_mes_pesos).toBe(25000);
    expect(inicio.trials_activos).toBe(1);
    expect(inicio.trials_por_vencer).toBe(1);
    expect(inicio.altas_nuevas).toBe(3);
    expect(inicio.churn_mes).toBe(1);
    expect(inicio.mrr_nota).toMatch(/no se leen las suscripciones/i);
    expect(inicio.alertas.some((row) => /no se leen los pagos/i.test(row.title))).toBe(true);
    expect(inicio.alertas.some((row) => /segundo paso|mfa/i.test(`${row.title} ${row.sub}`))).toBe(true);
  });

  it('el MRR de Mercado Pago usa solo lo autorizado y parte el anual', () => {
    expect(mrrDesdeSuscripciones([
      { nutritionist_id: 'a', plan_code: 'arranque', billing_cycle: 'monthly', status: 'authorized', current_amount_cents: 2_490_000, canceled_at: null },
      { nutritionist_id: 'b', plan_code: 'pro', billing_cycle: 'annual', status: 'authorized', current_amount_cents: 12_000_000, canceled_at: null },
      { nutritionist_id: 'c', plan_code: 'pro', billing_cycle: 'monthly', status: 'past_due', current_amount_cents: 4_990_000, canceled_at: null },
    ])).toBe(24900 + 10000);
    const inicio = armarInicio({
      board,
      today: TODAY,
      mpDisponible: true,
      suscripciones: [{ nutritionist_id: 'ana', plan_code: 'arranque', billing_cycle: 'monthly', status: 'authorized', current_amount_cents: 2_490_000, canceled_at: null }],
      pagos: [{ status: 'approved', amount_cents: 2_490_000, paid_at: '2026-10-12T10:00:00Z', created_at: '2026-10-12T10:00:00Z' }, { status: 'rejected', amount_cents: 100, paid_at: '2026-10-02T10:00:00Z', created_at: '2026-10-02T10:00:00Z' }],
      webhooksFallidos: 0,
      salud,
      seguridad,
    });
    expect(inicio.mrr_pesos).toBe(24900);
    expect(inicio.cobrado_mes_pesos).toBe(24900);
    expect(inicio.alertas.some((row) => /pago rechazado/i.test(row.title))).toBe(true);
  });

  it('el puntaje suma uso, pacientes y pago, con tope 100', () => {
    const sano = healthScore({ last_sign_in_at: '2026-10-30T10:00:00Z', today: TODAY, patients_active: 20, crm: 'activa' });
    expect(sano).toEqual({ uso: 40, pacientes: 30, pago: 30, total: 100 });
    const frio = healthScore({ last_sign_in_at: null, today: TODAY, patients_active: 0, crm: 'baja' });
    expect(frio.total).toBe(0);
  });
});

describe('migración del hub', () => {
  const sql = readFileSync(new URL('../../supabase/migrations/20261103180000_platform_hub.sql', import.meta.url), 'utf8');

  it('enciende RLS, niega el acceso directo y no borra tablas que ya existían', () => {
    for (const table of ['platform_leads', 'platform_nutri_notes', 'platform_nutri_tasks', 'platform_inbox_threads', 'platform_inbox_messages']) {
      expect(sql).toContain(`alter table public.${table} enable row level security`);
    }
    expect(sql).toMatch(/revoke all on public\.platform_leads[\s\S]+from public, anon, authenticated/);
    expect(sql).toContain('public.is_platform_admin()');
    expect(sql).not.toMatch(/drop table public\.(?!platform_inbox_messages|platform_inbox_threads|platform_nutri_tasks|platform_nutri_notes|platform_leads)/);
    expect(sql).not.toMatch(/^\s*drop table/im);
  });
});
