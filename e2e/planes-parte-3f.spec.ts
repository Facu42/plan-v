import { expect, test } from '@playwright/test';
import { enterDemo } from './helpers';

test('3f: Impreso abre papel, mail explica la demo, las pestañas y la tipografía se conservan', async ({ page }, testInfo) => {
  await enterDemo(page, '/crm/plan');
  await page.getByRole('button', { name: /plan (de|para) Sofía R\./ }).click();
  const tabs = page.getByRole('tablist', { name: 'Contenido del plan' });
  await expect(tabs.getByRole('tab')).toHaveText(['Comidas', 'Indicaciones', 'Compras', 'Versiones', 'Entrega']);
  await page.locator('.peshare').getByRole('button', { name: /Impreso/ }).click();
  await page.getByRole('button', { name: 'Compartir ahora', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('document')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Imprimir', exact: true })).toBeEnabled();
  await expect(dialog.getByRole('button', { name: 'Descargar PDF', exact: true })).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('impreso.png') });
  await dialog.getByRole('button', { name: 'Cerrar', exact: true }).click();
  const before = (await (await page.request.get('/api/patients/pat-sofia/plans?audience=pro')).json()).plan;
  await page.locator('.peshare').getByRole('button', { name: /Por mail/ }).click();
  await page.getByRole('button', { name: 'Compartir ahora', exact: true }).click();
  await expect(page.locator('#s-planes p[role="status"]')).toContainText('demo no envía correos');
  const after = (await (await page.request.get('/api/patients/pat-sofia/plans?audience=pro')).json()).plan;
  expect(after.current).toEqual(before.current); expect(after.published).toEqual(before.published);
  await page.getByRole('button', { name: 'Programar publicación', exact: true }).click();
  await expect(dialog.getByLabel('Día')).toBeVisible(); await expect(dialog.getByLabel('Hora')).toBeVisible();
  expect(await dialog.evaluate(el => getComputedStyle(el).fontFamily)).toContain('Inter');
  await dialog.getByRole('button', { name: 'Cerrar', exact: true }).click();
});

test('3f: revisión obligatoria, programación persistida al recargar y errores visibles', async ({ page }, testInfo) => {
  await enterDemo(page, '/crm/plan');
  const original = (await (await page.request.get('/api/patients/pat-sofia/plans?audience=pro')).json()).plan;
  const start = original.current.period_start;
  const items = Array.from({length:7}, (_,i) => {
    const at = new Date(`${start}T12:00:00Z`); at.setUTCDate(at.getUTCDate()+i);
    return ['Desayuno','Colación','Almuerzo','Merienda','Cena'].map(slot => ({ for_date:at.toISOString().slice(0,10),slot,free_text:'Comida revisada 3f' }));
  }).flat();
  expect((await page.request.post('/api/patients/pat-sofia/plans',{data:{id:original.id,expected_revision:original.current.revision,period_start:start,period_end:items[items.length - 1].for_date,items}})).ok()).toBeTruthy();
  await enterDemo(page, '/crm/plan');
  await page.getByRole('button', { name: /plan (de|para) Sofía R\./ }).click();
  await page.getByRole('tab', { name: 'Entrega', exact: true }).click();
  await page.getByRole('button', { name: 'Programar entrega', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('button', { name: 'Programar', exact: true })).toBeDisabled();
  await dialog.getByRole('button', { name: 'Cerrar', exact: true }).click();
  await page.getByRole('checkbox', { name: /Revisé el plan completo/ }).check();
  await page.getByRole('button', { name: 'Programar entrega', exact: true }).click();
  const at = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(at);
  await dialog.getByLabel('Día').fill(day); await dialog.getByLabel('Hora').fill('23:00');
  await page.route('**/api/plans/*/schedule', route => route.fulfill({ status:409, contentType:'application/json', body:JSON.stringify({error:'El borrador cambió. Revisalo otra vez.'}) }));
  await dialog.getByRole('button', { name: 'Programar', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('borrador cambió');
  await expect(dialog.getByLabel('Día')).toHaveValue(day);
  await page.unroute('**/api/plans/*/schedule');
  await page.screenshot({ path: testInfo.outputPath('programar.png') });
  const before = (await (await page.request.get('/api/patients/pat-sofia/plans')).json()).plan;
  await dialog.getByRole('button', { name: 'Programar', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  const saved = (await (await page.request.get('/api/patients/pat-sofia/plans?audience=pro')).json()).plan;
  expect(saved.delivery_schedule.scheduled_at).toBe(new Date(`${day}T23:00:00-03:00`).toISOString());
  expect(saved.current.status).toBe('scheduled');
  expect((await (await page.request.get('/api/patients/pat-sofia/plans')).json()).plan).toEqual(before);
  await enterDemo(page, '/crm/plan');
  await page.getByRole('button', { name: /plan (de|para) Sofía R\./ }).click();
  await page.getByRole('button', { name: 'Programar publicación', exact: true }).click();
  await expect(dialog.getByRole('status').first()).toContainText('Programada para');
  await expect(dialog.getByRole('status').first()).toContainText('23:00');
  await expect(dialog.getByLabel('Día')).toHaveValue(day);
  await expect(dialog.getByLabel('Hora')).toHaveValue('23:00');
});

test('3f: diálogo día y hora entra en 1440 y 390, claro y oscuro, con Inter', async ({ page }, testInfo) => {
  await enterDemo(page, '/crm/plan');
  await page.getByRole('button', { name: /plan (de|para) Sofía R\./ }).click();
  for (const width of [1440, 390]) for (const dark of [false,true]) {
    await page.setViewportSize({width:1440,height:900});
    if (await page.locator('#pv-panel-v29').getAttribute('data-theme') !== (dark?'dark':'light')) {
      await page.locator('#pv-panel-v29 .side .acct').click();
      await page.locator('#pv-account').getByRole('button',{name:dark?'Tema oscuro':'Tema claro',exact:true}).click();
    }
    await page.setViewportSize({width,height:900});
    await page.getByRole('button',{name:'Programar publicación',exact:true}).click();
    const dialog=page.getByRole('dialog');
    for(const el of [dialog,dialog.getByRole('heading'),dialog.getByLabel('Día'),dialog.getByLabel('Hora')]) expect(await el.evaluate(el=>getComputedStyle(el).fontFamily)).toContain('Inter');
    const box=await dialog.boundingBox(); expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x+box!.width).toBeLessThanOrEqual(width); expect(box!.y+box!.height).toBeLessThanOrEqual(900);
    expect(box!.x).toBeCloseTo(width === 390 ? 0 : width - 450, 0);
    expect(box!.width).toBeCloseTo(width === 390 ? width : 440, 0);
    expect(box!.y + box!.height).toBeCloseTo(width === 390 ? 900 : 890, 0);
    const cta = await dialog.getByRole('button', { name: 'Programar', exact: true }).boundingBox();
    const footer = await dialog.locator('footer').boundingBox();
    expect(cta!.x + cta!.width).toBeCloseTo(footer!.x + footer!.width, 0);
    await page.screenshot({path:testInfo.outputPath(`programar-${width}-${dark?'oscuro':'claro'}.png`)});
    await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0);
  }
});
