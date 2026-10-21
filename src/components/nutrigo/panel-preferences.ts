export type PanelTheme = 'light' | 'dark' | 'system';
type ReadStorage = { getItem: (key: string) => string | null };
type WriteStorage = { setItem: (key: string, value: string) => void };

export function panelTheme(value: unknown): PanelTheme | null {
  return value === 'light' || value === 'dark' || value === 'system' ? value : null;
}
// v2 (20/10): el panel arranca en oscuro. La clave vieja guardaba «como el sistema» aunque nadie lo eligiera;
// las elecciones reales con sesión siguen en el perfil de la cuenta.
export const panelStorageKey = (userId: string | null) => `plan-v:panel-theme-v2:${userId ?? 'demo'}`;
export const PANEL_DEFAULT_THEME: PanelTheme = 'dark';
export function readPanelPreference(storage: ReadStorage | null, userId: string | null): PanelTheme {
  try { return panelTheme(storage?.getItem(panelStorageKey(userId))) ?? PANEL_DEFAULT_THEME; }
  catch { return PANEL_DEFAULT_THEME; }
}
export function writePanelPreference(storage: WriteStorage | null, userId: string | null, theme: PanelTheme) {
  try { storage?.setItem(panelStorageKey(userId), theme); } catch { /* La elección sigue activa en esta visita. */ }
}
export function markPanelSyncPending(storage: WriteStorage | null, userId: string | null, pending: boolean) {
  try { storage?.setItem(`${panelStorageKey(userId)}:pending`, String(pending)); } catch { /* Sin storage, permanece en memoria. */ }
}
export function effectivePanelPreference(storage: ReadStorage | null, userId: string | null, profile: unknown): PanelTheme {
  try {
    if (storage?.getItem(`${panelStorageKey(userId)}:pending`) === 'true') return readPanelPreference(storage, userId);
  } catch { /* El perfil sigue disponible aunque storage esté bloqueado. */ }
  return panelTheme(profile) ?? readPanelPreference(storage, userId);
}
export function resolvedPanelTheme(preference: PanelTheme, systemDark: boolean): 'light' | 'dark' {
  return preference === 'system' ? systemDark ? 'dark' : 'light' : preference;
}
export function panelStorage(): Storage | null {
  try { return typeof window === 'undefined' ? null : window.localStorage; } catch { return null; }
}
