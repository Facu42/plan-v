import { expect, test } from '@playwright/test';
import { enterDemo } from './helpers';
import { snapshotBorrador } from '../src/types/plan-draft';
import { CONSENT_CATALOG } from '../server/intake/consent';
import type { ProfessionalMealPlan } from '../src/types/plans';

test('Planes: alcance día/comida/todo, aplicar, deshacer e historial sin publicar', async ({ page }) => {
  test.setTimeout(120_000);
  await enterDemo(page, '/crm/plan');
  const read = async () => (await (await page.request.get('/api/patients/pat-sofia/plans?audience=pro')).json()).plan as ProfessionalMealPlan;
  const anterior = await read();
  const inicio = anterior.current.period_start;
  const fin = new Date(`${inicio}T12:00:00Z`); fin.setUTCDate(fin.getUTCDate() + 1);
  const hasta = fin.toISOString().slice(0, 10);
  const guardado = await page.request.post('/api/patients/pat-sofia/plans', { data: {
    id: anterior.id, expected_revision: anterior.current.revision, period_start: inicio, period_end: hasta,
    guidance: { recommendations: ['Tomá agua'], avoid: [] }, meal_times: { Cena: '21:00' },
    items: [inicio, hasta].flatMap(for_date => ['Desayuno', 'Almuerzo', 'Cena'].map(slot => ({ for_date, slot, free_text: `Original ${slot}`, public_note: 'Conservar' }))),
  } });
  expect(guardado.ok()).toBeTruthy();
  const intake = await (await page.request.get('/api/patients/pat-sofia/intake')).json();
  expect((await page.request.patch('/api/patients/pat-sofia/intake', { data: { expected_revision: intake.intake.revision, step: 'allergies', payload: { allergies: { state: 'none', items: [] }, restrictions: { state: 'none', items: [] } } } })).ok()).toBeTruthy();
  const permiso = CONSENT_CATALOG.find(c => c.purpose === 'ai_menu_draft')!;
  expect((await page.request.post('/api/patients/pat-sofia/consents', { data: { purpose: permiso.purpose, text_version: permiso.text_version, text_hash: permiso.text_hash, decision: 'granted' } })).ok()).toBeTruthy();
  await enterDemo(page, '/crm/plan');
  await page.getByRole('button', { name: /plan (de|para) Sofía R\./ }).click();
  // El editor abre en el día de hoy; el recorrido pide el primer día del plan, que es el que se compara.
  await page.locator('.pedays button').first().click();
  await page.getByRole('button', { name: 'Ajustar con IA', exact: true }).click();
  const cajon = page.locator('#iadr');
  await expect(cajon.getByRole('button', { name: 'Deshacer última aplicación IA' })).toBeDisabled();
  const publicado = (await read()).published;
  const antes = await read();
  const pedidos: Array<{ period_start: string; period_end: string; slots: string[] }> = [];
  page.on('request', request => { if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/ai/jobs') pedidos.push(request.postDataJSON()); });
  const comparar = (p: ProfessionalMealPlan) => p.current.items.map(({ id: _id, ...i }) => i);
  for (const scope of [0, 1, 2]) {
    await cajon.getByRole('radio').nth(scope).click();
    const snapshot = await read();
    await cajon.getByRole('textbox', { name: 'Pedile un cambio' }).fill('Prepará opciones variadas');
    await cajon.getByRole('button', { name: 'Enviar', exact: true }).click();
    await expect(cajon.getByRole('button', { name: 'Aplicar', exact: true })).toBeVisible({ timeout: 20000 });
    const pedido = pedidos[pedidos.length - 1]!;
    expect(pedido.period_start).toBe(inicio);
    expect(pedido.period_end).toBe(scope === 2 ? hasta : inicio);
    expect(pedido.slots).toHaveLength(scope === 1 ? 1 : 5);
    // Cambiar el selector después del pedido no cambia el alcance ya capturado.
    await cajon.getByRole('radio').nth(scope === 0 ? 2 : 0).click();
    await cajon.getByRole('button', { name: 'Aplicar', exact: true }).click();
    await expect(cajon.getByText('Aplicado en el borrador', { exact: true })).toBeVisible();
    const aplicado = await read();
    expect(aplicado.published).toEqual(publicado);
    expect(aplicado.current.guidance).toEqual(snapshot.current.guidance);
    if (scope !== 2) expect(aplicado.current.items.filter(i => i.for_date === hasta).map(i => i.free_text).sort()).toEqual(['Original Almuerzo', 'Original Cena', 'Original Desayuno']);
    if (scope === 1) expect(comparar(aplicado).filter(i => i.slot !== pedido.slots[0] || i.for_date !== inicio)).toEqual(comparar(snapshot).filter(i => i.slot !== pedido.slots[0] || i.for_date !== inicio));
    await cajon.locator('.iaprop').getByRole('button', { name: 'Deshacer', exact: true }).click();
    await expect(page.locator('#s-planes p.mhelp[role="status"]')).toContainText('Se deshizo');
    expect(comparar(await read())).toEqual(comparar(snapshot));
    await expect(cajon.getByRole('button', { name: 'Deshacer última aplicación IA' })).toBeDisabled();
  }
  expect(comparar(await read())).toEqual(comparar(antes));
  await cajon.getByRole('tab', { name: 'Historial de cambios' }).click();
  await expect(cajon.getByText('Propuesta aplicada', { exact: true })).toHaveCount(3);
  await expect(cajon.getByText('Aplicación deshecha', { exact: true })).toHaveCount(3);
  await expect(cajon).not.toContainText('Próximamente');
  await expect(cajon).toHaveCSS('font-family', /Inter/);
  await page.screenshot({ path: 'test-results/planes-p3d-historial.png' });
  await cajon.getByRole('tab', { name: 'Chat', exact: true }).click();
  await cajon.getByRole('radio').nth(1).click();
  await cajon.getByRole('textbox', { name: 'Pedile un cambio' }).fill('Una comida nueva');
  await cajon.getByRole('button', { name: 'Enviar', exact: true }).click();
  await cajon.getByRole('button', { name: 'Aplicar', exact: true }).click();
  await expect(cajon.getByText('Aplicado en el borrador', { exact: true })).toBeVisible();
  const concurrente = snapshotBorrador(await read());
  concurrente.items[0] = { for_date: concurrente.items[0].for_date, slot: concurrente.items[0].slot, free_text: 'Edición posterior en otra sesión', public_note: '' };
  expect((await page.request.post('/api/patients/pat-sofia/plans', { data: concurrente })).ok()).toBeTruthy();
  const revisionAjena = (await read()).current.revision;
  await cajon.locator('.iaprop').getByRole('button', { name: 'Deshacer', exact: true }).click();
  await expect(page.locator('#s-planes p.mhelp[role="status"]')).toContainText('No se pudo deshacer');
  expect((await read()).current.revision).toBe(revisionAjena);
  expect((await read()).published).toEqual(publicado);
  await cajon.getByRole('tab', { name: 'Historial de cambios' }).click();
  await expect(cajon.getByText('Aplicación deshecha', { exact: true })).toHaveCount(3);
  for (const tema of ['light', 'dark']) {
    await cajon.getByRole('button', { name: 'Cerrar asistente' }).click();
    await page.setViewportSize({ width: 1440, height: 900 });
    if (await page.locator('#pv-panel-v29').getAttribute('data-theme') !== tema) {
      await page.locator('#pv-panel-v29 .side .acct').click();
      await page.locator('#pv-account').getByRole('button', { name: tema === 'dark' ? 'Tema oscuro' : 'Tema claro', exact: true }).click();
    }
    await page.getByRole('button', { name: 'Ajustar con IA', exact: true }).click();
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(cajon.getByRole('tab', { name: 'Historial de cambios' })).toBeVisible();
      const box = await cajon.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
      expect(box!.y + box!.height).toBeLessThanOrEqual(900);
      await page.screenshot({ path: `test-results/planes-p3d-${tema}-${width}.png` });
    }
  }
});

test('primera aplicación conserva el historial y explica que no había borrador para deshacer', async ({ page }) => {
  await enterDemo(page, '/crm/plan');
  const alta = await page.request.post('/api/patients', { data: { name: 'Primera aplicación IA', email: `primera-ia-${Date.now()}@example.test`, goal: 'Organizar las comidas' } });
  expect(alta.ok()).toBeTruthy();
  const { patient } = await alta.json() as { patient: { id: string } };
  const id = patient.id;
  const intake = await (await page.request.get(`/api/patients/${id}/intake`)).json();
  expect((await page.request.patch(`/api/patients/${id}/intake`, { data: { expected_revision: intake.intake.revision, step: 'allergies', payload: { allergies: { state: 'none', items: [] }, restrictions: { state: 'none', items: [] } } } })).ok()).toBeTruthy();
  const permiso = CONSENT_CATALOG.find(c => c.purpose === 'ai_menu_draft')!;
  expect((await page.request.post(`/api/patients/${id}/consents`, { data: { purpose: permiso.purpose, text_version: permiso.text_version, text_hash: permiso.text_hash, decision: 'granted' } })).ok()).toBeTruthy();
  await enterDemo(page, '/crm/plan');
  await page.getByRole('button', { name: /plan (de|para) Sofía R\./ }).click();
  await page.locator('.ppsel').click();
  await page.getByRole('option', { name: /Primera aplicación IA/ }).click();
  await page.getByRole('button', { name: 'Armar con el asistente', exact: true }).click();
  const cajon = page.locator('#iadr');
  await cajon.getByRole('button', { name: 'Aplicar', exact: true }).click();
  await expect(cajon.getByText('Aplicado en el borrador', { exact: true })).toBeVisible();
  await expect(cajon.getByRole('button', { name: 'Deshacer última aplicación IA' })).toBeDisabled();
  await cajon.getByRole('tab', { name: 'Historial de cambios' }).click();
  await expect(cajon.getByText('Propuesta aplicada', { exact: true })).toBeVisible();
  await expect(cajon).toContainText('Sin borrador anterior para deshacer');
});
