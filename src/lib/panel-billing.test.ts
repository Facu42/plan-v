import { describe, expect, it } from 'vitest';
import type { BillingBoard } from '../types/fees';
import { billingMovements, billingSnapshot, filterMovements, incomeMonths, movementsCsv } from './panel-billing';

const board: BillingBoard = {
  settings: { default_fee: null, alias: 'plan.v', payment_link: '', instructions: '' },
  patients: [{
    patient_id: 'camila', full_name: 'Camila Torres', fee: { amount: 54000, first_due_on: '2026-09-14', program_name: 'Mensual' },
    charges: [
      { id: 'c1', due_on: '2026-10-14', amount: 54000, status: 'open' },
      { id: 'c2', due_on: '2026-10-28', amount: 20000, status: 'open' },
    ],
    payments: [{ id: 'p1', amount: 10000, paid_on: '2026-09-10', method: 'transferencia', note: 'Septiembre', status: 'confirmed', reported_by_patient: false, created_at: '2026-09-10T12:00:00Z' }],
  }, {
    patient_id: 'sofia', full_name: 'Sofía Gómez', fee: { amount: 54000, first_due_on: '2026-11-10', program_name: 'Mensual' },
    charges: [],
    payments: [{ id: 'p2', amount: 54000, paid_on: '2026-10-21', method: 'mercado_pago', note: '', status: 'confirmed', reported_by_patient: false, created_at: '2026-10-21T12:00:00Z' }],
  }],
};

describe('cobranzas del panel', () => {
  it('separa cobrado, por cobrar y vencido sin contar pagos sin confirmar como cobrados', () => {
    const snap = billingSnapshot(board, '2026-10-21');
    expect(snap.collected).toBe(54000);
    expect(snap.toCollect).toBe(20000);
    expect(snap.overdue).toBe(44000);
    expect(snap.overduePatients.map(patient => patient.full_name)).toEqual(['Camila Torres']);
    expect(snap.activePrograms).toBe(2);
    expect(snap.expectedRatio).toBe(73);
  });

  it('arma movimientos filtrables y un archivo para exportar', () => {
    const rows = billingMovements(board, '2026-10-21');
    expect(filterMovements(rows, 'vencido').map(row => row.patientName)).toEqual(['Camila Torres']);
    expect(filterMovements(rows, 'cobrado').map(row => row.patientName)).toEqual(['Sofía Gómez', 'Camila Torres']);
    expect(movementsCsv(rows)).toContain('Sofía Gómez');
    expect(movementsCsv([{ ...rows[0], patientName: 'Ana "Nani" Paz' }])).toContain('"Ana ""Nani"" Paz"');
  });

  it('etiqueta el cobro que llegó por débito automático', () => {
    const withDebit: BillingBoard = {
      ...board,
      patients: board.patients.map(patient => patient.patient_id === 'sofia'
        ? { ...patient, payments: [{ ...patient.payments[0], note: 'Seguimiento mensual · octubre 2026', source: 'subscription' }] }
        : patient),
    };
    expect(billingMovements(withDebit, '2026-10-21').find(row => row.patientId === 'sofia')?.concept).toBe('Débito automático · Seguimiento mensual · octubre 2026');
  });

  it('suma ingresos por mes y deja en cero los meses sin pagos', () => {
    const bars = incomeMonths(board, '2026-10-21', 6);
    expect(bars).toHaveLength(6);
    expect(bars[bars.length - 1]?.current).toBe(true);
    expect(bars[bars.length - 1]?.amount).toBe(54000);
    expect(bars[0].amount).toBe(0);
  });
});
