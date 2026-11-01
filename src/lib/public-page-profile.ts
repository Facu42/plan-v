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
