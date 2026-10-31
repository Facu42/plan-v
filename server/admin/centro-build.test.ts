import { describe, expect, it } from 'vitest';
import type { ServiceBoard, ServiceNutritionist } from '../../src/types/service.js';
import { buildCobros, buildNutris, buildPacientes, buildResumen } from './centro.js';

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
  payments: [
    { id: `p-${over.id}`, amount: 25000, months: 1, paid_on: '2026-10-12', method: 'transferencia', note: '', status: 'confirmed', created_at: '2026-10-12T10:00:00Z' },
  ],
  ...over,
});

const board: ServiceBoard = {
  settings: { monthly_price: 25000, trial_days: 30 },
  nutritionists: [
    nutri({ id: 'ana', display_name: 'Ana Gómez', email: 'ana@x.test', patients_active: 4, patients_total: 5 }),
    nutri({
      id: 'bea',
      display_name: 'Bea Ruiz',
      email: 'bea@x.test',
      created_at: '2026-10-28T10:00:00Z',
      patients_active: 1,
      patients_total: 1,
      subscription: { trial_ends_on: '2026-11-10', paid_until: null, override: 'none', note: '' },
      payments: [],
    }),
    nutri({
      id: 'cla',
      display_name: 'Clara Paz',
      email: 'cla@x.test',
      patients_active: 2,
      patients_total: 6,
      subscription: { trial_ends_on: '2026-09-01', paid_until: '2026-10-28', override: 'none', note: '' },
      payments: [],
    }),
    nutri({
      id: 'demo',
      display_name: 'Cuenta de prueba',
      email: 'demo@x.test',
      is_test: true,
      patients_active: 99,
      patients_total: 99,
    }),
  ],
  events: [],
};

describe('armado del centro de mando', () => {
  it('el resumen cuenta nutris reales, pacientes y cobros del mes, sin la cuenta de prueba', () => {
    const resumen = buildResumen(board, TODAY);
    expect(resumen.nutris_activas).toBe(1);
    expect(resumen.nutris_prueba).toBe(1);
    expect(resumen.nutris_vencidas).toBe(1);
    expect(resumen.nutris_total).toBe(3);
    expect(resumen.pacientes_activos).toBe(7);
    expect(resumen.ingresos_mes).toBe(25000);
    expect(resumen.mrr).toBe(25000);
    expect(resumen.altas_recientes.map((row) => row.id)).toEqual(['bea', 'ana', 'cla']);
    expect(resumen.alertas.some((row) => /gracia|vencid/i.test(row.title))).toBe(true);
  });

  it('las nutris traen estado, plan y uso, y no mezclan datos clínicos', () => {
    const nutris = buildNutris(board, TODAY);
    const ana = nutris.find((row) => row.id === 'ana');
    expect(ana).toMatchObject({
      display_name: 'Ana Gómez',
      email: 'ana@x.test',
      state: 'activa',
      patients_active: 4,
      patients_total: 5,
      precio_mensual: 25000,
    });
    expect(JSON.stringify(nutris)).not.toMatch(/peso|síntoma|diagnóstico|goal|adherence/i);
  });

  it('pacientes solo agrega conteos por consultorio', () => {
    const pacientes = buildPacientes(board);
    expect(pacientes).toMatchObject({ activos: 7, total: 12, consultorios: 3 });
    expect(pacientes.por_nutri.map((row) => row.name)).toEqual(['Ana Gómez', 'Clara Paz', 'Bea Ruiz']);
    expect(JSON.stringify(pacientes)).not.toMatch(/peso|síntoma|diagnóstico|full_name|goal/i);
  });

  it('cobros separa MRR, vencidos y gracia', () => {
    const cobros = buildCobros(board, TODAY);
    expect(cobros).toMatchObject({ mrr: 25000, cobrado_mes: 25000, vencidos: 1, en_gracia: 1 });
    expect(cobros.pagos_mes).toHaveLength(1);
    expect(cobros.pagos_mes[0]).toMatchObject({ nutritionist_name: 'Ana Gómez', amount: 25000, status: 'confirmed' });
  });
});
