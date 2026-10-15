import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { CONSENT_CATALOG } from '../intake/consent.js';

const script = readFileSync(new URL('../../scripts/product-browser.local.mjs', import.meta.url), 'utf8');
// Ejecutar las expresiones reales del recorrido: el catálogo antepone permisos
// independientes de grabación y resumen al de propuestas de menú.
function browserAssertion(expected: boolean, granted: string[]) {
  const expression = script.match(new RegExp('await until\\(`([^`]+checked===' + expected + ')`\\);'))?.[1];
  if (!expression) throw new Error('Falta la comprobación persistente del permiso de menú.');
  const labels = CONSENT_CATALOG.filter(c => ['consultation_recording', 'ai_consultation', 'ai_menu_draft', 'ai_followup'].includes(c.purpose)).map(c => ({
    textContent: c.text,
    querySelector: (selector: string) => selector === 'input' ? { checked: granted.includes(c.purpose) } : null,
  }));
  const scope = 'section[aria-label="Permisos para la IA"]';
  return runInNewContext(expression, { document: {
    querySelector: (selector: string) => selector === `${scope} input` ? labels[0]?.querySelector('input') : null,
    querySelectorAll: (selector: string) => selector === `${scope} label` ? labels : [],
  } });
}

describe('Comprobaciones de permisos del recorrido de navegador', () => {
  it('confirma el menú aunque grabación y transcripción sigan sin autorización', () => {
    expect(browserAssertion(true, ['ai_menu_draft'])).toBe(true);
  });
  it('confirma el retiro del menú aunque el permiso independiente de grabación siga vigente', () => {
    expect(browserAssertion(false, ['consultation_recording'])).toBe(true);
  });
  it('no confunde grabación con menú habilitado ni un menú vigente con su retiro', () => {
    expect(browserAssertion(true, ['consultation_recording'])).toBe(false);
    expect(browserAssertion(false, ['ai_menu_draft'])).toBe(false);
  });
});
