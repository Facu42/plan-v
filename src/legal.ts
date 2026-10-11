/** Versión vigente de los términos y la política de privacidad (public/legal). */
export const LEGAL_VERSION = '2026-09-29';
export const PRIVACY_URL = '/legal/privacidad.html';
export const TERMS_URL = '/legal/terminos.html';

/** Queda guardado en la cuenta como constancia del consentimiento (ley 25.326, art. 5 y 7). */
export function legalAcceptance(now = new Date()) {
  return { legal_version: LEGAL_VERSION, legal_accepted_at: now.toISOString() };
}

/** La cuenta aceptó la versión vigente. Sin esto la app pide aceptar antes de seguir. */
export function hasCurrentLegalAcceptance(metadata: Record<string, unknown> | null | undefined): boolean {
  return metadata?.legal_version === LEGAL_VERSION;
}
