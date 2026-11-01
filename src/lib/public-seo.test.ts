import { describe, expect, it } from 'vitest';
import { schedulingDefaultSettings } from '../types/scheduling';
import type { PublicSchedulingPage } from '../types/scheduling';
import { publicPageProfile } from './public-page-profile';
import { publicSeo, robotsTxt, seoSourceFromPublic, sitemapXml } from './public-seo';

const settings = schedulingDefaultSettings();
const page: PublicSchedulingPage = {
  page: { ...settings.page, slug: 'ana-nutri', enabled: true, title: 'Lic. Ana Pérez', bio: 'Acompaño embarazos sin dietas extremas.', location: 'Cabildo 100', contact: 'MN 12' },
  profile: publicPageProfile({
    area: 'Belgrano', specialties: ['Embarazo'], license: 'MN 12', modality: 'ambas',
    consult_price_minor: 3500000,
  }, 'https://cdn.example/ana.jpg'),
  calendars: settings.calendars,
  types: settings.types,
  timezone: settings.timezone,
  transfer_alias: 'alias.secreto.mp',
  mercado_pago_connected: false,
};

describe('SEO de /slug', () => {
  it('arma meta, Open Graph y JSON-LD sin campos internos', () => {
    const dirty = {
      ...page,
      patient_email: 'ana.paciente@ejemplo.test',
      nutritionist_id: '11111111-1111-4111-8111-111111111111',
      service_notes: { nota: 'glucemia 140' },
    };
    const source = seoSourceFromPublic('https://nutridash.app', dirty, 'https://g.page/ana-nutri');
    const seo = publicSeo(source);
    expect(seo.head).toMatchInlineSnapshot(`"<title>Lic. Ana Pérez · Nutricionista</title><meta name="description" content="Acompaño embarazos sin dietas extremas."><meta name="robots" content="index, follow"><link rel="canonical" href="https://nutridash.app/ana-nutri"><meta property="og:title" content="Lic. Ana Pérez · Nutricionista"><meta property="og:description" content="Acompaño embarazos sin dietas extremas."><meta property="og:type" content="profile"><meta property="og:url" content="https://nutridash.app/ana-nutri"><meta property="og:locale" content="es_AR"><meta name="twitter:card" content="summary_large_image"><meta property="og:image" content="https://cdn.example/ana.jpg"><script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Dietitian","@id":"https://nutridash.app/ana-nutri#dietitian","name":"Lic. Ana Pérez","description":"Acompaño embarazos sin dietas extremas.","url":"https://nutridash.app/ana-nutri","image":"https://cdn.example/ana.jpg","priceRange":"$35.000","sameAs":["https://g.page/ana-nutri"],"medicalSpecialty":["Embarazo"],"address":{"@type":"PostalAddress","addressCountry":"AR","streetAddress":"Cabildo 100","addressLocality":"Belgrano"},"identifier":{"@type":"PropertyValue","name":"Matrícula","value":"MN 12"}},{"@type":"MedicalBusiness","@id":"https://nutridash.app/ana-nutri#business","name":"Lic. Ana Pérez","description":"Acompaño embarazos sin dietas extremas.","url":"https://nutridash.app/ana-nutri","image":"https://cdn.example/ana.jpg","priceRange":"$35.000","sameAs":["https://g.page/ana-nutri"],"medicalSpecialty":["Embarazo"],"address":{"@type":"PostalAddress","addressCountry":"AR","streetAddress":"Cabildo 100","addressLocality":"Belgrano"}}]}</script>"`);
    expect(seo.jsonLd).toMatchObject({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'Dietitian', medicalSpecialty: ['Embarazo'] },
        { '@type': 'MedicalBusiness', name: 'Lic. Ana Pérez' },
      ],
    });
    const dumped = `${seo.document} ${JSON.stringify(seo.jsonLd)}`;
    for (const hidden of ['alias.secreto.mp', 'ana.paciente@ejemplo.test', '11111111-1111-4111-8111-111111111111', 'glucemia', '3500000', 'service_notes', 'nutritionist_id', 'data:image']) {
      expect(dumped).not.toContain(hidden);
    }
    expect(dumped).toContain('$35.000');
    expect(dumped).not.toContain('"telephone"');
  });

  it('el sitemap deja afuera los slugs sin publicar y los reservados', () => {
    const xml = sitemapXml('https://nutridash.app/', [
      { slug: 'ana-ok', enabled: true },
      { slug: 'oculta-no', enabled: false },
      { slug: 'admin', enabled: true },
      { slug: 'X', enabled: true },
    ]);
    expect(xml).toContain('<loc>https://nutridash.app/ana-ok</loc>');
    expect(xml).not.toContain('oculta-no');
    expect(xml).not.toContain('>https://nutridash.app/admin<');
    expect(xml).not.toContain('/X<');
  });

  it('robots apunta al sitemap y no nombra un slug sin publicar', () => {
    const text = robotsTxt('https://nutridash.app');
    expect(text).toContain('Sitemap: https://nutridash.app/sitemap.xml');
    expect(text).toContain('Disallow: /crm');
    expect(text).not.toContain('oculta-no');
  });
});
