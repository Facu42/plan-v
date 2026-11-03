// La vuelta de Google tiene que quedar en el mismo sitio desde el que se salió.
// El camino se valida antes de guardarlo y antes de usarlo: nunca un dominio ajeno.

export const OAUTH_RETURN_KEY = 'planv.oauthReturnPath';

type KeyValueStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** Camino interno: empieza con / y no puede llevar a otro sitio. */
export function safeInternalPath(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  if (/[\u0000-\u001f\u007f]/.test(value)) return null;
  const raw = value.trim();
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return null;
  if (raw.includes('\\') || raw.includes('@') || /[\u0000-\u001f\u007f]/.test(raw)) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return null;
  let decoded = raw;
  try { decoded = decodeURIComponent(raw); } catch { return null; }
  if (decoded !== raw && (decoded.includes('\\') || decoded.includes('@') || decoded.startsWith('//') || decoded.includes('://') || /[\u0000-\u001f\u007f]/.test(decoded))) return null;
  let url: URL;
  try { url = new URL(raw, 'https://retorno.invalid'); } catch { return null; }
  if (url.origin !== 'https://retorno.invalid') return null;
  if (url.username || url.password) return null;
  if (!url.pathname.startsWith('/') || url.pathname.startsWith('//')) return null;
  return url.pathname;
}

/** Arma la vuelta con el origen real de esta pestaña. El camino inválido cae en la raíz. */
export function sameOriginUrl(origin: string, pathname: string): string | undefined {
  let base: URL;
  try { base = new URL(origin); } catch { return undefined; }
  if (base.protocol !== 'http:' && base.protocol !== 'https:') return undefined;
  if (base.username || base.password) return undefined;
  const path = safeInternalPath(pathname) ?? '/';
  if (path === '/') return base.origin;
  const target = new URL(path, `${base.origin}/`);
  if (target.origin !== base.origin) return base.origin;
  return target.href;
}

export function rememberReturnPath(store: KeyValueStore, pathname: string) {
  const safe = safeInternalPath(pathname);
  if (!safe || safe === '/') store.removeItem(OAUTH_RETURN_KEY);
  else store.setItem(OAUTH_RETURN_KEY, safe);
}

/** Si Google dejó a la persona en la raíz, devuelve el camino guardado y lo borra. */
export function takeReturnPath(store: KeyValueStore, pathname: string): string | null {
  const raw = store.getItem(OAUTH_RETURN_KEY);
  store.removeItem(OAUTH_RETURN_KEY);
  if (pathname !== '/') return null;
  const safe = safeInternalPath(raw);
  if (!safe || safe === '/') return null;
  return safe;
}
