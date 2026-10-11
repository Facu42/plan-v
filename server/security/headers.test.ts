import { describe, expect, it } from 'vitest';
import { app } from '../index.js';

describe('cabeceras de seguridad de la API', () => {
  it('no se deja embeber ni adivinar el tipo, y exige HTTPS', async () => {
    const res = await app.request('/api/health');
    expect(res.headers.get('x-frame-options')).toBe('DENY');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('strict-transport-security')).toContain('max-age=');
    expect(res.headers.get('referrer-policy')).toBe('no-referrer');
    expect(res.headers.get('content-security-policy')).toContain("frame-ancestors 'none'");
    expect(res.headers.get('cross-origin-resource-policy')).toBe('cross-origin');
  });
});
