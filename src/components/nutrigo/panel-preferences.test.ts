import { describe, expect, it } from 'vitest';
import { panelTheme, readPanelPreference, writePanelPreference, resolvedPanelTheme, panelStorageKey } from './panel-preferences';

describe('preferencias del panel profesional', () => {
  it('valida lo guardado en el perfil sin aceptar valores arbitrarios', () => {
    expect(panelTheme('system')).toBe('system');
    expect(panelTheme('dark')).toBe('dark');
    expect(panelTheme({ theme: 'dark' })).toBeNull();
    expect(panelTheme('sepia')).toBeNull();
  });
  it('sigue al sistema y permite elegir un tema explícito', () => {
    expect(resolvedPanelTheme('system', true)).toBe('dark');
    expect(resolvedPanelTheme('system', false)).toBe('light');
    expect(resolvedPanelTheme('light', true)).toBe('light');
    expect(resolvedPanelTheme('dark', false)).toBe('dark');
  });
  it('aísla la preferencia por cuenta y no cambia el tema de la paciente', () => {
    const data = new Map<string, string>([['plan-v:theme', 'dark']]);
    const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
    writePanelPreference(storage, 'profesional-a', 'light');
    expect(readPanelPreference(storage, 'profesional-a')).toBe('light');
    expect(readPanelPreference(storage, 'profesional-b')).toBe('system');
    expect(data.get('plan-v:theme')).toBe('dark');
    expect(panelStorageKey('profesional-a')).not.toBe(panelStorageKey(null));
  });
  it('sigue funcionando con el almacenamiento bloqueado o corrupto', () => {
    const blocked = { getItem: () => { throw Error('blocked'); }, setItem: () => { throw Error('blocked'); } };
    expect(readPanelPreference(blocked, null)).toBe('system');
    expect(() => writePanelPreference(blocked, null, 'dark')).not.toThrow();
    expect(readPanelPreference({ getItem: () => 'invalid' }, null)).toBe('system');
  });
});
