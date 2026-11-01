import type { Hono } from 'hono';
import { CareError } from '../care/errors.js';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { siteUrl } from '../admin/accounts.js';
import { isGoogleBusinessUrl } from '../../src/lib/google-review.js';
import { isPublicSlug } from '../../src/types/public-slug.js';
import { publicSeo, robotsTxt, seoSourceFromPublic, sitemapXml, type PublicSeoSource } from '../../src/lib/public-seo.js';
import * as repo from '../scheduling/repository.js';

export type PublicSeoDeps = {
  origin: () => string;
  publishedSlugs: () => Promise<string[]>;
  pageForSlug: (slug: string) => Promise<PublicSeoSource | null>;
};

function liveOrigin(): string {
  return siteUrl() ?? 'https://nutridash.app';
}

async function livePage(slug: string): Promise<PublicSeoSource | null> {
  if (!isPublicSlug(slug)) return null;
  try {
    const persistent = isSupabaseEnabled();
    const profile = await repo.publicProfile(slug, persistent);
    const page = await repo.publicPage(profile, persistent);
    const sameAs = profile.config.page_extras?.google_business_url ?? '';
    return seoSourceFromPublic(liveOrigin(), page, isGoogleBusinessUrl(sameAs) ? sameAs : '');
  } catch (error) {
    if (error instanceof CareError && error.status === 404) return null;
    throw error;
  }
}

export function registerPublicSeoRoutes(app: Hono, deps: PublicSeoDeps = {
  origin: liveOrigin,
  publishedSlugs: () => repo.publishedSlugs(isSupabaseEnabled()),
  pageForSlug: livePage,
}) {
  app.get('/api/public/seo/sitemap.xml', async c => {
    const xml = sitemapXml(deps.origin(), (await deps.publishedSlugs()).map(slug => ({ slug, enabled: true })));
    c.header('Content-Type', 'application/xml; charset=utf-8');
    c.header('Cache-Control', 'public, max-age=300');
    c.header('X-Robots-Tag', 'noindex');
    return c.body(xml);
  });
  app.get('/api/public/seo/robots.txt', c => {
    c.header('Content-Type', 'text/plain; charset=utf-8');
    c.header('Cache-Control', 'public, max-age=300');
    return c.body(robotsTxt(deps.origin()));
  });
  app.get('/api/public/seo/:slug', async c => {
    const source = await deps.pageForSlug(c.req.param('slug'));
    if (!source) {
      c.header('X-Robots-Tag', 'noindex');
      c.header('Cache-Control', 'no-store');
      return c.text('Esta página no está disponible.', 404);
    }
    const seo = publicSeo(source);
    c.header('Content-Type', 'text/html; charset=utf-8');
    c.header('Cache-Control', 'public, max-age=300');
    return c.body(seo.document);
  });
}
