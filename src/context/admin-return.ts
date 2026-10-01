// Entrar con Google vuelve a la raíz del sitio. Si la persona venía de /admin, se guarda acá
// y al volver se la lleva de nuevo a /admin (sin perder lo que Supabase deja en la dirección).
export const ADMIN_RETURN_KEY = 'planv.returnToAdmin';
const MAX_AGE_MS = 30 * 60 * 1000;

type KeyValueStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function rememberAdminReturn(store: KeyValueStore, pathname: string, now = new Date()) {
  if (/^\/admin\/?$/.test(pathname)) store.setItem(ADMIN_RETURN_KEY, now.toISOString());
}

/** Devuelve true (y borra la marca) si hay que volver a /admin desde la raíz. */
export function takeAdminReturn(store: KeyValueStore, pathname: string, now = new Date()): boolean {
  const raw = store.getItem(ADMIN_RETURN_KEY);
  store.removeItem(ADMIN_RETURN_KEY);
  if (!raw || pathname !== '/') return false;
  const savedAt = Date.parse(raw);
  return Number.isFinite(savedAt) && now.getTime() - savedAt <= MAX_AGE_MS;
}
