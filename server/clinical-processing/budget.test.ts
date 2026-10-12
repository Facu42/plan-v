import { describe, expect, it } from 'vitest';
import { MemoryClinicalBudget, argentinaBudgetMonth, estimateAudioMicros, estimateSummaryMicros } from './budget.js';

describe('bolsa global de IA clínica', () => {
  it('usa el mes argentino y calcula transcripción con redondeo mínimo del proveedor', () => {
    expect(argentinaBudgetMonth(new Date('2026-11-01T01:00:00Z'))).toBe('2026-10');
    expect(estimateAudioMicros(30)).toBe(925);
    expect(estimateAudioMicros(0.1)).toBe(309);
    expect(estimateSummaryMicros('consulta', 4096)).toBeGreaterThan(2400);
  });
  it('reserva antes de llamadas concurrentes y jamás supera cinco dólares', async () => {
    const ledger = new MemoryClinicalBudget(5_000_000);
    const result = await Promise.allSettled(Array.from({ length: 10 }, (_, i) => ledger.reserve({ key: `job-${i}`, month: '2026-10', micros: 1_000_000 })));
    expect(result.filter(r => r.status === 'fulfilled')).toHaveLength(5);
    expect(await ledger.used('2026-10')).toBe(5_000_000);
  });
  it('un cobro incierto queda reservado y no permite repetir la operación', async () => {
    const ledger = new MemoryClinicalBudget(5_000_000);
    await ledger.reserve({ key: 'consulta:1', month: '2026-10', micros: 100 });
    await ledger.settle('consulta:1', 'uncertain', 0);
    await expect(ledger.reserve({ key: 'consulta:1', month: '2026-10', micros: 100 })).rejects.toThrow();
    expect(await ledger.used('2026-10')).toBe(100);
  });
  it('liquida sólo una vez, rechaza gasto mayor al reservado y permite meses nuevos', async () => {
    const ledger = new MemoryClinicalBudget(5_000_000);
    await ledger.reserve({ key: 'a', month: '2026-10', micros: 100 });
    await expect(ledger.settle('a', 'charged', 101)).rejects.toThrow();
    await ledger.settle('a', 'charged', 20);
    await ledger.settle('a', 'charged', 20);
    expect(await ledger.used('2026-10')).toBe(20);
    await ledger.reserve({ key: 'b', month: '2026-11', micros: 5_000_000 });
    expect(await ledger.used('2026-11')).toBe(5_000_000);
  });
});
