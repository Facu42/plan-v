import { describe, expect, it } from 'vitest';
import { SERVICE_PAY_ACTION, serviceNoticeText } from './service-notice';
import type { OwnService } from '../../types/service';

const base: OwnService = { state: 'prueba', until: '2026-10-30', days_left: 5, monthly_price: 20000, read_only: false };

describe('aviso del servicio para la nutricionista', () => {
  it('no avisa nada con el servicio activo o sin cargo', () => {
    expect(serviceNoticeText({ ...base, state: 'activa', days_left: 40 })).toBeNull();
    expect(serviceNoticeText({ ...base, state: 'sin_cargo', until: null, days_left: null })).toBeNull();
    expect(serviceNoticeText(null)).toBeNull();
  });

  it('día 0: avisa los 30 días que le quedan y el botón para pagar', () => {
    const notice = serviceNoticeText({ ...base, days_left: 30 });
    expect(notice).toMatchObject({ tone: 'info', title: 'Te quedan 30 días para regularizar', action: SERVICE_PAY_ACTION });
    expect(notice?.body).toMatch(/termina el 30\/10\/2026 \(faltan 30 días\)/);
    expect(notice?.body).not.toContain('solo lectura');
  });

  it('día 29: avisa que queda 1 día y el botón para pagar', () => {
    const notice = serviceNoticeText({ ...base, days_left: 1 });
    expect(notice).toMatchObject({ tone: 'warning', title: 'Te queda 1 día para regularizar', action: SERVICE_PAY_ACTION });
    expect(notice?.body).toMatch(/faltan 1 día|falta 1 día/);
  });

  it('día 31: el aviso de vencido trae el botón para pagar, sin borrar datos', () => {
    const notice = serviceNoticeText({ ...base, state: 'vencida', days_left: -1 });
    expect(notice).toMatchObject({ tone: 'warning', title: 'Servicio vencido', action: SERVICE_PAY_ACTION });
    expect(notice?.body).toContain('venció el 30/10/2026. Coordiná el pago con Nutridash.');
    expect(notice?.body).not.toContain('solo lectura');
  });

  it('avisa la prueba por terminar con fecha, días, precio y el botón para pagar', () => {
    expect(serviceNoticeText(base)).toEqual({
      tone: 'warning',
      title: 'Te quedan 5 días para regularizar',
      body: expect.stringMatching(/termina el 30\/10\/2026 \(faltan 5 días\)\. Podés seguir trabajando\. Coordiná el pago con Nutridash\. El servicio cuesta \$\s?20\.000 por mes\./),
      action: SERVICE_PAY_ACTION,
    });
  });

  it('vencida, aunque pasen días, avisa y deja pagar: no habla de solo lectura', () => {
    for (const [state, days_left] of [['vencida', -2], ['cortada', -30]] as const) {
      const notice = serviceNoticeText({ ...base, state, days_left });
      expect(notice).toMatchObject({ tone: 'warning', title: 'Servicio vencido', action: SERVICE_PAY_ACTION });
      expect(notice?.body).toContain('venció el 30/10/2026. Coordiná el pago con Nutridash.');
      expect(notice?.body).not.toContain('solo lectura');
    }
  });

  it('solo la suspensión del administrador explica el solo lectura', () => {
    expect(serviceNoticeText({ ...base, state: 'suspendida', until: null, read_only: true })).toMatchObject({ tone: 'blocked', title: 'Cuenta en solo lectura' });
  });

  it('sin precio cargado no inventa un monto', () => {
    expect(serviceNoticeText({ ...base, monthly_price: null })?.body).not.toContain('$');
  });
});
