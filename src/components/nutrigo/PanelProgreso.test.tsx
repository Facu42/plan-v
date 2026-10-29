import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { GlobalPatientProgress, GlobalProgressResponse } from '../../types/progress-global';
import { PeriodoProgreso, PanelProgresoVista } from './PanelProgreso';
import { adherenciaDe, columnasAdherencia, filasDe, movimientosDelMes, paraMirar, puntosDeSerie, textoCurva } from './progreso-presentacion';

const peso = (delta: number | null, points = 2): GlobalPatientProgress['weight'] => ({
  state: 'ok', unit: 'kg', last: 68.4, last_on: '2026-10-20', from: delta === null ? null : 70, from_on: delta === null ? null : '2026-10-01', delta, points,
});

const fila = (id: string, nombre: string, logged: number, weight: GlobalPatientProgress['weight'] = { state: 'none' }, pending = 0): GlobalPatientProgress => ({
  patient_id: id, patient_name: nombre, weight, meals: { logged, previous: 0, pending },
});

const laura = fila('laura', 'Laura Ruiz', 0);
const sofia = fila('sofia', 'Sofía Gómez', 6, peso(-1.6, 4));
const romina = fila('romina', 'Romina Benítez', 4, peso(1.8, 3));
const julia = fila('julia', 'Julia Sosa', 3, { state: 'none' }, 4);

function datos(patients: GlobalPatientProgress[]): GlobalProgressResponse {
  return {
    period_days: 30,
    current: { start: '2026-09-26', end: '2026-10-25' },
    previous: { start: '2026-08-27', end: '2026-09-25' },
    patients,
    totals: { patients: patients.length, with_records: 0, meals: 0, previous_meals: 0, pending_review: 0, with_weight: 0, without_measurement_permission: 0 },
    unavailable: [],
    source: 'supabase',
  };
}

function vista(parcial: Partial<Parameters<typeof PanelProgresoVista>[0]> = {}) {
  return renderToStaticMarkup(<PanelProgresoVista
    data={datos([laura, sofia, romina])}
    days={30}
    filtro="all"
    orden="name"
    quien="laura"
    puntos={[]}
    series={null}
    curvaEstado="vacia"
    pacientes={[{ id: 'laura', name: 'Laura Ruiz', initials: 'LR', tone: 'peach', created_at: '2026-08-01T15:00:00.000Z' }]}
    aviso=""
    onFiltro={vi.fn()}
    onOrden={vi.fn()}
    onQuien={vi.fn()}
    onOpen={vi.fn()}
    onPromedio={vi.fn()}
    onAviso={vi.fn()}
    {...parcial}
  />);
}

describe('progreso, el dibujo', () => {
  it('arma la cartera, los filtros y la nota de Laura', () => {
    const html = vista();
    expect(html).toContain('id="s-progreso"');
    expect(html).toContain('data-mk="1"');
    expect(html).toContain('La cartera');
    expect(html).toContain('Sin dato · 1 bajan · 1 suben · 1 sin registros');
    expect(html).toContain('>Todas<');
    expect(html).toContain('>Con registros<');
    expect(html).toContain('>Sin registros<');
    expect(html).toContain('>Adherencia<');
    expect(html).toContain('Laura no está en «para mirar»: sin registros no es un incumplimiento.');
    expect(html).toContain('Sin registros');
    expect(html).not.toContain('WhatsApp');
    expect(html).not.toContain('86%');
  });

  it('el filtro sin registros deja solo a quien no cargó', () => {
    const html = vista({ filtro: 'without-records' });
    expect(html).toContain('Laura Ruiz');
    expect(html).not.toContain('Sofía Gómez');
    expect(html).toContain('Sin curva');
    expect(html).toContain('Falta el dato y no es un incumplimiento.');
  });

  it('sin dos pesos no dibuja una curva', () => {
    const html = vista({ quien: 'sofia', curvaEstado: 'vacia', data: datos([fila('sofia', 'Sofía Gómez', 2, peso(null, 1))]) });
    expect(html).toContain('Sin curva');
    expect(html).not.toContain('class="ln"');
    expect(textoCurva(0)).toContain('Sin curva');
    expect(textoCurva(2)).toBeNull();
  });

  it('con pesos reales dibuja la curva y abre ficha y registros', () => {
    const html = vista({
      quien: 'sofia',
      curvaEstado: 'lista',
      puntos: [{ value: 70, on: '2026-10-01', unit: 'kg' }, { value: 68.4, on: '2026-10-20', unit: 'kg' }],
    });
    expect(html).toContain('class="ln"');
    expect(html).toContain('sin meta de peso');
    expect(html).toContain('href="/crm/ficha?paciente=sofia"'.replace('href="', ''));
    expect(html).toContain('/crm/ficha?paciente=sofia');
    expect(html).toContain('/crm/ficha?paciente=sofia&amp;seccion=registros');
    expect(html).toContain('Sin adherencia: no hay registros. No es un incumplimiento.');
    expect(html).toContain('Grasa');
    expect(html).toContain('Sin dato');
  });

  it('muestra el indicador de adherencia de la ficha, ordena por él y arma las columnas con las comidas cargadas', () => {
    const ahora = new Date('2026-10-20T15:00:00.000Z');
    const logs = [{ logged_at: '2026-10-20T14:00:00.000Z' }, { logged_at: '2026-10-18T14:00:00.000Z' }, { logged_at: '2026-10-12T14:00:00.000Z' }];
    expect(adherenciaDe(sofia, { adherence_score: 86.4 })).toBe(86);
    expect(adherenciaDe(laura, { adherence_score: 80 })).toBeNull();
    expect(adherenciaDe(romina, { adherence_score: 0 })).toBeNull();
    const mapa = new Map([['laura', null], ['sofia', 86], ['romina', 54]]);
    expect(filasDe([laura, romina, sofia], 'all', 'adherence', mapa).map(item => item.patient_id)).toEqual(['sofia', 'romina', 'laura']);
    expect(columnasAdherencia(undefined, 7, ahora)).toBeNull();
    expect(columnasAdherencia(logs, 7, ahora)?.valores.filter(valor => valor === 100)).toHaveLength(2);
    expect(columnasAdherencia(logs, 30, ahora)?.valores).toHaveLength(4);
    const html = vista({
      data: datos([laura, sofia]), quien: 'sofia',
      pacientes: [{ id: 'sofia', name: 'Sofía Gómez', initials: 'SG', tone: 'mint', created_at: '2026-08-01T15:00:00.000Z', adherence_score: 86, meal_logs: [] }],
    });
    expect(html).toContain('<span class="adh"><span class="tr"><i style="width:86%"></i></span>86%</span>');
    expect(html).toContain('86% · 1 bajan');
  });

  it('el período se marca en las pestañas de 7, 30 y 90', () => {
    const html = renderToStaticMarkup(<PeriodoProgreso days={7} onDays={vi.fn()} />);
    expect(html).toContain('7 días');
    expect(html).toContain('30 días');
    expect(html).toContain('90 días');
    expect(html).toContain('class="on"');
    expect(html.indexOf('class="on"')).toBeLessThan(html.indexOf('30 días'));
    expect(vista({ days: 90 })).toContain('Evolución · 90 días');
  });
});

describe('progreso, los datos', () => {
  const filas = [laura, sofia, romina, julia];

  it('filtra, ordena y no inventa adherencia', () => {
    expect(filasDe(filas, 'with-records', 'name').map(fila => fila.patient_name)).toEqual(['Julia Sosa', 'Romina Benítez', 'Sofía Gómez']);
    expect(filasDe(filas, 'without-records', 'meals').map(fila => fila.patient_id)).toEqual(['laura']);
    expect(filasDe(filas, 'all', 'meals').map(fila => fila.patient_id)[0]).toBe('sofia');
    expect(filasDe(filas, 'all', 'weight-change').map(fila => fila.patient_id)[0]).toBe('romina');
    expect(filasDe(filas, 'all', 'adherence').map(fila => fila.patient_name)).toEqual(filasDe(filas, 'all', 'name').map(fila => fila.patient_name));
  });

  it('para mirar usa suba o muchas pendientes, y deja afuera a quien no registró', () => {
    const ids = paraMirar(filas).map(item => item.id);
    expect(ids).toContain('romina');
    expect(ids).toContain('julia');
    expect(ids).not.toContain('laura');
    expect(paraMirar([laura])).toEqual([]);
  });

  it('las altas y bajas salen de la fecha real del mes', () => {
    const ahora = new Date('2026-10-25T15:00:00.000Z');
    const lista = movimientosDelMes([
      { id: 'nueva', name: 'Valeria Núñez', created_at: '2026-10-03T15:00:00.000Z' },
      { id: 'vieja', name: 'Ana', created_at: '2026-08-01T15:00:00.000Z' },
      { id: 'baja', name: 'Carla Méndez', archived_at: '2026-10-09T15:00:00.000Z' },
      { id: 'borde', name: 'Lila', created_at: '2026-10-01T02:30:00.000Z' },
    ], ahora);
    expect(lista.map(item => `${item.tipo} ${item.nombre}`)).toEqual(['Baja Carla Méndez', 'Alta Valeria Núñez']);
    expect(lista.find(item => item.tipo === 'Baja')?.detalle).toContain('No es un incumplimiento');
  });

  it('la serie de peso no rellena huecos', () => {
    expect(puntosDeSerie([])).toEqual([]);
    expect(puntosDeSerie([{
      kind: 'weight', unit: 'kg', current: [
        { id: 'b', value: 68, source: 'patient', captured_on: '2026-10-20', created_at: '2026-10-20T00:00:00.000Z' },
        { id: 'a', value: 70, source: 'patient', captured_on: '2026-10-01', created_at: '2026-10-01T00:00:00.000Z' },
      ], previous: [], current_last: null, previous_last: null, declared_delta: null,
    }]).map(punto => punto.value)).toEqual([70, 68]);
  });
});
