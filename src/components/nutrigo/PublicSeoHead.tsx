import { useEffect } from 'react';
import { publicSeo, type PublicSeoSource } from '../../lib/public-seo';

/** Meta, Open Graph y JSON-LD de la página /slug. Solo datos públicos. */
export function PublicSeoHead({ source }: { source: PublicSeoSource }) {
  const seo = publicSeo(source);
  useEffect(() => {
    const previous = document.title;
    document.title = seo.title;
    return () => { document.title = previous; };
  }, [seo.title]);
  return <>
    <title>{seo.title}</title>
    <meta name="description" content={seo.description} />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href={seo.canonical} />
    <meta property="og:title" content={seo.title} />
    <meta property="og:description" content={seo.description} />
    <meta property="og:type" content="profile" />
    <meta property="og:url" content={seo.canonical} />
    <meta property="og:locale" content="es_AR" />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: seo.jsonLdText }} />
  </>;
}
