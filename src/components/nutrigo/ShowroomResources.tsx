import { useEffect, useMemo, useState } from 'react';
import type { ResourceAssignment } from '../../types';
import { resourcesApi } from '../../api/resources';
import { isAbortError } from '../../api/client';
import {
  SEEDED_OPERATIONAL_RESOURCES,
  SEEDED_RESOURCES,
  favoriteKindForResource,
  type EditorialResource,
  type FavoriteView,
  type PatientLibraryView,
} from '../../types/resources';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { Icon, type IconName } from '../shared/Icon';
import { NvBadge, NvButton, NvState } from './primitives';
import type { ShowroomPage } from './ShowroomPanels';
import './showroom-resources.css';
import './progreso-recursos-fig.css';
import './figma-mobile-resources.css';

export type ResourceGuide = {
  id: string;
  title: string;
  category: string;
  eyebrow: string;
  summary: string;
  minutes: number;
  icon: IconName;
  tags: string[];
  sections: Array<{ title: string; body: string }>;
  related: string[];
  action: { label: string; page: ShowroomPage };
  kind: 'operational' | 'clinical';
  author_name: string;
  reviewed_at: string | null;
  license_note: string;
  cover_url: string | null;
};

const ICONS: IconName[] = ['list', 'camera', 'check', 'message', 'trend', 'heart', 'sparkle', 'leaf'];
const asIcon = (value: string): IconName => ICONS.includes(value as IconName) ? value as IconName : 'sparkle';

export function toResourceGuide(entry: EditorialResource): ResourceGuide {
  return {
    id: entry.slug,
    title: entry.title,
    category: entry.category,
    eyebrow: entry.eyebrow,
    summary: entry.summary,
    minutes: entry.minutes,
    icon: asIcon(entry.icon),
    tags: entry.tags,
    sections: entry.sections,
    related: entry.related,
    action: { label: entry.action_label, page: entry.action_page as ShowroomPage },
    kind: entry.kind,
    author_name: entry.author_name,
    reviewed_at: entry.reviewed_at,
    license_note: entry.license_note,
    cover_url: entry.cover_url ?? null,
  };
}

export const RESOURCE_GUIDES: ResourceGuide[] = SEEDED_OPERATIONAL_RESOURCES.map(toResourceGuide);

export const resourceGuideIdFromHash = (hash: string) => {
  const match = /^#recurso=([^&]+)$/.exec(hash);
  if (!match) return null;
  let id = '';
  try { id = decodeURIComponent(match[1]); } catch { return null; }
  return SEEDED_RESOURCES.some((entry) => entry.slug === id) ? id : null;
};

export const buildResourceShareUrl = (id: string, href: string) => {
  const url = new URL(href);
  url.pathname = '/app/recursos';
  url.searchParams.delete('design');
  url.hash = `recurso=${encodeURIComponent(id)}`;
  return url.toString();
};

type ShareDependencies = {
  href: string;
  share?: (data: ShareData) => Promise<void>;
  writeText?: (text: string) => Promise<void>;
};

export async function shareResourceGuide(guide: ResourceGuide, dependencies: ShareDependencies) {
  const url = buildResourceShareUrl(guide.id, dependencies.href);
  if (dependencies.share) {
    await dependencies.share({ title: guide.title, text: guide.summary, url });
    return 'shared' as const;
  }
  if (dependencies.writeText) {
    await dependencies.writeText(url);
    return 'copied' as const;
  }
  return 'unavailable' as const;
}

const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-AR');
export const filterResourceGuides = (guides: ResourceGuide[], query: string, category: string) => {
  const term = normalize(query);
  return guides.filter((guide) => (category === 'Todas' || guide.category === category)
    && (!term || normalize(`${guide.title} ${guide.category} ${guide.summary} ${guide.tags.join(' ')}`).includes(term)));
};

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export const resourceAssignmentDateLabel = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})T/.exec(value);
  if (!match) return 'fecha no disponible';
  const month = Number(match[2]);
  const day = Number(match[3]);
  return month >= 1 && month <= 12 && day >= 1 && day <= 31 ? `${day} ${MONTHS[month - 1]}` : 'fecha no disponible';
};

const KIND_LABEL: Record<FavoriteView['item_kind'], string> = {
  resource: 'Guía',
  article: 'Artículo',
  recipe: 'Receta',
  plan_b: 'Plan B',
};

function emptyLibrary(patientId: string): PatientLibraryView {
  return {
    patient_id: patientId,
    resources: SEEDED_OPERATIONAL_RESOURCES.map((entry) => ({ ...entry })),
    articles: [],
    recipes: [],
    plan_b: null,
    assignments: [],
    favorites: [],
    hits: [],
  };
}

/** Fecha editorial "16 sep 2026", sin depender de la zona del navegador (como "Sept 15, 2028" del archivo). */
export const resourceDateLabel = (value: string | null) => {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  const month = Number(match[2]);
  const day = Number(match[3]);
  return month >= 1 && month <= 12 && day >= 1 && day <= 31 ? `${day} ${MONTHS[month - 1]} ${match[1]}` : null;
};

/** Trending Tags (263:7213) con las etiquetas reales del catálogo: cuántas guías usan cada una y su categoría más frecuente. */
export function topResourceTags(guides: ResourceGuide[]) {
  const tags = new Map<string, { tag: string; count: number; categories: Map<string, number> }>();
  for (const guide of guides) {
    for (const tag of new Set(guide.tags)) {
      const entry = tags.get(tag) ?? { tag, count: 0, categories: new Map<string, number>() };
      entry.count += 1;
      entry.categories.set(guide.category, (entry.categories.get(guide.category) ?? 0) + 1);
      tags.set(tag, entry);
    }
  }
  return [...tags.values()]
    .map(({ tag, count, categories }) => ({ tag, count, category: [...categories.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'))[0][0] }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'es'));
}

const hashTag = (tag: string) => `#${tag.replace(/\s+(\p{L})/gu, (_, letter: string) => letter.toLocaleUpperCase('es-AR')).replace(/\s+/g, '')}`;
const readLabel = (guide: ResourceGuide) => guide.kind === 'clinical' ? 'artículo' : 'guía';

function Cover({ guide, size }: { guide: ResourceGuide; size: number }) {
  return <div className="nvrf-image">
    {guide.cover_url ? <img src={guide.cover_url} alt="" loading="lazy" /> : <Icon name={guide.icon} size={size} />}
  </div>;
}

function Meta({ guide }: { guide: ResourceGuide }) {
  const date = resourceDateLabel(guide.reviewed_at);
  return <p className="nvrf-meta"><span>{guide.category}</span><i aria-hidden="true" /><small>{date ? `Revisado ${date}` : `${guide.minutes} min de lectura`}</small></p>;
}

function Author({ guide }: { guide: ResourceGuide }) {
  return <p className="nvrf-author"><i aria-hidden="true" />{guide.author_name}</p>;
}

export function ShowroomResources({ patientId, query, assignments = [], onNavigate, onMarkRead, onQueryChange, library: injected }: {
  patientId: string;
  query: string;
  assignments?: ResourceAssignment[];
  onNavigate: (page: ShowroomPage) => void;
  onMarkRead?: (resourceId: string) => Promise<void>;
  /** Con esto el buscador vive dentro de la cabecera del archivo (Header 371:10069). */
  onQueryChange?: (value: string) => void;
  library?: PatientLibraryView | null;
}) {
  const [category, setCategory] = useState('Todas');
  const [selectedId, setSelectedId] = useState<string | null>(() => typeof window === 'undefined' ? null : resourceGuideIdFromHash(window.location.hash));
  const [remote, setRemote] = useState<PatientLibraryView | null>(injected ?? null);
  const [shareStatus, setShareStatus] = useState('');
  const [readStatus, setReadStatus] = useState('');
  const [allTags, setAllTags] = useState(false);
  const snapshot = remote ?? emptyLibrary(patientId);
  const catalog = useMemo(() => {
    const operational = snapshot.resources.map(toResourceGuide);
    const articles = snapshot.articles.filter((entry) => entry.published).map(toResourceGuide);
    return [...operational, ...articles];
  }, [snapshot]);
  const categories = ['Todas', ...new Set(catalog.map((guide) => guide.category))];
  const guides = useMemo(() => filterResourceGuides(catalog, query, category), [catalog, query, category]);
  const tags = useMemo(() => topResourceTags(catalog), [catalog]);
  const selected = catalog.find((guide) => guide.id === selectedId) ?? null;
  const assignedGuides = (assignments.length ? assignments : snapshot.assignments.map((row) => ({
    id: row.id, patient_id: row.patient_id, resource_id: row.resource_id, assigned_at: row.assigned_at, read_at: row.read_at,
  }))).map((assignment) => ({
    assignment,
    guide: catalog.find((guide) => guide.id === assignment.resource_id),
  })).filter((item): item is { assignment: ResourceAssignment; guide: ResourceGuide } => Boolean(item.guide));
  const saved = snapshot.favorites;

  useEffect(() => {
    if (injected) {
      setRemote(injected);
      return;
    }
    const controller = new AbortController();
    resourcesApi.library(patientId, query, false, controller.signal).then((result) => {
      setRemote(result.library);
    }).catch((error) => {
      if (isAbortError(error)) return;
      setRemote(emptyLibrary(patientId));
    });
    return () => controller.abort();
  }, [injected, patientId, query]);
  useEffect(() => {
    setSelectedId(resourceGuideIdFromHash(window.location.hash));
  }, [patientId]);
  useEffect(() => {
    const syncHash = () => { setSelectedId(resourceGuideIdFromHash(window.location.hash)); setShareStatus(''); };
    window.addEventListener('popstate', syncHash);
    window.addEventListener('hashchange', syncHash);
    return () => { window.removeEventListener('popstate', syncHash); window.removeEventListener('hashchange', syncHash); };
  }, []);
  useEffect(() => {
    const assignment = assignments.find((item) => item.resource_id === selectedId);
    if (!selectedId || !assignment || assignment.read_at || !onMarkRead) return;
    let active = true;
    setReadStatus('');
    void onMarkRead(selectedId).catch(() => {
      if (active) setReadStatus('No se pudo registrar la lectura.');
    });
    return () => { active = false; };
  }, [assignments, onMarkRead, selectedId]);
  const openGuide = (id: string, replace = false) => {
    const method = replace ? 'replaceState' : 'pushState';
    const state = replace ? window.history.state : { ...window.history.state, planVResourceOpen: true };
    window.history[method](state, '', buildResourceShareUrl(id, window.location.href));
    setSelectedId(id);
    setShareStatus('');
  };
  const closeGuide = () => {
    if (window.history.state?.planVResourceOpen) { window.history.back(); return; }
    const url = new URL(window.location.href);
    url.hash = '';
    window.history.replaceState(window.history.state, '', url);
    setSelectedId(null);
    setShareStatus('');
  };
  const toggleSaved = async (guide: ResourceGuide) => {
    try {
      const result = await resourcesApi.favorite(patientId, favoriteKindForResource(guide.kind), guide.id);
      setRemote(result.library);
    } catch {
      setShareStatus('No se pudo guardar en tu cuenta.');
    }
  };
  const shareSelected = async (guide: ResourceGuide) => {
    try {
      const result = await shareResourceGuide(guide, {
        href: window.location.href,
        share: navigator.share?.bind(navigator),
        writeText: navigator.clipboard?.writeText.bind(navigator.clipboard),
      });
      setShareStatus(result === 'shared' ? 'Guía compartida.' : result === 'copied' ? 'Enlace copiado.' : 'Compartir no está disponible en este navegador.');
    } catch {
      setShareStatus('No se pudo compartir la guía.');
    }
  };

  /* ---------- Insight Details (279:9301): contenido 800 + 36 + rail 325 ---------- */
  if (selected) {
    const related = selected.related.map((id) => catalog.find((guide) => guide.id === id)).filter((guide): guide is ResourceGuide => Boolean(guide));
    const isSaved = saved.some((row) => row.item_id === selected.id);
    const date = resourceDateLabel(selected.reviewed_at);
    return <section className="nvrf nvrf-detail" data-figma-frame="507:17412" aria-label={`${selected.kind === 'clinical' ? 'Artículo' : 'Guía'}: ${selected.title}`}>
      <button type="button" className="nvrf-back" onClick={closeGuide}><Icon name="arrow" size={14} /> Volver a Recursos</button>
      <div className="nvrf-detail-layout">
        <article className="nvrf-article" data-figma-node="507:17793">
          <header>
            <p className="nvrf-meta"><span>{selected.category}</span><i aria-hidden="true" /><small>{selected.minutes} min de lectura</small></p>
            <h2>{selected.title}</h2>
            <p className="nvrf-byline"><i aria-hidden="true" />{selected.kind === 'clinical' ? selected.author_name : 'Guía de uso de Plan V'}{date && <><b aria-hidden="true" /><small>Revisado {date}</small></>}</p>
          </header>
          <Cover guide={selected} size={48} />
          <p className="nvrf-intro">{selected.summary}</p>
          <div className="nvrf-sections">{selected.sections.map((section) => <section key={section.title}><h3>{section.title}</h3><p>{section.body}</p></section>)}</div>
          <aside className="nvrf-quote"><p>{selected.license_note} {selected.kind === 'clinical' ? 'No diagnostica ni prescribe.' : 'No reemplaza las indicaciones de tu profesional.'}</p><strong>– {selected.kind === 'clinical' ? 'Límite editorial' : 'Sobre estas guías'} –</strong></aside>
          <NvButton onClick={() => onNavigate(selected.action.page)}>{selected.action.label} <Icon name="arrow" size={15} /></NvButton>
        </article>
        <aside className="nvrf-detail-rail" data-figma-node="507:18004">
          <section><header className="nvrf-head"><h3>Compartir</h3></header>
            <div className="nvrf-share">
              <button type="button" onClick={() => void shareSelected(selected)}><Icon name="arrow" size={16} /> Compartir</button>
              <button type="button" aria-pressed={isSaved} onClick={() => void toggleSaved(selected)}><Icon name="pin" size={16} /> {isSaved ? 'Guardada' : 'Guardar'}</button>
            </div>
            {shareStatus && <p className="nvrf-status" role="status" aria-live="polite">{shareStatus}</p>}
          </section>
          <section><header className="nvrf-head"><h3>Etiquetas</h3></header><div className="nvrf-tags">{selected.tags.map((tag) => <small key={tag}><b>#</b>{tag}</small>)}</div></section>
          {related.length > 0 && <section><header className="nvrf-head"><h3>Relacionados</h3></header><div className="nvrf-related">{related.map((guide) => <button type="button" key={guide.id} onClick={() => openGuide(guide.id, true)}><Cover guide={guide} size={28} /><strong>{guide.title}</strong><span>{guide.category}</span></button>)}</div></section>}
        </aside>
      </div>
      <footer className="nvrf-figma-footer"><strong>Copyright © {new Date().getFullYear()} Plan V</strong><span>Privacidad　 Condiciones　 Contacto</span></footer>
    </section>;
  }

  /* ---------- Insights (263:6588): contenido 856 + rail 249 ---------- */
  const [featured, ...others] = guides;
  const popular = others.slice(0, 2);
  const more = others.slice(2);
  const visibleTags = allTags ? tags : tags.slice(0, 6);
  return <section className="nvrf" data-figma-frame="504:15334" aria-label="Recursos">
    <div className="nvrf-layout">
      <div className="nvrf-main">
        <header className="nvrf-hero" data-figma-node="504:15702">
          <h2>Guías y artículos revisados</h2>
          {onQueryChange && <label className="nvrf-search"><span className="nvrf-sr">Buscar recursos y guardados</span><input type="search" placeholder="Buscar guías y artículos" value={query} onChange={(event) => onQueryChange(event.target.value)} /><span className="nvrf-search-go" aria-hidden="true"><MagnifyingGlass size={18} /></span></label>}
          {onQueryChange && tags.length > 0 && <div className="nvrf-chips" aria-label="Etiquetas frecuentes">{tags.slice(0, 5).map(({ tag }) => <button type="button" key={tag} aria-pressed={normalize(query) === normalize(tag)} onClick={() => onQueryChange(normalize(query) === normalize(tag) ? '' : tag)}>{tag}</button>)}</div>}
        </header>
        <div className="nvrf-tabs" data-figma-node="507:15755" role="group" aria-label="Categorías de recursos">{categories.map((value) => <button type="button" key={value} aria-pressed={category === value} onClick={() => setCategory(value)}>{value}</button>)}</div>
        {featured ? <>
          <div className="nvrf-featured-row">
            <section className="nvrf-featured" data-figma-node="507:15787" aria-label="Destacado">
              <header className="nvrf-head"><h3>Destacado</h3></header>
              <button type="button" className="nvrf-card-link" aria-label={`Abrir ${readLabel(featured)}: ${featured.title}`} onClick={() => openGuide(featured.id)}>
                <Cover guide={featured} size={40} />
                <span className="nvrf-featured-info"><Meta guide={featured} /><strong>{featured.title}</strong><span className="nvrf-desc">{featured.summary}</span><Author guide={featured} /></span>
              </button>
            </section>
            {popular.length > 0 && <section className="nvrf-popular" data-figma-node="507:15852" aria-label="Biblioteca de recursos">
              <header className="nvrf-head"><h3>Visible para vos</h3><small>{guides.length} {guides.length === 1 ? 'resultado' : 'resultados'}</small></header>
              <div>{popular.map((guide) => <button type="button" className="nvrf-card-link nvrf-popular-card" key={guide.id} aria-label={`Abrir ${readLabel(guide)}: ${guide.title}`} onClick={() => openGuide(guide.id)}>
                <Cover guide={guide} size={32} />
                <span className="nvrf-popular-info"><Meta guide={guide} /><strong>{guide.title}</strong><span className="nvrf-desc">{guide.summary}</span><Author guide={guide} /></span>
              </button>)}</div>
            </section>}
          </div>
          {more.length > 0 && <section className="nvrf-more" data-figma-node="507:16304" aria-label="Más para leer">
            <header className="nvrf-head"><h3>Más para leer</h3></header>
            <div className="nvrf-grid">{more.map((guide) => <button type="button" className="nvrf-card-link nvrf-small-card" key={guide.id} aria-label={`Abrir ${readLabel(guide)}: ${guide.title}`} onClick={() => openGuide(guide.id)}>
              <Cover guide={guide} size={28} />
              <span><span className="nvrf-cat">{guide.category}</span><strong>{guide.title}</strong><small>{guide.minutes} min{guide.kind === 'clinical' ? ` · ${guide.author_name}` : ''}</small></span>
            </button>)}</div>
          </section>}
        </> : <NvState title="Sin coincidencias" description="Probá con otra palabra o elegí una categoría diferente." />}
      </div>

      <aside className="nvrf-rail" data-figma-node="507:16417" aria-label="Explorar recursos">
        {assignedGuides.length > 0 && <section className="nvrf-assigned" aria-label="Recursos asignados">
          <header className="nvrf-head"><h3>Asignado por tu nutricionista</h3><NvBadge>{assignedGuides.length}</NvBadge></header>
          <div className="nvrf-list">{assignedGuides.map(({ assignment, guide }) => <button type="button" key={assignment.id} onClick={() => openGuide(guide.id)}>
            <strong>{guide.title}</strong>
            <span><span className="nvrf-cat">{guide.category}</span><i aria-hidden="true" /><small>{assignment.read_at ? `Leída · ${resourceAssignmentDateLabel(assignment.read_at)}` : `Pendiente de lectura · asignada ${resourceAssignmentDateLabel(assignment.assigned_at)}`}</small></span>
          </button>)}</div>
          {readStatus && <p className="nvrf-status" role="status">{readStatus}</p>}
        </section>}
        {tags.length > 0 && <section aria-label="Etiquetas">
          <header className="nvrf-head"><h3>Etiquetas</h3></header>
          <div className="nvrf-list">{visibleTags.map(({ tag, count, category: tagCategory }) => {
            const body = <><strong>{hashTag(tag)}</strong><span><span className="nvrf-cat">{tagCategory}</span><i aria-hidden="true" /><small>{count} {count === 1 ? 'recurso' : 'recursos'}</small></span></>;
            return onQueryChange ? <button type="button" key={tag} onClick={() => onQueryChange(tag)}>{body}</button> : <div key={tag}>{body}</div>;
          })}</div>
          {tags.length > 6 && <button type="button" className="nvrf-more-btn" aria-expanded={allTags} onClick={() => setAllTags((value) => !value)}>{allTags ? 'Mostrar menos' : 'Mostrar más'}</button>}
        </section>}
        <section aria-label="Guardado en tu cuenta">
          <header className="nvrf-head"><h3>Guardados</h3><NvBadge>{saved.length}</NvBadge></header>
          {saved.length > 0 ? <div className="nvrf-people">{saved.map((row) => {
            const guide = catalog.find((entry) => entry.id === row.item_id);
            return <button type="button" key={row.id} onClick={() => row.item_kind === 'recipe' ? onNavigate('recetas') : openGuide(row.item_id)}>
              <span className={`nvrf-avatar ${row.item_kind}`}><Icon name={guide?.icon ?? (row.item_kind === 'recipe' ? 'leaf' : 'sparkle')} size={18} /></span>
              <span><strong>{row.title}</strong><small>{KIND_LABEL[row.item_kind]}</small></span>
            </button>;
          })}</div> : <p className="nvrf-empty">Todavía no guardaste recetas, artículos ni guías.</p>}
          <p className="nvrf-empty">No queda sólo en este dispositivo: se guarda en tu cuenta.</p>
        </section>
      </aside>
    </div>
    <footer className="nvrf-figma-footer" data-figma-node="504:15358"><strong>Copyright © {new Date().getFullYear()} Plan V</strong><span>Privacidad　 Condiciones　 Contacto</span></footer>
  </section>;
}
