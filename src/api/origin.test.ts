import { describe, expect, it } from 'vitest';
import { resolveApiUrl } from './origin';

describe('resolveApiUrl', () => {
  it('keeps same-origin /api when the origin is empty', () => {
    expect(resolveApiUrl('/api/health')).toBe('/api/health');
    expect(resolveApiUrl('/api/health', '')).toBe('/api/health');
    expect(resolveApiUrl('/api/health', '   ')).toBe('/api/health');
  });

  it('prefixes a Railway-style origin and strips trailing slashes', () => {
    expect(resolveApiUrl('/api/health', 'https://api-production-aad6.up.railway.app'))
      .toBe('https://api-production-aad6.up.railway.app/api/health');
    expect(resolveApiUrl('/api/patients?limit=50', 'https://api.example.com/'))
      .toBe('https://api.example.com/api/patients?limit=50');
  });

  it('leaves non-path URLs untouched', () => {
    expect(resolveApiUrl('https://already.example/api/health', 'https://other.example'))
      .toBe('https://already.example/api/health');
  });
});
