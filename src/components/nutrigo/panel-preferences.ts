export type PanelTheme = 'light' | 'dark' | 'system';
type ReadStorage = { getItem: (key: string) => string | null };
type WriteStorage = { setItem: (key: string, value: string) => void };

export function panelTheme(value: unknown): PanelTheme | null {
  return value === 'light' || value === 'dark' || value === 'system' ? value : null;
}
export const panelStorageKey = (userId: string | null) => `plan-v:panel-theme:${userId ?? 'demo'}`;
export function readPanelPreference(storage: ReadStorage | null, userId: string | null): PanelTheme {
  try { return panelTheme(storage?.getItem(panelStorageKey(userId))) ?? 'system'; }
  catch { return 'system'; }
}
export function writePanelPreference(storage: WriteStorage | null, userId: string | null, theme: PanelTheme) {
  try { storage?.setItem(panelStorageKey(userId), theme); } catch { /* La elección sigue activa en esta visita. */ }
}
export function resolvedPanelTheme(preference: PanelTheme, systemDark: boolean): 'light' | 'dark' {
  return preference === 'system' ? systemDark ? 'dark' : 'light' : preference;
}
export function panelStorage(): Storage | null {
  try { return typeof window === 'undefined' ? null : window.localStorage; } catch { return null; }
}
