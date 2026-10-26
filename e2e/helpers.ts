import { expect, test, type Page } from '@playwright/test';
// @ts-expect-error Helper local de pruebas, con cobertura propia; nunca se carga en la app.
import { createBrowserRatePacer } from '../scripts/browser-rate-window.mjs';

const LOADING = /^Cargando (tu espacio|pantalla|datos)…$/;
const observedPages = new WeakSet<Page>();
const ratePacer = createBrowserRatePacer({ pause: async (ms: number) => {
  // Las pausas por presupuesto de la API no consumen el tiempo de interacción de la prueba.
  test.setTimeout(test.info().timeout + ms);
  await new Promise(resolve => setTimeout(resolve, ms));
} });

/** Espera a que desaparezcan los avisos de carga de la app. */
export async function waitLoaded(page: Page) {
  await expect(page.getByText(LOADING)).toHaveCount(0, { timeout: 20_000 });
}

/** Entra al modo demo (datos en memoria del servidor de prueba) en la pantalla pedida. */
export async function enterDemo(page: Page, path: string) {
  if (!observedPages.has(page)) {
    observedPages.add(page);
    page.on('response', response => {
      if (new URL(response.url()).pathname.startsWith('/api/')) ratePacer.observeHttpLine('{"event":"http"}');
    });
  }
  // Las pruebas comparten IP. Se usa el mismo pacing comprobado del control firmado,
  // conservando los límites reales y sin modificar respuestas ni repetir acciones de la app.
  await ratePacer.beforeAction();
  await page.goto(path);
  await page.getByRole('button', { name: 'Continuar en modo demo' }).click();
  await waitLoaded(page);
}
