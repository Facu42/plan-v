import { describe, expect, it } from 'vitest';
import { armarEstadisticas, mesesHasta, type TurnoEstadistico } from './estadisticas.js';

const SEDE_A = '00000000-0000-4000-a000-00000000000a';
const SEDE_B = '00000000-0000-4000-a000-00000000000b';
const sedes = [{ id: SEDE_A, name: 'Centro', address: 'Av. Siempreviva 742', modality: 'presencial' as const }, { id: SEDE_B, name: 'Online', modality: 'online' as const }];
const ahora = new Date('2026-11-05T20:00:00-03:00');
const turno = (id: string, paciente: string, inicio: string, extra: Partial<TurnoEstadistico> = {}): TurnoEstadistico =>
  ({ id, paciente, inicio: new Date(inicio).toISOString(), minutos: 45, canal: 'presencial', estado: 'scheduled', realizada: null, sede: null, ...extra });

describe('estadísticas del consultorio', () => {
  it('arma los meses del período terminando en el mes de hoy, cruzando el año', () => {
    expect(mesesHasta('2026-02-10', 4)).toEqual(['2025-11', '2025-12', '2026-01', '2026-02']);
    expect(mesesHasta('2026-11-05', 6)).toHaveLength(6);
  });

  it('cuenta consultas, ausencias, canceladas, pacientes nuevas e ingresos por mes', () => {
    const r = armarEstadisticas({
      hoy: '2026-11-05', ahora, cuantos: 2, sedes, sedesInstaladas: true,
      turnos: [
        turno('t0', 'ana', '2026-08-01T10:00:00-03:00'), // fuera del período: solo marca que Ana ya vino antes
        turno('t1', 'ana', '2026-10-10T10:00:00-03:00', { estado: 'done', realizada: true }),
        turno('t2', 'bea', '2026-10-12T10:00:00-03:00', { realizada: false, sede: SEDE_B }),
        turno('t3', 'bea', '2026-11-03T10:00:00-03:00', { canal: 'video', sede: SEDE_B }),
        turno('t4', 'cami', '2026-11-04T10:00:00-03:00', { estado: 'cancelled' }),
        turno('t5', 'cami', '2026-11-05T19:30:00-03:00'), // todavía no terminó
      ],
      cancelaciones: [{ inicio: '2026-11-04T13:00:00.000Z' }],
      pacientes: [{ id: 'ana', nombre: 'Ana Pérez', alta: '2026-03-01T12:00:00Z' }, { id: 'bea', nombre: 'Bea Gómez', alta: '2026-10-02T12:00:00Z' }, { id: 'cami', nombre: 'Cami Ruiz', alta: '2026-11-01T12:00:00Z' }],
      pagos: [{ monto: 30000, fecha: '2026-10-11' }, { monto: 25000, fecha: '2026-11-03' }, { monto: 999, fecha: '2026-01-01' }],
    });
    expect(r.meses.map(m => [m.mes, m.consultas, m.ausencias, m.canceladas, m.nuevas, m.ingresos])).toEqual([
      ['2026-10', 1, 1, 0, 1, 30000],
      ['2026-11', 1, 0, 1, 1, 25000],
    ]);
    expect(r.total).toMatchObject({ consultas: 2, ausencias: 1, ingresos: 55000, primeraVez: 1, seguimiento: 1, presencial: 1, online: 1, pacientesAtendidas: 2 });
    expect(r.porSede).toEqual([
      { id: SEDE_A, nombre: 'Centro', detalle: 'Presencial · Av. Siempreviva 742', consultas: 1, ausencias: 0, online: 0, presencial: 1 },
      { id: SEDE_B, nombre: 'Online', detalle: 'Online', consultas: 1, ausencias: 1, online: 1, presencial: 0 },
    ]);
    expect(r.masAusencias).toEqual([{ id: 'bea', nombre: 'Bea Gómez', ausencias: 1, ultima: '2026-10-12' }]);
  });

  it('un turno con una sede que ya no existe cuenta en la sede principal', () => {
    const r = armarEstadisticas({ hoy: '2026-11-05', ahora, cuantos: 1, sedes, sedesInstaladas: false, turnos: [turno('t1', 'ana', '2026-11-02T10:00:00-03:00', { sede: '00000000-0000-4000-a000-0000000000ff' })], cancelaciones: [], pacientes: [], pagos: [] });
    expect(r.porSede[0].consultas).toBe(1);
    expect(r.sedesInstaladas).toBe(false);
  });
});
