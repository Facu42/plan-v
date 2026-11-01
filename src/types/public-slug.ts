export const PUBLIC_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{2,59}$/;

/** Palabras que ya son rutas, archivos o prefijos del sitio y no pueden ser la página de una nutricionista. */
export const RESERVED_PUBLIC_SLUGS: ReadonlySet<string> = new Set([
  'app', 'crm', 'pacientes', 'consultorio', 'equipo', 'admin', 'api', 'legal', 'nutris',
  'assets', 'static', 'icons', 'img', 'brand', 'fonts', 'sw', 'manifest', 'robots',
  'favicon', 'offline', 'index', 'login', 'signup', 'register', 'health', 'status',
]);

export function isPublicSlug(value: string): boolean {
  return PUBLIC_SLUG_PATTERN.test(value) && !RESERVED_PUBLIC_SLUGS.has(value);
}

export function isReservedPublicSlug(value: string): boolean {
  return RESERVED_PUBLIC_SLUGS.has(value);
}

/** Devuelve el slug público de una ruta corta (/slug) o de la ruta histórica (/consultorio/slug). */
export function publicSlugFromPath(path: string): string | null {
  const legacy = /^\/consultorio\/([a-z0-9][a-z0-9-]{2,59})\/?$/.exec(path)?.[1];
  if (legacy) return legacy;
  const short = /^\/([a-z0-9][a-z0-9-]{2,59})\/?$/.exec(path)?.[1];
  return short && isPublicSlug(short) ? short : null;
}
