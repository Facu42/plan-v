import { beforeEach, describe, expect, it, vi } from 'vitest';
import { catalog } from './pricing.js';
import { invalidatePlans } from './catalog.js';

const bag = vi.hoisted(() => ({
  plans: [] as Array<Record<string, unknown>>,
  testers: new Set<string>(),
  claim: vi.fn(async () => true),
  casUpdate: vi.fn(async (): Promise<{ id: string; revision: number } | null> => null),
  insertSubscription: vi.fn(async (_input: Record<string, unknown>): Promise<Record<string, unknown>> => ({})),
}));

const rows = new Map<string, Record<string, unknown>>();
const created: Array<Record<string, unknown>> = [];

vi.mock('./repository.js', () => ({
  readPlanCatalog: async () => bag.plans,
  isPlanTester: async (email: string) => bag.testers.has(email),
  nutritionistCreatedAt: async () => Date.parse('2026-10-01T12:00:00Z'),
  usageOf: async () => ({ active_patients: 0, nutritionists: 1, ai_photos: 0 }),
  listPayments: async () => [],
  founderSeatsLeft: async () => 12,
  payerEmail: async () => 'nutri@example.test',
  findByClientRequest: async () => null,
  findOpenSubscription: async () => null,
  claimFounder: () => bag.claim(),
  releaseFounder: async () => undefined,
  insertSubscription: (input: Record<string, unknown>) => bag.insertSubscription(input),
  casUpdate: () => bag.casUpdate(),
  logBilling: () => undefined,
}));

vi.mock('./mp-platform.js', async () => {
  const actual = await vi.importActual<typeof import('./mp-platform.js')>('./mp-platform.js');
  return {
    ...actual,
    platformMercadoPago: {
      createPreapproval: vi.fn(async (body: Record<string, unknown>) => {
        created.push(body);
        return { id: 'pre-db', init_point: 'https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_id=pre-db' };
      }),
      updatePreapproval: vi.fn(),
      getPreapproval: vi.fn(),
      getPayment: vi.fn(),
      getAuthorizedPayment: vi.fn(),
    },
  };
});

const { checkout, planForNutritionist } = await import('./service.js');

function plansFromDb() {
  const seeded = catalog().map((plan) => ({ ...plan, active: true, listed: true }));
  seeded[0] = { ...seeded[0], monthly_amount_cents: 3_000_000, founder_monthly_amount_cents: 1_000_000 };
  return [
    ...seeded,
    {
      code: 'prueba', name: 'Prueba', monthly_amount_cents: 10_000, annual_amount_cents: 10_000,
      founder_monthly_amount_cents: 10_000, founder_annual_amount_cents: 10_000,
      max_active_patients: 25, max_nutritionists: 1, max_ai_meal_photos_month: 150, active: true, listed: false,
    },
  ];
}

describe('precios leídos de la base', () => {
  beforeEach(() => {
    rows.clear();
    created.length = 0;
    bag.plans = plansFromDb();
    bag.testers = new Set();
    bag.claim.mockClear();
    bag.casUpdate.mockReset();
    bag.casUpdate.mockResolvedValue({ id: '22222222-2222-4222-8222-222222222222', revision: 2 });
    bag.insertSubscription.mockImplementation(async (input: Record<string, unknown>) => {
      const row = { id: '22222222-2222-4222-8222-222222222222', revision: 1, provider_preapproval_id: null, init_point: null, ...input };
      rows.set(String(row.id), row);
      return row;
    });
    invalidatePlans();
    vi.stubEnv('PUBLIC_SITE_URL', 'https://plan-v.example');
    vi.stubEnv('MP_PLATFORM_ACCESS_TOKEN', 'TEST-sandbox');
  });

  it('cobra el precio de fundadora guardado y no el cálculo de respaldo', async () => {
    await checkout({ nutritionistId: 'nutri-1', userId: 'user-1', planCode: 'arranque', cycle: 'monthly', clientRequestId: 'pedido-db-1' });
    expect(bag.claim).toHaveBeenCalledOnce();
    expect(created[0]).toMatchObject({ auto_recurring: { transaction_amount: 10000 } });
    expect(rows.values().next().value).toMatchObject({ current_amount_cents: 1_000_000 });
  });

  it('un mail fuera de la lista no ve el plan oculto y no gasta cupo', async () => {
    const ajena = await planForNutritionist('nutri-2', 'user-2');
    expect(ajena.plans.map((plan) => plan.code)).toEqual(['arranque', 'pro', 'consultorio']);
    await expect(checkout({ nutritionistId: 'nutri-2', userId: 'user-2', planCode: 'prueba', cycle: 'monthly', clientRequestId: 'pedido-oculta' })).rejects.toMatchObject({ status: 400 });
    expect(bag.claim).not.toHaveBeenCalled();
    expect(created).toHaveLength(0);
    expect(bag.casUpdate).not.toHaveBeenCalled();
  });

  it('quien está en la lista ve el plan de prueba y lo paga sin cupo de fundadora', async () => {
    bag.testers.add('nutri@example.test');
    invalidatePlans();
    const propia = await planForNutritionist('nutri-1', 'user-1');
    expect(propia.plans.map((plan) => plan.code)).toContain('prueba');
    await checkout({ nutritionistId: 'nutri-1', userId: 'user-1', planCode: 'prueba', cycle: 'monthly', clientRequestId: 'pedido-prueba' });
    expect(bag.claim).not.toHaveBeenCalled();
    expect(created[0]).toMatchObject({ auto_recurring: { transaction_amount: 100 } });
  });
});
