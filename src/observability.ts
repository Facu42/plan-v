/** Eventos de la app. Nunca llevan mail, nombre ni datos de salud. */
export const TELEMETRY_EVENTS = ['auth.login', 'auth.signup', 'plan.published', 'message.sent', 'client.error', 'server.error'] as const;
export type TelemetryEvent = (typeof TELEMETRY_EVENTS)[number];

export type SentryTarget = { store: string; key: string };

/** DSN de Sentry: https://clave@host/proyecto. Vacío o mal formado = apagado. */
export function parseSentryDsn(dsn: string | undefined): SentryTarget | null {
  const value = dsn?.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    const key = url.username;
    const project = url.pathname.replace(/^\//, '').split('/')[0];
    if (url.protocol !== 'https:' || !key || !project || !/^\d+$/.test(project)) return null;
    return { key, store: `https://${url.host}/api/${project}/store/` };
  } catch {
    return null;
  }
}

export function telemetryEnabled(dsn: string | undefined): boolean {
  return parseSentryDsn(dsn) !== null;
}

/** Saca mails y recorta. El evento igual no debería traer datos. */
export function scrubTelemetry(text: string): string {
  return text.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[mail]').replace(/\s+/g, ' ').trim().slice(0, 200);
}

export type TelemetrySend = (url: string, body: string, key: string) => void;

/**
 * Manda un evento a Sentry si hay DSN. Si no hay, no hace nada y no llama al envío.
 * El cuerpo lleva el nombre del evento, no el contenido de la pantalla.
 */
export function reportTelemetry(input: {
  dsn?: string;
  event: string;
  message?: string;
  now?: Date;
  send?: TelemetrySend;
}): boolean {
  const target = parseSentryDsn(input.dsn);
  if (!target || !input.send) return false;
  const event = scrubTelemetry(input.event) || 'app.event';
  const body = JSON.stringify({
    event_id: randomId(),
    timestamp: (input.now ?? new Date()).toISOString(),
    platform: 'javascript',
    level: event === 'client.error' ? 'error' : 'info',
    message: input.message ? scrubTelemetry(input.message) : event,
    tags: { event },
    environment: 'nutridash',
  });
  try {
    input.send(target.store, body, target.key);
    return true;
  } catch {
    return false;
  }
}

function randomId(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
