import { expect, test } from '@playwright/test';

const id = '22222222-2222-4222-8222-222222222222';
const audience = '11111111-1111-4111-8111-111111111111';

test('Campañas: contactos, CSV, borrador, envío confirmado y avisos de solo lectura', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  let sent = false;
  let sends = 0;
  let added = false;
  let imported = false;
  const draft = { id, name: 'Novedades', subject: 'Conocé Nutridash', status: 'draft', segment_id: audience, html: '<p>Hola</p><a href="{{{RESEND_UNSUBSCRIBE_URL}}}">Baja</a>' };
  const writes: string[] = [];
  await page.route('**/api/admin/campaigns/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() !== 'GET') writes.push(path);
    let value: unknown;
    if (path.endsWith('/config')) value = { campaigns_ready: true, mail_ready: true, from: 'Nutridash <novedades@news.nutridash.net>', reply_to: 'contacto@nutridash.net' };
    else if (path.endsWith('/contacts') && request.method() === 'GET') value = { data: [{ id, email: 'baja@example.com', first_name: 'Ana', last_name: 'Gómez', unsubscribed: true }, ...(added ? [{ id: audience, email: 'nueva@example.com', first_name: 'Nueva', last_name: 'Nutri', unsubscribed: false }] : [])], has_more: false, next: null };
    else if (path.endsWith('/contacts')) { added = true; value = { id: audience }; }
    else if (path.endsWith('/import')) { imported = true; value = { imported: 1, failed_row: null }; }
    else if (path.endsWith('/broadcasts') && request.method() === 'GET') value = { data: [{ ...draft, status: sent ? 'sent' : 'draft' }], has_more: false, next: null };
    else if (path.endsWith('/broadcasts')) value = { id };
    else if (path.endsWith('/send')) { sends++; sent = true; expect(request.postDataJSON()).toEqual({ confirm: true }); value = { id }; }
    else if (path.endsWith('/opened')) value = { opened: { count: 3, has_more: false } };
    else if (path.includes('/broadcasts/')) value = { ...draft, status: sent ? 'sent' : 'draft' };
    else if (path.endsWith('/emails')) value = { data: [{ id, from: 'avisos@nutridash.net', created_at: '2026-11-04T10:00:00Z', last_event: 'delivered' }], has_more: false, next: null };
    else value = { id, from: 'avisos@nutridash.net', created_at: '2026-11-04T10:00:00Z', last_event: 'opened' };
    await route.fulfill({ json: value });
  });
  await page.route('**/campaign-harness', (route) => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body></body></html>' }));
  await page.goto('/campaign-harness');
  await page.evaluate(async () => {
    window.location.hash = '#/campanias';
    const path = '/src/components/nutrigo/admin-crm/harness.tsx';
    const harness = await import(/* @vite-ignore */ path);
    harness.mountAdminCrmHarness();
  });
  await expect(page.getByRole('heading', { name: 'Campañas', exact: true })).toBeVisible();
  await expect(page.getByText('Dado de baja', { exact: true })).toBeVisible();
  await page.getByLabel('Correo', { exact: true }).fill('nueva@example.com');
  await page.getByLabel('Nombre', { exact: true }).fill('Nueva');
  await page.getByLabel('Apellido', { exact: true }).fill('Nutri');
  await page.getByRole('button', { name: 'Guardar contacto', exact: true }).click();
  await expect(page.getByText('nueva@example.com', { exact: true })).toBeVisible();
  await page.getByLabel('Contenido CSV').fill('email,first_name,last_name\nimportada@example.com,Ana,Gómez');
  await page.getByRole('button', { name: 'Importar contactos', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: '1 contactos guardados' })).toBeVisible();
  expect(imported).toBe(true);
  await page.getByRole('button', { name: 'Borradores y envíos', exact: true }).click();
  await page.getByLabel('Nombre interno').fill('Novedades');
  await page.getByLabel('Asunto', { exact: true }).fill('Conocé Nutridash');
  await page.getByRole('button', { name: 'Guardar borrador', exact: true }).click();
  const review = page.getByRole('region', { name: 'Revisión de campaña' });
  await expect(review).toBeVisible();
  const send = review.getByRole('button', { name: 'Enviar campaña ahora' });
  await expect(send).toBeDisabled();
  expect(sends).toBe(0);
  await review.getByRole('checkbox').check();
  await send.click();
  await expect(review.getByText('Estado: Enviada', { exact: true })).toBeVisible();
  expect(sends).toBe(1);
  await review.getByRole('button', { name: 'Consultar aperturas' }).click();
  await expect(review.getByRole('status')).toContainText('3 destinatarios');
  await page.screenshot({ path: '/tmp/campaigns-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Avisos transaccionales', exact: true }).click();
  await expect(page.getByText('Entregado', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Actualizar estado', exact: true }).click();
  await expect(page.getByText('Abierto', { exact: true })).toBeVisible();
  expect(writes.some((path) => path.includes('/emails'))).toBe(false);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Contactos', exact: true }).click();
  await expect(page.getByLabel('Correo', { exact: true })).toBeVisible();
  await expect(page.locator('.nd-campaigns')).toHaveJSProperty('scrollWidth', await page.locator('.nd-campaigns').evaluate((el) => el.clientWidth));
  await page.screenshot({ path: '/tmp/campaigns-mobile.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('Campañas apagadas: muestra configuración pendiente y deshabilita escrituras', async ({ page }) => {
  await page.route('**/api/admin/campaigns/config', (route) => route.fulfill({ json: { campaigns_ready: false, mail_ready: false, from: 'Nutridash <novedades@news.nutridash.net>', reply_to: 'contacto@nutridash.net' } }));
  await page.route('**/campaign-harness', (route) => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body></body></html>' }));
  await page.goto('/campaign-harness');
  await page.evaluate(async () => {
    window.location.hash = '#/campanias';
    const path = '/src/components/nutrigo/admin-crm/harness.tsx';
    (await import(/* @vite-ignore */ path)).mountAdminCrmHarness();
  });
  await expect(page.getByText(/Las campañas están apagadas/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Guardar contacto', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Importar contactos', exact: true })).toBeDisabled();
});
