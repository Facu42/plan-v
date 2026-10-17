import { describe, expect, it } from 'vitest';
import type { ServiceNutritionist } from '../../types/service';
import { summarizeService } from '../../service';
import { focusCounts, matchesFocus, monthlyCollections, serviceRowsCsv, type ServiceRow } from './servicio-utils';

const base = (over: Partial<ServiceNutritionist>): ServiceNutritionist => ({
  id: 'n', display_name: 'Ana', email: 'ana@x.com', created_at: '2026-01-01', last_sign_in_at: '2026-10-01T10:00:00Z', is_test: false,
  patients_active: 3, patients_total: 4, subscription: { trial_ends_on: '2026-12-01', paid_until: null, override: 'none', note: '' }, payments: [], ...over,
});
const row = (n: ServiceNutritionist): ServiceRow => ({ nutritionist: n, summary: summarizeService(n.subscription, '2026-10-16') });

describe('atajos de la lista de nutricionistas', () => {
  it('separa las que hay que atender, las que nunca entraron y las sin pacientes', () => {
    const vencida = row(base({ id: 'a', subscription: { trial_ends_on: '2026-09-01', paid_until: null, override: 'none', note: '' } }));
    const nueva = row(base({ id: 'b', last_sign_in_at: null, patients_active: 0 }));
    const prueba = row(base({ id: 'c', is_test: true, last_sign_in_at: null }));
    expect(matchesFocus(vencida, 'atender')).toBe(true);
    expect(matchesFocus(nueva, 'atender')).toBe(false);
    expect(focusCounts([vencida, nueva, prueba])).toEqual({ todas: 2, atender: 1, sin_ingreso: 1, sin_pacientes: 1 });
  });
});

describe('cobros por mes', () => {
  it('suma solo pagos confirmados de los últimos meses y salta las cuentas de prueba', () => {
    const pay = (id: string, paid_on: string, amount: number, status: 'confirmed' | 'voided' = 'confirmed') => ({ id, amount, months: 1, paid_on, method: 'transferencia' as const, note: '', status, created_at: paid_on });
    const list = monthlyCollections([
      base({ payments: [pay('1', '2026-10-02', 20000), pay('2', '2026-08-10', 15000), pay('3', '2026-10-05', 9000, 'voided'), pay('4', '2025-01-01', 1)] }),
      base({ is_test: true, payments: [pay('5', '2026-10-01', 99999)] }),
    ], '2026-10-16', 3);
    expect(list).toEqual([{ month: '2026-08', label: 'ago', total: 15000 }, { month: '2026-09', label: 'sep', total: 0 }, { month: '2026-10', label: 'oct', total: 20000 }]);
  });

  it('cruza el cambio de año', () => {
    expect(monthlyCollections([], '2026-02-10', 4).map((item) => item.month)).toEqual(['2025-11', '2025-12', '2026-01', '2026-02']);
  });
});

describe('lista para planilla', () => {
  it('arma la cabecera, escapa comas y neutraliza fórmulas', () => {
    const csv = serviceRowsCsv([row(base({ display_name: '=Ana, Lic.', last_sign_in_at: null }))]);
    const [head, line] = csv.split('\n');
    expect(head).toBe('Nombre,Mail,Estado,Vigencia hasta,Pacientes activas,Pacientes en total,Último ingreso');
    expect(line.startsWith(`"'=Ana, Lic."`)).toBe(true);
    expect(line.endsWith(',Nunca')).toBe(true);
  });
});
