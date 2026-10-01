import { beforeEach, describe, expect, it } from 'vitest';
import { app } from './index.js';
import { resetStore } from './store.js';
import { localBillingDate } from '../src/billing.js';
import { summarizeService } from '../src/service.js';
import type { ServiceBoard, ServiceNutritionist } from '../src/types/service.js';

function send(path: string, method: string, body?: unknown) {
  return app.request(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function board(): Promise<ServiceBoard> {
  return (await (await send('/api/admin/service', 'GET')).json() as { board: ServiceBoard }).board;
}

describe('panel del servicio en modo demo', () => {
  beforeEach(() => resetStore());

  it('trae los ejemplos: Verónica activa, Camila en prueba, Julieta sin pagar', async () => {
    const today = localBillingDate();
    const states = Object.fromEntries((await board()).nutritionists.map((row) => [row.id, summarizeService(row.subscription, today).state]));
    expect(states['nutri-vero']).toMatch(/activa|por_vencer/);
    expect(states['nutri-camila']).toBe('prueba');
    expect(states['nutri-julieta']).toBe('cortada');
  });

  it('sólo muestra el acceso al panel en la vista de administrador', async () => {
    expect(await (await send('/api/admin/me', 'GET')).json()).toEqual({ admin: false });
    expect(await (await send('/api/admin/me?audience=admin', 'GET')).json()).toEqual({ admin: true });
    expect((await send('/api/admin/service?audience=patient', 'GET')).status).toBe(403);
  });

  it('registra un pago de Julieta y queda activa; anularlo la vuelve a dejar sin pagar', async () => {
    const response = await send('/api/admin/nutritionists/nutri-julieta/payments', 'POST', { amount: 15000, months: 1, paid_on: localBillingDate(), method: 'transferencia' });
    expect(response.status).toBe(201);
    const { nutritionist } = await response.json() as { nutritionist: ServiceNutritionist };
    expect(summarizeService(nutritionist.subscription, localBillingDate()).state).toBe('activa');
    const voided = await send(`/api/admin/service-payments/${nutritionist.payments[0].id}`, 'DELETE');
    const after = (await voided.json() as { nutritionist: ServiceNutritionist }).nutritionist;
    expect(summarizeService(after.subscription, localBillingDate()).state).toBe('cortada');
    expect((await board()).events.map((event) => event.action)).toEqual(['service.payment_voided', 'service.payment']);
  });

  it('extiende la prueba, da sin cargo y guarda el precio', async () => {
    const extended = await (await send('/api/admin/nutritionists/nutri-julieta/trial', 'POST', { days: 15 })).json() as { nutritionist: ServiceNutritionist };
    expect(summarizeService(extended.nutritionist.subscription, localBillingDate())).toMatchObject({ state: 'prueba', days_left: 15 });
    const waived = await (await send('/api/admin/nutritionists/nutri-julieta/override', 'PUT', { override: 'waived', note: 'amiga' })).json() as { nutritionist: ServiceNutritionist };
    expect(summarizeService(waived.nutritionist.subscription, localBillingDate()).state).toBe('sin_cargo');
    const saved = await (await send('/api/admin/service/settings', 'PUT', { monthly_price: 15000, trial_days: 30 })).json() as { settings: unknown };
    expect(saved.settings).toEqual({ monthly_price: 15000, trial_days: 30 });
  });

  it('rechaza datos inválidos', async () => {
    expect((await send('/api/admin/nutritionists/nutri-julieta/payments', 'POST', { amount: 0, months: 1, paid_on: localBillingDate(), method: 'transferencia' })).status).toBe(400);
    expect((await send('/api/admin/nutritionists/nutri-julieta/payments', 'POST', { amount: 10, months: 1, paid_on: '2020-01-01', method: 'transferencia' })).status).toBe(400);
    expect((await send('/api/admin/nutritionists/nadie/trial', 'POST', { days: 5 })).status).toBe(400);
    expect((await send('/api/admin/service/settings', 'PUT', { monthly_price: 0, trial_days: 30 })).status).toBe(400);
    expect((await send('/api/admin/nutritionists/nutri-julieta/override', 'PUT', { override: 'gratis' })).status).toBe(400);
  });
});
