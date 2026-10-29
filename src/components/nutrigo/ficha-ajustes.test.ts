import { describe, expect, it } from 'vitest';
import { AVISOS_AUTOMATICOS, INTEGRACIONES, avisoConfigurado, datosDeMarca, estadoDosPasos, fusionarMarca, separarContacto, textoDeEjemplo, validarImagen } from './ficha-ajustes';

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

describe('Marca del consultorio y avisos guardados', () => {
  it('muestra los campos propios y cae al contacto de siempre si faltan', () => {
    const vacia = datosDeMarca(null);
    expect(vacia.matricula).toBe('Sin completar'); expect(vacia.firma).toBe('');
    const marca = { name: 'Consultorio Trenti', contact: '11 5823-4410', logo: '', license: 'MN 4521', email: 'vero@x.com' };
    const d = datosDeMarca(marca);
    expect(d.matricula).toBe('MN 4521'); expect(d.mail).toBe('vero@x.com'); expect(d.telefono).toBe('11 5823-4410');
  });
  it('fusiona los cambios sin perder el resto y mantiene el contacto para los PDF', () => {
    const base = { name: 'A', contact: 'viejo', logo: 'data:image/png;base64,AAAA', license: 'MN 1' };
    const nueva = fusionarMarca(base, { phone: ' 11 1111 ', email: 'a@b.com' });
    expect(nueva).toMatchObject({ name: 'A', license: 'MN 1', phone: '11 1111', email: 'a@b.com', contact: '11 1111 · a@b.com', logo: base.logo });
    expect(fusionarMarca(base, { degree: 'Lic.' }).contact).toBe('viejo');
    expect(fusionarMarca(null, { name: ' B ' }).name).toBe('B');
  });
  it('acepta sólo PNG o JPG de hasta 500 KB', () => {
    expect(validarImagen({ type: 'image/png', size: 1000 })).toBeNull();
    expect(validarImagen({ type: 'image/gif', size: 1000 })).toContain('PNG o JPG');
    expect(validarImagen({ type: 'image/jpeg', size: 600 * 1024 })).toContain('500 KB');
  });
  it('un aviso sin tocar está apagado y con el texto sugerido', () => {
    const sug = { cuando: 'Ese día', texto: 'Hola' };
    expect(avisoConfigurado('cumple', [], sug)).toEqual({ enabled: false, cuando: 'Ese día', texto: 'Hola', personalizado: false });
    const g = [{ key: 'cumple' as const, enabled: true, when_text: null, message: 'Chau', updated_at: '' }];
    expect(avisoConfigurado('cumple', g, sug)).toMatchObject({ enabled: true, cuando: 'Ese día', texto: 'Chau', personalizado: true });
  });
});
