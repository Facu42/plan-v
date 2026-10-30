import { expect, test } from '@playwright/test';
import { enterDemo } from './helpers';

const plan = {
  enabled: true,
  founder_seats_left: 12,
  plans: [
    { code: 'arranque', name: 'Arranque', monthly_amount_cents: 2490000, annual_amount_cents: 23904000, founder_monthly_amount_cents: 1494000, founder_annual_amount_cents: 17928000, max_active_patients: 25, max_nutritionists: 1, max_ai_meal_photos_month: 150 },
    { code: 'pro', name: 'Pro', monthly_amount_cents: 4990000, annual_amount_cents: 47904000, founder_monthly_amount_cents: 2994000, founder_annual_amount_cents: 35928000, max_active_patients: 120, max_nutritionists: 1, max_ai_meal_photos_month: 600 },
    { code: 'consultorio', name: 'Consultorio', monthly_amount_cents: 8990000, annual_amount_cents: 86304000, founder_monthly_amount_cents: 5394000, founder_annual_amount_cents: 64728000, max_active_patients: null, max_nutritionists: 3, max_ai_meal_photos_month: null },
  ],
  subscription: {
    id: '11111111-1111-4111-8111-111111111111', plan_code: 'arranque', plan_name: 'Arranque', billing_cycle: 'monthly', status: 'authorized',
    founder: true, founder_until: '2027-10-30T00:00:00.000Z', current_amount_cents: 1494000, current_period_end: '2026-11-30T00:00:00.000Z',
    past_due_since: null, read_only: false, grace_until: null, init_point: null, attention: null,
  },
  usage: { active_patients: 4, nutritionists: 1, ai_photos: 3 },
  payments: [{ id: 'pay-1', amount_cents: 1494000, status: 'approved', paid_at: '2026-10-30T12:00:00.000Z' }],
};

test('Ajustes muestra el plan en claro y oscuro', async ({ page }) => {
  await page.route('**/api/billing/plan', (route) => route.fulfill({ json: plan }));
  await enterDemo(page, '/crm/ajustes');
  const card = page.locator('#s-ajustes');
  await expect(card.getByText('Tu servicio de Nutridash')).toBeVisible();
  await expect(card.getByText('Fundadora', { exact: true })).toBeVisible();
  await expect(card.getByText('Pacientes activas')).toBeVisible();
  await expect(card.getByText('4 de 25')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (await page.locator('#pv-panel-v29').getAttribute('data-theme') !== 'dark') {
    await page.locator('.side .acct').click();
    await page.locator('#pv-account').getByRole('button', { name: 'Tema oscuro', exact: true }).click();
  }
  await expect(page.locator('#pv-panel-v29')).toHaveAttribute('data-theme', 'dark');
  await expect(card.getByText('Fundadora', { exact: true })).toBeVisible();
  await expect(card.getByText('150', { exact: false })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
