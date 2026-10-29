import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LabLectura } from './LabLectura';
import type { Lectura } from './lab-lectura';

const lectura: Lectura = {
  ultima: '2026-10-10', previa: '2026-03-10', texto: 'Análisis del 10/10/26: 1 valor.',
  filas: [{ nombre: 'Ferritina', unidad: 'ng/ml', valor: '14', cambio: 'sube 3', estado: { texto: 'Bajo', clase: 'p-bad', fuera: true } }],
};

describe('LabLectura', () => {
  it('muestra la comparación, la lectura editable y avisa que no se guarda ni usa IA externa', () => {
    const html = renderToStaticMarkup(<LabLectura lectura={lectura} onClose={() => undefined} />);
    expect(html).toContain('Lectura de los valores');
    expect(html).toContain('Comparado con el 10/03/26');
    expect(html).toContain('14 ng/ml · sube 3 · bajo');
    expect(html).toContain('No se guarda');
    expect(html).toContain('sin IA externa');
    expect(html).toContain('Copiar lectura');
  });

  it('sin valores deja desactivado el botón de copiar', () => {
    const html = renderToStaticMarkup(<LabLectura lectura={{ ultima: null, previa: null, filas: [], texto: 'Todavía no hay valores revisados.' }} onClose={() => undefined} />);
    expect(html).toMatch(/<button[^>]*disabled[^>]*>Copiar lectura/);
  });
});
