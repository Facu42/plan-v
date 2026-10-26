import { expect, test } from '@playwright/test';
import { enterDemo } from './helpers';

test('Planes: el listado es la entrada y Recetas abre la Biblioteca', async ({ page }) => {
  await enterDemo(page, '/crm/plan');
  await expect(page.getByRole('heading', { name: 'Planes', exact: true })).toBeVisible();
  await expect(page.getByText('Organizá, armá y entregá los planes de tus pacientes', { exact: true })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Secciones de Planes' })).toBeVisible();
  await expect(page.locator('#s-planes th', { hasText: 'Paciente' })).toBeVisible();
  await expect(page.getByText('Sofía R.', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('No hay pedidos pendientes.', { exact: true })).toBeVisible();
  await expect(page.locator('#s-planes')).not.toContainText(/siguen en Planes/i);
  await expect(page.locator('.meal-plan-form')).toHaveCount(0);

  await page.getByRole('navigation', { name: 'Secciones de Planes' }).getByRole('button', { name: 'Recetas', exact: true }).click();
  await expect(page).toHaveURL(/biblioteca=recetas/);
  await expect(page.locator('body')).not.toContainText(/siguen en Planes/i);
});

test('Planes: buscar, volver y dejar el editor y el asistente para después', async ({ page }) => {
  await enterDemo(page, '/crm/plan?planes=todos');
  await page.getByLabel('Buscar por paciente, plan u objetivo').fill('zzzz');
  await expect(page.getByText('No hay planes con esta búsqueda', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Limpiar búsqueda y filtros', exact: true }).click();
  await expect(page.getByText('Sofía R.', { exact: true }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Elegir paciente y empezar', exact: true }).click();
  await expect(page.locator('#s-planes.pux-plan')).toBeVisible();
  await expect(page.locator('#s-planes').getByRole('status').filter({ hasText: /asistente|propuesta|permiso|Borradores de menú/i })).toBeVisible();
  await expect(page.locator('#s-planes')).not.toContainText('parte 3');

  await page.getByRole('navigation', { name: 'Secciones de Planes' }).getByRole('button', { name: /^Plan de / }).click();
  await expect(page.locator('#s-planes.pux-plan')).toBeVisible();
  await expect(page.locator('.meal-plan-form')).toHaveCount(0);
  await page.getByRole('button', { name: 'Todos los planes', exact: true }).click();
  await expect(page.locator('#s-planes th', { hasText: 'Estado' })).toBeVisible();

  await page.getByRole('button', { name: /plan (de|para) Sofía R\./ }).click();
  await expect(page.locator('#s-planes.pux-plan')).toBeVisible();
  await expect(page.locator('#s-planes')).toContainText(/todavía no tiene plan|Comidas/);
  await expect(page).not.toHaveURL(/editor=1/);
  await expect(page.locator('.meal-plan-form')).toHaveCount(0);

  await page.getByRole('button', { name: 'Todos los planes', exact: true }).click();
  await page.getByRole('button', { name: 'Nuevo plan', exact: true }).click();
  await expect(page.locator('.meal-plan-form')).toHaveCount(0);
  await expect(page.locator('#s-planes')).not.toContainText('llega en la parte 2');
});

test('Planes: pedidos queda en el listado y el editor viejo sigue en sus enlaces', async ({ page }) => {
  await enterDemo(page, '/crm/plan?planes=pedidos');
  await expect(page.getByRole('heading', { name: 'Pedidos de cambio', exact: true })).toBeVisible();
  await expect(page.getByText('No hay pedidos pendientes.', { exact: true })).toBeVisible();
  await enterDemo(page, '/crm/plan?paciente=pat-sofia');
  await expect(page.locator('.meal-plan-form')).toBeVisible();
  await enterDemo(page, '/crm/plan?editor=1');
  await expect(page.locator('.meal-plan-form')).toBeVisible();
});

test('Planes: en el celular se ven las secciones y la tabla', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await enterDemo(page, '/crm/plan');
  await expect(page.locator('#s-planes #pview')).toBeVisible();
  await expect(page.locator('#s-planes th', { hasText: 'Acción' })).toBeVisible();
  await expect(page.getByText('Crear con el asistente', { exact: true })).toBeVisible();
});
