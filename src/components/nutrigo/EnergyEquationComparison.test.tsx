import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { EnergyEquationComparison } from './EnergyEquationComparison';

const input = { sex: 'femenino' as const, age: 30, weight_kg: 65, height_cm: 165, activity: 'ligera' as const };

describe('comparación de fórmulas en Planificación', () => {
  it('muestra cada fórmula con basal y gasto diario, y cuál usa la meta', () => {
    const html = renderToStaticMarkup(<EnergyEquationComparison input={input} bodyFat={{ value: 28, date: '2026-10-01' }} scaleBmr={null} />);
    for (const label of ['Comparar fórmulas', 'Mifflin-St Jeor', 'Harris-Benedict revisada', 'FAO/OMS/ONU', 'Katch-McArdle']) expect(html).toContain(label);
    expect(html).toContain('Usa la meta');
    expect(html).toContain('1370 kcal');
    expect(html).toContain('Grasa corporal 28 % del 01/10/2026');
  });
  it('sin grasa corporal lo dice y no muestra un número inventado', () => {
    const html = renderToStaticMarkup(<EnergyEquationComparison input={input} bodyFat={null} scaleBmr={null} />);
    expect(html).toContain('Falta la grasa corporal en Mediciones');
  });
});
