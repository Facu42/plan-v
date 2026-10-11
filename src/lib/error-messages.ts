/** Mensaje por defecto cuando no se sabe qué pasó (nunca se muestra texto técnico ni en inglés). */
export const GENERIC_ERROR = 'No se pudo completar la acción. Probá de nuevo.';

const KNOWN: Array<[RegExp, string]> = [
  [/invalid login credentials/i, 'El mail o la contraseña no coinciden.'],
  [/email not confirmed/i, 'Todavía no confirmaste tu mail. Revisá tu bandeja de entrada.'],
  [/user already registered|already been registered/i, 'Ya existe una cuenta con ese mail.'],
  [/password should be at least/i, 'La contraseña es muy corta.'],
  [/new password should be different/i, 'La contraseña nueva tiene que ser distinta de la anterior.'],
  [/for security purposes.*(only request|seconds)/i, 'Por seguridad, esperá unos segundos antes de volver a intentar.'],
  [/email rate limit|over_email_send_rate_limit|too many requests/i, 'Pediste demasiados mails seguidos. Esperá unos minutos.'],
  [/signups? not allowed/i, 'El registro está cerrado por ahora.'],
  [/unable to validate email|invalid email/i, 'Revisá que el mail esté bien escrito.'],
  [/failed to fetch|load failed|networkerror|network request failed|fetch failed/i, 'No pudimos conectarnos. Revisá tu conexión e intentá de nuevo.'],
  [/^HTTP 429$/i, 'Hiciste muchos intentos seguidos. Esperá un momento y probá de nuevo.'],
  [/^HTTP 5\d\d$/i, 'Algo falló de nuestro lado. Probá de nuevo en un rato.'],
];

/** Un texto ya está en español si trae tildes, signos de apertura o palabras muy comunes. */
const looksSpanish = (text: string) =>
  /[áéíóúñ¿¡]/i.test(text) || /\b(no|se|el|la|los|las|de|del|que|con|para|por|una|un|tu|revisá|probá|intentá|elegí|falta|datos|mail)\b/i.test(text);

/**
 * Convierte cualquier error (texto, JSON `{"error":"…"}` o `Error`) en un mensaje corto en español.
 * Lo conocido se traduce; lo que ya está en español se conserva; el resto se reemplaza por un mensaje genérico.
 */
export function friendlyError(error: unknown): string {
  let text = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  text = text.trim();
  if (!text) return GENERIC_ERROR;
  try {
    const parsed = JSON.parse(text) as { error?: unknown; message?: unknown };
    const inner = parsed?.error ?? parsed?.message;
    if (typeof inner === 'string' && inner.trim()) text = inner.trim();
  } catch { /* no era JSON */ }
  for (const [pattern, message] of KNOWN) if (pattern.test(text)) return message;
  return looksSpanish(text) ? text : GENERIC_ERROR;
}
