import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { isClinicalUrl, isShellAsset } from './cache-policy';
import { SHELL_CACHE, SHELL_PRECACHE, staleShellCaches } from './shell';

describe('política de cache PWA', () => {
  it('nunca marca /api, Supabase, planes, mensajes, diario ni URLs firmadas como shell', () => {
    expect(isClinicalUrl('/api/patients')).toBe(true);
    expect(isClinicalUrl('/api/patients/x/plans')).toBe(true);
    expect(isClinicalUrl('/api/patients/x/messages')).toBe(true);
    expect(isClinicalUrl('/api/patients/x/meals')).toBe(true);
    expect(isClinicalUrl('/api/assets/blob/a')).toBe(true);
    expect(isClinicalUrl('https://api-production-aad6.up.railway.app/api/health')).toBe(true);
    expect(isClinicalUrl('https://xyz.supabase.co/rest/v1/patients')).toBe(true);
    expect(isClinicalUrl('https://xyz.supabase.in/functions/v1/job')).toBe(true);
    expect(isClinicalUrl('https://xyz.supabase.co/storage/v1/object/sign/meal-photos/a.jpg?token=abc')).toBe(true);
    expect(isClinicalUrl('/icons/icon-192.png?X-Amz-Signature=1')).toBe(true);
    expect(isShellAsset('/api/health')).toBe(false);
    expect(isShellAsset('http://127.0.0.1/app/inicio', 'http://127.0.0.1')).toBe(false);
    expect(isShellAsset('http://127.0.0.1/', 'http://127.0.0.1')).toBe(false);
  });

  it('acepta iconos, assets de marca y la página offline', () => {
    expect(isShellAsset('http://127.0.0.1/offline.html', 'http://127.0.0.1')).toBe(true);
    expect(isShellAsset('http://127.0.0.1/icons/icon-192.png', 'http://127.0.0.1')).toBe(true);
    expect(isShellAsset('http://127.0.0.1/assets/index-abc.js', 'http://127.0.0.1')).toBe(true);
  });

  it('el service worker publicado reitera la exclusión clínica y actualiza el shell', () => {
    const source = readFileSync(new URL('../../public/sw.js', import.meta.url), 'utf8');
    expect(source).toContain(`const SHELL = '${SHELL_CACHE}'`);
    expect(source).toContain("pathname.startsWith('/api/')");
    expect(source).toContain('supabase.co');
    expect(source).toContain('/storage/v1');
    expect(source).toContain("caches.match('/offline.html')");
    expect(source).toContain('SHELL_UPDATED');
    expect(source).toContain('SKIP_WAITING');
    expect(staleShellCaches(['plan-v-shell-v1', SHELL_CACHE, 'other'])).toEqual(['plan-v-shell-v1']);
    expect(existsSync(new URL('../../public/icons/icon-192.png', import.meta.url))).toBe(true);
    expect(existsSync(new URL('../../public/icons/icon-512.png', import.meta.url))).toBe(true);
    expect(existsSync(new URL('../../public/icons/apple-touch-icon.png', import.meta.url))).toBe(true);
    expect(existsSync(new URL('../../public/offline.html', import.meta.url))).toBe(true);
    for (const path of SHELL_PRECACHE) expect(source).toContain(path);
  });
});
