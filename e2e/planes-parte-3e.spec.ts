import { expect, test } from '@playwright/test';
import { enterDemo } from './helpers';

test('Armar con IA envía opciones y muestra el uso mensual de la API', async ({ page }) => {
  const errores: string[] = [];
  page.on('pageerror', error => errores.push(error.message));
  await page.route('**/api/patients/*/ai/jobs', async route => {
    const response = await route.fetch();
    const data = await response.json();
    await route.fulfill({ json: { ...data, usage: { month: '2026-10', used_micros: 1200000, limit_micros: 3000000, scope: 'global', source: 'supabase' } } });
  });
  await enterDemo(page, '/crm/plan');
  const catalog = await (await page.request.get('/api/consents/catalog')).json();
  const consent = catalog.consents.find((item: { purpose: string }) => item.purpose === 'ai_menu_draft');
  expect((await page.request.post('/api/patients/pat-sofia/consents', { data: { purpose: consent.purpose, text_version: consent.text_version, text_hash: consent.text_hash, decision: 'granted' } })).ok()).toBeTruthy();
  const intake = await (await page.request.get('/api/patients/pat-sofia/intake')).json();
  expect((await page.request.patch('/api/patients/pat-sofia/intake', { data: { expected_revision: intake.intake.revision, step: 'allergies', payload: { allergies: { state: 'none', items: [] }, restrictions: { state: 'none', items: [] } } } })).ok()).toBeTruthy();
  await page.locator('#s-planes').getByRole('button', { name: 'Armar con IA', exact: true }).click();
  await page.getByRole('button', { name: 'Cambiar paciente' }).click();
  await page.getByRole('option', { name: /Sofía R/ }).click();
  await page.getByRole('textbox', { name: 'Qué plan querés' }).fill('Viandas para el trabajo');
  await page.getByRole('radio', { name: 'Lista por día', exact: true }).click();
  await page.getByRole('radio', { name: 'Las dos', exact: true }).click();
  for (const name of ['Grupos de intercambio', 'Mi recetario', 'Alternativas por alimento', 'Lista de compras', 'Costo estimado'])
    await page.getByRole('button', { name, exact: true }).click();
  await page.getByRole('button', { name: 'Ver y elegir datos' }).click();
  const uso = page.locator('.iause');
  await expect(uso).toContainText('US$ 1,20');
  await expect(uso).toContainText('US$ 3,00');
  await expect(uso).toContainText('compartida');
  for (const name of ['Dictar pedido', 'Adjuntar referencia']) {
    await page.getByRole('button', { name, exact: true }).click();
    await expect(page.locator('#s-planes p.mhelp[role="status"]')).toContainText('Próximamente');
  }
  const solicitud = page.waitForRequest(req => req.url().endsWith('/api/ai/jobs') && req.method() === 'POST');
  await page.getByRole('button', { name: 'Crear propuesta del plan', exact: true }).click();
  const req = await solicitud;
  expect((await req.response())?.status()).toBe(202);
  const body = req.postDataJSON();
  expect(body.dietary_preferences).toContain('Formato: Lista por día');
  expect(body.dietary_preferences).toContain('Medidas: Las dos');
  for (const opcion of ['Grupos de intercambio', 'Mi recetario', 'Alternativas por alimento', 'Lista de compras', 'Costo estimado'])
    expect(body.dietary_preferences.join(' | ')).toContain(opcion);
  expect(body.job_type).toBe('menu_draft');
  await expect(page.getByRole('tab', { name: 'Chat', exact: true })).toBeVisible();
  await expect(page.locator('#s-planes')).not.toContainText('Plan publicado');
  expect(errores).toEqual([]);
});

test('Armar con IA explica el registro ausente y conserva Inter en escritorio y celular', async ({ page }) => {
  await page.route('**/api/patients/*/ai/jobs', route => route.fulfill({ json: { jobs: [], source: 'supabase', usage: null } }));
  await enterDemo(page, '/crm/plan');
  await page.locator('#s-planes').getByRole('button', { name: 'Armar con IA', exact: true }).click();
  await page.getByRole('button', { name: 'Ver y elegir datos' }).click();
  await expect(page.locator('.iause')).toContainText('No pudimos consultar');
  await expect(page.locator('.iause')).not.toContainText('US$ 5');
  expect(await page.locator('#iatxt').evaluate(element => getComputedStyle(element).fontFamily)).toContain('Inter');
  await page.screenshot({ path: '/tmp/planes-p3e-1440.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Crear propuesta del plan', exact: true })).toBeVisible();
  await page.screenshot({ path: '/tmp/planes-p3e-390.png', fullPage: true });
});
