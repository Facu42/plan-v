import { expect, type Page } from '@playwright/test';

const LOADING = /^Cargando (tu espacio|pantalla|datos)…$/;

/** Espera a que desaparezcan los avisos de carga de la app. */
export async function waitLoaded(page: Page) {
  await expect(page.getByText(LOADING)).toHaveCount(0, { timeout: 20_000 });
}

/** Entra al modo demo (datos en memoria del servidor de prueba) en la pantalla pedida. */
export async function enterDemo(page: Page, path: string) {
  await page.goto(path);
  await page.getByRole('button', { name: 'Continuar en modo demo' }).click();
  await waitLoaded(page);
}
