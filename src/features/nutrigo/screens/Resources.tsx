import { useEffect, useRef, useState } from 'react';
import { FramePair } from '../FramePair';
import { nodeName, sourceText, type SourceNode, type SourceResolver } from '../SourceView';
import { resourcesApi } from '../../../api/resources';
import { api } from '../../../api/client';
import { favoriteKindForResource, type EditorialResource } from '../../../types/resources';
import { isAllowedPage } from '../../../components/nutrigo/app-location';
import { dateLabel, descendants, errorText, idEnds, leaf, objects, safeImageSrc, searchBinding, source, Stateful, useRemote, type ScreenProps } from './shared';

type Props = ScreenProps & { resourceId?: string | null; onOpenResource?: (slug: string | null) => void };
const hashResource = () => { if (typeof window === 'undefined') return null; try { return window.location.hash.startsWith('#recurso=') ? decodeURIComponent(window.location.hash.slice(9)) : null; } catch { return null; } };
export function NutrigoResources({ patient, query = '', onNavigate, onSignOut, resourceId, onOpenResource }: Props) {
  const remote = useRemote(patient.id, signal => resourcesApi.library(patient.id, '', false, signal).then(result => result.library));
  const [search, setSearch] = useState(query); const [category, setCategory] = useState(''); const [savedOnly, setSavedOnly] = useState(false); const [selected, setSelected] = useState<string | null>(resourceId ?? hashResource());
  const [error, setError] = useState(''); const [status, setStatus] = useState(''); const [busy, setBusy] = useState(false); const lock = useRef(false);
  const catalog = [...(remote.data?.articles ?? []), ...(remote.data?.resources ?? [])]; const categories = [...new Set(catalog.map(item => item.category))]; const favorites = new Set(remote.data?.favorites.map(item => item.item_id) ?? []);
  const visible = catalog.filter(item => (!category || item.category === category) && (!savedOnly || favorites.has(item.id)) && `${item.title} ${item.summary} ${item.tags.join(' ')}`.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es')));
  const current = catalog.find(item => item.slug === selected || item.id === selected);
  const assigned = current ? remote.data?.assignments.find(item => item.slug === current.slug || item.resource_id === current.id) : undefined;
  useEffect(() => { const changed = () => setSelected(hashResource()); window.addEventListener('popstate', changed); window.addEventListener('hashchange', changed); return () => { window.removeEventListener('popstate', changed); window.removeEventListener('hashchange', changed); }; }, []);
  useEffect(() => { if (resourceId !== undefined) setSelected(resourceId); }, [resourceId]);
  useEffect(() => { if (!current || !assigned || assigned.read_at) return; let active = true; void api.markResourceRead(patient.id, current.slug).then(() => { if (active) remote.reload(); }).catch(caught => { if (active) setError(`El recurso se puede leer, pero no se pudo guardar la lectura: ${errorText(caught)}`); }); return () => { active = false; }; }, [patient.id, current?.slug, assigned?.id, assigned?.read_at]);
  const open = (slug: string | null) => { setSelected(slug); setError(''); setStatus(''); if (onOpenResource) onOpenResource(slug); else { const url = new URL(window.location.href); url.hash = slug ? `recurso=${encodeURIComponent(slug)}` : ''; window.history.pushState(null, '', url); } };
  const favorite = async (item: EditorialResource) => { if (lock.current) return; lock.current = true; setBusy(true); setError(''); setStatus(''); try { const saved = await resourcesApi.favorite(patient.id, favoriteKindForResource(item.kind), item.id); remote.setData(saved.library); setStatus(saved.library.favorites.some(entry => entry.item_id === item.id) ? 'Recurso guardado.' : 'Recurso quitado de guardados.'); } catch (caught) { setError(errorText(caught)); } finally { lock.current = false; setBusy(false); } };
  const share = async (item: EditorialResource) => { try { const url = new URL(window.location.href); url.pathname = '/app/recursos'; url.search = ''; url.hash = `recurso=${encodeURIComponent(item.slug)}`; if (typeof navigator.share === 'function') await navigator.share({ title: item.title, url: url.href }); else await navigator.clipboard.writeText(url.href); setStatus(typeof navigator.share === 'function' ? 'Recurso compartido.' : 'Enlace copiado.'); } catch (caught) { if (!(caught instanceof DOMException && caught.name === 'AbortError')) setError('No se pudo compartir el enlace.'); } };
  const card = (prototype: SourceNode, item: EditorialResource, key = item.id) => source(prototype, child => {
    const name = nodeName(child); const text = sourceText(child);
    if (name === 'Info Category') return { text: item.category };
    if (name === 'Info Date') return { text: item.reviewed_at ? dateLabel(item.reviewed_at) : `${item.minutes} min` };
    if (name === 'Info Author' || name === 'Left Info' && /Dr\.|Coach|Chef/.test(text)) return { text: item.author_name };
    if (idEnds(child, '263:7130') || idEnds(child, '267:8210') || idEnds(child, '276:9120') || idEnds(child, '507:15800') || idEnds(child, '507:16192') || idEnds(child, '290:7831')) return { onClick: () => open(item.slug), text: item.title, label: `Leer ${item.title}` };
    if (idEnds(child, '265:8107') || idEnds(child, '267:8226') || idEnds(child, '507:15801') || idEnds(child, '507:16193')) return { text: item.summary };
    if (idEnds(child, '276:9115') || idEnds(child, '507:16187') || idEnds(child, '290:7830')) return { text: item.category };
    if (idEnds(child, '276:9118') || idEnds(child, '507:16190')) return { text: item.reviewed_at ? dateLabel(item.reviewed_at) : 'Guía de uso' };
    if (leaf(child) && /^Dr\. Amelia Johnson$/.test(text)) return { text: item.author_name };
    if (name === 'Image') return { children: safeImageSrc(item.cover_url) ? <img src={safeImageSrc(item.cover_url)!} alt="" className="h-full w-full rounded-[12px] object-cover" /> : <span aria-hidden="true" className="flex h-full w-full items-center justify-center rounded-[12px] bg-[#f3f2eb] text-[40px] text-[#272932]">◇</span> };
    if (name === 'Avatar' || name === 'Play') return { hidden: true };
    return undefined;
  }, key);
  const state = () => <Stateful loading={!remote.data && !remote.error} error={remote.error || undefined} empty="No hay recursos que coincidan." onRetry={remote.reload} />;
  const listResolver: SourceResolver = node => {
    const name = nodeName(node); const text = sourceText(node);
    const input = searchBinding(node, search, setSearch, 'Buscar recurso'); if (input) return input;
    if (name === 'Featured Articles') return visible[0] ? { children: objects(node).map((child,index) => card(child, visible[0]!,`${visible[0]!.id}:${index}`)) } : { children: state() };
    if (name === 'List Menu' && objects(node).some(child => nodeName(child) === 'Card Popular Insights')) { const prototype = objects(node).find(child => nodeName(child) === 'Card Popular Insights'); return { children: prototype && visible.slice(1).map(item => card(prototype, item)) }; }
    if (name === 'List Rcommendation') { const prototype = objects(node).find(child => nodeName(child) === 'Card Recommended Insights'); return { children: prototype && visible.slice(1).map(item => card(prototype, item)) }; }
    if (name === 'Widget Trending Tags') { const header = objects(node).find(child => nodeName(child) === 'Header-Section'); return { children: <>{header && source(header, child => /Button/.test(nodeName(child)) ? { hidden: true } : undefined)}<div className="flex flex-col gap-[12px]">{categories.map(value => <button key={value} type="button" onClick={() => setCategory(category === value ? '' : value)} aria-pressed={category === value} className="rounded-[8px] border border-[#e1e1e2] px-[12px] py-[8px] text-left text-[14px]">{value} · {catalog.filter(item => item.category === value).length}</button>)}</div></> }; }
    if (name === 'Widget Top Author') { const header = objects(node).find(child => nodeName(child) === 'Header-Section'); return { children: <>{header && source(header, child => /Button/.test(nodeName(child)) ? { hidden: true } : undefined)}{[...new Set(catalog.map(item => item.author_name))].map(author => <p key={author} className="py-[8px] text-[14px]">{author}</p>)}</> }; }
    if (name === 'Categories' || name === 'Tab') return { props: { style: { flexWrap: 'wrap' } }, children: <>{['', ...categories].map(value => <button key={value} type="button" aria-pressed={category === value} onClick={() => setCategory(value)} className="rounded-[8px] border border-[#e1e1e2] px-[12px] py-[8px] text-[14px]">{value || 'Todos'}</button>)}</> };
    if (/Button/.test(name) && ['Recent', 'Featured', 'Trending', 'Popular', 'Recommended', 'See All'].includes(text)) return { onClick: () => { setCategory(''); setSearch(''); setSavedOnly(false); }, label: 'Ver todos los recursos' };
    return undefined;
  };
  const detailResolver: SourceResolver = node => {
    const name = nodeName(node); const text = sourceText(node);
    if (name === 'Back Button') return { onClick: () => open(null), label: 'Volver a Recursos', text: 'Volver a Recursos' };
    if (name === 'Button Nav' && descendants(node).some(child => nodeName(child) === 'Icon/ArrowLeft')) return { onClick: () => open(null), label: 'Volver a Recursos' };
    if (leaf(node) && text === 'Insights Details') return { text: 'Detalle del recurso' };
    if (idEnds(node, '281:9834') || idEnds(node, '507:17793')) {
      if (!current) return { children: state() };
      const parts = objects(node); const heading = parts.find(child => idEnds(child, '281:9835') || idEnds(child, '507:17800')); const metadata = parts.find(child => nodeName(child) === 'Header'); const byline = parts.find(child => nodeName(child) === 'Footer'); const image = parts.find(child => nodeName(child) === 'Image'); const paragraph = parts.find(child => nodeName(child) === 'Pharagraph' && descendants(child).some(n => nodeName(n) === 'Div Title'));
      return { children: <>{metadata && source(metadata, child => nodeName(child) === 'Info Category' || idEnds(child, '507:17796') ? { text: current.category } : nodeName(child) === 'Info Date' || idEnds(child, '507:17799') ? { text: `${current.minutes} min de lectura` } : undefined)}{heading && source(heading, () => ({ text: current.title }))}{byline && source(byline, child => nodeName(child) === 'Avatar' ? { hidden: true } : leaf(child) && /Dr\./.test(sourceText(child)) ? { text: current.author_name } : leaf(child) && /2028/.test(sourceText(child)) ? { text: current.reviewed_at ? dateLabel(current.reviewed_at) : 'Guía de uso' } : undefined)}{image && card(image, current)}{current.sections.map((section, index) => paragraph ? source(paragraph, child => nodeName(child) === 'Div Title' ? { text: section.title } : leaf(child) ? { text: section.body } : undefined, index) : <article key={index}><h2>{section.title}</h2><p>{section.body}</p></article>)}<p className="text-[12px] text-[#8a8c90]">{current.license_note}</p><div className="flex flex-wrap gap-[8px]"><button type="button" disabled={busy} aria-pressed={favorites.has(current.id)} onClick={() => void favorite(current)} className="rounded-[8px] bg-[#c2e66e] px-[16px] py-[10px] text-[#272932]">{favorites.has(current.id) ? 'Quitar de guardados' : 'Guardar recurso'}</button>{isAllowedPage('patient', current.action_page) && <button type="button" onClick={() => onNavigate(current.action_page as Parameters<typeof onNavigate>[0])} className="rounded-[8px] border border-[#e1e1e2] px-[16px] py-[10px]">{current.action_label}</button>}</div></> };
    }
    if (name === 'Section Tags') return { children: text.startsWith('Share') ? <><h3>Compartir</h3><button type="button" onClick={() => current && void share(current)} disabled={!current} className="rounded-[8px] border border-[#e1e1e2] px-[12px] py-[8px]">Copiar o compartir enlace</button></> : <><h3>Temas</h3><div className="flex flex-wrap gap-[8px]">{current?.tags.map(tag => <button type="button" key={tag} onClick={() => { setSearch(tag); open(null); }} className="rounded-[8px] border border-[#e1e1e2] px-[8px] py-[4px]">#{tag}</button>)}</div></> };
    if (name === 'List Rcommendation') { const prototype = objects(node)[0]; const related = catalog.filter(item => current?.related.includes(item.slug)); return { children: prototype ? related.map(item => card(prototype, item)) : null }; }
    if (name === 'Section Related VIdeo') return { hidden: true };
    return undefined;
  };
  return <FramePair nodes={selected ? ['279:9301', '507:17412'] : ['263:6588', '504:15334']} resolve={selected ? detailResolver : listResolver} patientName={patient.name} onNavigate={onNavigate} onSignOut={onSignOut} onSearch={setSearch} query={search}>
    {!selected && <div className="mx-[24px] mb-[24px] flex gap-[8px]"><button type="button" aria-pressed={savedOnly} onClick={() => setSavedOnly(value => !value)} className="rounded-[8px] border border-[#e1e1e2] px-[16px] py-[10px]">{savedOnly ? 'Ver todos' : 'Mis guardados'}</button></div>}{selected && remote.data && !current && <Stateful error="Ese recurso no está disponible para tu cuenta." />}{error && <Stateful error={error} />}{status && <p role="status" className="mx-[24px] p-[16px] text-[#272932]">{status}</p>}
  </FramePair>;
}
