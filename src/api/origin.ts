/** Public Vite origin for the Node API. Empty keeps same-origin `/api` (Vite proxy). */
export function resolveApiUrl(path: string, origin = import.meta.env.VITE_API_URL): string {
  if (!path.startsWith('/')) return path;
  const base = origin?.trim().replace(/\/+$/, '') ?? '';
  return base ? `${base}${path}` : path;
}
