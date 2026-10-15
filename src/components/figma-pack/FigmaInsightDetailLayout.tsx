import type { ResourceGuide } from '../nutrigo/ShowroomResources';
import type { ShowroomPage } from '../nutrigo/ShowroomPanels';

type Variant = 'desktop' | 'tablet' | 'mobile';
export type InsightDetailState = {
  selected: ResourceGuide | null;
  saved: string[];
  status: string;
  close: () => void;
  open: (id: string) => void;
  toggleSaved: (id: string) => void;
  setQuery: (value: string) => void;
  navigate: (page: ShowroomPage) => void;
  share: (guide: ResourceGuide) => Promise<void>;
};

const frameIds = {
  desktop: { content: '281:9834', header: '284:10153', title: '281:9835', byline: '284:10162', image: '293:7843', paragraphs: ['293:7846', '281:9862', '284:10176', '286:7164', '286:7168', '286:7225', '286:7249'], quote: '286:7116', aside: '281:9895', share: '286:7338', tags: '286:7253', related: '290:7777', relatedList: '290:7805', more: '293:7859', moreList: '293:7861' },
  tablet: { content: '507:17093', header: '507:17094', title: '507:17100', byline: '507:17101', image: '507:17107', paragraphs: ['507:17110', '507:17112', '507:17114', '507:17121', '507:17125', '507:17135', '507:17143'], quote: '507:17118', aside: '507:17186', share: '507:17187', tags: '507:17194', related: '507:17201', relatedList: '507:17203', more: '507:17206', moreList: '507:17208' },
  mobile: { content: '507:17793', header: '507:17794', title: '507:17800', byline: '507:17801', image: '507:17807', paragraphs: ['507:17810', '507:17812', '507:17814', '507:17821', '507:17825', '507:17835', '507:17843'], quote: '507:17818', aside: '507:18004', share: '507:18005', tags: '507:18015', related: '507:18025', relatedList: '507:18027', more: '507:18030', moreList: '507:18032' },
} as const;

function RelatedCard({ guide, state }: { guide: ResourceGuide; state: InsightDetailState }) {
  return <button type="button" className="nv-detail-related-card" onClick={() => state.open(guide.id)}><span className="nv-detail-related-image" aria-hidden="true" /><span className="nv-detail-related-copy"><small>{guide.category}</small><strong>{guide.title}</strong><span>{guide.minutes} min de lectura</span></span></button>;
}

export function InsightDetailLayout({ variant, state, allGuides }: { variant: Variant; state: InsightDetailState; allGuides: ResourceGuide[] }) {
  const guide = state.selected;
  if (!guide) return <div className="figma-insight-detail-empty"><p>La guía no está disponible.</p><button type="button" onClick={state.close}>Volver a consejos de salud</button></div>;
  const ids = frameIds[variant];
  const sections = guide.sections;
  const related = [...guide.related.map((id) => allGuides.find((item) => item.id === id)).filter((item): item is ResourceGuide => Boolean(item)), ...allGuides.filter((item) => item.id !== guide.id && !guide.related.includes(item.id))].slice(0, 4);
  const paragraphs = [
    { title: sections[0]?.title ?? 'Introducción', body: sections[0]?.body ?? guide.summary },
    { title: 'En pocas palabras', body: guide.summary },
    { title: sections[1]?.title ?? 'Cómo usarlo', body: sections[1]?.body ?? guide.summary },
    { title: sections[2]?.title ?? 'Qué hacer después', body: sections[2]?.body ?? guide.summary },
    { title: 'Preguntas para tu consulta', body: `Podés conversar sobre ${guide.tags.join(', ')} y contarle a tu nutricionista qué observaste en tus registros. Llevá tus dudas concretas para que pueda responderlas con el contexto de tu ficha.` },
    { title: 'Otras lecturas', body: `Si necesitás más contexto, continuá con ${related.slice(0, 2).map((item) => item.title).join(' o ')}. Cada guía explica una parte del uso de Plan V y se puede abrir desde esta ficha.` },
    { title: 'Próximo paso', body: `${guide.action.label} desde Plan V cuando quieras revisar la información disponible. Estas guías ayudan a usar la aplicación; tu nutricionista interpreta tus datos y define las indicaciones de cuidado.` },
  ];
  return <div className={`nv-detail-layout nv-detail-layout-${variant}`}>
    <article className="nv-detail-article" data-node-id={ids.content} data-name="Content">
      <div className="nv-detail-eyebrow" data-node-id={ids.header} data-name="Header"><span>{guide.category}</span><i aria-hidden="true" /><span>Guía Plan V · {guide.minutes} min</span></div>
      <h1 data-node-id={ids.title} data-name="Title">{guide.title}</h1>
      <div className="nv-detail-byline" data-node-id={ids.byline} data-name="Footer"><span className="nv-detail-avatar" aria-hidden="true" />Equipo Plan V <span>·</span> Actualizado en 2026</div>
      <div className="nv-detail-image" data-node-id={ids.image} data-name="Image" aria-label={`Imagen de ${guide.title} pendiente de publicación`} />
      {paragraphs.slice(0, 3).map((paragraph, index) => <section key={ids.paragraphs[index]} className="nv-detail-paragraph" data-node-id={ids.paragraphs[index]} data-name="Pharagraph"><h2>{paragraph.title}</h2><p>{paragraph.body}</p></section>)}
      <blockquote className="nv-detail-quote" data-node-id={ids.quote} data-name="Quotation">Si una indicación no está clara, consultala con tu nutricionista antes de cambiar tu plan.</blockquote>
      {paragraphs.slice(3).map((paragraph, index) => <section key={ids.paragraphs[index + 3]} className="nv-detail-paragraph" data-node-id={ids.paragraphs[index + 3]} data-name="Pharagraph"><h2>{paragraph.title}</h2><p>{paragraph.body}</p>{index === 1 && <ul>{sections.map((section) => <li key={section.title}>{section.title}</li>)}</ul>}{index === 2 && <div className="nv-detail-related-inline">{related.slice(0, 2).map((item) => <button type="button" key={item.id} onClick={() => state.open(item.id)}>{item.title} →</button>)}</div>}{index === 3 && <button className="nv-detail-action" type="button" onClick={() => state.navigate(guide.action.page)}>{guide.action.label} →</button>}</section>)}
    </article>
    <aside className="nv-detail-aside" data-node-id={ids.aside} data-name="Right Side">
      <section className="nv-detail-share" data-node-id={ids.share} data-name="Section Tags"><h2>Compartir</h2><div><button type="button" aria-label="Compartir guía" onClick={() => void state.share(guide)}>↗</button><button type="button" aria-label={state.saved.includes(guide.id) ? 'Quitar de guardadas' : 'Guardar guía'} aria-pressed={state.saved.includes(guide.id)} onClick={() => state.toggleSaved(guide.id)}>{state.saved.includes(guide.id) ? '★' : '☆'}</button><button type="button" aria-label="Abrir mensajes" onClick={() => state.navigate('mensajes')}>✉</button><button type="button" aria-label="Volver a consejos" onClick={state.close}>←</button></div>{state.status && <p role="status">{state.status}</p>}</section>
      <section className="nv-detail-tags" data-node-id={ids.tags} data-name="Section Tags"><h2>Etiquetas</h2><div>{guide.tags.map((tag) => <button type="button" key={tag} onClick={() => { state.close(); state.setQuery(tag); }}>#{tag.replace(/\s+/g, '')}</button>)}</div></section>
      <section className="nv-detail-related" data-node-id={ids.related} data-name="Section Related Articles"><h2>Guías relacionadas</h2><div data-node-id={ids.relatedList} data-name="List Rcommendation">{related.slice(0, 2).map((item) => <RelatedCard guide={item} state={state} key={item.id} />)}</div></section>
      <section className="nv-detail-more" data-node-id={ids.more} data-name="Section Related VIdeo"><h2>Seguí explorando</h2><div data-node-id={ids.moreList} data-name="List Rcommendation">{related.slice(2, 4).map((item) => <RelatedCard guide={item} state={state} key={item.id} />)}</div></section>
    </aside>
  </div>;
}
