import { existsSync, readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { PanelBocetoShell } from './PanelBocetoShell';

const probeSource = readFileSync(new URL('../../../scripts/product-browser-logout.mjs', import.meta.url), 'utf8');
const probeStart = probeSource.indexOf('export const logoutProbe = `') + 'export const logoutProbe = `'.length;
const logoutProbe = probeSource.slice(probeStart, probeSource.lastIndexOf('`'));

const chrome = ['/opt/google/chrome/chrome', '/usr/bin/google-chrome', '/usr/bin/chromium-browser', '/usr/bin/chromium'].find(path => existsSync(path));

const shell = renderToStaticMarkup(<PanelBocetoShell
  dark collapsed={false} onCollapse={vi.fn()} menuOpen={false} onMenu={vi.fn()} nav={<nav />}
  brand="Tu consultorio" name="Tu consultorio" initials="TC" account={[{ label: 'Tema claro', glyph: 'eye', onSelect: vi.fn() }]} onSignOut={vi.fn()}
  header={{ title: 'Pacientes', search: 'Buscar' }} bell={<button type="button" aria-label="Avisos" />} onSearch={vi.fn()}
  tabs={[{ label: 'Inicio', glyph: 'grid', href: '/crm/inicio' }]} onOpen={vi.fn()} onMore={vi.fn()} mainKey="pacientes"
><p>contenido</p></PanelBocetoShell>);

/** Misma lectura que el recorrido: la expresión devuelve true solo cuando pulsó cerrar sesión. */
async function probe(page: import('playwright').Page) {
  return page.evaluate(source => Boolean(window.eval(source)), logoutProbe);
}

describe('recorrido de cerrar sesión', () => {
  it('busca la sesión dentro del menú de la cuenta, y también el menú del celular', () => {
    expect(logoutProbe).toContain('Opciones de la cuenta');
    expect(logoutProbe).toContain('Abrir el menú');
    expect(logoutProbe.indexOf('Cerrar sesión')).toBeLessThan(logoutProbe.indexOf('Opciones de la cuenta'));
  });

  it.skipIf(!chrome)('abre la cuenta del armazón y pulsa cerrar sesión', async () => {
    const browser = await chromium.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox'] });
    try {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
      await page.setContent(`<!doctype html><style>
        #pv-panel-v29 .mhd,#pv-panel-v29 .mnav,#pv-panel-v29 .mscrim{display:none}
        #pv-account[hidden]{display:none}
      </style>${shell}<script>
        document.querySelector('button.acct').addEventListener('click', () => {
          const menu = document.getElementById('pv-account');
          menu.hidden = false;
          document.querySelector('button.acct').setAttribute('aria-expanded', 'true');
        });
        document.querySelector('[aria-label="Cerrar sesión"]').addEventListener('click', () => { window.sessionClosed = true; });
      </script>`, { waitUntil: 'domcontentloaded' });
      const oldProbe = logoutProbe.replace('[aria-label="Opciones de la cuenta"], ', '');
      expect(await page.evaluate(source => Boolean(window.eval(source)), oldProbe)).toBe(false);
      let closed = false;
      for (let turn = 0; turn < 4 && !closed; turn += 1) closed = await probe(page);
      expect(closed).toBe(true);
      expect(await page.evaluate(() => Boolean((window as { sessionClosed?: boolean }).sessionClosed))).toBe(true);
    } finally {
      await browser.close();
    }
  }, 60000);

  it.skipIf(!chrome)('sigue encontrando cerrar sesión cuando ya está a la vista', async () => {
    const browser = await chromium.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox'] });
    try {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
      await page.setContent('<!doctype html><button type="button">Cerrar sesión</button>', { waitUntil: 'domcontentloaded' });
      expect(await probe(page)).toBe(true);
    } finally {
      await browser.close();
    }
  }, 60000);
});
