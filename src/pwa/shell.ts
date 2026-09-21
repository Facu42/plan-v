export const SHELL_CACHE = 'plan-v-shell-v2';
export const SHELL_PRECACHE = [
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
] as const;

export function staleShellCaches(keys: readonly string[], current = SHELL_CACHE): string[] {
  return keys.filter((key) => key.startsWith('plan-v-shell-') && key !== current);
}
