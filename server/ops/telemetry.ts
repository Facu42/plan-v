import { reportTelemetry, type TelemetryEvent } from '../../src/observability.js';

/** Evento del servidor. Apagado hasta que exista SENTRY_DSN. No manda el cuerpo del pedido. */
export function trackServer(event: TelemetryEvent, env: Record<string, string | undefined> = process.env): void {
  reportTelemetry({
    dsn: env.SENTRY_DSN,
    event,
    send: (url, body, key) => {
      void fetch(`${url}?sentry_key=${encodeURIComponent(key)}&sentry_version=7`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      }).catch(() => undefined);
    },
  });
}
