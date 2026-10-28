import { describe, expect, it } from 'vitest';
import { AVISOS_AUTOMATICOS, INTEGRACIONES, estadoDosPasos, separarContacto, textoDeEjemplo } from './ficha-ajustes';

describe('ficha-ajustes', () => {
  it('manda el contacto a Mail si trae arroba y a Teléfono si no', () => {
    expect(separarContacto('vero@correo.com')).toEqual({ mail: 'vero@correo.com', telefono: 'Sin completar' });
    expect(separarContacto(' 11 5823-4410 ')).toEqual({ mail: 'Sin completar', telefono: '11 5823-4410' });
    expect(separarContacto('')).toEqual({ mail: 'Sin completar', telefono: 'Sin completar' });
    expect(separarContacto(undefined).telefono).toBe('Sin completar');
  });
  it('traduce el estado de los dos pasos sin afirmar de más', () => {
    expect(estadoDosPasos('Activa')).toMatchObject({ clase: 'p-conf', activa: true });
    expect(estadoDosPasos('Apagada')).toMatchObject({ clase: 'p-wait', activa: false });
    expect(estadoDosPasos('Consultando…').texto).toBe('Consultando');
    expect(estadoDosPasos('No disponible en modo demo')).toMatchObject({ texto: 'Sin información', activa: false });
  });
  it('completa el texto sugerido con datos de ejemplo y deja las variables desconocidas', () => {
    expect(textoDeEjemplo('Hola {nombre}, a las {hora} el {fecha} {otra}')).toBe('Hola Sofía, a las 10:30 el 4/11 otra');
  });
  it('conserva los ocho avisos y las cuatro integraciones del boceto', () => {
    expect(AVISOS_AUTOMATICOS).toHaveLength(8);
    expect(INTEGRACIONES.map(x => x.clave)).toEqual(['google', 'mercadopago', 'brevo', 'balanzas']);
  });
});
