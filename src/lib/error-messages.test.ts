import { describe, expect, it } from 'vitest';
import { friendlyError } from './error-messages';

describe('mensajes de error para personas', () => {
  it('traduce los errores de ingreso de Supabase', () => {
    expect(friendlyError('Invalid login credentials')).toBe('El mail o la contraseña no coinciden.');
    expect(friendlyError('Email not confirmed')).toBe('Todavía no confirmaste tu mail. Revisá tu bandeja de entrada.');
    expect(friendlyError('User already registered')).toBe('Ya existe una cuenta con ese mail.');
    expect(friendlyError('Password should be at least 6 characters.')).toBe('La contraseña es muy corta.');
    expect(friendlyError('For security purposes, you can only request this after 21 seconds.')).toBe('Por seguridad, esperá unos segundos antes de volver a intentar.');
    expect(friendlyError('New password should be different from the old password.')).toBe('La contraseña nueva tiene que ser distinta de la anterior.');
  });

  it('traduce los cortes de red y los errores del servidor', () => {
    for (const raw of ['Failed to fetch', 'Load failed', 'NetworkError when attempting to fetch resource.']) {
      expect(friendlyError(raw)).toBe('No pudimos conectarnos. Revisá tu conexión e intentá de nuevo.');
    }
    expect(friendlyError('HTTP 500')).toBe('Algo falló de nuestro lado. Probá de nuevo en un rato.');
    expect(friendlyError('HTTP 429')).toBe('Hiciste muchos intentos seguidos. Esperá un momento y probá de nuevo.');
  });

  it('abre los mensajes que vienen como JSON y conserva los que ya están en español', () => {
    expect(friendlyError('{"error":"Datos inválidos"}')).toBe('Datos inválidos');
    expect(friendlyError('{"error":"Invalid login credentials"}')).toBe('El mail o la contraseña no coinciden.');
    expect(friendlyError('No se pudo guardar. Reintentá.')).toBe('No se pudo guardar. Reintentá.');
  });

  it('no muestra textos en inglés desconocidos ni objetos', () => {
    expect(friendlyError('Something unexpected happened, please retry')).toBe('No se pudo completar la acción. Probá de nuevo.');
    expect(friendlyError(new Error('Request failed with status code 502'))).toBe('No se pudo completar la acción. Probá de nuevo.');
    expect(friendlyError(undefined)).toBe('No se pudo completar la acción. Probá de nuevo.');
    expect(friendlyError('')).toBe('No se pudo completar la acción. Probá de nuevo.');
  });
});
