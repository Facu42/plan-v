import { expect, test, type Page } from '@playwright/test';
import { enterDemo } from './helpers';


// Equipo no ofrece persistencia en demo. Contratos HTTP simulados con identidades ficticias.
async function fixtureTeam(page: Page) {
  const nid = '11111111-1111-4111-8111-111111111111';
  await page.route('**/api/team', r => r.fulfill({ json: { workplaces: [{ nutritionist_id: nid, name: 'Consultorio de prueba', owner: true }] } }));
  await page.route('**/api/team/*/members', r => r.fulfill({ json: { members: [{ user_id: '22222222-2222-4222-8222-222222222222', email: 'recepcion@example.test', revoked: false }] } }));
  await page.route('**/api/orgs', r => r.fulfill({ json: { organizations: [] } }));
  await page.route('**/api/team/*/invites', r => r.fulfill({ json: { token: 'CODIGO-FICTICIO-DE-PRUEBA', expires_in_days: 7 } }));
}

test('Equipo: pestañas, invitación real, error y registro pendiente', async ({ page }) => {
  await fixtureTeam(page);
  await enterDemo(page, '/crm/equipo');
  await expect(page.getByRole('heading', { name: /^Equipo/ }).first()).toBeVisible();
  await expect(page.locator('#s-equipo .ea-person')).toHaveCount(2);
  await page.getByRole('tab', { name: 'Permisos', exact: true }).click();
  await expect(page.getByText('La matriz todavía no se puede consultar ni editar.', { exact: false })).toBeVisible();
  await expect(page.locator('.eqc').first()).toBeDisabled();
  await page.getByRole('tab', { name: 'Registro de accesos', exact: true }).click();
  await page.getByRole('tab', { name: 'Fichas', exact: true }).click();
  await expect(page.getByText('El registro de fichas todavía no está disponible.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Invitar a alguien' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Mail', { exact: true }).fill('recepcion.ficticia@example.test');
  const response = page.waitForResponse(r => r.url().includes('/invites') && r.request().method() === 'POST');
  await dialog.getByRole('button', { name: 'Preparar invitación' }).click();
  expect((await response).ok()).toBe(true);
  await expect(dialog.getByRole('status')).toContainText('No se envió un mail');
  await expect(dialog.getByText('Código de invitación:', { exact: false })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Invitar a alguien' })).toBeFocused();
  await page.route('**/api/team/*/invites', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Servicio no disponible' }) }));
  await page.getByRole('button', { name: 'Invitar a alguien' }).click();
  await dialog.getByLabel('Mail', { exact: true }).fill('otra.ficticia@example.test');
  await dialog.getByRole('button', { name: 'Preparar invitación' }).click();
  await expect(dialog.getByRole('status')).not.toContainText('Invitación preparada');
});

test('Ajustes: alias, preferencias reales, cinco pestañas y enlaces', async ({ page }) => {
  await enterDemo(page, '/crm/desarrollo?modulo=configuracion');
  await expect(page.getByRole('heading', { name: 'Ajustes', exact: true })).toBeVisible();
  const label = page.getByLabel('Por mail', { exact: true });
  await expect(label).toBeEnabled();
  const response = page.waitForResponse(r => r.url().includes('/notification-preferences?audience=pro') && r.request().method() === 'PUT');
  await label.click(); expect((await response).ok()).toBe(true);
  await expect(page.getByRole('status').filter({ hasText: 'Preferencias guardadas' })).toBeVisible();
  await page.getByRole('tab', { name: 'Plantillas', exact: true }).click();
  await expect(page.getByText('No hay plantillas guardadas', { exact: false })).toBeVisible();
  await page.getByRole('tab', { name: 'Avisos automáticos', exact: true }).click();
  await expect(page.getByText('La conexión con Brevo todavía no está disponible.', { exact: false })).toBeVisible();
  await page.getByRole('tab', { name: 'Integraciones', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Brevo', exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Seguridad', exact: true }).click();
  await expect(page.getByText('No disponible en modo demo', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Ver registro de accesos' }).click();
  await expect(page).toHaveURL(/\/crm\/equipo\?vista=registro/);
  await expect(page.getByRole('tab', { name: 'Registro de accesos' })).toHaveAttribute('aria-selected', 'true');
  await page.locator('.side').getByRole('link', { name: 'Ajustes', exact: true }).click();
  await expect(page).toHaveURL(/\/crm\/ajustes/);
  await page.locator('.side').getByRole('link', { name: 'Equipo', exact: true }).click();
  await expect(page).toHaveURL(/\/crm\/equipo/);
});

test('1440/390 claro/oscuro: Equipo y Ajustes sin desborde, capturas y medidas', async ({ page }) => {
  test.setTimeout(120_000);
  await fixtureTeam(page);
  await enterDemo(page, '/crm/equipo');
  const measurements: unknown[] = [];
  for (const width of [1440, 390]) for (const dark of [false, true]) {
    await page.setViewportSize({ width: 1440, height: 900 });
    if (await page.locator('#pv-panel-v29').getAttribute('data-theme') !== (dark ? 'dark' : 'light')) {
      await page.locator('.side .acct').click();
      await page.locator('#pv-account').getByRole('button', { name: dark ? 'Tema oscuro' : 'Tema claro', exact: true }).click();
    }
    await page.setViewportSize({ width, height: 900 });
    for (const screen of ['equipo', 'ajustes']) {
      if (width === 390) await page.getByRole('button', { name: 'Más', exact: true }).click();
      await page.locator('.side').getByRole('link', { name: screen === 'equipo' ? 'Equipo' : 'Ajustes', exact: true }).click();
      const root = page.locator(`#s-${screen}`);
      await expect(root).toBeVisible();
      await expect(root.getByText('Cargando equipo…', { exact: true })).toHaveCount(0);
      if (screen === 'ajustes') await expect(root.getByLabel('Por mail', { exact: true })).toBeEnabled();
      expect(await root.evaluate(el => getComputedStyle(el).fontFamily)).toContain('Inter');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      measurements.push({ width, dark, screen, boxes: await root.locator(':scope > .fx > .c').evaluateAll(els => els.map(el => { const b = el.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; })) });
      await page.waitForTimeout(350);
      await page.screenshot({ path: `docs/screenshots/equipo-ajustes/${screen}-${width}-${dark ? 'oscuro' : 'claro'}.png`, fullPage: true });
      await page.getByRole('tab', { name: screen === 'equipo' ? 'Permisos' : 'Seguridad', exact: true }).click();
      await page.screenshot({ path: `docs/screenshots/equipo-ajustes/${screen}-${screen === 'equipo' ? 'permisos' : 'seguridad'}-${width}-${dark ? 'oscuro' : 'claro'}.png`, fullPage: true });
    }
  }
  await test.info().attach('medidas', { body: JSON.stringify(measurements, null, 2), contentType: 'application/json' });
});

test('Equipo: vacío, error de API y recepción sin consultas a organizaciones', async ({ page }) => {
  await page.route('**/api/team', r => r.fulfill({ json: { workplaces: [] } }));
  await enterDemo(page, '/crm/equipo');
  await expect(page.getByText('Cargando equipo…')).toHaveCount(0);
  await expect(page.getByText('No hay integrantes disponibles para este consultorio.')).toBeVisible();
  await page.route('**/api/team', r => r.fulfill({ json: { workplaces: [{ nutritionist_id: '11111111-1111-4111-8111-111111111111', name: 'Recepción de prueba', owner: false }] } }));
  const orgs: string[] = [];
  page.on('request', r => { if (r.url().endsWith('/api/orgs')) orgs.push(r.url()); });
  await page.reload();
  await page.getByRole('button', { name: 'Continuar en modo demo' }).click();
  await expect(page.getByText('No hay integrantes disponibles para este consultorio.')).toBeVisible();
  expect(orgs).toEqual([]);
  await page.getByRole('button', { name: 'Invitar a alguien' }).click();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Preparar invitación' })).toBeDisabled();
});
