import { beforeEach, describe, expect, it } from 'vitest';
import { app } from './index.js';
import { resetStore } from './store.js';
import { localBillingDate } from '../src/billing.js';
import { addDays, serviceTotals } from '../src/service.js';
import { siteUrl, testAliasEmail } from './admin/accounts.js';
import type { ServiceBoard, ServiceNutritionist, ServiceTestAccount } from '../src/types/service.js';

function send(path: string, method: string, body?: unknown) {
  return app.request(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
}

async function board(): Promise<ServiceBoard> {
  return (await (await send('/api/admin/service', 'GET')).json() as { board: ServiceBoard }).board;
}

const CLAVE = 'una-clave-larga';

describe('altas desde el panel (modo demo)', () => {
  beforeEach(() => resetStore());

  it('da de alta una nutricionista por invitación: 30 días de prueba, sin clave en la respuesta', async () => {
    const response = await send('/api/admin/nutritionists', 'POST', { name: '  Laura Díaz ', email: 'Laura@Example.test', mode: 'invite' });
    expect(response.status).toBe(201);
    const text = await response.text();
    const { nutritionist } = JSON.parse(text) as { nutritionist: ServiceNutritionist };
    expect(nutritionist).toMatchObject({ display_name: 'Laura Díaz', email: 'laura@example.test', is_test: false, patients_active: 0, last_sign_in_at: null, payments: [] });
    expect(nutritionist.subscription).toMatchObject({ trial_ends_on: addDays(localBillingDate(), 30), paid_until: null, override: 'none' });
    const after = await board();
    expect(after.nutritionists.some((row) => row.id === nutritionist.id)).toBe(true);
    expect(after.events[0]).toMatchObject({ action: 'service.nutritionist_created', nutritionist_id: nutritionist.id, metadata: { mode: 'invite' } });
  });

  it('da de alta con clave y nunca la devuelve ni la anota', async () => {
    const response = await send('/api/admin/nutritionists', 'POST', { name: 'Laura Díaz', email: 'laura@example.test', mode: 'password', password: CLAVE });
    expect(response.status).toBe(201);
    expect(await response.text()).not.toContain(CLAVE);
    expect(JSON.stringify(await board())).not.toContain(CLAVE);
  });

  it('mail repetido => 409', async () => {
    expect((await send('/api/admin/nutritionists', 'POST', { name: 'Otra Vero', email: 'VERO@example.test', mode: 'invite' })).status).toBe(409);
    await send('/api/admin/nutritionists', 'POST', { name: 'Laura', email: 'laura@example.test', mode: 'invite' });
    expect((await send('/api/admin/nutritionists', 'POST', { name: 'Laura', email: 'laura@example.test', mode: 'password', password: CLAVE })).status).toBe(409);
  });

  it('datos inválidos => 422; JSON roto => 400; cuerpo enorme => 413', async () => {
    const bad = [
      { name: 'L', email: 'laura@example.test', mode: 'invite' },
      { name: 'Laura', email: 'no-es-mail', mode: 'invite' },
      { name: 'Laura', email: 'laura@example.test', mode: 'magia' },
      { name: 'Laura', email: 'laura@example.test', mode: 'password' },
      { name: 'Laura', email: 'laura@example.test', mode: 'password', password: 'corta' },
      { name: 'Laura', email: 'laura@example.test', mode: 'invite', password: CLAVE },
      { name: 'Laura', email: 'laura@example.test', mode: 'invite', role: 'admin' },
    ];
    for (const body of bad) expect((await send('/api/admin/nutritionists', 'POST', body)).status).toBe(422);
    expect((await send('/api/admin/nutritionists', 'POST', '{roto')).status).toBe(400);
    expect((await send('/api/admin/nutritionists', 'POST', { name: 'x'.repeat(5000), email: 'a@b.test', mode: 'invite' })).status).toBe(413);
    expect((await board()).nutritionists).toHaveLength(3);
  });

  it('reenvía el acceso y lo anota', async () => {
    const response = await send('/api/admin/nutritionists/nutri-camila/send-access', 'POST');
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ sent: true });
    expect((await board()).events[0]).toMatchObject({ action: 'service.access_sent', nutritionist_id: 'nutri-camila' });
    expect((await send('/api/admin/nutritionists/nadie/send-access', 'POST')).status).toBe(400);
  });

  it('guarda la nota interna (hasta 500 caracteres)', async () => {
    const response = await send('/api/admin/nutritionists/nutri-julieta/note', 'PUT', { note: '  Paga a fin de mes  ' });
    expect(response.status).toBe(200);
    const { nutritionist } = await response.json() as { nutritionist: ServiceNutritionist };
    expect(nutritionist.subscription.note).toBe('Paga a fin de mes');
    expect((await board()).events[0]).toMatchObject({ action: 'service.note', nutritionist_id: 'nutri-julieta' });
    expect((await send('/api/admin/nutritionists/nutri-julieta/note', 'PUT', { note: 'x'.repeat(500) })).status).toBe(200);
    expect((await send('/api/admin/nutritionists/nutri-julieta/note', 'PUT', { note: 'x'.repeat(501) })).status).toBe(422);
    expect((await send('/api/admin/nutritionists/nutri-julieta/note', 'PUT', {})).status).toBe(422);
    expect((await send('/api/admin/nutritionists/nadie/note', 'PUT', { note: 'hola' })).status).toBe(400);
  });

  it('crea las cuentas de prueba con alias de Gmail, las devuelve si ya existen y no suman en los números', async () => {
    const before = serviceTotals((await board()).nutritionists, localBillingDate());
    const first = await send('/api/admin/test-accounts', 'POST', { email_base: 'facu@gmail.com', password: CLAVE });
    expect(first.status).toBe(201);
    const text = await first.text();
    expect(text).not.toContain(CLAVE);
    expect(JSON.parse(text)).toMatchObject({
      nutritionist: { email: 'facu+plan-v-nutri@gmail.com' },
      patient: { email: 'facu+plan-v-paciente@gmail.com' },
      created: true,
    });
    const again = await send('/api/admin/test-accounts', 'POST', { email_base: 'facu@gmail.com', password: CLAVE });
    expect(again.status).toBe(200);
    expect(await again.json()).toMatchObject({ created: false });

    const list = await (await send('/api/admin/test-accounts', 'GET')).json() as { accounts: ServiceTestAccount[] };
    expect(list.accounts).toEqual([
      { email: 'facu+plan-v-nutri@gmail.com', name: '[Prueba] Nutricionista', role: 'nutricionista' },
      { email: 'facu+plan-v-paciente@gmail.com', name: '[Prueba] Paciente', role: 'paciente' },
    ]);

    const after = await board();
    const testRows = after.nutritionists.filter((row) => row.is_test);
    expect(testRows).toHaveLength(1);
    expect(testRows[0]).toMatchObject({ display_name: '[Prueba] Nutricionista', patients_active: 1 });
    expect(after.events.filter((event) => event.action === 'service.test_accounts_created')).toHaveLength(1);
    const totals = serviceTotals(after.nutritionists, localBillingDate());
    expect(totals).toEqual({ ...before, cuentas_prueba: 1 });

    // Un alta con un mail de prueba choca.
    expect((await send('/api/admin/nutritionists', 'POST', { name: 'Laura', email: 'facu+plan-v-paciente@gmail.com', mode: 'invite' })).status).toBe(409);
  });

  it('valida las cuentas de prueba', async () => {
    expect((await send('/api/admin/test-accounts', 'POST', { email_base: 'facu@gmail.com', password: 'corta' })).status).toBe(422);
    expect((await send('/api/admin/test-accounts', 'POST', { email_base: 'facu', password: CLAVE })).status).toBe(422);
    expect((await send('/api/admin/test-accounts', 'POST', { email_base: 'facu@gmail.com' })).status).toBe(422);
  });

  it('desde la vista de paciente ninguna ruta de altas responde (403)', async () => {
    const calls: Array<[string, string, unknown?]> = [
      ['/api/admin/nutritionists?audience=patient', 'POST', { name: 'Laura', email: 'laura@example.test', mode: 'invite' }],
      ['/api/admin/nutritionists/nutri-camila/send-access?audience=patient', 'POST'],
      ['/api/admin/nutritionists/nutri-camila/note?audience=patient', 'PUT', { note: 'x' }],
      ['/api/admin/test-accounts?audience=patient', 'GET'],
      ['/api/admin/test-accounts?audience=patient', 'POST', { email_base: 'facu@gmail.com', password: CLAVE }],
    ];
    for (const [path, method, body] of calls) expect((await send(path, method, body)).status).toBe(403);
    expect((await board()).nutritionists).toHaveLength(3);
    expect((await board()).events).toEqual([]);
  });
});

describe('ayudas de altas', () => {
  it('arma el alias de Gmail y reemplaza uno previo', () => {
    expect(testAliasEmail('Facu@Gmail.com', 'nutricionista')).toBe('facu+plan-v-nutri@gmail.com');
    expect(testAliasEmail('facu+otra@gmail.com', 'paciente')).toBe('facu+plan-v-paciente@gmail.com');
  });

  it('el enlace de los mails va al sitio publicado (https) o a localhost', () => {
    expect(siteUrl({ PUBLIC_SITE_URL: 'https://planv.app/algo' })).toBe('https://planv.app');
    expect(siteUrl({ CORS_ORIGINS: 'http://evil.test, https://planv.app' })).toBe('https://planv.app');
    expect(siteUrl({ CORS_ORIGINS: 'http://localhost:5173' })).toBe('http://localhost:5173');
    expect(siteUrl({})).toBeUndefined();
  });
});
