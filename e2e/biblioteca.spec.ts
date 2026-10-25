import { expect, test } from '@playwright/test';
import { enterDemo } from './helpers';

test('Biblioteca: crear, publicar, asignar y avisar; reintentar solo los avisos fallidos', async ({ page }) => {
  await enterDemo(page, '/crm/biblioteca?biblioteca=recursos');
  await expect(page.getByRole('heading', { name: 'Para compartir' })).toBeVisible();
  await page.getByRole('button', { name: 'Nuevo recurso', exact: true }).click();
  let drawer = page.getByRole('dialog');
  const title = `Guía de prueba ${Date.now()}`;
  await drawer.getByLabel('Título', { exact: true }).fill(title);
  await drawer.getByLabel('Resumen', { exact: true }).fill('Material ficticio de prueba.');
  await drawer.getByLabel('Categoría', { exact: true }).fill('Organización');
  await drawer.getByLabel('Título de sección 1').fill('Primer paso');
  await drawer.getByLabel('Contenido 1').fill('Contenido ficticio para comprobar el guardado.');
  await drawer.getByRole('button', { name: 'Guardar recurso', exact: true }).click();
  await expect(drawer.getByRole('status')).toContainText('Borrador guardado');
  await drawer.getByRole('button', { name: 'Cerrar', exact: true }).click();
  await page.locator('.sxcard').filter({ hasText: title }).click();
  await expect(page.locator('#s-biblioteca').getByRole('button', { name: 'Asignar', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Ver contenido', exact: true }).click();
  drawer = page.getByRole('dialog');
  await drawer.getByRole('button', { name: 'Publicar recurso', exact: true }).click();
  await expect(drawer.getByRole('button', { name: 'Despublicar', exact: true })).toBeVisible();
  await drawer.getByRole('button', { name: 'Cerrar', exact: true }).click();
  await page.getByRole('button', { name: 'Asignar', exact: true }).click();
  await drawer.getByRole('checkbox', { name: 'Sofía R.' }).check();
  await drawer.getByRole('checkbox', { name: 'Marina C.' }).check();
  await drawer.getByRole('button', { name: 'Asignar', exact: true }).click();
  await expect(drawer).toHaveCount(0);
  await expect(page.locator('#s-biblioteca .fxr .l')).toHaveCount(2);
  await page.getByRole('button', { name: 'Avisar por la app' }).click();
  await drawer.getByRole('checkbox', { name: 'Sofía R.' }).check();
  await drawer.getByRole('checkbox', { name: 'Marina C.' }).check();
  let sofiaRequests = 0;
  let marinaRequests = 0;
  const marinaIds: string[] = [];
  await page.route('**/api/patients/*/messages', async route => {
    if (route.request().method() !== 'POST') return route.continue();
    if (route.request().url().includes('pat-sofia')) sofiaRequests++;
    if (route.request().url().includes('pat-marina')) {
      marinaRequests++;
      marinaIds.push(route.request().postDataJSON().client_id);
      if (marinaRequests === 1) return route.fulfill({ status: 503, json: { error: 'Fallo de prueba' } });
    }
    return route.continue();
  });
  await drawer.getByRole('button', { name: 'Enviar aviso' }).click();
  await expect(drawer.getByRole('status')).toContainText('No se pudieron enviar 1');
  await expect(drawer.getByRole('checkbox', { name: 'Sofía R.' })).not.toBeChecked();
  await drawer.getByRole('button', { name: 'Enviar aviso' }).click();
  await expect(drawer).toHaveCount(0);
  expect(sofiaRequests).toBe(1);
  expect(marinaRequests).toBe(2);
  expect(marinaIds[0]).toBe(marinaIds[1]);
  await page.reload();
  await page.getByRole('button', { name: 'Continuar en modo demo' }).click();
  await page.locator('.sxcard').filter({ hasText: title }).click();
  await expect(page.locator('#s-biblioteca .fxr .l')).toHaveCount(2);
  const catalog = await (await page.request.get('/api/resources?audience=pro')).json();
  const slug = catalog.resources.find((resource: { title: string }) => resource.title === title).slug;
  await enterDemo(page, `/app/recursos#recurso=${slug}`);
  await expect(page.getByText('Contenido ficticio para comprobar el guardado.', { exact: true })).toBeVisible();
  await enterDemo(page, `/crm/biblioteca?biblioteca=recursos#recurso=${slug}`);
  await expect(page.locator('#s-biblioteca .fxr .l').filter({ hasText: 'Sofía R.' })).toContainText('Lo abrió');
  await page.getByRole('button', { name: 'Ver recetas', exact: true }).click();
  await expect(page).toHaveURL(/biblioteca=recetas/);
});

test('Biblioteca: un error de catálogo permite reintentar sin mostrar una lista vacía', async ({ page }) => {
  let fail = true;
  await page.route('**/api/resources?audience=pro', route => fail
    ? route.fulfill({ status: 503, json: { error: 'Fallo de prueba' } }) : route.continue());
  await enterDemo(page, '/crm/biblioteca?biblioteca=recursos');
  await expect(page.locator('#s-biblioteca').getByRole('alert')).toBeVisible();
  fail = false;
  await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
  await expect(page.locator('.sxcard').first()).toBeVisible();
});

test('Biblioteca: en 390 las columnas se apilan y se puede crear un recurso', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterDemo(page, '/crm/biblioteca?biblioteca=recursos');
  await expect(page.locator('.sxcard').first()).toBeVisible();
  const columns = page.locator('#s-biblioteca > .fx > .c');
  const left = await columns.nth(0).boundingBox();
  const right = await columns.nth(1).boundingBox();
  expect(right!.y).toBeGreaterThanOrEqual(left!.y + left!.height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Nuevo recurso', exact: true }).click();
  await expect(page.getByRole('dialog').getByLabel('Título', { exact: true })).toBeVisible();
});
