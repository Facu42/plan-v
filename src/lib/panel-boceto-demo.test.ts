import { describe, expect, it } from 'vitest';
import { billingSnapshot } from './panel-billing';
import { homeAppointments } from './panel-home';
import { bocetoBillingBoard, bocetoHomePatients, bocetoHomeWork, bocetoWorkspace, panelDemoEnabled } from './panel-boceto-demo';

describe('datos de ejemplo del boceto', () => {
  it('solo se activan en la demostración local', () => {
    expect(panelDemoEnabled({ DEV: false, VITE_ALLOW_DEMO: 'true' })).toBe(false);
    expect(panelDemoEnabled({ DEV: true, VITE_ALLOW_DEMO: 'true' })).toBe(true);
    expect(panelDemoEnabled({ DEV: true, VITE_ALLOW_DEMO: '' })).toBe(false);
  });

  it('arma la semana y las reservas del boceto', () => {
    const snapshot = bocetoWorkspace(new Date('2026-10-19T15:00:00Z'));
    expect(snapshot.bookings.some((item) => item.contact_name === 'Valentina Sosa')).toBe(true);
    expect(snapshot.bookings.filter((item) => item.status === 'requested')).toHaveLength(2);
    expect(snapshot.bookings.find((item) => item.contact_name === 'Agustina Díaz')?.paid_minor).toBe(2_000_000);
    expect(snapshot.bookings.find((item) => item.contact_name === 'Mariana López')?.paid_minor).toBe(0);
  });

  it('cierra los números de cobranzas del 19 de octubre', () => {
    const board = billingSnapshot(bocetoBillingBoard('2026-10-19'), '2026-10-19');
    expect(board.collected).toBe(842000);
    expect(board.toCollect).toBe(288000);
    expect(board.toCollectCount).toBe(6);
    expect(board.overdue).toBe(108000);
    expect(board.overduePatients.map((item) => item.full_name)).toEqual(['Camila Torres', 'Brenda Acosta']);
    expect(board.activePrograms).toBe(21);
    expect(board.programs.find((item) => item.name === 'Mensual')?.count).toBe(14);
    expect(board.programs.find((item) => item.name === 'Trimestral')?.count).toBe(7);
  });

  it('muestra en Inicio los turnos del lunes y las dos cuotas vencidas', () => {
    const now = new Date('2026-10-19T15:00:00Z');
    const today = homeAppointments(bocetoHomePatients(bocetoWorkspace(now)), now);
    expect(today.today.map((item) => item.patient.name)).toEqual(['Valentina Sosa', 'Brenda Acosta', 'Paula Herrera']);
    expect(bocetoHomeWork('2026-10-19').counts.fee_overdue).toBe(2);
  });
});
