import type { SourceBinding } from './SourceView';

type PhotoCard = { cover_status?: string; cover_url?: string | null; cover_alt?: string } | null | undefined;
const DATA_IMAGE = /^data:image\/(png|jpe?g|webp|gif);base64,/;
/** Foto del plato lista para mostrar: sólo con estado «lista» y una dirección https o imagen incrustada. Nunca se inventa. */
export function photoUrl(card: PhotoCard): string | null {
  if (card?.cover_status !== 'ready' || !card.cover_url) return null;
  if (DATA_IMAGE.test(card.cover_url)) return card.cover_url;
  try { return new URL(card.cover_url).protocol === 'https:' ? card.cover_url : null; } catch { return null; }
}
/** Si la foto no carga, se oculta y queda el recuadro gris del archivo (en vez del ícono de imagen rota). */
export function hideBrokenPhoto(event: { currentTarget: { style: { display: string } } }): void {
  event.currentTarget.style.display = 'none';
}
/** Reemplaza el contenido del recuadro de imagen del archivo por la foto real; sin foto, devuelve undefined y el recuadro queda como está. */
export function plateImage(card: PhotoCard, alt: string): SourceBinding | undefined {
  const src = photoUrl(card);
  return src ? { children: <img key={src} src={src} alt={card?.cover_alt || alt} loading="lazy" decoding="async" onError={hideBrokenPhoto} className="absolute inset-0 block size-full object-cover" /> } : undefined;
}

type IngredientPhotoSource = { name: string; ingredient_cover_url?: string | null; ingredient_cover_alt?: string };
const INGREDIENT_HTTPS_PATH = /^\/storage\/v1\/object\/public\/recipe-covers\/ingredients\/[a-z0-9]+(-[a-z0-9]+)*\.(png|jpg|webp)$/;
const INGREDIENT_DATA = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/;
const isDemo = () => import.meta.env.DEV && import.meta.env.VITE_ALLOW_DEMO === 'true';
function sameSupabaseHost(host: string): boolean {
  const configured = import.meta.env.VITE_SUPABASE_URL;
  if (!configured) return true; // El servidor ya comparó el host; aquí se vuelve a comprobar cuando se conoce.
  try { return new URL(configured).host === host; } catch { return false; }
}
/** Mismas reglas que el servidor: https del bucket público bajo `ingredients/`, o la imagen incrustada (png, jpeg, webp) sólo en la demostración. */
export function ingredientPhotoUrl(ingredient: IngredientPhotoSource): string | null {
  const value = ingredient.ingredient_cover_url;
  if (typeof value !== 'string' || !value) return null;
  if (INGREDIENT_DATA.test(value)) return isDemo() ? value : null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && INGREDIENT_HTTPS_PATH.test(url.pathname) && !url.search && !url.hash && sameSupabaseHost(url.host) ? value : null;
  } catch { return null; }
}
/**
 * Listo para el recuadro de ingrediente. El archivo de Nutrigo todavía no dibuja un lugar para esta foto en el detalle
 * de la receta (cada fila sólo tiene el número y el texto), por eso la pantalla aún no lo usa: ver docs/fotos-menu-cloudflare-2026-10-06.md.
 */
export function ingredientImage(ingredient: IngredientPhotoSource): SourceBinding | undefined {
  const src = ingredientPhotoUrl(ingredient);
  return src ? plateImage({ cover_status: 'ready', cover_url: src, cover_alt: ingredient.ingredient_cover_alt }, ingredient.name) : undefined;
}
