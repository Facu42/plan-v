import { reportTelemetry, type TelemetryEvent } from './observability';

/** Evento de la app en el navegador. Apagado hasta que exista VITE_SENTRY_DSN. */
export function track(event: TelemetryEvent): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  reportTelemetry({
    dsn,
    event,
    send: (url, body, key) => {
      void fetch(`${url}?sentry_key=${encodeURIComponent(key)}&sentry_version=7`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => undefined);
    },
  });
}
