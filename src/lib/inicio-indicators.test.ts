import { describe, expect, it } from 'vitest';
import { countConsultations, incomeIn, periodWindows, variation } from './inicio-indicators';

const history = (...ids: string[]) => ({ appointment_history: ids.map((dateId) => ({ id: dateId, when: '', dateId, duration: 30, channel: '', action: 'elapsed' as const, actor: 'system' as const, at: '' })) });

describe('períodos de Inicio', () => {
  it('el período actual termina hoy y el anterior lo precede sin superponerse', () => {
    const { current, previous } = periodWindows('2026-10-10', 7);
    expect(current).toEqual({ from: '2026-10-04', to: '2026-10-10' });
    expect(previous).toEqual({ from: '2026-09-27', to: '2026-10-03' });
  });
  it('funciona con 30 y 90 días y cruzando meses', () => {
    expect(periodWindows('2026-10-10', 30).current.from).toBe('2026-09-11');
    expect(periodWindows('2026-10-10', 30).previous).toEqual({ from: '2026-08-12', to: '2026-09-10' });
    expect(periodWindows('2026-10-10', 90).current.from).toBe('2026-07-13');
  });
});

describe('consultas del período', () => {
  const window = { from: '2026-10-04', to: '2026-10-10' };
  it('separa la primera consulta de cada paciente de las de seguimiento', () => {
    const patients = [history('2026-10-05'), history('2026-09-01', '2026-10-06', '2026-10-09'), history()];
    expect(countConsultations(patients, window)).toEqual({ total: 3, first: 1, followUp: 2 });
  });
  it('una primera consulta anterior al período no se cuenta como primera dentro de él', () => {
    expect(countConsultations([history('2026-09-01', '2026-10-05')], window)).toEqual({ total: 1, first: 0, followUp: 1 });
  });
  it('sin historial o con una misma fecha repetida no suma de más', () => {
    expect(countConsultations([{}, history('2026-10-05', '2026-10-05')], window).total).toBe(1);
  });
});

describe('ingresos del período', () => {
  const payment = (amount: number, paid_on: string, status: 'confirmed' | 'reported' | 'rejected' | 'voided') => ({ id: `${paid_on}${amount}`, amount, paid_on, method: 'efectivo' as const, note: '', status, reported_by_patient: false, created_at: '' });
  const patient = (...payments: ReturnType<typeof payment>[]) => ({ payments });
  it('suma sólo pagos confirmados con fecha dentro del período y cuenta cuántas pacientes pagaron', () => {
    const board = { patients: [
      patient(payment(28000, '2026-10-05', 'confirmed'), payment(28000, '2026-10-06', 'confirmed')),
      patient(payment(30000, '2026-10-07', 'reported'), payment(30000, '2026-10-08', 'rejected'), payment(30000, '2026-10-09', 'voided')),
      patient(payment(15000, '2026-09-20', 'confirmed')),
    ] } as unknown as Parameters<typeof incomeIn>[0];
    expect(incomeIn(board, { from: '2026-10-04', to: '2026-10-10' })).toEqual({ amount: 56000, payers: 1 });
  });
});

describe('variación contra el período anterior', () => {
  it('sube, baja o queda igual', () => {
    expect(variation(5, 3)).toEqual({ kind: 'up', delta: 2 });
    expect(variation(1, 4)).toEqual({ kind: 'down', delta: -3 });
    expect(variation(2, 2)).toEqual({ kind: 'same', delta: 0 });
  });
  it('sin datos en el período anterior no inventa un porcentaje', () => {
    expect(variation(3, 0)).toEqual({ kind: 'no-baseline' });
    expect(variation(0, 0)).toEqual({ kind: 'same', delta: 0 });
  });
});
