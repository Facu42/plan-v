import { describe, expect, it } from 'vitest';
import { filaTelefonoNutri } from './AvisosTelefonoNutri';

describe('filaTelefonoNutri', () => {
  it('no aparece si el navegador no soporta avisos', () => expect(filaTelefonoNutri('unsupported', false)).toBeNull());
  it('explica cómo desbloquear si están bloqueados', () => expect(filaTelefonoNutri('blocked', false)?.detalle).toMatch(/Permitilos/));
  it('avisa del fallo para probar de nuevo', () => expect(filaTelefonoNutri('off', true)?.nombre).toMatch(/No pudimos/));
  it('muestra qué avisos recibe la nutri', () => expect(filaTelefonoNutri('on', false)?.detalle).toMatch(/te escribe/));
});
