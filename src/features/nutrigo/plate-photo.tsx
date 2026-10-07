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
