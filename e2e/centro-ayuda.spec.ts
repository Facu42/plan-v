import { expect, test } from '@playwright/test';
import { enterDemo } from './helpers';

test('Ayuda: filtros, búsqueda en pasos/error, selección y enlace anterior', async ({ page }) => {
  await enterDemo(page, '/crm/desarrollo?modulo=ayuda');
  const help = page.locator('#s-ayuda');
  await expect(page.getByRole('heading', { name: 'Centro de ayuda', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Datos', exact: true }).click();
  await expect(help.getByRole('button', { name: /^Ver / })).toHaveCount(1);
  await expect(help.getByRole('heading', { name: 'Importar una cartera' })).toBeVisible();
  await page.getByRole('button', { name: 'Todas', exact: true }).click();
  await page.getByRole('button', { name: 'Ver Plan y lista de compras', exact: true }).click();
  await expect(help.getByRole('heading', { name: 'Plan y lista de compras' })).toBeVisible();
  await page.getByLabel('Buscar una guía').fill('  XLSX  ');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(help.getByRole('heading', { name: 'Importar una cartera' })).toBeVisible();
  await page.getByLabel('Buscar una guía').fill('conciliación');
  await expect(help.getByRole('heading', { name: 'Agenda y cobranzas' })).toBeVisible();
  await page.getByLabel('Buscar una guía').fill('texto inexistente');
  await expect(help.getByText('No encontramos una guía con ese texto.')).toBeVisible();
  await expect(help.getByRole('button', { name: 'Abrir apartado', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'La más consultada' }).click();
  await expect(help.getByRole('status')).toContainText('Todavía no hay medición');
  await page.getByLabel('Buscar una guía').fill('');
  await help.getByRole('button', { name: 'Abrir apartado', exact: true }).click();
  await expect(page).toHaveURL(/\/crm\/mensajes/);
});

test('Ayuda: FAQ abre destinos reales y pedido local no genera solicitudes', async ({ page }) => {
  await enterDemo(page, '/crm/ayuda');
  const help = page.locator('#s-ayuda');
  await help.getByRole('button', { name: /¿Puedo corregir SARA 2/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('No. SARA 2 se consulta.', { exact: false })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Cerrar', exact: true })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: 'Cerrar panel' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(help.getByRole('button', { name: /¿Puedo corregir SARA 2/ })).toBeFocused();
  await help.getByRole('button', { name: /¿Puedo corregir SARA 2/ }).click();
  await dialog.getByRole('button', { name: 'Abrir el apartado' }).click();
  await expect(page).toHaveURL(/\/crm\/alimentos/);
  await enterDemo(page, '/crm/ayuda');
  const writes: string[] = [];
  page.on('request', request => { if (request.url().includes('/api/') && request.method() !== 'GET') writes.push(request.url()); });
  await help.getByRole('button', { name: 'Pedir ayuda a Plan V' }).click();
  await dialog.getByLabel('Apartado', { exact: true }).selectOption('Pacientes e invitaciones');
  await dialog.getByLabel('Qué pasó', { exact: true }).fill('No veo una opción. Ejemplo ficticio.');
  await dialog.getByRole('button', { name: 'Anotar pedido' }).click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('checkbox').check();
  await dialog.getByRole('button', { name: 'Anotar pedido' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(help.getByRole('status')).toContainText('No se envió a Plan V');
  expect(writes).toEqual([]);
});

test('Ayuda: 1440/390, claro/oscuro, Inter y diálogos dentro de pantalla', async ({ page }) => {
  await enterDemo(page, '/crm/ayuda');
  await expect(page.locator('#s-ayuda')).toBeVisible();
  for (const width of [1440, 390]) for (const dark of [false, true]) {
    await page.setViewportSize({ width: 1440, height: 900 });
    if (await page.locator('#pv-panel-v29').getAttribute('data-theme') !== (dark ? 'dark' : 'light')) {
      await page.locator('#pv-panel-v29 .side .acct').click();
      await page.locator('#pv-account').getByRole('button', { name: dark ? 'Tema oscuro' : 'Tema claro', exact: true }).click();
    }
    await page.setViewportSize({ width, height: 900 });
    const columns = page.locator('#s-ayuda .help-columns > .c');
    const left = (await columns.nth(0).boundingBox())!;
    const right = (await columns.nth(1).boundingBox())!;
    if (width === 390) expect(right.y).toBeGreaterThanOrEqual(left.y + left.height);
    else expect(right.x).toBeGreaterThan(left.x);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await page.locator('#s-ayuda').evaluate(el => getComputedStyle(el).fontFamily)).toContain('Inter');
    await page.screenshot({ path: `docs/screenshots/centro-ayuda/ayuda-${width}-${dark ? 'oscuro' : 'claro'}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Pedir ayuda a Plan V' }).click();
    const dialog = page.getByRole('dialog');
    const box = (await dialog.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    expect(box.y + box.height).toBeLessThanOrEqual(900);
    await page.screenshot({ path: `docs/screenshots/centro-ayuda/pedido-${width}-${dark ? 'oscuro' : 'claro'}.png` });
    await page.keyboard.press('Escape');
  }
});
