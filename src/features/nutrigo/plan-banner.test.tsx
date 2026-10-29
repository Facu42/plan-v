import { describe, expect, it, vi } from 'vitest';
import { planBannerBinding } from './plan-banner';
import type { SourceNode } from './SourceView';

const p = (text: string): SourceNode => ({ tag: 'p', props: {}, children: [text] });
const button: SourceNode = { tag: 'div', props: { 'data-name': 'Button' }, children: [p('Claim Now!')] };

describe('aviso de plan nuevo en la tarjeta amarilla', () => {
  it('sin aviso deja la tarjeta como en el archivo', () => {
    expect(planBannerBinding(p('Start your health journey with a FREE 1-month access to Nutrigo!'), null, () => undefined)).toBeUndefined();
    expect(planBannerBinding(button, null, () => undefined)).toBeUndefined();
  });
  it('con aviso cuenta el cambio y el botón abre «Qué cambia»', () => {
    const open = vi.fn();
    expect(planBannerBinding(p('Start your health journey with a FREE 1-month access to Nutrigo!'), 'Tu nutricionista publicó tu plan.', open)?.children).toBeTruthy();
    const action = planBannerBinding(button, 'Tu nutricionista publicó tu plan.', open);
    expect(action?.label).toBe('Ver qué cambia en el plan');
    action?.onClick?.(); expect(open).toHaveBeenCalledOnce();
    expect(planBannerBinding(p('Claim Now!'), 'x', open)?.text).toBe('Ver qué cambia');
  });
  it('no toca otros nodos', () => {
    expect(planBannerBinding(p('Meal Plan'), 'x', () => undefined)).toBeUndefined();
  });
});
