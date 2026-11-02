import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { pedidoBioimpedancia } from './bioimpedancia';
import { BioimpedanceReview } from './BioimpedanceReview';

const values = { weight_kg: 68, body_fat_pct: 24, muscle_kg: 27, water_pct: 52, visceral_fat: 6 };
const record = (id: string, day: string, weight: number) => ({ id, recorded_on: day, values: { ...values, weight_kg: weight }, reviewed_at: `${day}T12:00:00Z` });

describe('bioimpedancia en la ficha', () => {
  it('apagada no agrega nada a la pantalla', () => {
    expect(renderToStaticMarkup(<BioimpedanceReview patientId="p1" enabled={false} />)).toBe('');
  });
  it('muestra el texto, las cinco medidas, el guardado revisado y la evolución', () => {
    const html = renderToStaticMarkup(<BioimpedanceReview patientId="p1" enabled draft={values} records={[record('a', '2026-09-01', 70), record('b', '2026-10-01', 68)]} />);
    for (const label of ['Bioimpedancia', 'Texto del informe', 'Peso', 'Grasa corporal', 'Músculo', 'Agua', 'Grasa visceral', 'Guardar revisado', 'Evolución']) expect(html).toContain(label);
    expect(html).toContain('disabled="">Guardar revisado');
    expect(html).toContain('<svg');
  });
  it('no arma el guardado sin la revisión de la profesional', () => {
    expect(pedidoBioimpedancia({ id: '10000000-0000-4000-a000-000000000001', recordedOn: '2026-10-01', values, reviewed: false })).toBeNull();
    expect(pedidoBioimpedancia({ id: '10000000-0000-4000-a000-000000000001', recordedOn: '2026-10-01', values, reviewed: true })?.reviewed).toBe(true);
  });
});
