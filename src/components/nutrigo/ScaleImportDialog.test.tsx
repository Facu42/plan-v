import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { parseScaleReport } from '../../lib/scale-report';
import { ScaleImportView } from './ScaleImportDialog';

describe('importación de informe de balanza', () => {
  it('muestra lo reconocido con su renglón de origen y avisa que todavía no se guardó nada', () => {
    const html = renderToStaticMarkup(<ScaleImportView reading={parseScaleReport('Fecha 08/10/2026\nGrasa corporal 27,5 %\nMasa muscular 24,1 kg\nGrasa visceral 90')} onReview={vi.fn()} />);
    expect(html).toContain('08/10/2026');
    expect(html).toContain('Nada se guarda todavía');
    expect(html).toContain('Grasa corporal');
    expect(html).toContain('Para cargar');
    expect(html).toContain('No se puede cargar');
    expect(html).toContain('Revisar y cargar 2');
  });

  it('un informe sin nada reconocible lo dice y no ofrece cargar', () => {
    const html = renderToStaticMarkup(<ScaleImportView reading={parseScaleReport('texto cualquiera')} onReview={vi.fn()} />);
    expect(html).toContain('No reconocimos mediciones');
    expect(html).not.toContain('Revisar y cargar');
  });

  it('si todo ya estaba cargado no hay nada nuevo para cargar', () => {
    const reading = parseScaleReport('Fecha 08/10/2026\nGrasa corporal 27,5 %', [{ kind: 'body_fat_pct', value_numeric: 27.5, captured_on: '2026-10-08' }]);
    const html = renderToStaticMarkup(<ScaleImportView reading={reading} onReview={vi.fn()} />);
    expect(html).toContain('Ya cargada');
    expect(html).toContain('Nada nuevo para cargar');
  });
});
