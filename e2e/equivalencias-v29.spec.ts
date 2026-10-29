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
  await expect(switchApp).toBeDisabled();
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
