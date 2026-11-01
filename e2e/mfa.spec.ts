import { expect, test } from '@playwright/test';
import { enterDemo } from './helpers';

test('Ajustes: la nutri puede abrir la verificación en dos pasos', async ({ page }) => {
  await enterDemo(page, '/crm/desarrollo?modulo=configuracion');
  await expect(page.getByRole('heading', { name: 'Ajustes', exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Seguridad', exact: true }).click();
  await expect(page.getByText('Verificación en dos pasos', { exact: true })).toBeVisible();
  await expect(page.getByText('App de códigos', { exact: true })).toBeVisible();
  await page.getByRole('switch', { name: 'Dos pasos para vos' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Verificación en dos pasos' })).toBeVisible();
  await expect(dialog.getByText('Google Authenticator', { exact: false })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Activar' })).toBeDisabled();
});
