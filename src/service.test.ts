import { describe, expect, it } from 'vitest';
import { addMonths, servicePaidUntil, serviceTotals, summarizeService } from './service';
import type { ServiceNutritionist } from './types/service';

const sub = (patch: Partial<ServiceNutritionist['subscription']> = {}) => ({ trial_ends_on: '2026-10-30', paid_until: null, override: 'none' as const, note: '', ...patch });
const pay = (paid_on: string, months = 1, status: 'confirmed' | 'voided' = 'confirmed') => ({ paid_on, months, status, created_at: `${paid_on}T10:00:00Z` });

describe('estado del servicio de una nutricionista', () => {
  it('prueba, vencida dentro de la gracia y sin pagar después', () => {
    expect(summarizeService(sub(), '2026-10-01')).toMatchObject({ state: 'prueba', days_left: 29 });
    expect(summarizeService(sub(), '2026-11-03').state).toBe('vencida');
    expect(summarizeService(sub(), '2026-11-10').state).toBe('cortada');
  });

  it('activa, por vencer, sin cargo y suspendida', () => {
    expect(summarizeService(sub({ paid_until: '2026-12-30' }), '2026-11-01').state).toBe('activa');
    expect(summarizeService(sub({ paid_until: '2026-12-30' }), '2026-12-25').state).toBe('por_vencer');
    expect(summarizeService(sub({ override: 'waived' }), '2027-05-01').state).toBe('sin_cargo');
    expect(summarizeService(sub({ override: 'suspended', paid_until: '2027-01-01' }), '2026-11-01').state).toBe('suspendida');
  });

  it('los pagos suman meses desde el fin de la prueba o desde el último vencimiento', () => {
    expect(servicePaidUntil('2026-10-30', [pay('2026-10-01')])).toBe('2026-11-30');
    expect(servicePaidUntil('2026-10-30', [pay('2026-10-01'), pay('2026-11-28', 2)])).toBe('2027-01-30');
    expect(servicePaidUntil('2026-10-30', [pay('2026-10-01'), pay('2026-10-02', 1, 'voided')])).toBe('2026-11-30');
  });

  it('los meses de pagos seguidos se suman desde el mismo comienzo, también a fin de mes', () => {
    expect(servicePaidUntil('2026-10-31', [pay('2026-10-20')])).toBe('2026-11-30');
    expect(servicePaidUntil('2026-10-31', [pay('2026-10-20'), pay('2026-11-25', 2)])).toBe('2027-01-31');
    expect(servicePaidUntil('2026-10-31', [pay('2026-10-20'), pay('2026-11-25', 2), pay('2027-03-15')])).toBe('2027-04-15');
  });

  it('después de un corte largo, cuenta desde el día que pagó', () => {
    expect(servicePaidUntil('2026-10-30', [pay('2026-11-05')])).toBe('2026-11-30');
    expect(servicePaidUntil('2026-10-30', [pay('2026-12-15')])).toBe('2027-01-15');
  });

  it('suma meses como la base y arma los totales', () => {
    expect(addMonths('2027-01-31', 1)).toBe('2027-02-28');
    const rows = [
      { subscription: sub({ paid_until: '2026-12-30' }), payments: [{ id: '1', amount: 15000, months: 1, paid_on: '2026-11-02', method: 'transferencia', note: '', status: 'confirmed', created_at: '' }] },
      { subscription: sub(), payments: [] },
      { subscription: sub({ override: 'waived' }), payments: [] },
      // Cuenta de prueba: no suma en nada más, ni sus pagos.
      { is_test: true, subscription: sub({ paid_until: '2026-12-30' }), payments: [{ id: '2', amount: 9999, months: 1, paid_on: '2026-11-02', method: 'otro', note: '', status: 'confirmed', created_at: '' }] },
    ] as unknown as ServiceNutritionist[];
    expect(serviceTotals(rows, '2026-11-10')).toEqual({ activas: 1, prueba: 0, vencidas: 1, sin_cargo: 1, cobrado_mes: 15000, cuentas_prueba: 1 });
  });
});
