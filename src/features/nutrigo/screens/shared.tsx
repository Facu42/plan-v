import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { ShowroomPatient } from '../../../components/nutrigo/showroom-model';
import type { ShowroomPage } from '../../../components/nutrigo/ShowroomPanels';
import { nodeId, nodeName, renderSource, sourceText, type SourceNode, type SourceResolver } from '../SourceView';
import { translateSource } from '../translation';
import { secondaryLabels } from '../secondaryTranslation';
import { canLeaveWorkspace, useUnsavedChanges } from '../../../components/nutrigo/unsaved-changes';

export type ScreenProps = { patient: ShowroomPatient; query?: string; now?: Date; onNavigate: (page: ShowroomPage) => void; onSignOut?: () => void };
export const descendants = (node: SourceNode): SourceNode[] => [node, ...node.children.flatMap(child => typeof child === 'object' ? descendants(child) : [])];
export const objects = (node: SourceNode) => node.children.filter((child): child is SourceNode => typeof child === 'object');
export const leaf = (node: SourceNode) => node.children.some(child => typeof child === 'string') && !objects(node).length;
export const matches = (node: SourceNode, name: string) => nodeName(node) === name;
export const idEnds = (node: SourceNode, id: string) => nodeId(node) === id || nodeId(node).endsWith(`;${id}`) || nodeId(node) === `node-${id.replace(':', '_')}`;
export const formatNumber = (value: number | null | undefined) => value == null ? '—' : new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 }).format(value);
export const dateId = (value: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(value);
export { dateLabel } from './date-label';
export const timeLabel = (value: string) => Number.isNaN(Date.parse(value)) ? '' : new Date(value).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
export const safeUrl = (value: string | null | undefined) => { try { const url = new URL(value ?? ''); return url.protocol === 'https:' ? url.href : null; } catch { return null; } };

export const translate = (text: string) => secondaryLabels[text] ?? translateSource(text);
export function source(node: SourceNode, resolve: SourceResolver, key?: string | number) { return renderSource(node, resolve, translate, key); }
export function fields(node: SourceNode, values: Record<string, ReactNode>, extra?: SourceResolver, key?: string | number) {
  return source(node, child => { const custom = extra?.(child); if (custom) return custom; for (const [id, text] of Object.entries(values)) if (idEnds(child, id)) return { text }; return undefined; }, key);
}
export function Stateful({ loading, error, empty, onRetry }: { loading?: boolean; error?: string; empty?: string; onRetry?: () => void }) {
  if (error) return <div role="alert" className="p-[16px] text-[#a32929]">{error}{onRetry && <button type="button" className="ml-[8px] underline" onClick={onRetry}>Reintentar</button>}</div>;
  return <p role={loading ? 'status' : undefined} className="p-[16px] text-[14px] text-[#8a8c90]">{loading ? 'Cargando…' : empty}</p>;
}
export function RecordDialog({ title, onClose, busy = false, dirty = false, children }: { title: string; onClose: () => void; busy?: boolean; dirty?: boolean; children: ReactNode }) {
  useUnsavedChanges(dirty,busy);
  const requestClose=()=>{if(!busy&&canLeaveWorkspace())onClose();};
  const container = useRef<HTMLDivElement | null>(null); const busyRef = useRef(busy); busyRef.current = busy; const closeRef = useRef(onClose); closeRef.current = onClose;
  useEffect(() => { const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null; const focusable = () => [...(container.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),a[href],[tabindex="0"]') ?? [])]; focusable()[0]?.focus(); const onKey = (event: globalThis.KeyboardEvent) => { if (event.key === 'Escape' && !busyRef.current) { event.preventDefault(); closeRef.current(); } if (event.key === 'Tab') { const options = focusable(); if (!options.length) { event.preventDefault(); container.current?.focus(); } else if (event.shiftKey && document.activeElement === options[0]) { event.preventDefault(); options[options.length - 1]?.focus(); } else if (!event.shiftKey && document.activeElement === options[options.length - 1]) { event.preventDefault(); options[0]?.focus(); } } }; document.addEventListener('keydown', onKey); return () => { document.removeEventListener('keydown', onKey); previous?.focus(); }; }, []);
  closeRef.current=requestClose;
  return <div role="dialog" aria-modal="true" aria-label={title} ref={container} tabIndex={-1} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-[16px]" onClick={event => { if (event.target === event.currentTarget) requestClose(); }}>{children}</div>;
}
export function useRemote<T>(key: string, load: (signal: AbortSignal) => Promise<T>) {
  const [state, setState] = useState<{ key: string; value: T } | null>(null);
  const [failure, setFailure] = useState<{ key: string; text: string } | null>(null);
  const [revision, setRevision] = useState(0);
  const generation = useRef(0); const currentKey = useRef(key); currentKey.current = key;
  const loader = useRef(load); loader.current = load;
  const reload = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => { const controller = new AbortController(); const attempt = ++generation.current; setFailure(null); void loader.current(controller.signal).then(value => { if (!controller.signal.aborted && attempt === generation.current) setState({ key, value }); }).catch(error => { if (!controller.signal.aborted && attempt === generation.current) setFailure({ key, text: error instanceof Error ? error.message : 'No se pudo cargar. Reintentá.' }); }); return () => controller.abort(); }, [key, revision]);
  return { data: state?.key === key ? state.value : null, error: failure?.key === key ? failure.text : '', reload, setData: (value: T) => { if (currentKey.current !== key) return; generation.current += 1; setFailure(null); setState({ key, value }); } };
}
export function searchBinding(node: SourceNode, value: string, onChange: (value: string) => void, placeholder: string) {
  if (nodeName(node) !== 'Input-search') return undefined;
  const originalText = descendants(node).find(child => leaf(child) && Boolean(sourceText(child)));
  const input = <input type="search" aria-label={placeholder} placeholder={placeholder} value={value} onChange={event => onChange(event.target.value)} className={String(originalText?.props.className ?? '')} style={{ background: 'transparent', border: 0, outlineOffset: 3, minWidth: 0, width: '100%' }} />;
  return { children: node.children.map((child, index) => typeof child === 'object' && originalText && descendants(child).includes(originalText) ? input : typeof child === 'object' ? source(child, () => undefined, index) : null) };
}
export const errorText = (error: unknown) => { const text = error instanceof Error ? error.message : 'No se pudo guardar.'; try { const parsed = JSON.parse(text); return String(parsed.error ?? text); } catch { return text; } };
