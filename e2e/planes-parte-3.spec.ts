import { expect, test } from '@playwright/test';
import { enterDemo } from './helpers';

const COMIDAS = ['Desayuno', 'Colación', 'Almuerzo', 'Merienda', 'Cena'] as const;
const TEXTOS = ['Avena con leche', 'Fruta de estación', 'Pollo con arroz', 'Yogur natural', 'Merluza al horno'];

test('Planes: la entrega muestra vista, PDF, lista y no publica sola', async ({ page }) => {
  await enterDemo(page, '/crm/plan');
  await page.getByRole('button', { name: /plan (de|para) Sofía R\./ }).click();
  await expect(page.locator('#s-planes.pux-plan')).toBeVisible();

  await page.getByRole('radio', { name: 'App', exact: true }).click();
  await expect(page.getByText('Así se vería en la app', { exact: false })).toBeVisible();
  await page.getByRole('radio', { name: 'PDF', exact: true }).click();
  await expect(page.getByText('no se envía a la paciente', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Abrir PDF / imprimir', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Imprimir o guardar el plan como PDF' })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar', exact: true }).click();

  await page.getByRole('tab', { name: 'Entrega', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Revisión antes de entregar' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Publicación', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Publicar plan revisado', exact: true })).toBeDisabled();

  await page.getByRole('button', { name: /Vista de la paciente/ }).click();
  await expect(page.getByText('No se notificó ni se envió nada', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar', exact: true }).click();

  const descarga = page.waitForEvent('download');
  await page.getByRole('button', { name: /Lista de compras/ }).click();
  expect((await descarga).suggestedFilename()).toMatch(/^lista-compras-/);

  await page.getByRole('button', { name: 'Programar entrega', exact: true }).click();
  await expect(page.locator('#s-planes p.mhelp[role="status"]')).toContainText('Próximamente');
  await expect(page.locator('#s-planes')).not.toContainText('Plan publicado');
});

test('Planes: publicar con el borrador cambiado no reemplaza el plan de la paciente', async ({ page }) => {
  await enterDemo(page, '/crm/plan');
  const lectura = await page.request.get('/api/patients/pat-sofia/plans?audience=pro');
  expect(lectura.ok()).toBeTruthy();
  const cuerpo = await lectura.json() as { plan: { id: string; current: { revision: string; period_start: string; period_end: string; version: number } } };
  const actual = cuerpo.plan.current;
  const items = fechas(actual.period_start, actual.period_end).flatMap(fecha => COMIDAS.map((slot, indice) => ({
    for_date: fecha, slot, free_text: TEXTOS[indice], public_note: '',
  })));
  const primero = await page.request.post('/api/patients/pat-sofia/plans', {
    data: {
      id: cuerpo.plan.id, expected_revision: actual.revision,
      period_start: actual.period_start, period_end: actual.period_end,
      timezone: 'America/Argentina/Buenos_Aires', items,
    },
  });
  expect(primero.ok()).toBeTruthy();
  const borrador = await primero.json() as { plan: { current: { revision: string; version: number } } };

  await enterDemo(page, '/crm/plan');
  await page.getByRole('button', { name: /plan (de|para) Sofía R\./ }).click();
  await expect(page.locator('#s-planes.pux-plan')).toBeVisible();
  await expect(page.getByText('Fruta de estación').first()).toBeVisible();
  const segundo = await page.request.post('/api/patients/pat-sofia/plans', {
    data: {
      id: cuerpo.plan.id, expected_revision: borrador.plan.current.revision,
      period_start: actual.period_start, period_end: actual.period_end,
      timezone: 'America/Argentina/Buenos_Aires',
      items: items.map((item, indice) => indice === 0 ? { ...item, free_text: 'Tostadas con queso' } : item),
    },
  });
  expect(segundo.ok()).toBeTruthy();

  const antes = await page.request.get('/api/patients/pat-sofia/plans');
  expect(antes.ok()).toBeTruthy();
  const versionVista = ((await antes.json()) as { plan: { version: number } | null }).plan?.version;

  await page.getByRole('tab', { name: 'Entrega', exact: true }).click();
  await page.getByRole('checkbox', { name: /Revisé el plan completo/ }).check();
  await page.getByRole('button', { name: 'Publicar plan revisado', exact: true }).click();
  await expect(page.locator('#s-planes p.mhelp[role="status"]')).toContainText('El borrador cambió');

  const paciente = await page.request.get('/api/patients/pat-sofia/plans');
  expect(paciente.ok()).toBeTruthy();
  const publicado = await paciente.json() as { plan: { version: number } | null };
  expect(publicado.plan?.version).toBe(versionVista);
});

function fechas(inicio: string, fin: string) {
  const dias: string[] = [];
  for (let cursor = inicio; cursor <= fin; cursor = sumar(cursor)) dias.push(cursor);
  return dias;
}

function sumar(iso: string) {
  const fecha = new Date(`${iso}T12:00:00Z`);
  fecha.setUTCDate(fecha.getUTCDate() + 1);
  return fecha.toISOString().slice(0, 10);
}
