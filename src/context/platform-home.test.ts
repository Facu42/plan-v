import { describe, expect, it } from 'vitest';
import { adminStillRequiresCode, homeScreen, readPlatformAdminFlag, showAdminAccess, shouldRedirectToAdmin } from './platform-home';

describe('a dónde va cada cuenta después de entrar', () => {
  it('manda al admin de plataforma a /admin', () => {
    const input = { pathname: '/', platformAdmin: true, role: 'paciente' as const, linkedPatient: false };
    expect(shouldRedirectToAdmin(input)).toBe(true);
    expect(homeScreen(input)).toBe('admin');
    expect(showAdminAccess(input)).toBe(false);
  });

  it('deja a la paciente sin ficha en la pantalla de cuenta sin vincular', () => {
    const input = { pathname: '/', platformAdmin: false, role: 'paciente' as const, linkedPatient: false };
    expect(shouldRedirectToAdmin(input)).toBe(false);
    expect(homeScreen(input)).toBe('unlinked');
  });

  it('deja a la nutri en su panel', () => {
    const input = { pathname: '/', platformAdmin: false, role: 'nutri' as const, linkedPatient: false };
    expect(shouldRedirectToAdmin(input)).toBe(false);
    expect(homeScreen(input)).toBe('panel');
    expect(showAdminAccess(input)).toBe(false);
  });

  it('si es admin y también nutri, se queda en el panel y ve el acceso', () => {
    const input = { pathname: '/', platformAdmin: true, role: 'nutri' as const, linkedPatient: false };
    expect(shouldRedirectToAdmin(input)).toBe(false);
    expect(homeScreen(input)).toBe('panel');
    expect(showAdminAccess(input)).toBe(true);
  });

  it('no redirige de nuevo si ya está en /admin, y esa ruta sigue pidiendo el código', () => {
    const input = { pathname: '/admin', platformAdmin: true, role: 'paciente' as const, linkedPatient: false };
    expect(shouldRedirectToAdmin(input)).toBe(false);
    expect(homeScreen(input)).toBe('admin');
    expect(adminStillRequiresCode('/admin')).toBe(true);
    expect(adminStillRequiresCode('/')).toBe(false);
  });

  it('solo cree el sí explícito de la base', async () => {
    expect(await readPlatformAdminFlag(async () => ({ data: true, error: null }))).toBe(true);
    expect(await readPlatformAdminFlag(async () => ({ data: false, error: null }))).toBe(false);
    expect(await readPlatformAdminFlag(async () => ({ data: null, error: { message: 'no' } }))).toBe(false);
    expect(await readPlatformAdminFlag(async () => { throw new Error('red'); })).toBe(false);
  });
});
