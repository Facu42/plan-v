import { describe, expect, it } from 'vitest';
import { OAUTH_RETURN_KEY, rememberReturnPath, safeInternalPath, sameOriginUrl, takeReturnPath } from './oauth-return';

const memory = () => {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
};

describe('vuelta segura después de Google', () => {
  it('acepta un camino interno y arma la dirección con el origen de esta pestaña', () => {
    expect(safeInternalPath('/admin')).toBe('/admin');
    expect(safeInternalPath('/crm/inicio')).toBe('/crm/inicio');
    const back = sameOriginUrl('https://app.ejemplo.test', '/admin');
    expect(back).toBe('https://app.ejemplo.test/admin');
    expect(new URL(back!).origin).toBe('https://app.ejemplo.test');
  });

  it('rechaza un destino ajeno, un protocolo o una barra doble', () => {
    for (const bad of [
      'https://evil.test/admin',
      'http://evil.test',
      '//evil.test',
      '//evil.test/admin',
      '/\\evil.test',
      '\\evil.test',
      'javascript:alert(1)',
      'javascript:alert(1)//',
      '/admin\\@evil.test',
      '/%2f%2fevil.test',
      '/%5c%5cevil.test',
      '/admin\n',
      'https://nutridash.ar/admin',
    ]) {
      expect(safeInternalPath(bad)).toBeNull();
    }
    expect(sameOriginUrl('https://app.ejemplo.test', '//evil.test')).toBe('https://app.ejemplo.test');
    expect(sameOriginUrl('https://app.ejemplo.test', 'https://evil.test/admin')).toBe('https://app.ejemplo.test');
    expect(sameOriginUrl('https://app.ejemplo.test', '/')).toBe('https://app.ejemplo.test');
    expect(sameOriginUrl('javascript:alert(1)', '/admin')).toBeUndefined();
  });

  it('guarda el camino, lo devuelve una sola vez al caer en la raíz y no pisa otra pantalla', () => {
    const store = memory();
    rememberReturnPath(store, '/admin');
    expect(store.getItem(OAUTH_RETURN_KEY)).toBe('/admin');
    expect(takeReturnPath(store, '/')).toBe('/admin');
    expect(takeReturnPath(store, '/')).toBeNull();

    rememberReturnPath(store, '/crm/pacientes');
    expect(takeReturnPath(store, '/admin')).toBeNull();
    expect(store.getItem(OAUTH_RETURN_KEY)).toBeNull();
  });

  it('no guarda la raíz ni un camino manipulado', () => {
    const store = memory();
    rememberReturnPath(store, '/');
    expect(store.getItem(OAUTH_RETURN_KEY)).toBeNull();
    store.setItem(OAUTH_RETURN_KEY, 'https://evil.test');
    expect(takeReturnPath(store, '/')).toBeNull();
    store.setItem(OAUTH_RETURN_KEY, '//evil.test');
    expect(takeReturnPath(store, '/')).toBeNull();
  });
});
