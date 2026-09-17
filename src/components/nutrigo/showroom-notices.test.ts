import { describe, expect, it } from 'vitest';
import { readNoticePrefs, writeNoticePrefs, noticeFiredKey, markNoticeFired, wasNoticeFired } from './showroom-notices';

describe('Preferencias de avisos demo', () => {
  it('guarda teléfono del navegador y buzón demo por separado', () => {
    const store: Record<string, string> = {};
    const storage = { getItem: (key: string) => store[key] ?? null, setItem: (key: string, value: string) => { store[key] = value; } };
    expect(readNoticePrefs(storage, 'patient')).toEqual({ browser: false, email: false });
    writeNoticePrefs(storage, 'patient', { browser: true, email: true });
    expect(readNoticePrefs(storage, 'patient')).toEqual({ browser: true, email: true });
    expect(readNoticePrefs(storage, 'pro')).toEqual({ browser: false, email: false });
  });

  it('marca un aviso disparado para no repetirlo en el mismo dispositivo', () => {
    const store: Record<string, string> = {};
    const storage = { getItem: (key: string) => store[key] ?? null, setItem: (key: string, value: string) => { store[key] = value; } };
    expect(wasNoticeFired(storage, 'agua')).toBe(false);
    markNoticeFired(storage, 'agua');
    expect(wasNoticeFired(storage, 'agua')).toBe(true);
    expect(store[noticeFiredKey('agua')]).toBe('1');
  });
});
