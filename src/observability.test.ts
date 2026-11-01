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

  it('con DSN manda solo el evento permitido y descarta todo texto libre', () => {
    const send = vi.fn();
    expect(parseSentryDsn(DSN)?.store).toBe('https://o0.ingest.sentry.io/api/12345/store/');
    expect(reportTelemetry({
      dsn: DSN,
      event: 'message.sent',
      message: 'Ana Pérez, diabetes, peso 70 kg, ana@correo.com',
      now: new Date('2026-10-31T12:00:00Z'),
      send,
    })).toBe(true);
    expect(send).toHaveBeenCalledOnce();
    const [url, body, key] = send.mock.calls[0] as [string, string, string];
    expect(url).toBe('https://o0.ingest.sentry.io/api/12345/store/');
    expect(key).toBe('abc123');
    expect(body).toContain('message.sent');
    expect(body).not.toContain('ana@correo.com');
    expect(JSON.parse(body).message).toBe('message.sent');
    for (const dato of ['Ana', 'diabetes', '70 kg', '[mail]']) expect(body).not.toContain(dato);
    expect(scrubTelemetry('a@b.com')).toBe('[mail]');
  });
});

it('rechaza eventos desconocidos con datos personales antes del envío', () => {
  const send = vi.fn();
  expect(reportTelemetry({ dsn: DSN, event: 'Ana Pérez diabetes', send })).toBe(false);
  expect(send).not.toHaveBeenCalled();
});
