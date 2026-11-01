import { resolveApiUrl } from '../api/origin';
import { track } from '../telemetry';

export type ClientErrorKind = 'render' | 'error' | 'promise';

/** Avisos por carga de página: una falla en bucle no manda cientos. */
const MAX_REPORTS = 5;
let sent = 0;

/** Texto corto de la falla, sin datos: solo el mensaje del error, recortado. */
export function clientErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? `${error.name}: ${error.message}` : typeof error === 'string' ? error : 'Error sin detalle';
  return raw.replace(/\s+/g, ' ').trim().slice(0, 300);
}

/**
 * Avisa a la API que algo falló en esta pantalla. Manda el tipo, la ruta (sin búsqueda ni ancla) y el mensaje;
 * nunca lo que se estaba viendo. Si no se puede avisar, no pasa nada: la app sigue igual.
 */
export function reportClientError(kind: ClientErrorKind, error: unknown, location: Pick<Location, 'pathname'> = window.location): boolean {
  if (sent >= MAX_REPORTS) return false;
  sent += 1;
  const body = JSON.stringify({ kind, path: location.pathname.slice(0, 200), message: clientErrorMessage(error) });
  try {
    void fetch(resolveApiUrl('/api/client-errors'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => undefined);
    track('client.error');
    return true;
  } catch {
    return false;
  }
}

/** Fallas que no atrapa ninguna pantalla (errores sueltos y promesas rechazadas). */
export function watchClientErrors(target: Pick<Window, 'addEventListener'> = window) {
  target.addEventListener('error', event => { if (event instanceof ErrorEvent) reportClientError('error', event.error ?? event.message); });
  target.addEventListener('unhandledrejection', event => reportClientError('promise', (event as PromiseRejectionEvent).reason));
}

/** Solo para pruebas. */
export function resetClientErrorReports() { sent = 0; }
