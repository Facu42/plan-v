import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ServiceBoard, ServiceNutritionist } from '../../types/service';
import { api } from '../../api/client';
import { serviceTotals } from '../../service';
import { buildServiceRows, daysLeftText, replaceNutritionist, serviceEventLabel } from './servicio-utils';
import { NutritionistPanel, ServicioScreen } from './ShowroomServicio';
import { isAllowedPage, resolveAppLocation } from './app-location';
import { PRO_MORE, PRO_SURFACES, proMore, proSurfaces } from './showroom-nav';
import { PAGE_LABELS } from './ShowroomPanels';

const TODAY = '2026-09-30';
const nutri = (over: Partial<ServiceNutritionist> & { id: string }): ServiceNutritionist => ({
  display_name: 'Nutri', email: 'n@x.com', created_at: '2026-08-01T10:00:00Z', last_sign_in_at: '2026-09-28T10:00:00Z', patients_active: 4, patients_total: 5,
  subscription: { trial_ends_on: '2026-09-15', paid_until: null, override: 'none', note: '' }, payments: [], ...over,
});
const payment = { id: 'p1', amount: 20000, months: 1, paid_on: '2026-09-12', method: 'transferencia' as const, note: 'Septiembre', status: 'confirmed' as const, created_at: '2026-09-12T10:00:00Z' };
const board: ServiceBoard = {
  settings: { monthly_price: 20000, trial_days: 30 },
  nutritionists: [
    nutri({ id: 'ana', display_name: 'Ana Gómez', email: 'ana@x.com', subscription: { trial_ends_on: '2026-09-01', paid_until: '2026-10-12', override: 'none', note: '' }, payments: [payment, { ...payment, id: 'p0', status: 'voided', amount: 999 }] }),
    nutri({ id: 'bea', display_name: 'Bea Ruiz', email: 'bea@x.com', subscription: { trial_ends_on: '2026-10-10', paid_until: null, override: 'none', note: '' } }),
    nutri({ id: 'cla', display_name: 'Clara Paz', email: 'cla@x.com', last_sign_in_at: null, patients_active: 1 }),
  ],
  events: [{ id: 'e1', occurred_at: '2026-09-12T10:00:00Z', action: 'service.payment', nutritionist_id: 'ana', metadata: {} }],
};

afterEach(() => vi.unstubAllGlobals());

describe('Panel del servicio: helpers', () => {
  it('ordena lo que hay que atender primero y calcula los totales', () => {
    expect(buildServiceRows(board, TODAY).map((row) => row.nutritionist.id)).toEqual(['cla', 'bea', 'ana']);
    expect(serviceTotals(board.nutritionists, TODAY)).toMatchObject({ activas: 1, prueba: 1, vencidas: 1, cobrado_mes: 20000 });
    expect(daysLeftText({ state: 'prueba', until: '2026-10-10', days_left: 10 })).toBe('Faltan 10 días');
    expect(daysLeftText({ state: 'vencida', until: '2026-09-29', days_left: -1 })).toBe('Venció hace 1 día');
    expect(serviceEventLabel('service.payment_voided')).toBe('Pago anulado');
    expect(serviceEventLabel('service.org_status')).toBe('Estado de consultorio');
    expect(replaceNutritionist(board, nutri({ id: 'bea', display_name: 'Bea R.' })).nutritionists[1].display_name).toBe('Bea R.');
  });
});

describe('Pantalla Panel del servicio', () => {
  it('muestra totales, lista, precio y actividad', () => {
    const html = renderToStaticMarkup(<ServicioScreen board={board} onBoard={vi.fn()} today={TODAY} />);
    for (const text of ['Panel del servicio', 'no hay datos de salud', 'Activas', 'En prueba', 'Vencidas', 'Cobrado este mes', 'Ana Gómez', 'ana@x.com', 'Sin pagar', 'En prueba', 'Hasta 12/10/2026', 'Faltan 12 días', '4 pacientes activas', 'Último ingreso: nunca', 'Actividad reciente', 'Buscar', 'role="tablist"', 'Pago registrado', 'Elegí una nutricionista']) expect(html).toContain(text);
    expect(html.indexOf('Clara Paz')).toBeLessThan(html.indexOf('Ana Gómez'));
  });
  it('muestra "Sin definir" cuando no hay precio', () => {
    const html = renderToStaticMarkup(<ServicioScreen initialTab="precio" board={{ ...board, settings: { monthly_price: null, trial_days: 30 } }} onBoard={vi.fn()} today={TODAY} />);
    expect(html).toContain('placeholder="Sin definir"');
  });
  it('la pestaña Precio y prueba tiene el precio y los días', () => {
    const html = renderToStaticMarkup(<ServicioScreen initialTab="precio" board={board} onBoard={vi.fn()} today={TODAY} />);
    for (const text of ['Precio mensual', 'Días de prueba', 'Guardar']) expect(html).toContain(text);
    expect(html).toContain('value="20000"');
    expect(html).not.toContain('Cobrado este mes');
  });
  it('el detalle ofrece pago con el precio cargado, prueba, excepciones e historial', () => {
    const html = renderToStaticMarkup(<ServicioScreen board={board} onBoard={vi.fn()} today={TODAY} initialSelectedId="ana" />);
    expect(html).toContain('Servicio de Ana Gómez');
    for (const text of ['Reenviar acceso', 'Escribir mail', 'Nota interna', 'Guardar nota', 'mailto:ana@x.com', 'Registrar pago', 'Meses que cubre', 'Extender prueba', 'Sin cargo', 'Suspender', 'Historial de pagos', 'Septiembre', 'Anular', 'Anulado']) expect(html).toContain(text);
    expect(html).not.toContain('Quitar excepción');
    expect(html).toMatch(/id="svc-pay-amount"[^>]*value="20000"/);
    expect(html).toMatch(/id="svc-trial-days"[^>]*value="15"/);
  });
  it('con una excepción ofrece quitarla', () => {
    const waived = nutri({ id: 'w', subscription: { trial_ends_on: '2026-09-01', paid_until: null, override: 'waived', note: '' } });
    const html = renderToStaticMarkup(<NutritionistPanel nutritionist={waived} monthlyPrice={null} today={TODAY} onChange={vi.fn()} onBack={vi.fn()} />);
    expect(html).toContain('Quitar excepción');
    expect(html).toContain('Suspender');
  });
});

describe('Cliente del Panel del servicio', () => {
  const stub = () => { const fetchMock = vi.fn(async () => new Response(JSON.stringify({ nutritionist: nutri({ id: 'ana' }), admin: true }), { status: 200 })); vi.stubGlobal('fetch', fetchMock); return fetchMock; };
  it('registra un pago con POST y el cuerpo esperado', async () => {
    const fetchMock = stub();
    const input = { amount: 20000, months: 1, paid_on: TODAY, method: 'efectivo' as const, note: 'Hola' };
    const result = await api.addServicePayment('ana', input);
    expect(result.nutritionist.id).toBe('ana');
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain('/api/admin/nutritionists/ana/payments');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual(input);
  });
  it('pide ser administrador en demo sólo con audience admin', async () => {
    const fetchMock = stub();
    await api.getAdminMe();
    await api.getAdminMe('admin');
    expect((fetchMock.mock.calls[0] as unknown as [string])[0]).toMatch(/\/api\/admin\/me$/);
    expect((fetchMock.mock.calls[1] as unknown as [string])[0]).toContain('/api/admin/me?audience=admin');
  });
  it('anula, extiende y cambia la excepción', async () => {
    const fetchMock = stub();
    await api.voidServicePayment('p1'); await api.extendServiceTrial('ana', 15); await api.setServiceOverride('ana', 'waived', 'amiga');
    const calls = fetchMock.mock.calls as unknown as Array<[string, RequestInit]>;
    expect(calls[0][0]).toContain('/api/admin/service-payments/p1'); expect(calls[0][1].method).toBe('DELETE');
    expect(JSON.parse(calls[1][1].body as string)).toEqual({ days: 15 });
    expect(calls[2][1].method).toBe('PUT'); expect(JSON.parse(calls[2][1].body as string)).toEqual({ override: 'waived', note: 'amiga' });
  });
});

describe('Navegación del Panel del servicio', () => {
  it('oculta la entrada del menú si no es administrador y la suma si lo es', () => {
    expect(proSurfaces(false)).toBe(PRO_SURFACES);
    expect(proMore(false)).toBe(PRO_MORE);
    expect(proSurfaces(false).some((tab) => tab.id === 'servicio')).toBe(false);
    expect(proSurfaces(true)[PRO_SURFACES.length]).toMatchObject({ id: 'servicio', label: 'Panel del servicio', icon: 'wallet' });
    expect(proMore(true).some((tab) => tab.id === 'servicio')).toBe(true);
  });
  it('la ruta existe sólo para el nutricionista y /admin la abre', () => {
    expect(isAllowedPage('pro', 'servicio')).toBe(true);
    expect(isAllowedPage('patient', 'servicio')).toBe(false);
    expect(PAGE_LABELS.servicio).toBe('Panel del servicio');
    expect(resolveAppLocation({ pathname: '/admin' })).toMatchObject({ role: 'pro', page: 'servicio', path: '/crm/servicio' });
    expect(resolveAppLocation({ pathname: '/admin', lockedRole: 'patient' })).toMatchObject({ role: 'patient', page: 'inicio' });
    expect(resolveAppLocation({ pathname: '/app/servicio' }).page).toBe('inicio');
  });
});
