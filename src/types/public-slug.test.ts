import { describe, expect, it } from 'vitest';
import { PUBLIC_SLUG_PATTERN, RESERVED_PUBLIC_SLUGS, isPublicSlug, publicSlugFromPath } from './public-slug';
import { schedulingDefaultSettings, schedulingSettingsSchema } from './scheduling';

describe('slug público corto', () => {
  it('acepta minúsculas, números y guiones entre 3 y 60 caracteres', () => {
    expect(PUBLIC_SLUG_PATTERN.test('ana')).toBe(true);
    expect(PUBLIC_SLUG_PATTERN.test('lic-ana-2026')).toBe(true);
    expect(PUBLIC_SLUG_PATTERN.test('ab')).toBe(false);
    expect(PUBLIC_SLUG_PATTERN.test('Ana')).toBe(false);
    expect(PUBLIC_SLUG_PATTERN.test('-ana')).toBe(false);
    expect(PUBLIC_SLUG_PATTERN.test('a'.repeat(61))).toBe(false);
  });

  it('reserva rutas y prefijos del sitio', () => {
    for (const word of ['app', 'crm', 'pacientes', 'consultorio', 'equipo', 'admin', 'api', 'legal', 'nutris', 'assets', 'static']) {
      expect(RESERVED_PUBLIC_SLUGS.has(word)).toBe(true);
      expect(isPublicSlug(word)).toBe(false);
    }
    expect(isPublicSlug('ana-nutricion')).toBe(true);
  });

  it('reconoce la ruta corta y la histórica, sin confundir rutas reservadas', () => {
    expect(publicSlugFromPath('/ana-nutricion')).toBe('ana-nutricion');
    expect(publicSlugFromPath('/ana-nutricion/')).toBe('ana-nutricion');
    expect(publicSlugFromPath('/consultorio/ana-nutricion')).toBe('ana-nutricion');
    expect(publicSlugFromPath('/consultorio/ana-nutricion/')).toBe('ana-nutricion');
    for (const path of ['/', '/app', '/crm', '/pacientes', '/consultorio', '/nutris', '/legal', '/assets/archivo.js']) {
      expect(publicSlugFromPath(path)).toBeNull();
    }
  });

  it('rechaza una palabra reservada al crear la página de la nutricionista', () => {
    const settings = schedulingDefaultSettings();
    expect(schedulingSettingsSchema.safeParse({ ...settings, page: { ...settings.page, slug: 'app' } }).success).toBe(false);
    expect(schedulingSettingsSchema.safeParse({ ...settings, page: { ...settings.page, slug: 'ana-nutricion' } }).success).toBe(true);
  });
});
