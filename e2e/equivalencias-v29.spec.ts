import { expect, test } from '@playwright/test';
import { enterDemo } from './helpers';

test('Equivalencias conserva el dibujo v29 y calcula con un grupo guardado en la API real de demo', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await enterDemo(page, '/crm/inicio');
  await page.locator('.side a[href="/crm/plan?planes=equivalencias"]').click();
  const idA = crypto.randomUUID(), idB = crypto.randomUUID(), groupId = crypto.randomUUID();
  const nombreGrupo = `Energía revisada ${groupId.slice(0, 6)}`;
  for (const [id, name, kcal] of [[idA, 'Origen de prueba', 100], [idB, 'Alternativa de prueba', 50]] as const) {
    const result = await page.request.post('/api/foods', { data: {
      id, expected_revision: 0, name, brand: '', category: 'Prueba de equivalencias', kind: 'food',
      source: 'Etiqueta revisada para prueba local', reference: 'Solo datos ficticios de demo', nutrients: { kcal, protein: 10, carbs: 20, fat: 1 }, portions: [{ name: 'Taza de prueba', grams: 150 }],
    } });
    expect(result.ok(), await result.text()).toBeTruthy();
  }
  const saved = await page.request.post('/api/nutrition/exchanges', { data: {
    id: groupId, expected_revision: 0, name: nombreGrupo, reference: 'Etiqueta revisada para prueba local', reviewed: true,
    items: [{ food_id: idA, food_revision: 1, quantity: 100, unit: 'g' }, { food_id: idB, food_revision: 1, quantity: 200, unit: 'g' }],
  } });
  expect(saved.ok(), await saved.text()).toBeTruthy();
  await enterDemo(page, '/crm/plan?planes=equivalencias');
  await expect(page.getByRole('heading', { name: 'Calculadora de equivalencias', exact: true })).toBeVisible();
  await page.locator('#peg').getByRole('button', { name: nombreGrupo, exact: true }).click();
  await page.locator('#peqf').selectOption(idA);
  await page.getByRole('spinbutton', { name: 'Cantidad (g)', exact: true }).fill('150');
  await expect(page.locator('.peqk b')).toHaveText('150 kcal');
  const fila = page.locator('#pwrap .fxtb tbody tr').filter({ hasText: 'Alternativa de prueba' });
  await expect(fila).toContainText('300 g');
  await expect(fila).toContainText('150 kcal');
  await expect(fila).toContainText('2 × Taza de prueba');
  await page.getByRole('spinbutton', { name: 'Cantidad (g)', exact: true }).fill('180');
  await expect(page.locator('.peqk b')).toHaveText('180 kcal');
  await expect(fila).toContainText('360 g');
  const switchApp = page.getByRole('switch', { name: 'Mostrar equivalencias en la app' });
  await expect(switchApp).toBeEnabled();
  await expect(switchApp).toHaveAttribute('aria-checked', 'false');
  await expect(page.getByText('Esta comparación no modifica ni publica el plan de la paciente.')).toBeVisible();
  await page.getByRole('spinbutton', { name: 'Cantidad (g)', exact: true }).fill('0');
  await expect(page.locator('.peqk b')).toHaveText('—');
  await expect(page.locator('#pwrap .fxtb tbody tr')).toHaveCount(0);
  await expect(page.getByText('Ingresá una cantidad válida y elegí un alimento con energía declarada.')).toBeVisible();
  await page.getByRole('spinbutton', { name: 'Cantidad (g)', exact: true }).fill('150');
  await expect(page.locator('#pwrap.pv4 > .fx.pfx')).toBeVisible();
  await page.screenshot({ path: '/tmp/planv-equivalencias-v29-desktop.png', fullPage: true });
  await page.locator('#pview').getByRole('button', { name: 'Todos los planes', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Planes de tus pacientes', exact: true })).toBeVisible();
  await page.locator('#pview').getByRole('button', { name: 'Equivalencias', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Calculadora de equivalencias', exact: true })).toBeVisible();
  await page.locator('#peg').getByRole('button', { name: nombreGrupo, exact: true }).click();
  await page.locator('#peqf').selectOption(idA);
  await expect(page.locator('.peqk b')).toHaveText('150 kcal');
});

test('visibilidad: guarda, persiste al recargar, llega a la paciente y conserva estado si falla', async ({ page }) => {
  test.setTimeout(120_000);
  await enterDemo(page, '/crm/plan?planes=equivalencias');
  const groupId = crypto.randomUUID(), foodA = crypto.randomUUID(), foodB = crypto.randomUUID();
  const groupName = `Grupo compartido ${groupId.slice(0, 6)}`;
  for (const [id, name] of [[foodA, 'Manzana revisada'], [foodB, 'Pera revisada']]) {
    const response = await page.request.post('/api/foods', { data: { id, expected_revision: 0, name, brand: '', category: 'Prueba', kind: 'food', source: 'Etiqueta revisada', reference: 'Ficticia', nutrients: { kcal: 50 }, portions: [] } });
    expect(response.ok(), await response.text()).toBeTruthy();
  }
  const group = await page.request.post('/api/nutrition/exchanges', { data: { id: groupId, expected_revision: 0, name: groupName, reference: 'Referencia privada que no se publica', reviewed: true, items: [{ food_id: foodA, food_revision: 1, quantity: 120, unit: 'g' }, { food_id: foodB, food_revision: 1, quantity: 120, unit: 'g' }] } });
  expect(group.ok(), await group.text()).toBeTruthy();
  const beforePlan = await (await page.request.get('/api/patients/pat-sofia/plans')).json();
  const switchApp = page.getByRole('switch', { name: 'Mostrar equivalencias en la app' });
  await expect(switchApp).toBeEnabled();
  await expect(switchApp).toHaveAttribute('aria-checked', 'false');
  await switchApp.click();
  await expect(switchApp).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByText('Equivalencias visibles en la app.', { exact: true })).toBeVisible();
  await enterDemo(page, '/crm/plan?planes=equivalencias');
  await expect(switchApp).toBeEnabled();
  await expect(switchApp).toHaveAttribute('aria-checked', 'true');
  // Otra sesión guarda primero: la revisión vieja no debe pisarla.
  const concurrent = await (await page.request.get('/api/nutrition/exchange-visibility')).json();
  const otherSave = await page.request.put('/api/nutrition/exchange-visibility', { data: { enabled: false, expected_revision: concurrent.revision } });
  expect(otherSave.ok()).toBeTruthy();
  await switchApp.click();
  await expect(page.getByRole('alert')).toContainText('La visibilidad cambió');
  await expect(switchApp).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('button', { name: 'Recargar configuración' }).click();
  await expect(switchApp).toBeEnabled();
  await expect(switchApp).toHaveAttribute('aria-checked', 'false');
  await switchApp.click();
  await expect(switchApp).toHaveAttribute('aria-checked', 'true');
  const patientData = await (await page.request.get('/api/patients/pat-sofia/nutrition/exchanges')).json();
  expect(patientData.groups.some((g: { id: string }) => g.id === groupId)).toBe(true);
  expect(JSON.stringify(patientData)).not.toContain('Referencia privada');
  expect(JSON.stringify(patientData)).not.toContain('owner_id');
  await enterDemo(page, '/app/plan');
  await page.getByRole('button', { name: 'Filtrar el plan', exact: true }).click();
  await page.getByText('Ver equivalencias revisadas', { exact: true }).click();
  await expect(page.getByRole('heading', { name: groupName, exact: true })).toBeVisible();
  await expect(page.getByText('Manzana revisada · 120 g', { exact: true })).toBeVisible();
  await enterDemo(page, '/crm/plan?planes=equivalencias');
  await expect(switchApp).toBeEnabled();
  await page.route('**/api/nutrition/exchange-visibility', route => route.request().method() === 'PUT' ? route.fulfill({ status: 503, json: { error: 'Guardado no confirmado en prueba.' } }) : route.continue());
  await switchApp.click();
  await expect(page.getByRole('alert')).toContainText('Guardado no confirmado');
  await expect(switchApp).toHaveAttribute('aria-checked', 'true');
  await page.unroute('**/api/nutrition/exchange-visibility');
  await page.getByRole('button', { name: 'Recargar configuración' }).click();
  await expect(switchApp).toBeEnabled();
  await switchApp.click();
  await expect(switchApp).toHaveAttribute('aria-checked', 'false');
  const hidden = await (await page.request.get('/api/patients/pat-sofia/nutrition/exchanges')).json();
  expect(hidden).toEqual({ enabled: false, groups: [] });
  const afterPlan = await (await page.request.get('/api/patients/pat-sofia/plans')).json();
  expect(afterPlan.plan?.version).toEqual(beforePlan.plan?.version);
  expect(afterPlan.plan?.items).toEqual(beforePlan.plan?.items);
  await enterDemo(page, '/app/plan');
  await page.getByRole('button', { name: 'Filtrar el plan', exact: true }).click();
  await expect(page.getByText('Consultando equivalencias…')).toHaveCount(0);
  await expect(page.getByText('Ver equivalencias revisadas', { exact: true })).toHaveCount(0);
});
