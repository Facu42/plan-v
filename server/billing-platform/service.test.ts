import { beforeEach, describe, expect, it, vi } from 'vitest';
import { checkout } from './service.js';

const rows = new Map<string, Record<string, unknown>>();
const created: Array<Record<string, unknown>> = [];

vi.mock('./repository.js', () => ({
  payerEmail: async () => 'nutri@example.test',
  findByClientRequest: async (_nid: string, key: string) => [...rows.values()].find((row) => row.client_request_id === key) ?? null,
  findOpenSubscription: async () => [...rows.values()].find((row) => ['pending', 'authorized', 'paused', 'past_due'].includes(String(row.status))) ?? null,
  claimFounder: async () => true,
  releaseFounder: async () => undefined,
  insertSubscription: async (input: Record<string, unknown>) => {
    const row = { id: '11111111-1111-4111-8111-111111111111', revision: 1, provider_preapproval_id: null, init_point: null, create_idempotency_key: input.client_request_id, ...input };
    rows.set(String(row.id), row);
    return row;
  },
  casUpdate: async (id: string, revision: number, patch: Record<string, unknown>) => {
    const row = rows.get(id);
    if (!row || row.revision !== revision) return null;
    Object.assign(row, patch, { revision: revision + 1 });
    return row;
  },
  logBilling: () => undefined,
}));

vi.mock('./mp-platform.js', async () => {
  const actual = await vi.importActual<typeof import('./mp-platform.js')>('./mp-platform.js');
  return {
    ...actual,
    platformMercadoPago: {
      createPreapproval: vi.fn(async (body: Record<string, unknown>, key: string) => {
        created.push({ body, key });
        return { id: 'pre-1', init_point: 'https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_id=pre-1' };
      }),
      updatePreapproval: vi.fn(),
      getPreapproval: vi.fn(),
      getPayment: vi.fn(),
      getAuthorizedPayment: vi.fn(),
    },
  };
});

describe('alta con el token de la plataforma', () => {
  beforeEach(() => {
    rows.clear();
    created.length = 0;
    vi.stubEnv('PUBLIC_SITE_URL', 'https://plan-v.example');
  });

  it('manda el monto calculado en el servidor y la clave de idempotencia', async () => {
    const first = await checkout({ nutritionistId: 'nutri-1', userId: 'user-1', planCode: 'arranque', cycle: 'monthly', clientRequestId: 'pedido-1234' });
    const second = await checkout({ nutritionistId: 'nutri-1', userId: 'user-1', planCode: 'arranque', cycle: 'monthly', clientRequestId: 'pedido-1234' });
    expect(first.init_point).toContain('mercadopago.com');
    expect(second.init_point).toBe(first.init_point);
    expect(created).toHaveLength(1);
    expect(created[0].key).toBe('pedido-1234');
    expect(created[0].body).toMatchObject({
      external_reference: '11111111-1111-4111-8111-111111111111',
      auto_recurring: { frequency: 1, transaction_amount: 14940, currency_id: 'ARS' },
    });
    expect(JSON.stringify(created[0].body)).not.toContain('free_trial');
  });
});
