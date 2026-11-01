import { describe, expect, it, vi } from 'vitest';
import { trackServer } from './telemetry.js';

describe('monitoreo del servidor', () => {
  it('sin SENTRY_DSN no llama a la red', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response());
    trackServer('server.error', {});
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
