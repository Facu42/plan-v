import { describe, expect, it } from 'vitest';
import { categoriaImc, filasDeMedidas, filasSegmentales, medidoresDe, seriesDeEvolucion, ultimaKerr, ultimaMedicion } from './ficha-mediciones';

const m = (kind: string, captured_on: string, value_numeric: number, unit: string, source = 'professional') => ({ kind, captured_on, created_at: `${captured_on}T10:00:00Z`, value_numeric, unit, source }) as never;
const HOY = '2026-10-27';

describe('medidores de la solapa Mediciones', () => {
  it('calcula el IMC con peso y altura, y dice la categoría de la OMS', () => {
    const [imc] = medidoresDe([m('weight', '2026-10-14', 68.4, 'kg'), m('height', '2026-03-12', 168, 'cm')], HOY);
    expect(imc).toMatchObject({ etiqueta: 'IMC', valor: '24,2', nota: 'Normal' });
    expect(categoriaImc(17)).toBe('Bajo peso');
    expect(categoriaImc(27)).toBe('Sobrepeso');
    expect(categoriaImc(31)).toBe('Obesidad');
  });
  it('sin altura no inventa el IMC y lo dice', () => {
    expect(medidoresDe([m('weight', '2026-10-14', 68.4, 'kg')], HOY)[0]).toMatchObject({ valor: '—', nota: 'Falta la altura', pct: 0 });
  });
  it('sin ninguna medida los cinco dicen «Sin dato» o lo que falta', () => {
    const todos = medidoresDe([], HOY);
    expect(todos).toHaveLength(5);
    expect(todos.every(x => x.valor === '—' && x.pct === 0)).toBe(true);
  });
  it('grasa y cintura muestran el cambio desde el primer registro, con el mes', () => {
    const lista = medidoresDe([m('body_fat_pct', '2026-03-12', 30.9, '%'), m('body_fat_pct', '2026-10-14', 27.8, '%'), m('waist', '2026-10-14', 78, 'cm'), m('hip', '2026-10-14', 97.5, 'cm')], HOY);
    expect(lista[1]).toMatchObject({ valor: '27,8%', nota: '−3,1 desde mar' });
    expect(lista[3]).toMatchObject({ valor: '78 cm', nota: 'Primer registro' });
    expect(lista[4]).toMatchObject({ valor: '0,8', nota: 'cintura ÷ cadera' });
  });
  it('el medidor nunca pasa de 0 a 100', () => {
    const [imc] = medidoresDe([m('weight', '2026-10-14', 300, 'kg'), m('height', '2026-03-12', 150, 'cm')], HOY);
    expect(imc!.pct).toBe(100);
  });
  it('ignora las medidas del futuro', () => {
    expect(medidoresDe([m('waist', '2027-01-01', 70, 'cm')], HOY)[3]!.valor).toBe('—');
  });
});

describe('encabezado y tablas', () => {
  it('«última 14/10 · consultorio» con la fecha más nueva y quién la cargó', () => {
    expect(ultimaMedicion([m('weight', '2026-10-14', 68, 'kg'), m('waist', '2026-10-14', 78, 'cm', 'patient'), m('weight', '2026-09-01', 70, 'kg')], HOY)).toBe('última 14/10 · consultorio y paciente');
    expect(ultimaMedicion([], HOY)).toBe('sin mediciones');
  });
  it('perímetros: último, fecha, anterior y cambio; saltea lo que no tiene datos', () => {
    const filas = filasDeMedidas([m('waist', '2026-09-03', 80, 'cm'), m('waist', '2026-10-14', 78, 'cm'), m('arm', '2026-10-14', 31, 'cm')], 'perimetros', HOY);
    expect(filas.map(f => f.sitio)).toEqual(['Cintura', 'Brazo']);
    expect(filas[0]).toMatchObject({ ultimo: '78 cm', fecha: '14/10', anterior: '80 cm', cambio: '−2' });
    expect(filas[1]).toMatchObject({ anterior: '—', cambio: '—' });
  });
  it('segmental compara la última evaluación con la anterior', () => {
    const reg = (id: string, fecha: string, valor: number) => ({ id, recorded_on: fecha, created_at: `${fecha}T10:00:00Z`, data: { kind: 'segmental', values: [{ segment: 'trunk', component: 'muscle', value: valor, unit: 'kg', original: 'x' }] } }) as never;
    const filas = filasSegmentales([reg('a', '2026-03-12', 24), reg('b', '2026-10-14', 25.5)], HOY);
    expect(filas).toEqual([{ sitio: 'Tronco · Músculo', ultimo: '25,5 kg', fecha: '14/10', anterior: '24 kg', cambio: '+1,5' }]);
    expect(filasSegmentales([], HOY)).toEqual([]);
  });
});

describe('Kerr y evolución', () => {
  const kerr = (masas: Record<string, number | null>) => ({ id: 'k', recorded_on: '2026-10-14', created_at: '2026-10-14T10:00:00Z', data: { kind: 'kerr', weight_kg: 68.4, components_kg: masas } }) as never;
  it('muestra solo las masas cargadas y no calcula la suma si falta alguna', () => {
    const r = ultimaKerr([kerr({ adipose: 22.1, muscle: 29.8, bone: null, residual: 5.4, skin: 3.5 })], HOY)!;
    expect(r.componentes.map(c => c.etiqueta)).toEqual(['Adiposa', 'Muscular', 'Residual', 'Piel']);
    expect(r.completo).toBe(false);
    expect(r.suma).toBeNull();
  });
  it('con las cinco masas calcula la suma y la diferencia con el peso', () => {
    const r = ultimaKerr([kerr({ adipose: 22.1, muscle: 29.8, bone: 7.6, residual: 5.4, skin: 3.5 })], HOY)!;
    expect(r.completo).toBe(true);
    expect(r.suma).toBeCloseTo(68.4, 5);
    expect(r.componentes[0]).toMatchObject({ pct: 32, clase: 'o' });
  });
  it('sin evaluación Kerr devuelve null', () => { expect(ultimaKerr([], HOY)).toBeNull(); });
  it('el gráfico toma los últimos seis valores y la meta solo si el objetivo trae kilos', () => {
    const medidas = [74, 72, 71, 70, 69.5, 69, 68.4].map((v, i) => m('weight', `2026-0${i + 3}-10`, v, 'kg'));
    const [peso, grasa] = seriesDeEvolucion(medidas, 'Bajar a 66,5 kg', HOY);
    expect(peso!.valores).toHaveLength(6);
    expect(peso!.meta).toBe(66.5);
    expect(grasa!.valores).toEqual([]);
    expect(seriesDeEvolucion(medidas, 'Comer mejor', HOY)[0]!.meta).toBeNull();
  });
});
