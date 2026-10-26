import { expect, test } from '@playwright/test';
import { enterDemo } from './helpers';

test('Biblioteca: el enlace anterior de Recetas conserva su catálogo y Biblioteca su título', async ({ page }) => {
  await enterDemo(page, '/crm/recetas?paciente=pat-sofia');
  await expect(page.getByRole('button', { name: 'Nueva receta', exact: true })).toBeVisible();
  await expect(page).toHaveURL(/biblioteca=recetas/);
  await expect(page).toHaveURL(/paciente=pat-sofia/);
  await page.reload();
  await page.getByRole('button', { name: 'Continuar en modo demo' }).click();
  await expect(page.getByRole('button', { name: 'Nueva receta', exact: true })).toBeVisible();
  await enterDemo(page, '/crm/biblioteca');
  await expect(page.getByRole('heading', { name: 'Biblioteca', exact: true })).toBeVisible();
  await expect(page.getByText('Guías, videos, PDF y recetas del consultorio.', { exact: true })).toBeVisible();
  await expect(page.getByText('Las recetas están en esta Biblioteca.', { exact: true })).toBeVisible();
  await expect(page.locator('#s-biblioteca')).not.toContainText(/siguen en Planes/i);
  await expect(page.getByRole('button', { name: 'Ver contenido', exact: true })).toHaveCount(0);
  for (const type of await page.locator('.sxcard .sxk').allTextContents()) expect(['Guía', 'Video', 'PDF']).toContain(type);
});

test('Biblioteca: tres campos, asignadas marcadas y aviso directo con reintento solo de fallidos', async ({ page }) => {
  await enterDemo(page, '/crm/biblioteca?biblioteca=recursos');
  await expect(page.getByRole('heading', { name: 'Para compartir' })).toBeVisible();
  await page.getByRole('button', { name: 'Nuevo recurso', exact: true }).click();
  const dialog = page.getByRole('dialog');
  const title = `Video de prueba ${Date.now()}`;
  await expect(dialog.getByText('Guía, video o PDF del consultorio', { exact: true })).toBeVisible();
  await expect(dialog.locator('input, select, textarea')).toHaveCount(3);
  await dialog.getByLabel('Título', { exact: true }).fill(title);
  await dialog.getByLabel('Tipo', { exact: true }).selectOption('Video');
  await dialog.getByLabel('De qué se trata', { exact: true }).fill('Material ficticio para comprobar el guardado.');
  await dialog.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('.sxcard.on .sxk')).toHaveText('Video');
  await expect(page.locator('#s-biblioteca .fxs')).toContainText('Video · Material ficticio');
  await page.getByRole('button', { name: 'Avisar por la app' }).click();
  await expect(page.locator('#s-biblioteca').getByRole('status')).toHaveText('Primero asignalo a alguien.');
  await expect(dialog).toHaveCount(0);
  const assignedBatches: string[][] = [];
  await page.route('**/api/resources/assign', route => {
    assignedBatches.push(route.request().postDataJSON().patient_ids);
    return route.continue();
  });
  await page.getByRole('button', { name: 'Asignar', exact: true }).click();
  await expect(dialog.getByRole('heading')).toHaveText(`Asignar «${title}»`);
  await expect(dialog.getByText('Se lo das a una o varias pacientes', { exact: true })).toBeVisible();
  await dialog.getByRole('checkbox', { name: 'Sofía R.' }).check();
  await dialog.getByRole('button', { name: 'Asignar', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole('button', { name: 'Asignar', exact: true }).click();
  await expect(dialog.getByRole('checkbox', { name: 'Sofía R.' })).toBeChecked();
  await expect(dialog.getByRole('checkbox', { name: 'Sofía R.' })).toBeDisabled();
  await dialog.getByRole('checkbox', { name: 'Marina C.' }).check();
  await dialog.getByRole('button', { name: 'Asignar', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(assignedBatches).toEqual([['pat-sofia'], ['pat-marina']]);
  await expect(page.locator('#s-biblioteca .fxr .l')).toHaveCount(2);
  let sofiaRequests = 0;
  let marinaRequests = 0;
  const marinaIds: string[] = [];
  await page.route('**/api/patients/*/messages', async route => {
    if (route.request().method() !== 'POST') return route.continue();
    const body = route.request().postDataJSON();
    expect(body.text).toContain(title);
    expect(body.text).toContain('/app/recursos#recurso=');
    if (route.request().url().includes('pat-sofia')) sofiaRequests++;
    if (route.request().url().includes('pat-marina')) {
      marinaRequests++;
      marinaIds.push(body.client_id);
      if (marinaRequests === 1) return route.fulfill({ status: 503, json: { error: 'Fallo de prueba' } });
    }
    return route.continue();
  });
  await page.getByRole('button', { name: 'Avisar por la app' }).click();
  await expect(page.locator('#s-biblioteca').getByRole('status')).toContainText('No se pudieron enviar 1');
  await expect(dialog).toHaveCount(0);
  await page.getByRole('button', { name: 'Avisar por la app' }).click();
  await expect(page.locator('#s-biblioteca').getByRole('status')).toContainText('1 avisos enviados');
  expect(sofiaRequests).toBe(1);
  expect(marinaRequests).toBe(2);
  expect(marinaIds[0]).toBe(marinaIds[1]);
  await page.reload();
  await page.getByRole('button', { name: 'Continuar en modo demo' }).click();
  await page.locator('.sxcard').filter({ hasText: title }).click();
  await expect(page.locator('#s-biblioteca .fxr .l')).toHaveCount(2);
  const catalog = await (await page.request.get('/api/resources?audience=pro')).json();
  const resource = catalog.resources.find((item: { title: string }) => item.title === title);
  expect(resource).toMatchObject({ category: 'video', published: true });
  await enterDemo(page, `/app/recursos#recurso=${resource.slug}`);
  await expect(page.getByText('Material ficticio para comprobar el guardado.', { exact: true }).first()).toBeVisible();
  await enterDemo(page, `/crm/biblioteca?biblioteca=recursos#recurso=${resource.slug}`);
  await expect(page.locator('#s-biblioteca .fxr .l').filter({ hasText: 'Sofía R.' })).toContainText('Lo abrió');
  await page.getByRole('button', { name: 'Ver recetas', exact: true }).click();
  await expect(page).toHaveURL(/biblioteca=recetas/);
});

test('Biblioteca: reintentar Guardar tras fallar publicación conserva un solo recurso', async ({ page }) => {
  await enterDemo(page, '/crm/biblioteca');
  let fail = true;
  let saves = 0;
  await page.route('**/api/resources?audience=pro', route => {
    if (route.request().method() === 'POST') saves++;
    return route.continue();
  });
  await page.route('**/api/resources/*/publish?audience=pro', route => {
    if (fail) { fail = false; return route.fulfill({ status: 503, json: { error: 'Fallo de prueba' } }); }
    return route.continue();
  });
  await page.getByRole('button', { name: 'Nuevo recurso', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Título', { exact: true }).fill('PDF ficticio con reintento');
  await dialog.getByLabel('Tipo', { exact: true }).selectOption('PDF');
  await dialog.getByLabel('De qué se trata', { exact: true }).fill('Descripción ficticia.');
  await dialog.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(dialog.getByRole('status')).toBeVisible();
  await dialog.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(saves).toBe(1);
  await expect(page.locator('.sxcard.on .sxk')).toHaveText('PDF');
});

test('Biblioteca: asignaciones concurrentes y fallos parciales se reintentan por paciente', async ({ page }) => {
  await enterDemo(page, '/crm/biblioteca');
  await page.locator('.sxcard').filter({ hasText: 'Cómo leer tu plan semanal' }).click();
  await page.getByRole('button', { name: 'Asignar', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('checkbox', { name: 'Sofía R.' }).check();
  await dialog.getByRole('checkbox', { name: 'Marina C.' }).check();
  // Otra sesión asignó a Sofía después de abrir el diálogo: la lista local quedó vieja.
  expect((await page.request.post('/api/resources/assign', { data: { resource_id: 'leer-plan-semanal', patient_ids: ['pat-sofia'] } })).ok()).toBe(true);
  const requests: string[][] = [];
  let fail = true;
  await page.route('**/api/resources/assign', route => {
    const ids: string[] = route.request().postDataJSON().patient_ids;
    requests.push(ids);
    if (ids.includes('pat-marina') && fail) {
      fail = false;
      return route.fulfill({ status: 503, json: { error: 'Fallo de prueba' } });
    }
    return route.continue();
  });
  await dialog.getByRole('button', { name: 'Asignar', exact: true }).click();
  await expect(dialog.getByRole('status')).toContainText('No se pudieron asignar 1');
  await expect(dialog.getByRole('checkbox', { name: 'Sofía R.' })).toBeChecked();
  await expect(dialog.getByRole('checkbox', { name: 'Sofía R.' })).toBeDisabled();
  await expect(dialog.getByRole('checkbox', { name: 'Marina C.' })).toBeChecked();
  await dialog.getByRole('button', { name: 'Asignar', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(requests).toEqual([['pat-sofia'], ['pat-marina'], ['pat-marina']]);
  await expect(page.locator('#s-biblioteca .fxr .l')).toHaveCount(2);
  // Los e2e comparten la paciente demo: no dejar otro aviso sin leer al recorrido de la campana.
  expect((await page.request.post('/api/patients/pat-sofia/resources/leer-plan-semanal/read')).ok()).toBe(true);
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

test('Biblioteca: en 390 las columnas se apilan y el alta tiene tres campos', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterDemo(page, '/crm/biblioteca?biblioteca=recursos');
  await expect(page.locator('.sxcard').first()).toBeVisible();
  const columns = page.locator('#s-biblioteca > .fx > .c');
  const left = await columns.nth(0).boundingBox();
  const right = await columns.nth(1).boundingBox();
  expect(right!.y).toBeGreaterThanOrEqual(left!.y + left!.height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Nuevo recurso', exact: true }).click();
  await expect(page.getByRole('dialog').locator('input, select, textarea')).toHaveCount(3);
});
