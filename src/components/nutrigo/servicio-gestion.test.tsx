import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ServiceBoard, ServiceNutritionist } from '../../types/service';
import { api, ApiError } from '../../api/client';
import { adminErrorMessage, buildMailto, buildServiceRows, emailsOf, filterServiceEvents, filterServiceRows, mailKindFor, mailTemplate, testAliasEmails } from './servicio-utils';
import { ActividadTab, AltasTab, PruebasTab } from './ServicioTabs';
import { ServicioScreen } from './ShowroomServicio';

const TODAY = '2026-09-30';
const nutri = (over: Partial<ServiceNutritionist> & { id: string }): ServiceNutritionist => ({
  display_name: 'Nutri', email: 'n@x.com', created_at: '2026-08-01T10:00:00Z', last_sign_in_at: '2026-09-28T10:00:00Z', patients_active: 4, patients_total: 5,
  subscription: { trial_ends_on: '2026-09-15', paid_until: null, override: 'none', note: '' }, payments: [], ...over,
});
const board: ServiceBoard = {
  settings: { monthly_price: 20000, trial_days: 30 },
  nutritionists: [
    nutri({ id: 'ana', display_name: 'Ana Gómez', email: 'ana@x.com', last_sign_in_at: '2026-09-29T10:00:00Z', subscription: { trial_ends_on: '2026-09-01', paid_until: '2026-10-12', override: 'none', note: '' } }),
    nutri({ id: 'bea', display_name: 'Bea Ruiz', email: 'bea@x.com', last_sign_in_at: '2026-09-20T10:00:00Z', subscription: { trial_ends_on: '2026-10-10', paid_until: null, override: 'none', note: '' } }),
    nutri({ id: 'cla', display_name: 'Clara Paz', email: 'cla@x.com', last_sign_in_at: null, patients_active: 1 }),
  ],
  events: [{ id: 'e1', occurred_at: '2026-09-12T10:00:00Z', action: 'service.payment', nutritionist_id: 'ana', metadata: {} }],
};

afterEach(() => vi.unstubAllGlobals());

describe('Lista: filtros, orden y mails', () => {
  const rows = buildServiceRows(board, TODAY);
  it('busca por nombre o mail sin tildes y filtra por estado', () => {
    expect(filterServiceRows(rows, { query: 'GOMEZ' }).map((r) => r.nutritionist.id)).toEqual(['ana']);
    expect(filterServiceRows(rows, { query: 'bea@' }).map((r) => r.nutritionist.id)).toEqual(['bea']);
    expect(filterServiceRows(rows, { state: 'prueba' }).map((r) => r.nutritionist.id)).toEqual(['bea']);
    expect(filterServiceRows(rows, { state: 'suspendida' })).toEqual([]);
  });
  it('ordena por vencimiento, último ingreso y nombre sin tocar la lista original', () => {
    expect(filterServiceRows(rows, { order: 'vencimiento' }).map((r) => r.nutritionist.id)).toEqual(['cla', 'bea', 'ana']);
    expect(filterServiceRows(rows, { order: 'ingreso' }).map((r) => r.nutritionist.id)).toEqual(['ana', 'bea', 'cla']);
    expect(filterServiceRows(rows, { order: 'nombre' }).map((r) => r.nutritionist.id)).toEqual(['ana', 'bea', 'cla']);
    expect(rows.map((r) => r.nutritionist.id)).toEqual(['cla', 'bea', 'ana']);
  });
  it('arma los mails y el mailto según el estado', () => {
    expect(emailsOf(rows)).toEqual(['cla@x.com', 'bea@x.com', 'ana@x.com']);
    expect(mailKindFor('por_vencer')).toBe('por_vencer');
    expect(mailKindFor('cortada')).toBe('vencida');
    expect(mailKindFor('prueba')).toBe('bienvenida');
    expect(mailTemplate('por_vencer', 'Ana Gómez').body).toContain('Hola Ana,');
    expect(mailTemplate('vencida').subject).toContain('vencido');
    expect(mailTemplate('bienvenida').body).toContain('https://plan-v-eight.vercel.app');
    expect(buildMailto([], 'a', 'b')).toBe('');
    expect(buildMailto(['ana@x.com'], 'Hola mundo', 'Línea 1\nLínea 2')).toBe('mailto:ana@x.com?subject=Hola%20mundo&body=L%C3%ADnea%201%0AL%C3%ADnea%202');
    expect(buildMailto(['a@x.com', 'b@x.com'], 's', 'b')).toBe('mailto:?bcc=a@x.com,b@x.com&subject=s&body=b');
  });
  it('la lista muestra buscador, filtros, orden y las acciones de mail', () => {
    const html = renderToStaticMarkup(<ServicioScreen board={board} onBoard={vi.fn()} today={TODAY} />);
    for (const text of ['id="svc-search"', 'id="svc-state"', 'id="svc-order"', 'Sin cargo', 'Suspendida', 'Por vencer', 'Vencimiento más cercano', 'Último ingreso', 'Copiar mails', 'Escribir mail', 'mailto:?bcc=cla@x.com,bea@x.com,ana@x.com']) expect(html).toContain(text);
  });
});

describe('Pestañas del panel', () => {
  it('muestra las cinco pestañas con la actual seleccionada', () => {
    const html = renderToStaticMarkup(<ServicioScreen board={board} onBoard={vi.fn()} today={TODAY} initialTab="actividad" />);
    for (const text of ['Resumen', 'Altas', 'Cuentas de prueba', 'Actividad', 'Precio y prueba']) expect(html).toContain(text);
    expect(html).toMatch(/id="svc-tab-actividad"[^>]*aria-selected="true"/);
    expect(html).toMatch(/id="svc-tab-resumen"[^>]*aria-selected="false"/);
  });
  it('Altas: formulario con las dos formas de entrar y altas recientes', () => {
    const html = renderToStaticMarkup(<ServicioScreen board={board} onBoard={vi.fn()} today={TODAY} initialTab="altas" />);
    for (const text of ['Alta de nutricionista', 'Nombre', 'Email', 'Enviar invitación por mail', 'Crear con clave', 'Altas recientes', 'Bea Ruiz']) expect(html).toContain(text);
    expect(html).not.toContain('id="alta-password"');
    expect(renderToStaticMarkup(<AltasTab nutritionists={[]} onCreated={vi.fn()} onOpen={vi.fn()} />)).toContain('Todavía no hay altas');
  });
  it('Cuentas de prueba: formulario y lista de las existentes', () => {
    const html = renderToStaticMarkup(<PruebasTab initialAccounts={[{ email: 'f+plan-v-nutri@gmail.com', name: 'Nutri de prueba', role: 'nutritionist' }, { email: 'f+plan-v-paciente@gmail.com', name: 'Paciente de prueba', role: 'patient' }]} />);
    for (const text of ['Tu mail', 'Clave', 'Crear nutricionista y paciente de prueba', 'facundorodriguez42@gmail.com', 'f+plan-v-nutri@gmail.com', 'Paciente de prueba', 'Cuentas de prueba existentes']) expect(html).toContain(text);
    expect(renderToStaticMarkup(<PruebasTab initialAccounts={[]} />)).toContain('Todavía no hay cuentas de prueba');
  });
  it('Actividad: historial completo con filtro por tipo y buscador', () => {
    const events = [...board.events, { id: 'e2', occurred_at: '2026-09-20T10:00:00Z', action: 'service.trial_extended', nutritionist_id: 'bea', metadata: {} }, { id: 'e3', occurred_at: '2026-09-25T10:00:00Z', action: 'service.settings', nutritionist_id: null, metadata: {} }];
    const names = new Map(board.nutritionists.map((n) => [n.id, n.display_name]));
    expect(filterServiceEvents(events, { names }).map((e) => e.id)).toEqual(['e3', 'e2', 'e1']);
    expect(filterServiceEvents(events, { names, type: 'service.payment' }).map((e) => e.id)).toEqual(['e1']);
    expect(filterServiceEvents(events, { names, query: 'bea' }).map((e) => e.id)).toEqual(['e2']);
    expect(filterServiceEvents(events, { names, query: 'general' }).map((e) => e.id)).toEqual(['e3']);
    const html = renderToStaticMarkup(<ActividadTab events={events} names={names} />);
    for (const text of ['Todos los movimientos', 'Prueba extendida', 'Precio o prueba cambiados', '3 movimientos', 'id="act-search"', 'General']) expect(html).toContain(text);
  });
});

describe('Cuentas de prueba y errores', () => {
  it('testAliasEmails arma los alias y rechaza mails inválidos', () => {
    expect(testAliasEmails('facundorodriguez42@gmail.com')).toEqual({ nutritionist: 'facundorodriguez42+plan-v-nutri@gmail.com', patient: 'facundorodriguez42+plan-v-paciente@gmail.com' });
    expect(testAliasEmails('f+viejo@gmail.com')?.nutritionist).toBe('f+plan-v-nutri@gmail.com');
    expect(testAliasEmails('nada')).toBeNull();
  });
  it('traduce los errores de las rutas de gestión', () => {
    expect(adminErrorMessage(new ApiError(409, '{"error":"x"}'))).toBe('Ese mail ya tiene cuenta.');
    expect(adminErrorMessage(new ApiError(422, ''))).toContain('Revisá los datos');
    expect(adminErrorMessage(new ApiError(404, 'Not found'))).toContain('todavía no tiene');
    expect(adminErrorMessage(new ApiError(500, '{"error":"Se rompió"}'))).toBe('Se rompió');
  });
});

describe('Cliente de gestión de cuentas', () => {
  it('usa las rutas y métodos del contrato', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ nutritionist: nutri({ id: 'ana' }), sent: true, accounts: [] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await api.createNutritionist({ name: 'Ana', email: 'a@x.com', mode: 'password', password: '1234567890' });
    await api.sendNutritionistAccess('ana');
    await api.saveNutritionistNote('ana', 'Nota');
    await api.createTestAccounts({ email_base: 'f@gmail.com', password: '1234567890' });
    await api.listTestAccounts();
    const calls = fetchMock.mock.calls as unknown as Array<[string, RequestInit]>;
    expect(calls[0][0]).toMatch(/\/api\/admin\/nutritionists$/); expect(calls[0][1].method).toBe('POST');
    expect(JSON.parse(calls[0][1].body as string)).toEqual({ name: 'Ana', email: 'a@x.com', mode: 'password', password: '1234567890' });
    expect(calls[1][0]).toContain('/api/admin/nutritionists/ana/send-access'); expect(calls[1][1].method).toBe('POST');
    expect(calls[2][0]).toContain('/api/admin/nutritionists/ana/note'); expect(calls[2][1].method).toBe('PUT'); expect(JSON.parse(calls[2][1].body as string)).toEqual({ note: 'Nota' });
    expect(calls[3][0]).toMatch(/\/api\/admin\/test-accounts$/); expect(calls[3][1].method).toBe('POST'); expect(JSON.parse(calls[3][1].body as string)).toEqual({ email_base: 'f@gmail.com', password: '1234567890' });
    expect(calls[4][0]).toMatch(/\/api\/admin\/test-accounts$/); expect(calls[4][1].method).toBeUndefined();
  });
});
