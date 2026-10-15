import { describe, expect, it } from 'vitest';
import { serviceNoticeText } from './service-notice';
import type { OwnService } from '../../types/service';

const base: OwnService = { state: 'prueba', until: '2026-10-30', days_left: 5, monthly_price: 20000, read_only: false };

describe('aviso del servicio para la nutricionista', () => {
  it('no avisa nada con la prueba lejos, activa o sin cargo', () => {
    expect(serviceNoticeText({ ...base, days_left: 20 })).toBeNull();
    expect(serviceNoticeText({ ...base, state: 'activa', days_left: 40 })).toBeNull();
    expect(serviceNoticeText({ ...base, state: 'sin_cargo', until: null, days_left: null })).toBeNull();
    expect(serviceNoticeText(null)).toBeNull();
  });
  it('avisa la prueba por terminar con fecha, días y precio', () => {
    expect(serviceNoticeText(base)).toEqual({ tone: 'info', title: 'Tu prueba termina pronto', body: expect.stringMatching(/termina el 30\/10\/2026 \(faltan 5 días\)\. Coordiná el pago con Plan V\. El servicio cuesta \$\s?20\.000 por mes\./) });
  });
  it('vencida avisa cuándo pasa a solo lectura', () => {
    expect(serviceNoticeText({ ...base, state: 'vencida', days_left: -2 })?.body).toContain('antes del 06/11/2026');
  });
  it('cortada y suspendida explican el solo lectura', () => {
    expect(serviceNoticeText({ ...base, state: 'cortada', days_left: -9, read_only: true })).toMatchObject({ tone: 'blocked', title: 'Cuenta en solo lectura' });
    expect(serviceNoticeText({ ...base, state: 'suspendida', until: null, read_only: true })?.body).toContain('suspendida');
  });
  it('sin precio cargado no inventa un monto', () => {
    expect(serviceNoticeText({ ...base, monthly_price: null })?.body).not.toContain('$');
  });
});
