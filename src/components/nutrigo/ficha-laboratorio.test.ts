import { describe, expect, it } from 'vitest';
import type { ClinicalWorkspaceRecord, ClinicalWorkspaceSnapshot } from '../../types/clinical-workspace';
import { recordLabSeries } from './panel-record-data';
import { analisisDeFecha, analisisPorFecha, estadoDe, fechasDeLaboratorio, graficoDeValor, historialDeValor, metaDeAnalisis, pedidosDeEstudios, valoresPorFecha } from './ficha-laboratorio';

const uid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const valor = (n: number, nombre: string, v: number | null, rango: string, unidad = 'ng/ml', operador: '' | '<' | '>' = '') => ({ id: uid(n), name: nombre, value: v, operator: operador, unit: unidad, range_text: rango, raw_value: v === null ? '<5' : String(v).replace('.', ','), source_line: nombre, page: 1, reviewed: true as const });
const registro = (n: number, fecha: string, documento: number, valores: ReturnType<typeof valor>[]) => ({ id: uid(n), patient_id: 'p1', recorded_on: fecha, created_at: `${fecha}T10:00:00Z`, note: '', reviewed: true as const, data: { kind: 'laboratory' as const, document_id: uid(documento), values: valores } }) as ClinicalWorkspaceRecord;
const documento = (n: number, nombre: string) => ({ id: uid(n), patient_id: 'p1', filename: nombre, mime: 'application/pdf', source_sha256: 'a'.repeat(64), asset_id: 'z', created_at: '2026-10-12T10:00:00Z' });
const registros = [
  registro(1, '2026-03-20', 101, [valor(10, 'Ferritina', 11, '30 - 200'), valor(11, 'Hemoglobina', 11.9, '12 - 16', 'g/dl')]),
  registro(2, '2026-10-12', 102, [valor(20, 'Ferritina', 14, '30 - 200'), valor(21, 'Hemoglobina', 12.3, '12 - 16', 'g/dl'), valor(22, 'PCR', null, '< 5', 'mg/l', '<')]),
];
const snapshot = { records: registros, documents: [documento(101, 'Laboratorio 03-26.pdf'), documento(102, 'Laboratorio 12-10.pdf')], references: [], brand: null } as ClinicalWorkspaceSnapshot;
const series = recordLabSeries(registros, 'p1', '2026-10-27');

describe('estado de un valor de laboratorio', () => {
  it('marca bajo y alto contra el rango del informe', () => {
    expect(estadoDe({ value: 14, operator: '', range_text: '30 - 200' })).toMatchObject({ texto: 'Bajo', fuera: true });
    expect(estadoDe({ value: 250, operator: '', range_text: '30 - 200' })).toMatchObject({ texto: 'Alto', fuera: true });
  });
  it('avisa «Límite» cuando queda pegado al piso del rango y «Normal» si no', () => {
    expect(estadoDe({ value: 12.3, operator: '', range_text: '12 - 16' })?.texto).toBe('Límite');
    expect(estadoDe({ value: 86, operator: '', range_text: '70 - 100' })?.texto).toBe('Normal');
  });
  it('no interpreta resultados con comparador, sin valor exacto ni rangos ambiguos', () => {
    expect(estadoDe({ value: null, operator: '<', range_text: '< 5' })).toBeNull();
    expect(estadoDe({ value: 3, operator: '<', range_text: '< 5' })).toBeNull();
    expect(estadoDe({ value: 3, operator: '', range_text: 'según edad y sexo' })).toBeNull();
    expect(estadoDe({ value: 3, operator: '', range_text: '' })).toBeNull();
  });
});

describe('tabla por fechas', () => {
  it('toma las últimas fechas, de la más vieja a la más nueva, y cuenta los análisis', () => {
    expect(fechasDeLaboratorio(series)).toEqual(['2026-03-20', '2026-10-12']);
    expect(metaDeAnalisis(series)).toBe('2 análisis · el último el 12/10');
    expect(metaDeAnalisis([])).toBe('sin análisis cargados');
  });
  it('deja un guion donde no hubo análisis y marca lo que sale del rango', () => {
    const ferritina = series.find(s => s.name === 'Ferritina')!;
    expect(valoresPorFecha(ferritina, ['2026-01-01', '2026-10-12'])).toEqual([{ texto: '—', fuera: false }, { texto: '14', fuera: true }]);
  });
});

describe('análisis entero de una fecha', () => {
  it('compara cada valor con el anterior y dice «primera vez» cuando no hay', () => {
    const filas = analisisDeFecha(series, '2026-10-12');
    expect(filas.find(f => f.nombre === 'Ferritina')).toMatchObject({ valor: '14', fuera: true, antes: '↑ antes 11' });
    expect(filas.find(f => f.nombre === 'PCR')).toMatchObject({ valor: '<5', antes: 'primera vez' });
  });
  it('lista un informe por fecha con cuántos valores salen del rango', () => {
    const lista = analisisPorFecha(snapshot, 'p1', '2026-10-27');
    expect(lista[0]).toMatchObject({ fecha: '2026-10-12', archivo: 'Laboratorio 12-10.pdf', valores: 3, fuera: 1 });
    expect(analisisPorFecha(snapshot, 'otra', '2026-10-27')).toEqual([]);
    expect(analisisPorFecha(snapshot, 'p1', '2026-04-01')).toHaveLength(1);
  });
  it('arma el historial de un valor con el archivo de origen', () => {
    const historial = historialDeValor(series.find(s => s.name === 'Ferritina')!, snapshot, 'p1');
    expect(historial.map(h => [h.fecha, h.valor, h.archivo])).toEqual([['2026-10-12', '14', 'Laboratorio 12-10.pdf'], ['2026-03-20', '11', 'Laboratorio 03-26.pdf']]);
  });
});

describe('curva del valor', () => {
  it('dibuja la banda del rango y un punto por resultado exacto', () => {
    const grafico = graficoDeValor(series.find(s => s.name === 'Ferritina')!)!;
    expect(grafico.puntos).toHaveLength(2);
    expect(grafico.banda?.texto).toBe('30–200');
    expect(grafico.puntos.every(p => p.fuera)).toBe(true);
  });
  it('no dibuja un valor que solo tiene resultados con comparador', () => {
    expect(graficoDeValor(series.find(s => s.name === 'PCR')!)).toBeNull();
  });
});

describe('pedidos de estudios', () => {
  it('lista los pedidos de la paciente, el más nuevo primero', () => {
    const pedido = (n: number, fecha: string, estudios: string[], motivo: string, paciente = 'p1') => ({ id: uid(n), patient_id: paciente, recorded_on: fecha, created_at: `${fecha}T09:00:00Z`, note: '', reviewed: true as const, data: { kind: 'study_order' as const, studies: estudios, reason: motivo, instructions: '' } }) as ClinicalWorkspaceRecord;
    const lista = pedidosDeEstudios([pedido(1, '2026-03-12', ['Perfil tiroideo'], ''), pedido(2, '2026-10-27', ['Hierro', 'Ferritina'], 'control'), pedido(3, '2026-10-27', ['Otro'], '', 'p2')], 'p1');
    expect(lista.map(p => [p.titulo, p.sub])).toEqual([['Hierro, Ferritina', 'pedido el 27/10 · control'], ['Perfil tiroideo', 'pedido el 12/3']]);
  });
});
