import { describe, expect, it } from 'vitest';
import { readAiUsage } from './usage.js';
import { MemoryClinicalBudget } from '../clinical-processing/budget.js';

describe('uso real de la bolsa compartida', () => {
  const now = new Date('2026-11-01T02:30:00Z'); // todavía octubre en Argentina
  it('lee consumo y reservas reales y respeta el cambio de mes argentino', async () => {
    const budget = new MemoryClinicalBudget();
    await budget.reserve({ key: 'charged', month: '2026-10', micros: 2000000 });
    await budget.settle('charged', 'charged', 1200000);
    await budget.reserve({ key: 'pending', month: '2026-10', micros: 300000 });
    expect(await readAiUsage(false, now, budget)).toEqual({ month: '2026-10', used_micros: 1500000, limit_micros: 5000000, scope: 'global', source: 'memory' });
    expect((await readAiUsage(false, new Date('2026-11-01T03:00:00Z'), budget))?.used_micros).toBe(0);
  });
});

// El servidor puede leer la bolsa, pero no expone el registro privado de operaciones.
import { vi } from 'vitest';
const { maybeSingle, select, eq, from } = vi.hoisted(() => ({ maybeSingle: vi.fn(), select: vi.fn(), eq: vi.fn(), from: vi.fn() }));
vi.mock('../db/supabase-client.js', () => ({ privilegedDb: () => ({ from }) }));

describe('lectura persistente de la bolsa', () => {
  function result(data: unknown, error: unknown = null) {
    maybeSingle.mockResolvedValue({ data, error });
    eq.mockReturnValue({ maybeSingle }); select.mockReturnValue({ eq }); from.mockReturnValue({ select });
  }
  it('devuelve el tope guardado, sin inventar US$ 5 ni leer operaciones', async () => {
    result({ used_micros: '1200000', limit_micros: '3000000' });
    expect(await readAiUsage(true, new Date('2026-10-26T12:00:00Z'))).toMatchObject({ used_micros: 1200000, limit_micros: 3000000, source: 'supabase' });
    expect(from).toHaveBeenLastCalledWith('clinical_ai_budget_months');
    expect(select).toHaveBeenLastCalledWith('used_micros,limit_micros');
    expect(eq).toHaveBeenLastCalledWith('month', '2026-10');
  });
  it('ausencia, error y cifras inválidas devuelven desconocido, nunca cero falso', async () => {
    for (const data of [null, { used_micros: -1, limit_micros: 5000000 }, { used_micros: 10, limit_micros: 1 }]) {
      result(data); expect(await readAiUsage(true)).toBeNull();
    }
    result(null, { code: '42P01' }); expect(await readAiUsage(true)).toBeNull();
    maybeSingle.mockRejectedValue(new Error('offline')); expect(await readAiUsage(true)).toBeNull();
  });
});
