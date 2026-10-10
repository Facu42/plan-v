import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import inicio from './source/12-792.json';
import { findSource, nodeName, sourceText, SourceView, type SourceNode } from './SourceView';
import { feeBannerBinding, insertMobileFeeBanner, noticeFromLedger } from './fee-notice';
import mobileHome from './source/427-14405.json';
import type { PatientLedger } from '../../types/fees';

const ledger = (charges: PatientLedger['charges']): PatientLedger => ({ patient_id: 'pat-1', fee: null, charges, payments: [] });
const source = inicio as SourceNode;
const banner = findSource(source, node => node.tag === 'p' && /^Start your health journey/.test(sourceText(node)))!;
const button = findSource(source, node => nodeName(node) === 'Button' && sourceText(node) === 'Claim Now!')!;

describe('aviso de cuota en el banner del archivo', () => {
  it('no hay aviso si la paciente no tiene cuotas', () => {
    expect(noticeFromLedger(ledger([]))).toBeNull();
  });

  it('avisa de una cuota vencida sin pagar', () => {
    const text = noticeFromLedger(ledger([{ id: 'c1', due_on: '2020-01-05', amount: 45000, status: 'open' }]), '2020-02-01');
    expect(text).toMatch(/cuota pendiente/);
  });

  it('con aviso, el banner cuenta la cuota y el botón lleva a Pagos', () => {
    const navigate = vi.fn();
    const html = renderToStaticMarkup(<>{feeBannerBinding(banner, 'Tenés una cuota pendiente de $45.000', navigate)?.children}</>);
    // El <p> del archivo tiene text-[0px]: el tamaño real va en el <span>.
    expect(html).toBe('<span class="leading-[1.5] text-[12px]">Tenés una cuota pendiente de $45.000</span>');
    const action = feeBannerBinding(button, 'aviso', navigate)!;
    expect(action.label).toBe('Ver pagos');
    expect(action.text).toBeUndefined();
    expect(renderToStaticMarkup(<SourceView source={button} resolve={node => feeBannerBinding(node, 'aviso', navigate)} translate={t => t} />)).toMatch(/text-\[12px\][^>]*>Ver pagos</);
    action.onClick?.();
    expect(navigate).toHaveBeenCalledWith('pagos');
  });

  it('sin aviso, el banner queda como en el archivo', () => {
    expect(feeBannerBinding(banner, null, vi.fn())).toBeUndefined();
    expect(feeBannerBinding(button, null, vi.fn())).toBeUndefined();
  });
});

describe('aviso de cuota en el celular', () => {
  const mobile = mobileHome as SourceNode;
  const promo = findSource(source, node => nodeName(node) === 'Promotional Banner')!;

  it('el marco del celular no trae la tarjeta amarilla', () => {
    expect(findSource(mobile, node => nodeName(node) === 'Promotional Banner')).toBeUndefined();
    expect(insertMobileFeeBanner(mobile, null)).toBe(mobile);
  });

  it('con aviso, muestra la tarjeta del archivo y deja las cuatro medidas del inicio', () => {
    const navigate = vi.fn();
    const tree = insertMobileFeeBanner(mobile, promo);
    const again = insertMobileFeeBanner(tree, promo);
    expect(again.children).toEqual(tree.children);
    const html = renderToStaticMarkup(
      <SourceView source={tree} resolve={node => feeBannerBinding(node, 'Tenés una cuota pendiente de $45.000', navigate)} translate={text => text} />,
    );
    expect(html).toContain('data-name="Promotional Banner"');
    expect(html).toContain('Tenés una cuota pendiente de $45.000');
    expect(html).toContain('Ver pagos');
    expect(html.match(/data-name="Card Statistic - Dashboard"/g)).toHaveLength(4);
    expect(html).toContain('bg-[#ffcb65]');
    expect(html).toContain('bg-[#c2e66e]');
    const buttonNode = findSource(tree, node => nodeName(node) === 'Button' && sourceText(node) === 'Claim Now!')!;
    feeBannerBinding(buttonNode, 'aviso', navigate)?.onClick?.();
    expect(navigate).toHaveBeenCalledWith('pagos');
  });
});
