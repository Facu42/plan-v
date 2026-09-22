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
import { Icon, type IconName } from '../shared/Icon';
import { NvBadge, NvButton, NvState } from './primitives';
import type { ShowroomPage } from './ShowroomPanels';
import './showroom-resources.css';

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

export function ShowroomResources({ patientId, query, assignments = [], onNavigate, onMarkRead, library: injected }: {
  patientId: string;
  query: string;
  assignments?: ResourceAssignment[];
  onNavigate: (page: ShowroomPage) => void;
  onMarkRead?: (resourceId: string) => Promise<void>;
  library?: PatientLibraryView | null;
}) {
  const [category, setCategory] = useState('Todas');
  const [selectedId, setSelectedId] = useState<string | null>(() => typeof window === 'undefined' ? null : resourceGuideIdFromHash(window.location.hash));
  const [remote, setRemote] = useState<PatientLibraryView | null>(injected ?? null);
  const [shareStatus, setShareStatus] = useState('');
  const [readStatus, setReadStatus] = useState('');
  const snapshot = remote ?? emptyLibrary(patientId);
  const catalog = useMemo(() => {
    const operational = snapshot.resources.map(toResourceGuide);
    const articles = snapshot.articles.filter((entry) => entry.published).map(toResourceGuide);
    return [...operational, ...articles];
  }, [snapshot]);
  const categories = ['Todas', ...new Set(catalog.map((guide) => guide.category))];
  const guides = useMemo(() => filterResourceGuides(catalog, query, category), [catalog, query, category]);
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

  if (selected) {
    const related = selected.related.map((id) => catalog.find((guide) => guide.id === id)).filter((guide): guide is ResourceGuide => Boolean(guide));
    const isSaved = saved.some((row) => row.item_id === selected.id);
    return <section className="nvr-resources nvr-detail" aria-label={`${selected.kind === 'clinical' ? 'Artículo' : 'Guía'}: ${selected.title}`}>
      <div className="nvr-detail-toolbar"><button type="button" onClick={closeGuide}>← Volver a Recursos</button><div><button type="button" onClick={() => void shareSelected(selected)}><Icon name="arrow" size={15} /> Compartir</button><button type="button" aria-pressed={isSaved} onClick={() => void toggleSaved(selected)}><Icon name="pin" size={15} /> {isSaved ? 'Guardada' : 'Guardar'}</button></div></div>
      {shareStatus && <p className="nvr-share-status" role="status" aria-live="polite">{shareStatus}</p>}
      <div className="nvr-detail-layout">
        <article className="nvr-article">
          <header><span>{selected.eyebrow}</span><h2>{selected.title}</h2><p>{selected.summary}</p><div><NvBadge>{selected.category}</NvBadge><small>{selected.minutes} min de lectura</small><small>{selected.kind === 'clinical' ? `Autoría: ${selected.author_name}` : 'Guía de uso de Plan V'}</small>{selected.reviewed_at && <small>Revisado</small>}</div></header>
          <div className={`nvr-cover nvr-cover-${selected.icon}`}><span className="nv-icon-tile"><Icon name={selected.icon} size={34} /></span><strong>{selected.category}</strong><small>{selected.kind === 'clinical' ? 'Artículo revisado' : 'Recurso operativo'}</small></div>
          <div className="nvr-sections">{selected.sections.map((section) => <section key={section.title}><h3>{section.title}</h3><p>{section.body}</p></section>)}</div>
          <aside className="nvr-disclaimer"><Icon name="sparkle" size={18} /><p><strong>{selected.kind === 'clinical' ? 'Límite editorial' : 'Sobre estas guías'}</strong><span>{selected.license_note} {selected.kind === 'clinical' ? 'No diagnostica ni prescribe.' : 'Explican cómo usar Plan V. No reemplazan las indicaciones de tu profesional.'}</span></p></aside>
          <NvButton onClick={() => onNavigate(selected.action.page)}>{selected.action.label} <Icon name="arrow" size={15} /></NvButton>
        </article>
        <aside className="nvr-related">
          <section><span>ETIQUETAS</span><div className="nvr-tags">{selected.tags.map((tag) => <small key={tag}>#{tag.replace(/\s+/g, '')}</small>)}</div></section>
          <section><span>RELACIONADOS</span><div>{related.map((guide) => <button type="button" key={guide.id} onClick={() => openGuide(guide.id, true)}><span className="nv-icon-tile"><Icon name={guide.icon} size={16} /></span><span><strong>{guide.title}</strong><small>{guide.category} · {guide.minutes} min</small></span><Icon name="chevron" size={14} /></button>)}</div></section>
          <p><Icon name="pin" size={15} /> Guardado en tu cuenta, no sólo en este dispositivo.</p>
        </aside>
      </div>
    </section>;
  }

  const featured = guides[0];
  return <section className="nvr-resources" aria-label="Recursos">
    <div className="nvr-layout">
    <div className="nvr-main">
      <header className="nvr-hero"><div><span>RECURSOS DE PLAN V</span><h2>Guías y artículos revisados</h2><p>Pasos para usar Plan V y lecturas con autoría, sólo las que te corresponden.</p></div><span className="nvr-hero-mark"><Icon name="sparkle" size={25} /></span></header>
      {assignedGuides.length > 0 && <section className="nvr-assigned" aria-label="Recursos asignados"><header><div><span>PARA VOS</span><h3>Asignado por tu nutricionista</h3></div><NvBadge>{assignedGuides.length}</NvBadge></header><div>{assignedGuides.map(({ assignment, guide }) => <button type="button" key={assignment.id} onClick={() => openGuide(guide.id)}><span className="nv-icon-tile"><Icon name={guide.icon} size={18} /></span><span><strong>{guide.title}</strong><small>{assignment.read_at ? `Leída · ${resourceAssignmentDateLabel(assignment.read_at)}` : `Pendiente de lectura · asignada ${resourceAssignmentDateLabel(assignment.assigned_at)}`} · {guide.minutes} min</small></span><Icon name="chevron" size={15} /></button>)}</div>{readStatus && <p role="status">{readStatus}</p>}</section>}
      <div className="nvr-filters" aria-label="Categorías de recursos">{categories.map((value) => <button type="button" key={value} aria-pressed={category === value} onClick={() => setCategory(value)}>{value}</button>)}</div>
        {featured ? <>
          <article className="nvr-featured">
            <div className={`nvr-cover nvr-cover-${featured.icon}`}><span className="nv-icon-tile"><Icon name={featured.icon} size={30} /></span><strong>{featured.category}</strong><small>{featured.kind === 'clinical' ? 'Artículo revisado' : 'Guía de uso'}</small></div>
            <div><NvBadge>{featured.eyebrow}</NvBadge><h3>{featured.title}</h3><p>{featured.summary}</p><small>{featured.minutes} min de lectura</small><NvButton onClick={() => openGuide(featured.id)}>Abrir {featured.kind === 'clinical' ? 'artículo' : 'guía'} <Icon name="arrow" size={15} /></NvButton></div>
          </article>
          <section className="nvr-library" aria-label="Biblioteca de recursos"><header><div><span>BIBLIOTECA</span><h3>Visible para vos</h3></div><small>{guides.length} {guides.length === 1 ? 'resultado' : 'resultados'}</small></header><div className="nvr-grid">{guides.map((guide) => <article key={guide.id}><div className={`nvr-card-icon nvr-card-${guide.icon}`}><Icon name={guide.icon} size={19} /></div><div><NvBadge tone={guide.kind === 'clinical' ? 'gold' : guide.category === 'Movimiento' ? 'coral' : guide.category === 'Organización' ? 'gold' : 'green'}>{guide.category}</NvBadge><h4>{guide.title}</h4><p>{guide.summary}</p><small>{guide.minutes} min{guide.kind === 'clinical' ? ` · ${guide.author_name}` : ''}</small></div><button type="button" onClick={() => openGuide(guide.id)}>Abrir {guide.kind === 'clinical' ? 'artículo' : 'guía'} <Icon name="arrow" size={14} /></button></article>)}</div></section>
        </> : <NvState title="Sin coincidencias" description="Probá con otra palabra o elegí una categoría diferente." />}
      </div>
      <aside className="nvr-aside" aria-label="Explorar recursos">
        <section><span>EXPLORAR</span><h3>Categorías</h3><div>{categories.slice(1).map((value) => <button type="button" key={value} onClick={() => setCategory(value)}><span>{value}</span><small>{catalog.filter((guide) => guide.category === value).length}</small></button>)}</div></section>
        <section><span>GUARDADO UNIFICADO</span><h3>Para volver después</h3><strong>{saved.length}</strong><p>{saved.length === 1 ? 'ítem en tu cuenta' : 'ítems en tu cuenta'}</p><small>Recetas, artículos y guías. No queda sólo en este dispositivo.</small>{saved.length > 0 && <div className="nvr-saved">{saved.map((row) => <button type="button" key={row.id} onClick={() => row.item_kind === 'recipe' ? onNavigate('recetas') : openGuide(row.item_id)}>{KIND_LABEL[row.item_kind]} · {row.title}<Icon name="chevron" size={13} /></button>)}</div>}</section>
      </aside>
    </div>
    <p className="nvr-note"><Icon name="sparkle" size={16} /> Las guías operativas son de Plan V. Los artículos clínicos aparecen sólo si están publicados, revisados y asignados. Sin imágenes remotas de terceros.</p>
  </section>;
}
