import { isPublicSlug } from '../types/public-slug';
import type { PublicSchedulingPage } from '../types/scheduling';
import { isGoogleBusinessUrl } from './google-review';
import { precioConsulta } from './public-page-profile';

/** Datos públicos de una nutricionista. No entran fichas, turnos ni notas. */
export type PublicSeoSource = {
  origin: string;
  slug: string;
  title: string;
  bio: string;
  location: string;
  contact: string;
  area: string;
  license: string;
  specialties: string[];
  photo: string;
  consultPriceMinor?: number;
  sameAs?: string;
};

export type PublicSeo = {
  title: string;
  description: string;
  canonical: string;
  jsonLd: Record<string, unknown>;
  jsonLdText: string;
  head: string;
  document: string;
};

const PHONE = /^[0-9+\s()-]{6,40}$/;

function esc(value: string): string {
  return value.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch] ?? ch);
}

function originOf(value: string): string {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') return 'https://nutridash.app';
    return url.origin;
  } catch {
    return 'https://nutridash.app';
  }
}

function clip(value: string, max: number): string {
  const clean = value.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

function httpsPhoto(value: string): string {
  if (!value.startsWith('https://')) return '';
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
  } catch {
    return '';
  }
}

export function seoSourceFromPublic(origin: string, page: PublicSchedulingPage, sameAs = ''): PublicSeoSource {
  return {
    origin,
    slug: page.page.slug,
    title: page.page.title,
    bio: page.page.bio,
    location: page.page.location,
    contact: page.page.contact,
    area: page.profile.area,
    license: page.profile.license,
    specialties: [...page.profile.specialties],
    photo: page.profile.photo,
    consultPriceMinor: page.profile.consult_price_minor,
    sameAs: isGoogleBusinessUrl(sameAs) && sameAs.trim() ? sameAs.trim() : '',
  };
}

export function publicSeo(source: PublicSeoSource): PublicSeo {
  const origin = originOf(source.origin);
  const slug = isPublicSlug(source.slug) ? source.slug : '';
  const name = clip(source.title, 100) || 'Consultorio';
  const title = `${name} · Nutricionista`;
  const description = clip(source.bio, 160) || clip(`Consultorio de ${name}${source.area.trim() ? ` en ${source.area.trim()}` : ''}.`, 160);
  const canonical = slug ? `${origin}/${slug}` : origin;
  const image = httpsPhoto(source.photo);
  const price = precioConsulta(source.consultPriceMinor);
  const sameAs = source.sameAs && isGoogleBusinessUrl(source.sameAs) ? source.sameAs.trim() : '';
  const phone = PHONE.test(source.contact.trim()) ? source.contact.trim() : '';
  const address: Record<string, string> = { '@type': 'PostalAddress', addressCountry: 'AR' };
  if (source.location.trim()) address.streetAddress = clip(source.location, 200);
  if (source.area.trim()) address.addressLocality = clip(source.area, 80);
  const specialties = source.specialties.map(item => clip(item, 40)).filter(Boolean).slice(0, 12);
  const shared: Record<string, unknown> = {
    name,
    description,
    url: canonical,
    ...(image ? { image } : {}),
    ...(price ? { priceRange: price } : {}),
    ...(sameAs ? { sameAs: [sameAs] } : {}),
    ...(specialties.length ? { medicalSpecialty: specialties } : {}),
    ...(source.location.trim() || source.area.trim() ? { address } : {}),
    ...(phone ? { telephone: phone } : {}),
  };
  const dietitian: Record<string, unknown> = {
    '@type': 'Dietitian',
    '@id': `${canonical}#dietitian`,
    ...shared,
    ...(source.license.trim() ? { identifier: { '@type': 'PropertyValue', name: 'Matrícula', value: clip(source.license, 60) } } : {}),
  };
  const business: Record<string, unknown> = {
    '@type': 'MedicalBusiness',
    '@id': `${canonical}#business`,
    ...shared,
  };
  const jsonLd = { '@context': 'https://schema.org', '@graph': [dietitian, business] };
  const jsonLdText = JSON.stringify(jsonLd).replace(/</g, '\\u003c');
  const metas = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}">`,
    `<meta name="robots" content="index, follow">`,
    `<link rel="canonical" href="${esc(canonical)}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:type" content="profile">`,
    `<meta property="og:url" content="${esc(canonical)}">`,
    `<meta property="og:locale" content="es_AR">`,
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">`,
    ...(image ? [`<meta property="og:image" content="${esc(image)}">`] : []),
    `<script type="application/ld+json">${jsonLdText}</script>`,
  ];
  const head = metas.join('');
  const specialtyList = specialties.map(item => `<li>${esc(item)}</li>`).join('');
  const document = `<!DOCTYPE html><html lang="es-AR"><head><meta charset="utf-8">${head}</head><body><main><h1>${esc(name)}</h1><p>${esc(description)}</p>${source.area.trim() || source.location.trim() ? `<p>${esc([source.location.trim(), source.area.trim()].filter(Boolean).join(' · '))}</p>` : ''}${specialtyList ? `<ul>${specialtyList}</ul>` : ''}</main></body></html>`;
  return { title, description, canonical, jsonLd, jsonLdText, head, document };
}

export function sitemapXml(origin: string, rows: readonly { slug: string; enabled: boolean }[]): string {
  const base = originOf(origin);
  const locs = [...new Set(rows.filter(row => row.enabled && isPublicSlug(row.slug)).map(row => row.slug))].sort();
  const body = locs.map(slug => `<url><loc>${esc(`${base}/${slug}`)}</loc></url>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
}

export function robotsTxt(origin: string): string {
  const base = originOf(origin);
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /crm',
    'Disallow: /app',
    'Disallow: /admin',
    'Disallow: /api',
    'Disallow: /equipo',
    'Disallow: /consultorio',
    '',
    `Sitemap: ${base}/sitemap.xml`,
    '',
  ].join('\n');
}
