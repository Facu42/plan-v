import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import inicio from './source/12-792.json';
import { findSource, nodeName, sourceText, SourceView, type SourceNode } from './SourceView';
import { installCardBinding } from './install-card';

const source = inicio as SourceNode;
const card = findSource(source, node => node.tag === 'p' && /^Start your health journey/.test(sourceText(node)))!;
const button = findSource(source, node => nodeName(node) === 'Button' && sourceText(node) === 'Claim Now!')!;
const offer = { title: 'Instalar Plan V', body: 'b', card: 'Instalá Plan V en esta computadora y abrila como una app.', action: 'Instalar' };

describe('instalar desde la tarjeta amarilla del menú (lugar del «Claim Now!» del archivo)', () => {
  it('con oferta, la tarjeta invita a instalar y su botón instala', () => {
    const install = vi.fn();
    const html = renderToStaticMarkup(<>{installCardBinding(card, offer, install)?.children}</>);
    expect(html).toBe('<span class="leading-[1.5] text-[12px]">Instalá Plan V en esta computadora y abrila como una app.</span>');
    const action = installCardBinding(button, offer, install)!;
    expect(action.label).toBe('Instalar');
    expect(action.text).toBeUndefined();
    expect(renderToStaticMarkup(<SourceView source={button} resolve={node => installCardBinding(node, offer, install)} translate={t => t} />)).toMatch(/text-\[12px\][^>]*>Instalar</);
    action.onClick?.();
    expect(install).toHaveBeenCalledOnce();
  });

  it('sin oferta, la tarjeta queda como en el archivo', () => {
    expect(installCardBinding(card, null, vi.fn())).toBeUndefined();
    expect(installCardBinding(button, null, vi.fn())).toBeUndefined();
  });
});
