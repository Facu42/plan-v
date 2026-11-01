import { expect, test } from '@playwright/test';
import { enterDemo } from './helpers';

const hash = 'a'.repeat(64);
const patientA = '10000000-0000-4000-a000-0000000000a1';
const patientB = '10000000-0000-4000-a000-0000000000b2';

test('con las banderas apagadas la pantalla dice Próximamente y no pide campañas', async ({ page }) => {
  const pedidos: string[] = [];
  page.on('request', request => { if (request.url().includes('/api/portfolio/campaigns')) pedidos.push(request.url()); });
  await enterDemo(page, '/crm/desarrollo?modulo=campanas');
  await expect(page.getByRole('region', { name: 'Campañas' })).toContainText('Próximamente');
  await expect(page.getByRole('button', { name: 'Vista previa' })).toHaveCount(0);
  expect(pedidos).toEqual([]);
});

test('la vista previa y la confirmación usan la API simulada y no envían nada', async ({ page }) => {
  let consultorio: 'A' | 'B' = 'A';
  const vistos: string[] = [];
  page.on('request', request => vistos.push(request.url()));
  await page.route('**/api/features', route => route.fulfill({ json: { reactivation_campaigns: true, bioimpedance: false, lab_draft: false } }));
  await page.route('**/api/portfolio/campaigns**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/preview') && route.request().method() === 'POST') {
      const propio = consultorio === 'A';
      return route.fulfill({ json: {
        segment: { segment: 'no_app_record', days: 30 },
        templates: [{ id: 'agenda_notice', subject: 'Aviso de agenda', text: 'Entrá.', path: '/app/agenda', hash }],
        patients: [{ id: propio ? patientA : patientB, name: propio ? 'Ana de consultorio A' : 'Beto de consultorio B', opted_out: false }],
        total: 1,
        max_recipients: 100,
      } });
    }
    if (route.request().method() === 'POST') {
      expect(url.pathname).toBe('/api/portfolio/campaigns');
      const body = route.request().postDataJSON() as { patient_ids: string[]; channel: string };
      expect(body.patient_ids).toEqual([consultorio === 'A' ? patientA : patientB]);
      expect(body.channel).toBe('push');
      return route.fulfill({ status: 201, json: { id: 'campania-ficticia' } });
    }
    return route.fulfill({ json: {
      settings: { enabled: true, daily_limit: 20 },
      quota: { daily_limit: 20, used: 0, remaining: 20 },
      templates: [{ id: 'agenda_notice', subject: 'Aviso de agenda', text: 'Entrá.', path: '/app/agenda', hash }],
      channels: { push: true, email: false, whatsapp: false },
      whatsapp_template: null,
      campaigns: [],
      deliveries: [],
      optouts: [],
    } });
  });
  await enterDemo(page, '/crm/desarrollo?modulo=campanas');
  await expect(page.getByText('Te quedan 20 de 20')).toBeVisible();
  await page.getByRole('button', { name: 'Vista previa' }).click();
  await expect(page.getByText('Ana de consultorio A')).toBeVisible();
  await page.getByRole('combobox', { name: 'Canal', exact: true }).selectOption('push');
  await page.getByRole('combobox', { name: 'Plantilla', exact: true }).selectOption('agenda_notice');
  await page.getByRole('checkbox', { name: 'Confirmé el segmento, el canal y las bajas' }).check();
  await page.getByRole('button', { name: 'Confirmar' }).click();
  await expect(page.getByText('No se envió ningún mensaje.')).toBeVisible();
  consultorio = 'B';
  await page.getByRole('button', { name: 'Vista previa' }).click();
  await expect(page.getByText('Beto de consultorio B')).toBeVisible();
  await expect(page.getByText('Ana de consultorio A')).toHaveCount(0);
  expect(vistos.some(url => /graph\.facebook|api\.groq|dispatch/.test(url))).toBe(false);
});
