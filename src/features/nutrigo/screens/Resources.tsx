import { useEffect, useRef, useState, type ReactNode } from 'react';
import { FramePair } from '../FramePair';
import { nodeName, sourceText, type SourceBinding, type SourceNode, type SourceResolver } from '../SourceView';
import { resourcesApi } from '../../../api/resources';
import { api } from '../../../api/client';
import { favoriteKindForResource, type EditorialResource } from '../../../types/resources';
import { isAllowedPage } from '../../../components/nutrigo/app-location';
import { plateImage } from '../plate-photo';
import { CREAM_BG, GREEN_BG, swapBackground } from '../source-tone';
import { lineClamp, oneLineEllipsis, shrinkable } from '../text-fit';
import { leftAlignedSearch } from './search-align';
import { dateLabel, descendants, EmptyState, errorText, leaf, listChildren, objects, searchBinding, source, Stateful, useRemote, type ScreenProps } from './shared';

type Props = ScreenProps & { resourceId?: string | null; onOpenResource?: (slug: string | null) => void };
type View = 'all' | 'recent' | 'saved' | 'assigned' | 'short';
/** Las cinco pastillas del buscador del archivo pasan a ser los filtros de Plan V. */
const VIEWS: { id: View; label: string; hint: string }[] = [
  { id: 'all', label: 'Todos', hint: 'Ver todos los recursos' }, { id: 'recent', label: 'Recientes', hint: 'Ordenar por fecha de revisión' },
  { id: 'saved', label: 'Guardados', hint: 'Ver mis recursos guardados' }, { id: 'assigned', label: 'Indicados', hint: 'Ver los recursos que te indicó tu nutricionista' },
  { id: 'short', label: 'Lectura breve', hint: 'Ver recursos de hasta 3 minutos' },
];
const is = (node: SourceNode, ...samples: string[]) => leaf(node) && samples.includes(sourceText(node));
const inner = (node: SourceNode, resolve: SourceResolver): ReactNode[] => node.children.map((child, index) => typeof child === 'object' ? source(child, resolve, index) : child);
/** Minutos de lectura; sin un valor válido, «Lectura breve» (nunca «0 min»). */
const readingTime = (minutes: number) => Number.isFinite(minutes) && minutes > 0 ? `${minutes} min de lectura` : 'Lectura breve';
const NO_CATEGORY = 'Sin categoría';
const hashResource = () => { if (typeof window === 'undefined') return null; try { return window.location.hash.startsWith('#recurso=') ? decodeURIComponent(window.location.hash.slice(9)) : null; } catch { return null; } };
export function NutrigoResources({ patient, query = '', onNavigate, onSignOut, resourceId, onOpenResource }: Props) {
  const remote = useRemote(patient.id, signal => resourcesApi.library(patient.id, '', false, signal).then(result => result.library));
  const [search, setSearch] = useState(query); const [category, setCategory] = useState(''); const [view, setView] = useState<View>('all'); const [moreTags, setMoreTags] = useState(false); const [moreAuthors, setMoreAuthors] = useState(false); const [selected, setSelected] = useState<string | null>(resourceId ?? hashResource());
  const [error, setError] = useState(''); const [status, setStatus] = useState(''); const [busy, setBusy] = useState(false); const lock = useRef(false);
  const catalog = [...(remote.data?.articles ?? []), ...(remote.data?.resources ?? [])]; const categories = [...new Set(catalog.map(item => item.category))].filter(Boolean); const favorites = new Set(remote.data?.favorites.map(item => item.item_id) ?? []);
  const assignedIds = new Set(remote.data?.assignments.flatMap(item => [item.slug, item.resource_id]) ?? []);
  const matches = (item: EditorialResource) => (!category || item.category === category) && (view !== 'saved' || favorites.has(item.id)) && (view !== 'assigned' || assignedIds.has(item.slug) || assignedIds.has(item.id)) && (view !== 'short' || item.minutes <= 3) && `${item.title} ${item.summary} ${item.author_name} ${item.tags.join(' ')}`.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es'));
  const filtered = catalog.filter(matches);
  const visible = view === 'recent' ? filtered.slice().sort((a, b) => (b.reviewed_at ?? '').localeCompare(a.reviewed_at ?? '')) : filtered;
  // Lugares del archivo: destacado (1), lista (2), recomendados (2) y «Más recursos» (2, el bloque de videos: Plan V no tiene videos).
  // Lo que sobra se suma a la lista para no perder nada.
  const popular = [...visible.slice(1, 3), ...visible.slice(7)];
  const recommended = visible.slice(3, 5);
  const more = visible.slice(5, 7);
  const count = <K extends string>(keys: K[]) => keys.reduce((map, key) => map.set(key, (map.get(key) ?? 0) + 1), new Map<K, number>());
  const tagCounts = count(catalog.flatMap(item => item.tags));
  const tags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es')).map(([tag, total]) => { const kinds = count(catalog.filter(item => item.tags.includes(tag)).map(item => item.category)); return [tag, { count: total, category: [...kinds.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '' }] as const; });
  const authors = [...count(catalog.map(item => item.author_name)).entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'));
  const current = catalog.find(item => item.slug === selected || item.id === selected);
  const assigned = current ? remote.data?.assignments.find(item => item.slug === current.slug || item.resource_id === current.id) : undefined;
  useEffect(() => { const changed = () => setSelected(hashResource()); window.addEventListener('popstate', changed); window.addEventListener('hashchange', changed); return () => { window.removeEventListener('popstate', changed); window.removeEventListener('hashchange', changed); }; }, []);
  useEffect(() => { if (resourceId !== undefined) setSelected(resourceId); }, [resourceId]);
  useEffect(() => { if (!current || !assigned || assigned.read_at) return; let active = true; void api.markResourceRead(patient.id, current.slug).then(() => { if (active) remote.reload(); }).catch(caught => { if (active) setError(`El recurso se puede leer, pero no se pudo guardar la lectura: ${errorText(caught)}`); }); return () => { active = false; }; }, [patient.id, current?.slug, assigned?.id, assigned?.read_at]);
  const open = (slug: string | null) => { window.scrollTo(0, 0); setSelected(slug); setError(''); setStatus(''); if (onOpenResource) onOpenResource(slug); else { const url = new URL(window.location.href); url.hash = slug ? `recurso=${encodeURIComponent(slug)}` : ''; window.history.pushState(null, '', url); } };
  const favorite = async (item: EditorialResource) => { if (lock.current) return; lock.current = true; setBusy(true); setError(''); setStatus(''); try { const saved = await resourcesApi.favorite(patient.id, favoriteKindForResource(item.kind), item.id); remote.setData(saved.library); setStatus(saved.library.favorites.some(entry => entry.item_id === item.id) ? 'Recurso guardado.' : 'Recurso quitado de guardados.'); } catch (caught) { setError(errorText(caught)); } finally { lock.current = false; setBusy(false); } };
  const share = async (item: EditorialResource) => { try { const url = new URL(window.location.href); url.pathname = '/app/recursos'; url.search = ''; url.hash = `recurso=${encodeURIComponent(item.slug)}`; if (typeof navigator.share === 'function') await navigator.share({ title: item.title, url: url.href }); else await navigator.clipboard.writeText(url.href); setStatus(typeof navigator.share === 'function' ? 'Recurso compartido.' : 'Enlace copiado.'); } catch (caught) { if (!(caught instanceof DOMException && caught.name === 'AbortError')) setError('No se pudo compartir el enlace.'); } };
  const dateText = (item: EditorialResource) => item.reviewed_at ? dateLabel(item.reviewed_at) : readingTime(item.minutes);
  /** Tarjeta del archivo con los datos del recurso: cada texto conserva su tipografía. */
  const card = (prototype: SourceNode, item: EditorialResource, key: string | number = item.id) => {
    const inside = (name: string) => new Set(descendants(prototype).filter(node => nodeName(node) === name).flatMap(descendants));
    // La tarjeta de la lista tiene alto fijo en el archivo (168 px): el resumen entra en dos renglones.
    const fixedHeight = /\bh-\[\d+px\]/.test(String(prototype.props.className ?? ''));
    const categories = inside('Info Category'); const authors = new Set([...inside('Info Author'), ...descendants(prototype).filter(node => nodeName(node) === 'Info Date' && descendants(node).some(child => nodeName(child) === 'Avatar')).flatMap(descendants)]); const dates = inside('Info Date');
    return source(prototype, node => {
      const name = nodeName(node);
      // Plan V no publica videos: el botón de reproducir del archivo solo corresponde a un recurso en video.
      if (name === 'Play') return { hidden: true };
      if (name === 'Image') return plateImage({ cover_status: 'ready', cover_url: item.cover_url }, '');
      if (['Left Info', 'Info Author', 'Info Category', 'Info Date'].includes(name)) return { props: { style: shrinkable } };
      if (!leaf(node)) return undefined;
      const text = sourceText(node);
      if (categories.has(node)) return { text: item.category || NO_CATEGORY, props: { style: oneLineEllipsis } };
      if (authors.has(node) || /^(Dr\.|Coach|Chef) /.test(text)) return { text: item.author_name, props: { style: oneLineEllipsis } };
      if (dates.has(node) || /\b20\d\d$/.test(text)) return { text: dateText(item) };
      const titleLines = /text-\[20px\]/.test(String(node.props.className)) ? 3 : 2;
      if (/SemiBold/.test(String(node.props.className))) return { onClick: () => open(item.slug), text: item.title, label: `Leer ${item.title}`, props: { title: item.title, style: { textAlign: 'left', cursor: 'pointer', ...lineClamp(titleLines) } } };
      if (text.length > 30) return { text: item.summary, props: { title: item.summary, style: lineClamp(fixedHeight ? 2 : 3) } };
      return undefined;
    }, key);
  };
  const reset = () => { setCategory(''); setSearch(''); setView('all'); };
  const seeAll: SourceBinding = { onClick: reset, label: 'Ver todos los recursos' };
  const stateText = (empty: string) => remote.error ? 'No se pudieron cargar los recursos.' : !remote.data ? 'Cargando…' : empty;
  const state = (empty: string) => <EmptyState text={stateText(empty)} />;
  const header = (node: SourceNode, more?: SourceBinding, title?: string) => source(node, child => nodeName(child) === 'Button More' ? more ?? { props: { 'aria-hidden': true } } : nodeName(child) === 'Button CTA' ? seeAll : title && leaf(child) && /^Recommended /.test(sourceText(child)) ? { text: title } : undefined, 'header');
  const listResolver: SourceResolver = node => {
    const name = nodeName(node); const text = sourceText(node);
    const input = leftAlignedSearch(searchBinding(node, search, setSearch, 'Buscar recurso')); if (input) return input;
    if (name === 'Button More' && !text && descendants(node).some(child => nodeName(child) === 'Icon/MagnifyingGlass')) return { onClick: () => document.querySelector<HTMLInputElement>('input[type="search"][aria-label="Buscar recurso"]')?.focus(), label: 'Buscar recurso' };
    if (name === 'Categories' && objects(node).some(child => nodeName(child) === 'Chips Category')) {
      const chips = objects(node).filter(child => nodeName(child) === 'Chips Category');
      return { children: chips.map((chip, index) => { const option = VIEWS[index]; if (!option) return null; const active = view === option.id; return source(chip, child => child === chip ? { onClick: () => setView(active && option.id !== 'all' ? 'all' : option.id), label: option.hint, props: { 'aria-pressed': active, ...(active ? swapBackground(chip, [CREAM_BG], GREEN_BG).props : {}) } } : leaf(child) ? { text: option.label } : undefined, option.id); }) };
    }
    if (name === 'Tab') {
      const buttons = objects(node); const active = buttons.find(child => /bg-\[#c2e66e\]/.test(String(child.props.className))) ?? buttons[0]; const idle = buttons.find(child => child !== active) ?? active;
      if (!active || !idle) return undefined;
      return { props: { style: { overflowX: 'auto', gap: '8px' } }, children: ['', ...categories].map(value => source(category === value ? active : idle, child => child === active || child === idle ? { onClick: () => setCategory(value), label: value ? `Ver ${value}` : 'Ver todas las categorías', props: { 'aria-pressed': category === value } } : leaf(child) ? { text: value || 'Todos' } : undefined, value || 'todos')) };
    }
    if (name === 'Featured Articles') {
      const top = objects(node).find(child => nodeName(child) === 'Header-Section');
      if (!visible[0]) return { children: <>{top && header(top)}{state('No hay recursos que coincidan.')}</> };
      return { children: objects(node).map((child, index) => child === top ? header(child) : card(child, visible[0]!, `featured-${index}`)) };
    }
    if (name === 'Widget Popular Menu') return { children: objects(node).map((child, index) => {
      if (nodeName(child) === 'Header-Section') return header(child);
      if (nodeName(child) !== 'List Menu') return source(child, () => undefined, index);
      const prototypes = objects(child).filter(part => nodeName(part) === 'Card Popular Insights');
      return source(child, list => list === child ? { children: popular.length ? popular.map((item, position) => card(prototypes[position % prototypes.length], item)) : state(visible.length ? 'No hay más recursos por ahora.' : 'No hay recursos que coincidan.') } : undefined, index);
    }) };
    if (name === 'Widget Recommnded Article') {
      const video = text.includes('Recommended Video');
      return { children: objects(node).map((child, index) => nodeName(child) === 'Header-Section' ? header(child, undefined, video ? 'Otros recursos' : undefined) : nodeName(child) === 'List Rcommendation' ? source(child, list => list === child ? { children: (video ? more : recommended).length ? (video ? more : recommended).map((item, position) => card(objects(list)[position % objects(list).length], item)) : state('No hay más recursos por ahora.') } : undefined, index) : source(child, () => undefined, index)) };
    }
    if (name === 'Widget Trending Tags') {
      const shown = tags.slice(0, moreTags ? tags.length : 6);
      return { children: objects(node).map((child, index) => {
        if (nodeName(child) === 'Header-Section') return header(child, { onClick: () => setMoreTags(value => !value), label: moreTags ? 'Ver menos temas' : 'Ver todos los temas' });
        if (nodeName(child) === 'List Menu') return source(child, list => list === child ? listChildren(list, shown, (part, [tag, info]) => {
          if (!leaf(part)) return undefined;
          const sample = sourceText(part);
          if (sample.startsWith('#')) return { onClick: () => { setSearch(tag); setCategory(''); }, text: `#${tag}`, label: `Buscar recursos sobre ${tag}`, props: { style: { textAlign: 'left' } } };
          if (/posts$/.test(sample)) return { text: `${info.count} ${info.count === 1 ? 'recurso' : 'recursos'}` };
          return { text: info.category };
        }, stateText('Todavía no hay temas.'), { key: ([tag]) => tag }) : undefined, index);
        if (nodeName(child) === 'Button') return source(child, part => part === child ? { onClick: () => setMoreTags(value => !value), label: moreTags ? 'Ver menos temas' : 'Ver más temas', props: { disabled: tags.length <= 6 } } : leaf(part) ? { text: moreTags ? 'Ver menos' : 'Ver más' } : undefined, index);
        return source(child, () => undefined, index);
      }) };
    }
    if (name === 'Widget Top Author') {
      const shown = authors.slice(0, moreAuthors ? authors.length : 6);
      return { children: objects(node).map((child, index) => {
        if (nodeName(child) === 'Header-Section') return header(child, { onClick: () => setMoreAuthors(value => !value), label: moreAuthors ? 'Ver menos autores' : 'Ver todos los autores' });
        if (nodeName(child) === 'List Menu') return source(child, list => list === child ? listChildren(list, shown, (part, [author, count]) => {
          if (nodeName(part) === 'User Profile') return { onClick: () => { setSearch(author); setCategory(''); }, label: `Ver recursos de ${author}`, props: { style: { textAlign: 'left' } } };
          if (!leaf(part)) return undefined;
          return /Followers$/.test(sourceText(part)) ? { text: `${count} ${count === 1 ? 'recurso' : 'recursos'}` } : { text: author };
        }, stateText('Todavía no hay autores.'), { key: ([author]) => author }) : undefined, index);
        if (nodeName(child) === 'Button') return source(child, part => part === child ? { onClick: () => setMoreAuthors(value => !value), label: moreAuthors ? 'Ver menos autores' : 'Ver más autores', props: { disabled: authors.length <= 6 } } : leaf(part) ? { text: moreAuthors ? 'Ver menos' : 'Ver más' } : undefined, index);
        return source(child, () => undefined, index);
      }) };
    }
    return undefined;
  };

  const actions = current ? [
    { text: favorites.has(current.id) ? 'Quitar de guardados' : 'Guardar recurso', label: favorites.has(current.id) ? `Quitar ${current.title} de guardados` : `Guardar ${current.title}`, run: () => void favorite(current), pressed: favorites.has(current.id) },
    ...(isAllowedPage('patient', current.action_page) ? [{ text: current.action_label, label: current.action_label, run: () => onNavigate(current.action_page as Parameters<typeof onNavigate>[0]) }] : []),
    { text: 'Consultar', label: 'Consultar a tu nutricionista sobre este recurso', run: () => onNavigate('mensajes') },
  ] : [];
  const actionText = "px-[4px] font-['Poppins:Medium'] text-[12px] leading-[18px] text-[#272932] whitespace-nowrap";
  const detailResolver: SourceResolver = node => {
    const name = nodeName(node); const text = sourceText(node);
    if (name === 'Back Button') return { onClick: () => open(null), label: 'Volver a Recursos', children: inner(node, child => leaf(child) ? { text: 'Volver a Recursos' } : undefined) };
    if (name === 'Button Nav' && descendants(node).some(child => nodeName(child) === 'Icon/ArrowLeft')) return { onClick: () => open(null), label: 'Volver a Recursos' };
    if (leaf(node) && ['Insight Details', 'Insights Details'].includes(text)) return { text: 'Detalle del recurso' };
    if (name === 'Content' && objects(node).some(child => nodeName(child) === 'Pharagraph')) {
      if (!current) return { children: state('Ese recurso no está disponible.') };
      const parts = objects(node);
      const entry = parts.find(child => nodeName(child) === 'Pharagraph' && /border-l/.test(String(child.props.className)));
      const plain = parts.find(child => nodeName(child) === 'Pharagraph' && child !== entry && !descendants(child).some(n => nodeName(n) === 'Div Title'));
      const section = parts.find(child => nodeName(child) === 'Pharagraph' && objects(child).length === 2 && descendants(child).some(n => nodeName(n) === 'Div Title'));
      const license = current.published && current.license_note === 'Borrador sin publicar. Sin imagen remota.' ? 'Material del consultorio. Sin imagen remota.' : current.license_note;
      return { children: <>{parts.map((child, index) => {
        const childName = nodeName(child);
        if (childName === 'Header') return source(child, part => leaf(part) && descendants(child).filter(n => nodeName(n) === 'Info Category').flatMap(descendants).includes(part) ? { text: current.category } : leaf(part) ? { text: readingTime(current.minutes) } : undefined, index);
        if (leaf(child)) return source(child, () => ({ text: current.title }), index);
        if (childName === 'Footer') return source(child, part => ['Info Author', 'Info Date', 'Left Info'].includes(nodeName(part)) ? { props: { style: shrinkable } } : leaf(part) && descendants(child).filter(n => nodeName(n) === 'Info Author').flatMap(descendants).includes(part) ? { text: current.author_name, props: { style: oneLineEllipsis } } : leaf(part) ? { text: current.reviewed_at ? dateLabel(current.reviewed_at) : 'Guía de uso' } : undefined, index);
        if (childName === 'Image') return source(child, () => plateImage({ cover_status: 'ready', cover_url: current.cover_url }, ''), index);
        if (child === entry) return source(child, part => leaf(part) ? { text: current.summary } : undefined, index);
        if (child === plain && !current.sections.length) return <EmptyState key="no-sections" text="Este recurso todavía no tiene secciones." />;
        if (child === plain) return section ? current.sections.map((item, position) => source(section, part => nodeName(part) === 'Div Title' ? { children: inner(part, title => leaf(title) ? { text: item.title } : undefined) } : leaf(part) ? { text: item.body } : undefined, `section-${position}`)) : null;
        if (child === section && plain && license) return source(plain, part => leaf(part) ? { text: license, props: { style: { fontSize: '12px', color: '#8a8c90' } } } : undefined, index);
        // Citas y listas del artículo de ejemplo: Plan V publica el recurso por secciones.
        return null;
      })}</> };
    }
    if (name === 'Section Tags' && text.startsWith('Share')) {
      return { children: inner(node, child => {
        if (is(child, 'Share')) return { text: 'Guardar y compartir' };
        if (nodeName(child) !== 'Categories') return undefined;
        const icons = objects(child);
        return { children: icons.map((icon, index) => {
          if (index === 0) return source(icon, part => part === icon ? { onClick: () => current && void share(current), label: 'Copiar o compartir el enlace', props: { disabled: !current } } : undefined, 'share');
          const action = actions[index - 1];
          if (!action) return null;
          return source(icon, part => part === icon ? { onClick: action.run, label: action.label, props: { disabled: busy, 'aria-pressed': action.pressed } } : nodeName(part).startsWith('Icon/') ? { tag: 'span', props: { className: actionText }, children: action.text } : undefined, `action-${index}`);
        }) };
      }) };
    }
    if (name === 'Categories' && objects(node).some(child => nodeName(child) === 'Chips Tag')) return listChildren(node, current?.tags ?? [], (part, tag) => {
      if (nodeName(part) === 'Chips Tag') return { onClick: () => { setSearch(tag); open(null); }, label: `Buscar recursos sobre ${tag}` };
      return leaf(part) ? { text: sourceText(part) === '#' ? '#' : tag } : undefined;
    }, 'Sin temas.', { key: tag => tag });
    if (name === 'Section Related Articles' || name === 'Section Related VIdeo') {
      // El bloque de videos del archivo muestra otros recursos: Plan V no publica videos.
      const video = name === 'Section Related VIdeo';
      const related = catalog.filter(item => item.id !== current?.id && (video ? !current?.related.includes(item.slug) : current?.related.includes(item.slug))).slice(0, video ? 2 : undefined);
      return { children: inner(node, child => {
        if (nodeName(child) !== 'List Rcommendation') return undefined;
        const prototypes = objects(child);
        return { children: related.length ? related.map((item, index) => card(prototypes[index % prototypes.length], item)) : <EmptyState text={video ? 'Sin otros recursos por ahora.' : 'Sin recursos relacionados.'} /> };
      }) };
    }
    return undefined;
  };
  return <FramePair nodes={selected ? ['279:9301', '507:17412'] : ['263:6588', '504:15334']} resolve={selected ? detailResolver : listResolver} patientName={patient.name} onNavigate={onNavigate} onSignOut={onSignOut} onSearch={setSearch} query={search}>
    {selected && remote.data && !current && <Stateful error="Ese recurso no está disponible para tu cuenta." />}{error && <Stateful error={error} />}{status && <p role="status" className="mx-[24px] p-[16px] text-[#272932]">{status}</p>}
  </FramePair>;
}
