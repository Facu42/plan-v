import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CareError } from '../care/errors.js';

const bag = vi.hoisted(() => ({
  save: vi.fn(async (_code: string, _patch: Record<string, unknown>, _actor: { userId: string | null; email: string }) => undefined),
  casUpdate: vi.fn(async () => null as null),
  insertSubscription: vi.fn(async () => null as null),
  testers: [] as string[],
}));

vi.mock('./repository.js', () => ({
  readPlanCatalog: async () => [],
  savePlanAmount: (code: string, patch: Record<string, unknown>, actor: { userId: string | null; email: string }) => bag.save(code, patch, actor),
  listPlanChanges: async () => [],
  listPlanTesters: async () => bag.testers,
  replacePlanTesters: async (emails: string[]) => { bag.testers = emails; },
  casUpdate: () => bag.casUpdate(),
  insertSubscription: () => bag.insertSubscription(),
}));

const { adminPlanBoard, adminReplaceTesters, adminUpdatePlan, pesosToCents, resetPlanMemory } = await import('./plan-admin.js');

describe('edición de precios', () => {
  beforeEach(() => {
    resetPlanMemory();
    bag.save.mockClear();
    bag.casUpdate.mockClear();
    bag.insertSubscription.mockClear();
    bag.testers = [];
  });

  it('en el panel local guarda el monto y el historial sin tocar un cobro ya hecho', async () => {
    const cobroYaHecho = 1_494_000;
    const board = await adminUpdatePlan('arranque', {
      monthly_pesos: 30000, annual_pesos: 280000, founder_monthly_pesos: 10000, founder_annual_pesos: 90000, active: true,
    }, { userId: null, email: 'facu@nutridash.test' }, false);
    const arranque = board.plans.find((plan) => plan.code === 'arranque');
    const prueba = board.plans.find((plan) => plan.code === 'prueba');
    expect(arranque).toMatchObject({ monthly_pesos: 30000, founder_monthly_pesos: 10000 });
    expect(prueba).toMatchObject({ listed: false, monthly_pesos: 100 });
    expect(board.changes[0]).toMatchObject({ actor_email: 'facu@nutridash.test', plan_code: 'arranque' });
    expect(cobroYaHecho).toBe(1_494_000);
    expect(bag.casUpdate).not.toHaveBeenCalled();
    expect(bag.insertSubscription).not.toHaveBeenCalled();
  });

  it('rechaza un monto en cero o con centavos', () => {
    expect(() => pesosToCents(0)).toThrow(CareError);
    expect(() => pesosToCents(10.5)).toThrow(CareError);
    expect(pesosToCents(100)).toBe(10_000);
  });

  it('la lista de mails no publica el plan oculto', async () => {
    const board = await adminReplaceTesters(['Facu@Nutridash.test', 'facu@nutridash.test'], false);
    expect(board.testers).toEqual(['facu@nutridash.test']);
    expect(board.plans.find((plan) => plan.code === 'prueba')?.listed).toBe(false);
  });

  it('en la base pide guardar el plan y no reescribe suscripciones', async () => {
    bag.save.mockImplementation(async () => undefined);
    await expect(adminPlanBoard(true)).rejects.toMatchObject({ status: 501 });
    expect(bag.save).not.toHaveBeenCalled();
    expect(bag.casUpdate).not.toHaveBeenCalled();
  });
});
