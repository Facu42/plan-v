import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { publicSeo, type PublicSeoSource } from '../../src/lib/public-seo.js';
import { registerPublicSeoRoutes } from './routes.js';

const source: PublicSeoSource = {
  origin: 'https://nutridash.app',
  slug: 'ana-ok',
  title: 'Lic. Ana Pérez',
  bio: 'Acompaño embarazos.',
  location: 'Cabildo 100',
  contact: 'MN 12',
  area: 'Belgrano',
  license: 'MN 12',
  specialties: ['Embarazo'],
  photo: 'https://cdn.example/ana.jpg',
  consultPriceMinor: 3500000,
  sameAs: 'https://g.page/ana-ok',
};

function app() {
  const hono = new Hono();
  registerPublicSeoRoutes(hono, {
    origin: () => 'https://nutridash.app',
    publishedSlugs: async () => ['ana-ok'],
    pageForSlug: async slug => slug === 'ana-ok' ? source : null,
  });
  return hono;
}

describe('rutas públicas de SEO', () => {
  it('el sitemap no incluye un slug sin publicar', async () => {
    const xml = await (await app().request('/api/public/seo/sitemap.xml')).text();
    expect(xml).toContain('https://nutridash.app/ana-ok');
    expect(xml).not.toContain('oculta-no');
  });

  it('robots publica el sitemap', async () => {
    const text = await (await app().request('/api/public/seo/robots.txt')).text();
    expect(text).toContain('Sitemap: https://nutridash.app/sitemap.xml');
    expect(text).not.toContain('oculta-no');
  });

  it('la página publicada trae JSON-LD y una no publicada responde 404', async () => {
    const ok = await app().request('/api/public/seo/ana-ok');
    expect(ok.status).toBe(200);
    const html = await ok.text();
    expect(html).toContain(publicSeo(source).jsonLdText);
    expect(html).toContain('og:title');
    expect(html).not.toContain('3500000');
    expect(html).not.toContain('ana.paciente@ejemplo.test');
    const missing = await app().request('/api/public/seo/oculta-no');
    expect(missing.status).toBe(404);
    expect(missing.headers.get('x-robots-tag')).toBe('noindex');
    expect(await missing.text()).not.toContain('Embarazo');
  });
});
