import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Measurement } from '../../types/care';
import { MeasurementsBoard } from './ProfessionalMeasurements';

const row = (kind: Measurement['kind'], value: number, captured_on: string, unit = 'cm', id = `${kind}-${captured_on}`): Measurement =>
  ({ id, patient_id: 'p', kind, value_numeric: value, unit, source: 'professional', captured_on, created_at: `${captured_on}T12:00:00Z` });
const render = (measurements: Measurement[], allowed = true, initialOpen: Parameters<typeof MeasurementsBoard>[0]['initialOpen'] = null) =>
  renderToStaticMarkup(<MeasurementsBoard measurements={measurements} allowed={allowed} patientName="Sofía" onEnter={() => undefined} initialOpen={initialOpen} />);

describe('mediciones de la ficha', () => {
  it('muestra los tres grupos y sus métricas, con «Sin dato» donde no se midió y nunca un cero inventado', () => {
    const html = render([]);
    for (const text of ['Básicas', 'Composición corporal', 'Perímetros', 'Grasa corporal', 'Masa muscular', 'Agua corporal', 'Abdominal', 'Muslo', 'Altura', 'Cintura']) expect(html).toContain(text);
    expect(html).toContain('Sin dato');
    expect(html).toContain('Todavía sin medir');
    expect(html).not.toMatch(/>0 (cm|kg|%)</);
    expect(html).toContain('Cargar mediciones');
  });

  it('muestra el último valor de cada métrica, su fecha y su tendencia en palabras', () => {
    const html = render([row('thigh', 55, '2026-09-01'), row('thigh', 53.5, '2026-10-01'), row('body_fat_pct', 27.5, '2026-10-01', '%')]);
    expect(html).toContain('53,5 cm');
    expect(html).toContain('1 oct 2026 · ↓ 1,5 cm');
    expect(html).toContain('27,5 %');
    expect(html).toContain('1 oct 2026 · 1 registro');
  });

  it('cada tarjeta se puede abrir con un botón con nombre accesible', () => {
    expect(render([])).toContain('aria-label="Ver detalle de Grasa corporal"');
  });

  it('el detalle muestra mínimo, promedio, máximo, historial con diferencias y marca la última medición', () => {
    const html = render([row('thigh', 55, '2026-09-01'), row('thigh', 53, '2026-09-15'), row('thigh', 54, '2026-10-01')], true, 'thigh');
    expect(html).toContain('Detalle de Muslo');
    expect(html).toContain('Mínimo'); expect(html).toContain('53 cm');
    expect(html).toContain('Promedio'); expect(html).toContain('54 cm');
    expect(html).toContain('Máximo'); expect(html).toContain('55 cm');
    expect(html).toContain('Última');
    expect(html).toContain('+1 cm');
    expect(html).toContain('−2 cm');
    expect(html).toContain('Primer registro');
    expect(html).toContain('Historial de muslo');
    expect(html).toContain('Subió 1 cm desde el registro anterior');
  });

  it('sin permiso de medidas no muestra valores ni deja cargar', () => {
    const html = render([row('thigh', 55, '2026-09-01')], false);
    expect(html).toContain('Falta el permiso de medidas');
    expect(html).toContain('Sofía todavía no autorizó');
    expect(html).not.toContain('55 cm');
    expect(html).not.toContain('Cargar mediciones');
  });

  it('el gráfico tiene descripción textual con todas las fechas y valores', () => {
    const html = render([row('arm', 30, '2026-09-01'), row('arm', 31, '2026-10-01')], true, 'arm');
    expect(html).toContain('Evolución de Brazo: 1 sep 2026 30 cm; 1 oct 2026 31 cm');
  });
});
