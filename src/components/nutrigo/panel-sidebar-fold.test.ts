import { readFileSync } from 'node:fs';
import postcss, { type Rule } from 'postcss';
import { describe, expect, it } from 'vitest';

const generated = readFileSync(new URL('./panel-v29.css', import.meta.url), 'utf8');
const app = readFileSync(new URL('./panel-v29-app.css', import.meta.url), 'utf8');

/** Especificidad aproximada: ids, clases/pseudo-clases y elementos. :not() suma lo de adentro. */
function specificity(selector: string) {
  const body = selector.replace(/:not\(([^)]+)\)/g, ' $1 ');
  const ids = (body.match(/#[\w-]+/g) ?? []).length;
  const classes = (body.match(/\.[\w-]+|:(?!not)[\w-]+(\([^)]*\))?/g) ?? []).length;
  const elements = (body.match(/(^|[\s>+~])[a-z][\w-]*/g) ?? []).length;
  return ids * 100 + classes * 10 + elements;
}

function stripped(selector: string) {
  return selector.replace(/:not\([^)]*\)/g, '');
}
function forbids(selector: string, token: string) {
  return [...selector.matchAll(/:not\(([^)]+)\)/g)].some(match => match[1].includes(token));
}
function matchesState(selector: string, state: { mcol: boolean; mob: boolean }) {
  if (stripped(selector).includes('.mcol') && !state.mcol) return false;
  if (forbids(selector, '.mcol') && state.mcol) return false;
  if (stripped(selector).includes('.mob') && !state.mob) return false;
  if (forbids(selector, '.mob') && state.mob) return false;
  return true;
}
function subject(selector: string) {
  return selector.trim().split(/[\s>+~]+/).pop() ?? '';
}
function matchesSide(selector: string, state: { mcol: boolean; mob: boolean }) {
  return subject(selector).includes('.side') && matchesState(selector, state);
}

function winning(cssText: string, prop: string, state: { mcol: boolean; mob: boolean }) {
  let winner: { spec: number; order: number; value: string } | undefined;
  let order = 0;
  postcss.parse(cssText).walkRules(rule => {
    const parent = rule.parent;
    if (parent && parent.type === 'atrule') return;
    for (const selector of rule.selectors) {
      if (!matchesSide(selector, state)) continue;
      const decl = rule.nodes.find(node => node.type === 'decl' && node.prop === prop);
      if (!decl || decl.type !== 'decl') continue;
      const spec = specificity(selector);
      order += 1;
      if (!winner || spec > winner.spec || (spec === winner.spec && order >= winner.order)) {
        winner = { spec, order, value: decl.value };
      }
    }
  });
  return winner?.value;
}

function winningFold(cssText: string, prop: string, state: { mcol: boolean; mob: boolean }) {
  let winner: { spec: number; order: number; value: string } | undefined;
  let order = 0;
  postcss.parse(cssText).walkRules((rule: Rule) => {
    const parent = rule.parent;
    if (parent && parent.type === 'atrule') return;
    for (const selector of rule.selectors) {
      if (!subject(selector).includes('.fold')) continue;
      if (!matchesState(selector, state)) continue;
      const decl = rule.nodes.find(node => node.type === 'decl' && node.prop === prop);
      if (!decl || decl.type !== 'decl') continue;
      const spec = specificity(selector);
      order += 1;
      if (!winner || spec > winner.spec || (spec === winner.spec && order >= winner.order)) {
        winner = { spec, order, value: decl.value };
      }
    }
  });
  return winner?.value;
}

const both = `${generated}\n${app}`;

describe('flecha de plegar el menú', () => {
  it('se ve con el menú abierto: no la recorta la barra y el ícono contrasta', () => {
    const open = { mcol: false, mob: false };
    expect(winning(both, 'overflow', open)).toBe('visible');
    expect(winningFold(both, 'display', open) ?? 'grid').not.toBe('none');
    expect(winningFold(both, 'z-index', open)).toBe('5');
    expect(winningFold(both, 'color', open)).toBe('var(--ink)');
    expect(winningFold(both, 'background', open)).toBe('var(--card)');
    expect(winningFold(both, 'width', open)).toBe('24px');
    expect(winningFold(both, 'height', open)).toBe('24px');
    expect(winningFold(both, 'bottom', open)).toBe('34px');
    expect(winningFold(both, 'right', open)).toBe('-12px');
  });

  it('sigue adentro del riel cuando el menú está plegado, y en el celular no aparece', () => {
    const folded = { mcol: true, mob: false };
    expect(winningFold(both, 'left', folded)).toBe('calc(50% - 12px)');
    expect(winningFold(both, 'bottom', folded)).toBe('74px');
    expect(winningFold(both, 'display', folded) ?? 'grid').not.toBe('none');
    expect(winningFold(both, 'background', folded)).toBe('var(--card)');
    expect(winning(`${generated}\n${app}`, 'overflow', folded)).not.toBe('visible');
    expect(winningFold(both, 'display', { mcol: false, mob: true })).toBe('none');
  });
});
