import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { isClinicalUrl, isShellAsset } from './cache-policy';

describe('política de cache PWA', () => {
  it('nunca marca /api, Supabase ni URLs firmadas como shell', () => {
    expect(isClinicalUrl('/api/patients')).toBe(true);
    expect(isClinicalUrl('https://api-production-aad6.up.railway.app/api/health')).toBe(true);
    expect(isClinicalUrl('https://xyz.supabase.co/rest/v1/patients')).toBe(true);
    expect(isClinicalUrl('https://xyz.supabase.co/storage/v1/object/sign/meal-photos/a.jpg?token=abc')).toBe(true);
    expect(isClinicalUrl('/icons/icon-192.png?X-Amz-Signature=1')).toBe(true);
    expect(isShellAsset('/api/health')).toBe(false);
  });

  it('acepta iconos, assets de marca y la página offline', () => {
    expect(isShellAsset('http://127.0.0.1/offline.html', 'http://127.0.0.1')).toBe(true);
    expect(isShellAsset('http://127.0.0.1/icons/icon-192.png', 'http://127.0.0.1')).toBe(true);
    expect(isShellAsset('http://127.0.0.1/assets/index-abc.js', 'http://127.0.0.1')).toBe(true);
  });

  it('el service worker publicado reitera la exclusión clínica', () => {
    const source = readFileSync(new URL('../../public/sw.js', import.meta.url), 'utf8');
    expect(source).toContain("pathname.startsWith('/api/')");
    expect(source).toContain('supabase.co');
    expect(source).toContain('/storage/v1');
    expect(source).toContain("caches.match('/offline.html')");
  });
});
