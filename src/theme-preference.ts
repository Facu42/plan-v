export type ThemePreference = 'light' | 'dark';

type ThemeStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

const THEME_KEY = 'plan-v:theme';

export function readThemePreference(storage: ThemeStorage | null, systemDark: boolean): ThemePreference {
  try {
    const stored = storage?.getItem(THEME_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    // La preferencia del sistema mantiene el tema utilizable sin storage.
  }
  return systemDark ? 'dark' : 'light';
}

export function writeThemePreference(storage: ThemeStorage | null, theme: ThemePreference): void {
  try {
    storage?.setItem(THEME_KEY, theme);
  } catch {
    // El tema continúa activo durante la visita aunque storage esté bloqueado.
  }
}
