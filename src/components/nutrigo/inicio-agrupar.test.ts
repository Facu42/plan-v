import { describe, expect, it } from 'vitest';
import type { Patient } from '../../types';
import { armarPendientes } from './inicio-presentacion';
import { avancePrimerosPasos } from './FirstSteps';

const ahora = new Date('2026-10-19T13:00:00Z');
const ana = { id: 'a', name: 'Ana López', initials: 'AL', tone: 'mint', goal: '', adherence_score: 0, meal_logs: [], habit_logs: [], messages: [], appointment: null } as unknown as Patient;
const datos = (extra: object = {}) => ({ pacientes: [ana], ahora, data: null, novedades: [], atencion: [], reservas: [], rachas: [], ...extra });
const registro = (id: string, title: string) => ({ id, kind: 'record', patient_id: 'a', patient_name: 'Ana López', status: 'x', updated_at: '', href: '/crm/seguimiento', title });

describe('Inicio: pendientes sin repetir', () => {
  it('junta los registros de la misma paciente en un solo renglón con cuántos son', () => {
    const data = { items: [registro('r1', 'Actividad física'), registro('r2', 'Actividad física'), registro('r3', 'Peso semanal')], counts: { record: 3 } };
    const filas = armarPendientes(datos({ data }) as never, {});
    expect(filas.map(f => f.titulo)).toEqual(['Revisar los registros de Ana López']);
    expect(filas[0]!.sub).toBe('3 registros · Actividad física · Peso semanal');
  });

  it('muestra Primeros pasos arriba mientras falte algo, con el próximo paso', () => {
    const preparacion = avancePrimerosPasos({ datos: true, horarios: false, pagina: false }, { tienePaciente: true, vinculada: true });
    expect(preparacion).toMatchObject({ listos: 3, total: 5, siguiente: { href: '/crm/agenda?agenda=horarios' } });
    const [fila] = armarPendientes(datos({ preparacion }) as never, {});
    expect(fila).toMatchObject({ key: 'primeros-pasos', titulo: 'Terminá de preparar tu consultorio' });
    expect(fila!.detalle.acciones.map(a => a.href)).toEqual(['/crm/inicio?primeros=1', '/crm/agenda?agenda=horarios']);
  });

  it('no muestra Primeros pasos completos ni mientras no se sabe', () => {
    expect(avancePrimerosPasos({ datos: null, horarios: true, pagina: true }, { tienePaciente: true, vinculada: true })).toBeNull();
    const listo = avancePrimerosPasos({ datos: true, horarios: true, pagina: true }, { tienePaciente: true, vinculada: true });
    expect(listo?.siguiente).toBeNull();
    expect(armarPendientes(datos({ preparacion: listo }) as never, {})).toEqual([]);
  });
});
