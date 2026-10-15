import { describe, expect, it } from 'vitest';
import { readThemePreference, writeThemePreference } from './theme-preference';

describe('theme preference', () => {
  it('restores a stored dark theme', () => {
    const storage = { getItem: () => 'dark', setItem: () => undefined };
    expect(readThemePreference(storage, false)).toBe('dark');
  });

  it('falls back to the system preference when storage is empty', () => {
    const storage = { getItem: () => null, setItem: () => undefined };
    expect(readThemePreference(storage, true)).toBe('dark');
    expect(readThemePreference(storage, false)).toBe('light');
  });

  it('survives unavailable storage and persists the selected theme', () => {
    const calls: Array<[string, string]> = [];
    const storage = {
      getItem: () => { throw new Error('blocked'); },
      setItem: (key: string, value: string) => { calls.push([key, value]); },
    };

    expect(readThemePreference(storage, true)).toBe('dark');
    writeThemePreference(storage, 'light');
    expect(calls).toEqual([['plan-v:theme', 'light']]);
  });
});
