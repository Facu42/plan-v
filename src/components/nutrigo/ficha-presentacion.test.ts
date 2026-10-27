import { describe, expect, it } from 'vitest';
import { FICHA_SOLAPAS, avanceDeIngreso, avanceEnKilos, conteoDeSolapas, curvaFicha, diaMes, limitesDeRango, mosaicosDeMedidas, seccionDe, solapaDe, valoresAlterados } from './ficha-presentacion';
import { RECORD_TABS } from './patient-record-sections';

const medida = (kind: string, captured_on: string, value_numeric: number, unit = 'kg') => ({ kind, captured_on, created_at: `${captured_on}T10:00:00Z`, value_numeric, unit }) as never;

describe('solapas de la ficha', () => {
  it('son las diez del boceto, con Consultas tercera', () => {
    expect(FICHA_SOLAPAS.map(([id]) => id)).toEqual(['resumen', 'historia', 'consultas', 'mediciones', 'objetivos', 'plan', 'alimentario', 'laboratorio', 'archivos', 'cobros']);
  });
  it('cada sección de la ficha marca una solapa, salvo el chat', () => {
    for (const [id] of RECORD_TABS) expect(solapaDe(id) === null).toBe(id === 'chat');
    expect(solapaDe('evolucion')).toBe('mediciones');
    expect(solapaDe('notas')).toBe('consultas');
    expect(solapaDe('semanal')).toBe('plan');
  });
  it('cada solapa abre una sección que la marca de vuelta', () => {
    for (const [id] of FICHA_SOLAPAS) expect(solapaDe(seccionDe(id))).toBe(id);
  });
  it('solo cuenta lo que se conoce', () => {
    expect(conteoDeSolapas({ comidas: null, notaPorAprobar: false, alterados: 0 })).toEqual({});
    expect(conteoDeSolapas({ comidas: 3, notaPorAprobar: true, alterados: 2 })).toEqual({ consultas: { n: 1, hot: true }, alimentario: { n: 3, hot: false }, laboratorio: { n: 2, hot: true } });
  });
});

describe('mosaicos de medidas', () => {
  it('toma el último valor, el cambio contra el anterior y la curva de los últimos siete', () => {
    const [peso] = mosaicosDeMedidas([medida('weight', '2026-10-01', 70), medida('weight', '2026-10-08', 69.4)], '2026-10-27', 'Bajar a 66 kg');
    expect(peso).toMatchObject({ valor: '69,4', unidad: 'kg', cambio: '−0,6', bueno: true, serie: [70, 69.4] });
  });
  it('sin medidas dice «Sin dato» y no inventa curva', () => {
    expect(mosaicosDeMedidas([], '2026-10-27', '')[1]).toMatchObject({ valor: 'Sin dato', cambio: '—', serie: [] });
  });
  it('si el objetivo es subir, subir es bueno', () => {
    const [peso] = mosaicosDeMedidas([medida('weight', '2026-10-01', 50), medida('weight', '2026-10-08', 51)], '2026-10-27', 'Subir de peso');
    expect(peso).toMatchObject({ cambio: '+1', bueno: true });
  });
  it('ignora las medidas del futuro', () => {
    expect(mosaicosDeMedidas([medida('weight', '2026-12-01', 60)], '2026-10-27', '')[0]!.valor).toBe('Sin dato');
  });
});

describe('curva y avance', () => {
  it('con meta incluye la línea del objetivo y con una sola medición no rompe', () => {
    const curva = curvaFicha([70, 69, 68], ['1/10', '8/10', '15/10'], { meta: 66 });
    expect(curva.meta?.etiqueta).toBe('66');
    expect(curva.etiquetas).toHaveLength(3);
    expect(curvaFicha([70], null).curva).toMatch(/^M/);
  });
  it('avance en kilos desde la primera medición hasta la meta', () => {
    expect(avanceEnKilos(74, 68.4, 'Bajar a 66,5 kg')).toEqual({ pct: 75, faltan: 1.9, meta: 66.5 });
    expect(avanceEnKilos(74, 68.4, 'Comer con más regularidad')).toBeNull();
    expect(avanceEnKilos(null, 68.4, 'Bajar a 66 kg')).toBeNull();
  });
  it('el avance nunca pasa de 0 a 100', () => {
    expect(avanceEnKilos(74, 60, 'Bajar a 66 kg')?.pct).toBe(100);
    expect(avanceEnKilos(74, 80, 'Bajar a 66 kg')?.pct).toBe(0);
  });
  it('el ingreso cuenta los puntos completos', () => {
    expect(avanceDeIngreso(0)).toEqual({ completos: 5, total: 5, pct: 100 });
    expect(avanceDeIngreso(3)).toEqual({ completos: 2, total: 5, pct: 40 });
    expect(avanceDeIngreso(9).completos).toBe(0);
  });
  it('escribe las fechas como día/mes', () => { expect(diaMes('2026-10-04')).toBe('4/10'); });
});

describe('valores de laboratorio alterados', () => {
  it('lee solo rangos inequívocos', () => {
    expect(limitesDeRango('30 - 400 ng/ml')).toEqual({ min: 30, max: 400 });
    expect(limitesDeRango('< 5,2')).toEqual({ min: null, max: 5.2 });
    expect(limitesDeRango('mín. 30')).toEqual({ min: 30, max: null });
    expect(limitesDeRango('negativo')).toBeNull();
  });
  it('marca baja o alta, y no interpreta lo que no entiende ni los valores con comparador', () => {
    const lab = (name: string, value: number | null, range_text: string, operator: '' | '<' = '') => ({ name, unit: 'ng/ml', latest: { value, operator, raw_value: String(value), range_text } });
    expect(valoresAlterados([lab('Ferritina', 14, '30 - 400'), lab('Glucemia', 120, '70 - 100'), lab('Hierro', 80, '60 - 170'), lab('TSH', 3, 'según edad'), lab('PCR', 2, '< 5', '<')]).map(v => [v.nombre, v.sentido])).toEqual([['Ferritina', 'baja'], ['Glucemia', 'alta']]);
  });
});
