import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { enterDemo } from './helpers';

// Medimos el DOM dibujado por el HTML de referencia y la app real, en el mismo
// estado y con Inter cargada en ambos. Las capturas no determinan los valores.
for (const theme of ['light', 'dark']) test(`Punto 4: estilos contra código v29, ${theme}`, async ({ page, browser }) => {
  test.setTimeout(120_000);
  await page.addInitScript(value => localStorage.setItem('plan-v:panel-theme-v2:demo', value), theme);
  await enterDemo(page, '/crm/inicio');
  const source = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: theme as 'light' | 'dark' });
  await source.route(/^https?:/, route => route.abort());
  try {
    await source.goto(`file://${resolve('design/panel-nutri/v29/panel-trabajo.html')}`, { waitUntil: 'domcontentloaded' });
    await source.evaluate(() => {
      document.getElementById('stage')!.style.transform = 'none';
      document.getElementById('wrap')!.style.height = '900px';
    });
    await source.addStyleTag({ content: [300, 400, 500, 600].map(weight => `@font-face{font-family:Inter;font-style:normal;font-weight:${weight};src:url(data:font/woff2;base64,${readFileSync(resolve(`node_modules/@fontsource/inter/files/inter-latin-${weight}-normal.woff2`)).toString('base64')})}`).join('\n') });
    await source.evaluate(async value => { document.documentElement.dataset.theme = value; await Promise.all([300, 400, 500, 600].map(weight => document.fonts.load(`${weight} 16px Inter`))); }, theme);
    await expect(page.locator('#pv-panel-v29')).toHaveAttribute('data-theme', theme);
    const measure = (p: Page, selector: string, props: string[]) => p.locator(selector).first().evaluate((element, names) => {
      const css = getComputedStyle(element);
      return Object.fromEntries(names.map(name => [name, name === 'height' ? element.getBoundingClientRect().height.toFixed(2) : css.getPropertyValue(name)]));
    }, props);
    const compare = async (label: string, selector: string, props: string[], appSelector = selector) => {
      await expect(source.locator(selector).first()).toBeVisible();
      await expect(page.locator(appSelector).first()).toBeVisible();
      const wanted = await measure(source, selector, props);
      const actual = await measure(page, appSelector, props);
      console.log(`${theme} ${label}: ${JSON.stringify({ wanted, actual })}`);
      for (const prop of props) {
        if (prop === 'height') expect.soft(Math.abs(Number(actual[prop]) - Number(wanted[prop])), `${label}: ${prop}`).toBeLessThanOrEqual(0.6);
        else expect.soft(actual[prop], `${label}: ${prop}`).toEqual(wanted[prop]);
      }
    };
    const go = async (screen: string, href: string) => {
      await source.evaluate(value => (globalThis as unknown as { go: (id: string) => void }).go(value), screen);
      await page.locator(`#pv-panel-v29 .side a[href="${href}"]`).first().click();
      await expect(page.locator(`#s-${screen}`)).toBeVisible();
    };
    await go('planes', '/crm/plan');
    await compare('botón de fila', '#s-planes .r29-table .sbtn', ['display', 'font-size', 'height']);
    await compare('ícono de fila', '#s-planes .r29-table .sbtn svg', ['display', 'position', 'vertical-align']);
    await go('publica', '/crm/agenda?agenda=publica');
    await compare('panel público', '#s-publica .fxp.g', ['overflow']);
    await source.locator('#pubview button').nth(2).click();
    await page.locator('#pubview button').nth(2).click();
    // Dos filas visibles permiten probar también el caso que antes se alineaba al inicio.
    for (const current of [source, page]) await current.locator('#s-publica .pubhr.pubev').first().evaluate(el => [...el.children].slice(2).forEach(row => row.remove()));
    await compare('distribución con dos filas', '#s-publica .pubhr.pubev', ['justify-content']);
    await go('ayuda', '/crm/ayuda');
    await compare('borde de Ayuda', '#s-ayuda .fxp', ['border-top-color']);
    await compare('tema seleccionado de Ayuda', '#s-ayuda .sxtemas .chip.on', ['color', 'background-color', 'border-top-color']);
    await go('equipo', '/crm/equipo');
    await compare('Equipo sin relleno extra', '#s-equipo .fx', ['padding-top']);
    await go('mensajes', '/crm/mensajes');
    await compare('panel lateral de Mensajes', '#s-mensajes .mside .fxp.g', ['overflow']);
    await compare('filtro seleccionado de Mensajes', '#mfil button.on', ['padding-left', 'padding-top']);
    await compare('botón enviar', '#s-mensajes .mcomp .ibtn.go', ['color', 'padding-top', 'padding-left', 'font-size']);
    await go('ajustes', '/crm/ajustes');
    await compare('interruptor', '#s-ajustes .sw', ['padding-top', 'padding-left', 'font-size', 'color']);
    await page.locator('#pv-panel-v29 .side a[href="/crm/pacientes"]').first().click();
    await page.locator('#prows tr[data-i]').first().click();
    await page.locator('#prows .pd-acts .go').first().click();
    await source.evaluate(() => (globalThis as unknown as { go: (id: string) => void }).go('ficha'));
    await source.locator('#ftabs [data-ft="historia"]').click();
    await page.locator('#ftabs button').filter({ hasText: /^Historia clínica/ }).click();
    await compare('Historia sin relleno extra', '#s-ficha .hcx', ['padding-top']);
    await expect(page.locator('#s-ficha .pw-record')).toHaveCSS('padding-top', '0px');
    await compare('separación ícono y texto', '#s-ficha .cbtn.sbtn', ['column-gap']);
    await compare('botón de ícono en Ficha', '#s-ficha .ntfhg .ibtn', ['padding-top', 'padding-left', 'font-size', 'color']);
  } finally { await source.close(); }
});
