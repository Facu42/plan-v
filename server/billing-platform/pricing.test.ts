import { describe, expect, it } from 'vitest';
import { cycleAmountCents, GRACE_DAYS, GRACE_MS, PLATFORM_PLANS } from './pricing.js';
import { preapprovalBody } from './mp-platform.js';

describe('precios de Nutridash', () => {
  it('la gracia por cobro rechazado dura 30 días', () => {
    expect(GRACE_DAYS).toBe(30);
    expect(GRACE_MS).toBe(30 * 24 * 60 * 60 * 1000);
  });

  it('calcula la lista, el anual del 20% y la fundadora del 40% sin sumarlos', () => {
    const [arranque, pro, consultorio] = PLATFORM_PLANS;
    expect(cycleAmountCents(arranque.monthly_amount_cents, 'monthly', false)).toBe(2_490_000);
    expect(cycleAmountCents(arranque.monthly_amount_cents, 'annual', false)).toBe(23_904_000);
    expect(cycleAmountCents(pro.monthly_amount_cents, 'annual', false)).toBe(47_904_000);
    expect(cycleAmountCents(consultorio.monthly_amount_cents, 'annual', false)).toBe(86_304_000);
    expect(cycleAmountCents(arranque.monthly_amount_cents, 'monthly', true)).toBe(1_494_000);
    expect(cycleAmountCents(arranque.monthly_amount_cents, 'annual', true)).toBe(17_928_000);
    const stacked = Math.round(23_904_000 * 0.6);
    expect(cycleAmountCents(arranque.monthly_amount_cents, 'annual', true)).not.toBe(stacked);
  });

  it('arma el preapproval mensual o anual, sin prueba gratis', () => {
    const body = preapprovalBody({
      id: 'sub-1', planName: 'Arranque', payerEmail: 'nutri@example.test', amountCents: 2_490_000,
      cycle: 'monthly', backUrl: 'https://plan-v.example/crm/ajustes', notificationUrl: null,
    });
    expect(body).not.toHaveProperty('free_trial');
    expect(JSON.stringify(body)).not.toContain('free_trial');
    expect(body.auto_recurring).toMatchObject({ frequency: 1, frequency_type: 'months', transaction_amount: 24900, currency_id: 'ARS' });
    expect(body.status).toBe('pending');
    const annual = preapprovalBody({ ...{ id: 'sub-1', planName: 'Pro', payerEmail: 'nutri@example.test', amountCents: 47_904_000, cycle: 'annual' as const, backUrl: 'https://plan-v.example/crm/ajustes', notificationUrl: 'https://plan-v.example/api/public/billing/mp/webhook' } });
    expect(annual.auto_recurring.frequency).toBe(12);
    expect(annual.auto_recurring.transaction_amount).toBe(479040);
    expect(annual.notification_url).toBe('https://plan-v.example/api/public/billing/mp/webhook');
  });
});
