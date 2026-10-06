import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import desktop from './source/84-2994.json';
import mobile from './source/470-15300.json';
import { SourceView, findSource, nodeName, sourceText, type SourceNode } from './SourceView';
import { patientExtraBinding } from './patient-extra-binding';
import { translateSource } from './translation';

describe('shell compartido para las pantallas adicionales del paciente', () => {
  it.each(['pagos', 'ficha'] as const)('muestra su título y retira el mes del plan en %s', page => {
    for (const tree of [desktop, mobile] as SourceNode[]) {
      const html = renderToStaticMarkup(<SourceView source={tree} resolve={node => patientExtraBinding(node, page, () => undefined)} translate={translateSource} />);
      expect(html).toContain(page === 'pagos' ? 'Mis pagos' : 'Mi ficha');
      expect(html).not.toContain('data-name="Header-Section"');
    }
  });
  it('el plan conserva su acceso sin aparecer seleccionado desde Pagos', () => {
    const node = findSource(desktop as SourceNode, item => nodeName(item) === 'SubMenu' && sourceText(item) === 'Meal Plan')!;
    const navigate = vi.fn();
    const binding = patientExtraBinding(node, 'pagos', navigate)!;
    binding.onClick?.();
    expect(navigate).toHaveBeenCalledWith('plan');
    expect(binding.props?.style).toEqual({ background: 'transparent' });
  });
});
