import { expect, test } from '@playwright/test';
import { enterDemo } from './helpers';
import type { ProfessionalMealPlan } from '../src/types/plans';
import type { ProfessionalRecipe } from '../src/types/recipes';

test('guarda plantilla, la encuentra al recargar y copia comidas sin publicar', async ({ page }) => {
  await enterDemo(page, '/crm/plan');
  // Other specs deliberately leave text-only drafts. Own the editable quantity fixture.
  const plans = await page.request.get('/api/patients/pat-sofia/plans?audience=pro');
  expect(plans.ok()).toBeTruthy();
  const { plan } = await plans.json() as { plan: ProfessionalMealPlan };
  const catalog = await page.request.get('/api/recipes');
  expect(catalog.ok()).toBeTruthy();
  const { recipes } = await catalog.json() as { recipes: ProfessionalRecipe[] };
  const recipe = recipes.find(item => item.published)!;
  expect(recipe).toBeDefined();
  const seeded = await page.request.post('/api/patients/pat-sofia/plans', { data: {
    id: plan.id, expected_revision: plan.current.revision,
    period_start: plan.current.period_start, period_end: plan.current.period_end,
    timezone: plan.timezone,
    items: [{ for_date: plan.current.period_start, slot: 'Desayuno', recipe_id: recipe.id,
      recipe_version: recipe.published!.version, portions: 1, public_note: '' }],
  } });
  expect(seeded.ok()).toBeTruthy();
  await enterDemo(page, '/crm/plan');
  await page.getByRole('button', { name: /plan (de|para) Sofía R\./ }).click();
  await page.getByLabel('Elegir día', { exact: true }).getByRole('button').first().click();
  const cantidad = page.getByRole('spinbutton', { name: /^Cantidad de/ }).first();
  await expect(cantidad).toHaveValue('1');
  await cantidad.fill('2');
  const [saved] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/api/patients/pat-sofia/plans') && r.request().method() === 'POST'),
    cantidad.press('Tab'),
  ]);
  expect(saved.ok()).toBeTruthy();
  expect(((await saved.json()) as { plan: ProfessionalMealPlan }).plan.current.items[0].portions).toBe(2);
  const origen = (await (await page.request.get('/api/patients/pat-sofia/plans?audience=pro')).json()).plan;
  await page.getByRole('button', { name: 'Guardar como plantilla', exact: true }).first().click();
  const dialogo = page.getByRole('dialog');
  await dialogo.getByLabel('Nombre').fill('Semana reutilizable 3c');
  await dialogo.getByRole('button', { name: 'Guardar plantilla', exact: true }).click();
  await expect(dialogo).not.toBeVisible();
  await page.getByRole('button', { name: 'Copiar a otra paciente', exact: true }).first().click();
  const destinoId = await dialogo.getByLabel('Paciente').inputValue();
  const antes = (await (await page.request.get(`/api/patients/${destinoId}/plans?audience=pro`)).json()).plan;
  await dialogo.getByRole('button', { name: 'Copiar', exact: true }).click();
  await expect(dialogo).not.toBeVisible();
  const despues = (await (await page.request.get(`/api/patients/${destinoId}/plans?audience=pro`)).json()).plan;
  expect(await page.locator('#s-planes').evaluate(el => getComputedStyle(el).fontFamily)).toContain('Inter');
  expect(despues.current.status).toBe('draft');
  expect(despues.current.items[0].recipe_id).toBe(recipe.id);
  expect(despues.current.items[0].recipe_version).toBe(recipe.published!.version);
  expect(despues.current.items.map((i: { free_text: string }) => i.free_text)).toEqual(origen.current.items.map((i: { free_text: string }) => i.free_text));
  expect(despues.current.items.map((i: { portions: number }) => i.portions)).toEqual(origen.current.items.map((i: { portions: number }) => i.portions));
  expect(despues.published).toEqual(antes?.published ?? null);
  expect(despues.current.nutrition_target ?? null).toEqual(antes?.current.nutrition_target ?? null);
  expect(despues.current.guidance?.recommendations ?? []).toEqual(antes?.current.guidance?.recommendations ?? []);
  await enterDemo(page, '/crm/plan');
  await page.getByRole('button', { name: 'Plantillas', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Buscar plantillas' }).fill('Semana reutilizable 3c');
  await expect(page.getByRole('button', { name: 'Seleccionar plantilla Semana reutilizable 3c' })).toBeVisible();
  await page.getByRole('searchbox', { name: 'Buscar plantillas' }).fill('Sin coincidencias 3c');
  await expect(page.getByRole('button', { name: 'Seleccionar plantilla Semana reutilizable 3c' })).toHaveCount(0);
  await page.getByRole('searchbox', { name: 'Buscar plantillas' }).fill('');
  await page.getByRole('button', { name: 'Seleccionar plantilla Semana reutilizable 3c' }).click();
  await page.getByRole('button', { name: 'Aplicar a una paciente', exact: true }).click();
  await dialogo.getByRole('button', { name: 'Crear borrador', exact: true }).click();
  await expect(dialogo).not.toBeVisible();
});

test('errores de plantilla y permiso al copiar mantienen el formulario abierto', async ({ page }) => {
  await enterDemo(page, '/crm/plan');
  await page.getByRole('button', { name: /plan (de|para) Sofía R\./ }).click();
  await page.getByRole('button', { name: 'Guardar como plantilla', exact: true }).last().click();
  const dialogo = page.getByRole('dialog');
  await expect(dialogo.getByRole('button', { name: 'Guardar plantilla', exact: true })).toBeDisabled();
  await dialogo.getByLabel('Nombre').fill('No debe guardarse');
  await page.route('**/api/models', route => route.request().method() === 'POST' ? route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'No disponible' }) }) : route.continue());
  await dialogo.getByRole('button', { name: 'Guardar plantilla', exact: true }).click();
  await expect(dialogo.getByRole('alert')).toBeVisible();
  await expect(dialogo.getByLabel('Nombre')).toHaveValue('No debe guardarse');
  await dialogo.getByRole('button', { name: 'Cerrar', exact: true }).click();
  await page.getByRole('button', { name: 'Copiar a otra paciente', exact: true }).last().click();
  await page.route('**/api/patients/*/plans', route => route.request().method() === 'POST' ? route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ error: 'El borrador cambió. Volvé a abrirlo.' }) }) : route.continue());
  await dialogo.getByRole('button', { name: 'Copiar', exact: true }).click();
  await expect(dialogo.getByRole('alert')).toBeVisible();
  await expect(dialogo.getByRole('button', { name: 'Copiar', exact: true })).toBeEnabled();
});

test('elegir plantilla desde una paciente sin plan usa un solo diálogo y crea borrador', async ({ page }) => {
  await enterDemo(page, '/crm/plan');
  const origen = (await (await page.request.get('/api/patients/pat-sofia/plans?audience=pro')).json()).plan;
  expect((await page.request.post('/api/models', { data: { id: crypto.randomUUID(), expected_revision: null, kind: 'plan', title: 'Desde el inicio 3c', description: '', source: { patient_id: 'pat-sofia', version: origen.current.version, revision: origen.current.revision } } })).ok()).toBeTruthy();
  await page.getByRole('button', { name: 'Nuevo plan', exact: true }).first().click();
  await page.getByRole('button', { name: 'Elegir plantilla', exact: true }).click();
  await page.getByRole('button', { name: 'Seleccionar plantilla Desde el inicio 3c', exact: true }).click();
  await page.getByRole('button', { name: 'Aplicar a una paciente', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Aplicar plantilla', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Crear borrador', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('#s-planes.pux-plan')).toBeVisible();
});

test('formularios con Inter visibles en escritorio y celular, claro y oscuro', async ({ page }, testInfo) => {
  await enterDemo(page, '/crm/plan');
  await page.getByRole('button', { name: /plan (de|para) Sofía R\./ }).click();
  for (const ancho of [1440, 390]) {
    await page.setViewportSize({ width: ancho, height: 900 });
    for (const oscuro of [false, true]) {
      await page.setViewportSize({ width: 1440, height: 900 });
      const tema = oscuro ? 'dark' : 'light';
      if (await page.locator('#pv-panel-v29').getAttribute('data-theme') !== tema) {
        await page.locator('#pv-panel-v29 .side .acct').click();
        await page.locator('#pv-account').getByRole('button', { name: oscuro ? 'Tema oscuro' : 'Tema claro', exact: true }).click();
      }
      await page.setViewportSize({ width: ancho, height: 900 });
      await page.getByRole('button', { name: 'Guardar como plantilla', exact: true }).first().click();
      const dialogo = page.getByRole('dialog');
      await expect(dialogo.getByLabel('Nombre')).toBeVisible();
      expect(await dialogo.evaluate(el => getComputedStyle(el).fontFamily)).toContain('Inter');
      expect(await dialogo.getByRole('heading').evaluate(el => getComputedStyle(el).fontFamily)).toContain('Inter');
      expect(await dialogo.getByLabel('Nombre').evaluate(el => getComputedStyle(el).fontFamily)).toContain('Inter');
      expect(await dialogo.evaluate(el => getComputedStyle(el).backgroundColor)).toBe(oscuro ? 'rgb(28, 29, 34)' : 'rgb(255, 255, 255)');
      const caja = await dialogo.boundingBox();
      expect(caja!.x).toBeGreaterThanOrEqual(0);
      expect(caja!.x + caja!.width).toBeLessThanOrEqual(ancho);
      expect(caja!.y + caja!.height).toBeLessThanOrEqual(900);
      await page.screenshot({ path: testInfo.outputPath(`plantilla-${ancho}-${oscuro ? 'oscuro' : 'claro'}.png`) });
      await page.keyboard.press('Escape');
      await expect(dialogo).toHaveCount(0);
      await page.getByRole('button', { name: 'Copiar a otra paciente', exact: true }).first().click();
      await expect(dialogo.getByLabel('Paciente')).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath(`copiar-${ancho}-${oscuro ? 'oscuro' : 'claro'}.png`) });
      await page.keyboard.press('Escape');
    }
  }
});
