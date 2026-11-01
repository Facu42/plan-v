import type { PageExtras, PublicPageProfile, SchedulingSettings } from '../types/scheduling';

export const MODALIDADES = [['presencial', 'Presencial'], ['online', 'Online'], ['ambas', 'Presencial y online']] as const;

export function etiquetaModalidad(valor: string | undefined): string {
  return MODALIDADES.find(([clave]) => clave === valor)?.[1] ?? '';
}

export function precioConsulta(centavos: number | undefined): string {
  if (centavos == null || centavos <= 0) return '';
  return `$${(centavos / 100).toLocaleString('es-AR')}`;
}

export function fotoPublica(page: Pick<SchedulingSettings['page'], 'logo_url'>, marcaLogo = ''): string {
  if (page.logo_url.startsWith('https://')) return page.logo_url;
  return marcaLogo.startsWith('data:image/') ? marcaLogo : '';
}

/** Huella estable del archivo. La misma cuenta en el navegador y en el servidor. */
export async function huellaFoto(valor: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(valor));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Lo que ve quien abre /slug.
 * Un enlace https publicado gana. El logo de la marca solo entra si su huella
 * es la que quedó guardada al publicar. Subir la foto no alcanza.
 */
export function fotoParaSlug(page: Pick<SchedulingSettings['page'], 'logo_url'>, marcaLogo: string, huellaPublicada: string | undefined, huellaMarca: string): string {
  if (page.logo_url.startsWith('https://')) return page.logo_url;
  if (!marcaLogo.startsWith('data:image/') || !huellaPublicada || huellaPublicada !== huellaMarca) return '';
  return marcaLogo;
}

/** Elegir el archivo no lo escribe en la marca ni lo publica. */
export function fotoAlElegir(dataUrl: string): { persistirAhora: false; borrador: string } {
  return { persistirAhora: false, borrador: dataUrl };
}

/** Recorte público de page_extras: sin obras, avisos ni notas internas. */
export function publicPageProfile(extras: PageExtras | undefined, photo = ''): PublicPageProfile {
  return {
    specialties: extras?.specialties ?? [],
    area: extras?.area?.trim() ?? '',
    license: extras?.license?.trim() ?? '',
    modality: extras?.modality,
    consult_price_minor: extras?.consult_price_minor,
    booking_url: extras?.booking_url?.trim() ?? '',
    color: extras?.color,
    accent: extras?.accent,
    photo,
  };
}
