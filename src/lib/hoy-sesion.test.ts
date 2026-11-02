import { describe, expect, it, vi } from 'vitest';
import { borradorHoy, guardarIntencion, leerIntencion } from './hoy-sesion';
import type { ItemHoy } from './hoy-accion';

const item: ItemHoy = {
  patientId: 'p1', nombre: 'Ana', action: 'mensaje', titulo: 'Mandarle un mensaje',
  cuerpo: 'Hay 1 foto sin revisar.', borrador: 'Hola, ¿las vemos hoy?', sourceKey: 'fotos:1:a', href: '/crm/ficha?paciente=p1&accion=mensaje',
};

describe('intención de Hoy', () => {
  it('guarda el borrador en el navegador y no arma un envío', () => {
    const caja = new Map<string, string>();
    vi.stubGlobal('sessionStorage', {
      setItem: (clave: string, valor: string) => caja.set(clave, valor),
      getItem: (clave: string) => caja.get(clave) ?? null,
    });
    guardarIntencion(item);
    expect(leerIntencion()).toMatchObject({ patientId: 'p1', action: 'mensaje', sourceKey: 'fotos:1:a' });
    expect(borradorHoy('p1')).toBe('Hola, ¿las vemos hoy?');
    expect(borradorHoy('otra')).toBeNull();
    expect([...caja.values()].join('')).not.toContain('send');
    vi.unstubAllGlobals();
  });
});
