// Directorio de nutris matriculadas: lo que viaja entre la app, el panel del administrador y la página pública.

export const LICENSE_SCOPES = ['nacional', 'provincial'] as const;
export type LicenseScope = (typeof LICENSE_SCOPES)[number];
export const LICENSE_STATUSES = ['pending', 'verified', 'rejected'] as const;
export type LicenseStatus = (typeof LICENSE_STATUSES)[number];
export const LICENSE_MIMES = ['application/pdf', 'image/jpeg', 'image/png'] as const;
export type LicenseMime = (typeof LICENSE_MIMES)[number];
/** Igual que el límite del bucket privado license-files. */
export const LICENSE_MAX_BYTES = 5 * 1024 * 1024;

/** Lo que ve la nutricionista de su propia solicitud. Nunca incluye el archivo. */
export type DirectoryListingView = {
  license_number: string;
  license_scope: LicenseScope;
  license_province: string;
  status: LicenseStatus;
  listed: boolean;
  reject_reason: string;
  submitted_at: string;
  reviewed_at: string | null;
  /** «PDF» o «Foto»: el tipo de archivo que subió, para que sepa qué mandó. */
  file_kind: 'PDF' | 'Foto';
};

export type DirectoryLicenseInput = {
  license_number: string;
  license_scope: LicenseScope;
  license_province: string;
  listed: boolean;
  /** data:application/pdf;base64,… o data:image/(jpeg|png);base64,… */
  file: string;
};

/** Fila de la lista del administrador. */
export type AdminLicenseRow = DirectoryListingView & { nutritionist_id: string; name: string; email: string };

/** Tarjeta pública del directorio. Solo datos que la nutri ya publicó en su página. */
export type DirectoryCard = {
  slug: string;
  title: string;
  area: string;
  location: string;
  modality: string;
  specialties: string[];
  license: string;
  photo: string;
};

export function licenseLabel(scope: LicenseScope, number: string, province = ''): string {
  const clean = number.trim().replace(/^(MN|MP)\s*/i, '');
  if (!clean) return '';
  return scope === 'nacional' ? `MN ${clean}` : `MP ${clean}${province.trim() ? ` · ${province.trim()}` : ''}`;
}

export const STATUS_TEXT: Record<LicenseStatus, string> = {
  pending: 'En revisión',
  verified: 'Verificada',
  rejected: 'Rechazada',
};
