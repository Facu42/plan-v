import { useRef } from 'react';
import type { ResourceAssignment } from '../../types';
import { RESOURCE_GUIDES, type ResourceGuide } from '../nutrigo/ShowroomResources';

export type InsightsLayoutState = {
  guides: ResourceGuide[];
  assignments: ResourceAssignment[];
  query: string;
  setQuery: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  categories: string[];
  open: (id: string) => void;
};

type Variant = 'desktop' | 'tablet' | 'mobile';
const ids = {
  desktop: { header: '371:10069', body: '276:9284', tab: '265:8064', top: '263:7123', topBody: '263:7125', featured: '263:7126', popular: '267:8131', popularList: '267:8133', recommendation: '276:9217', first: '276:8898', firstList: '276:8900', second: '276:9183', secondList: '276:9185' },
  tablet: { header: '501:24341', body: undefined, tab: '501:24377', top: undefined, topBody: undefined, featured: '501:24416', popular: '504:14917', popularList: '504:14919', recommendation: '504:15044', first: '504:15045', firstList: '504:15047', second: '504:15050', secondList: '504:15052' },
  mobile: { header: '504:15702', body: undefined, tab: '507:15755', top: undefined, topBody: undefined, featured: '507:15787', popular: '507:15852', popularList: '507:15854', recommendation: undefined, first: '507:16304', firstList: '507:16306', second: '507:16309', secondList: '507:16311' },
} as const;

function ArticleCard({ guide, mode, state, nodeIds }: { guide: ResourceGuide; mode: 'featured' | 'popular' | 'recommended'; state: InsightsLayoutState; nodeIds?: { body?: string; image?: string; copy?: string } }) {
  const assignment = state.assignments.find((item) => item.resource_id === guide.id);
  return <button type="button" className={`nv-insight-card nv-insight-card-${mode}`} data-node-id={nodeIds?.body} onClick={() => state.open(guide.id)}>
    <span className="nv-insight-image" aria-hidden="true" data-node-id={nodeIds?.image} data-name="Image" />
    <span className="nv-insight-copy" data-node-id={nodeIds?.copy}><span className="nv-insight-meta">{guide.category} <i aria-hidden="true" /> 2026</span><strong>{guide.title}</strong><span className="nv-insight-description">{guide.summary}</span><span className="nv-insight-author"><i aria-hidden="true" />Equipo Plan V{assignment ? ` · ${assignment.read_at ? 'Leído' : 'Asignado'}` : ''}</span></span>
  </button>;
}

function RecommendationGroup({ guides, id, listId, title, state, titleId }: { guides: ResourceGuide[]; id: string; listId: string; title: string; state: InsightsLayoutState; titleId?: string }) {
  return <section className="nv-insight-recommendation" data-node-id={id} data-name="Widget Recommnded Article"><h2 data-node-id={titleId}>{title}</h2><div className="nv-insight-recommendation-list" data-node-id={listId} data-name="List Rcommendation">{guides.map((guide) => <ArticleCard key={guide.id} guide={guide} mode="recommended" state={state} />)}</div></section>;
}

export function InsightsMainLayout({ variant, state }: { variant: Variant; state: InsightsLayoutState }) {
  const frame = ids[variant];
  const searchRef = useRef<HTMLInputElement>(null);
  const featured = state.guides[0];
  const popular = state.guides.slice(1, 3);
  const recommended = state.guides.slice(3, 7);
  return <div className={`nv-insights-main nv-insights-main-${variant}`}>
    <header className="nv-insights-header" data-node-id={frame.header} data-name="Header">
      {variant !== 'mobile' && <h1>Consejos de salud</h1>}
      <div className="nv-insights-search" data-node-id={variant === 'mobile' ? '504:15705' : undefined} data-name="Header Menu"><input ref={searchRef} type="search" aria-label="Buscar consejos" placeholder="Buscar consejos" value={state.query} onChange={(event) => state.setQuery(event.target.value)} /><button type="button" aria-label="Ir a búsqueda" onClick={() => searchRef.current?.focus()}>⌕</button></div>
      <div className="nv-insights-header-chips" data-node-id={variant === 'mobile' ? '504:15708' : undefined} data-name="Categories" aria-label="Categorías principales">{state.categories.slice(0, 5).map((category) => <button type="button" key={category} aria-pressed={state.category === category} onClick={() => state.setCategory(category)}>{category}</button>)}</div>
    </header>
    <div className="nv-insights-body" data-node-id={frame.body} data-name={variant === 'desktop' ? 'Body' : undefined}>
      <div className="nv-insights-tabs-viewport"><nav className="nv-insights-tabs" data-node-id={frame.tab} data-name="Tab" aria-label="Todos los temas">{state.categories.map((category, index) => <button type="button" key={category} data-node-id={variant === 'mobile' && index < 6 ? `507:${15756 + index}` : undefined} aria-pressed={state.category === category} onClick={() => state.setCategory(category)}>{category}</button>)}</nav></div>
      {featured ? <>
        <div className="nv-insights-top-shell" data-node-id={frame.top} data-name={variant === 'desktop' ? 'Widget Featured Menu' : undefined}><div className="nv-insights-top" data-node-id={frame.topBody} data-name={variant === 'desktop' ? 'Body' : undefined}>
          <section className="nv-insights-feature" data-node-id={frame.featured} data-name="Featured Articles"><h2 data-node-id={variant === 'mobile' ? '507:15788' : undefined}>Artículo destacado</h2><ArticleCard guide={featured} mode="featured" state={state} nodeIds={variant === 'mobile' ? { body: '507:15789', image: '507:15790', copy: '507:15792' } : undefined} /></section>
          <section className="nv-insights-popular" data-node-id={frame.popular} data-name="Widget Popular Menu"><div className="nv-insights-section-heading" data-node-id={variant === 'mobile' ? '507:15853' : undefined}><h2>Consejos populares</h2><button type="button" onClick={() => { state.setQuery(''); state.setCategory('Todas'); }}>Ver todos</button></div><div className="nv-insights-popular-list" data-node-id={frame.popularList} data-name="List Menu">{popular.map((guide) => <ArticleCard key={guide.id} guide={guide} mode="popular" state={state} />)}</div></section>
        </div></div>
        <div className="nv-insights-recommendation-row" data-node-id={frame.recommendation} data-name={variant === 'mobile' ? undefined : 'Section Recomendation'}>
          <RecommendationGroup guides={recommended.slice(0, 2)} id={frame.first} listId={frame.firstList} title="Lecturas recomendadas" state={state} titleId={variant === 'mobile' ? '507:16305' : undefined} />
          <RecommendationGroup guides={recommended.slice(2, 4)} id={frame.second} listId={frame.secondList} title="Para seguir leyendo" state={state} titleId={variant === 'mobile' ? '507:16310' : undefined} />
        </div>
      </> : <p className="nv-insights-empty">No hay guías que coincidan con la búsqueda.</p>}
    </div>
  </div>;
}

export function InsightsAsideLayout({ variant, state, patientName, bellIcon }: { variant: Variant; state: InsightsLayoutState; patientName: string; bellIcon?: string }) {
  const tags = [...new Set(RESOURCE_GUIDES.flatMap((guide) => guide.tags))].slice(0, 6);
  const assigned = state.assignments.map((assignment) => RESOURCE_GUIDES.find((guide) => guide.id === assignment.resource_id)).filter((guide): guide is ResourceGuide => Boolean(guide));
  const reading = [...assigned, ...RESOURCE_GUIDES.filter((guide) => !assigned.includes(guide))].slice(0, 6);
  const frame = variant === 'desktop' ? { tags: '263:7213', tagList: '263:7215', authors: '276:8517', authorList: '276:8519' } : variant === 'tablet' ? { tags: '504:15153', tagList: '504:15155', authors: '504:15163', authorList: '504:15165' } : { tags: '507:16418', tagList: '507:16420', authors: '507:16428', authorList: '507:16430' };
  return <aside className={`nv-insights-aside nv-insights-aside-${variant}`} data-node-id={variant === 'mobile' ? '507:16417' : undefined} data-name={variant === 'mobile' ? 'Right Side' : undefined}>
    {variant === 'desktop' && <div className="nv-insights-profile"><span aria-hidden="true" /><strong>{patientName}<small>Miembro</small></strong>{bellIcon && <img src={bellIcon} alt="" />}</div>}
    <section className="nv-insights-tag-widget" data-node-id={frame.tags} data-name="Widget Trending Tags"><h2>Etiquetas populares</h2><div className="nv-insights-tag-list" data-node-id={frame.tagList} data-name="List Menu">{tags.map((tag, index) => <button type="button" key={tag} onClick={() => { state.setCategory('Todas'); state.setQuery(tag); }}><strong>#{tag.replace(/\s+/g, '')}</strong><span>{RESOURCE_GUIDES[index % RESOURCE_GUIDES.length].category} · Ver guías</span></button>)}</div><button className="nv-insights-see-all" type="button" onClick={() => { state.setCategory('Todas'); state.setQuery(''); }}>Ver todas</button></section>
    <section className="nv-insights-author-widget" data-node-id={frame.authors} data-name="Widget Top Author"><h2>Lecturas del equipo</h2><div className="nv-insights-author-list" data-node-id={frame.authorList} data-name="List Menu">{reading.map((guide) => <button type="button" key={guide.id} onClick={() => state.open(guide.id)}><span className="nv-insights-author-avatar" aria-hidden="true" /><span><strong>Equipo Plan V</strong><small>{guide.title}</small></span></button>)}</div><button className="nv-insights-see-all" type="button" onClick={() => { state.setCategory('Todas'); state.setQuery(''); }}>Ver todas</button></section>
  </aside>;
}
