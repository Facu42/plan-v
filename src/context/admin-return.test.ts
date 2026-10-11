import { describe, expect, it } from 'vitest';
import { ADMIN_RETURN_KEY, rememberAdminReturn, takeAdminReturn } from './admin-return';

const memory = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) }; };

describe('volver a /admin después de entrar con Google', () => {
  it('guarda la marca sólo desde /admin y la consume al volver a la raíz', () => {
    const store = memory();
    rememberAdminReturn(store, '/app');
    expect(store.getItem(ADMIN_RETURN_KEY)).toBeNull();
    rememberAdminReturn(store, '/admin');
    expect(takeAdminReturn(store, '/')).toBe(true);
    expect(takeAdminReturn(store, '/')).toBe(false);
  });
  it('ignora marcas viejas o fuera de la raíz', () => {
    const store = memory();
    rememberAdminReturn(store, '/admin', new Date('2026-09-30T10:00:00Z'));
    expect(takeAdminReturn(store, '/', new Date('2026-09-30T11:00:00Z'))).toBe(false);
    rememberAdminReturn(store, '/admin');
    expect(takeAdminReturn(store, '/app')).toBe(false);
  });
});
