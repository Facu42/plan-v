import { describe, expect, it, vi } from 'vitest';
import { parseSentryDsn, reportTelemetry, scrubTelemetry, telemetryEnabled } from './observability';

const DSN = 'https://abc123@o0.ingest.sentry.io/12345';

describe('monitoreo apagado hasta que haya clave', () => {
  it('sin DSN no manda nada', () => {
    const send = vi.fn();
    expect(telemetryEnabled(undefined)).toBe(false);
    expect(telemetryEnabled('')).toBe(false);
    expect(telemetryEnabled('no-es-un-dsn')).toBe(false);
    expect(reportTelemetry({ event: 'auth.login', send })).toBe(false);
    expect(send).not.toHaveBeenCalled();
  });

  it('con DSN manda el nombre del evento y saca el mail', () => {
    const send = vi.fn();
    expect(parseSentryDsn(DSN)?.store).toBe('https://o0.ingest.sentry.io/api/12345/store/');
    expect(reportTelemetry({
      dsn: DSN,
      event: 'message.sent',
      message: 'listo ana@correo.com',
      now: new Date('2026-10-31T12:00:00Z'),
      send,
    })).toBe(true);
    expect(send).toHaveBeenCalledOnce();
    const [url, body, key] = send.mock.calls[0] as [string, string, string];
    expect(url).toBe('https://o0.ingest.sentry.io/api/12345/store/');
    expect(key).toBe('abc123');
    expect(body).toContain('message.sent');
    expect(body).not.toContain('ana@correo.com');
    expect(body).toContain('[mail]');
    expect(scrubTelemetry('a@b.com')).toBe('[mail]');
  });
});
