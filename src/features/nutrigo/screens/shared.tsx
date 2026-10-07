import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { ShowroomPatient } from '../../../components/nutrigo/showroom-model';
import type { ShowroomPage } from '../../../components/nutrigo/ShowroomPanels';
import { nodeId, nodeName, renderSource, sourceText, type SourceBinding, type SourceNode, type SourceResolver } from '../SourceView';
import { translateSource } from '../translation';
import { secondaryLabels } from '../secondaryTranslation';
import { friendlyError } from '../../../lib/error-messages';
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
/**
 * Repite los ítems originales de una lista del archivo con datos reales. Usa los ítems en ciclo
 * (1.º, 2.º, 3.º, 1.º…) para conservar sus colores; nunca reemplaza la lista por texto suelto.
 */
export function cloneList<T>(list: SourceNode, items: readonly T[], bind: (node: SourceNode, item: T, index: number) => SourceBinding | undefined, options: { key?: (item: T, index: number) => string | number; only?: (node: SourceNode) => boolean } = {}): ReactNode[] {
  // Las líneas divisorias del archivo no son ítems: se repiten entre ítems, como en el diseño.
  const divider = objects(list).find(node => nodeName(node) === 'Divider');
  const prototypes = objects(list).filter(options.only ?? (node => nodeName(node) !== 'Divider'));
  if (!prototypes.length) return [];
  return items.flatMap((item, index) => {
    const key = options.key?.(item, index) ?? index;
    const row = source(prototypes[index % prototypes.length], node => bind(node, item, index), key);
    return divider && index > 0 ? [source(divider, () => undefined, `divider-${key}`), row] : [row];
  });
}
/** Hijos de una lista: los ítems clonados y, sin datos, un estado vacío con la tipografía del archivo. */
export function listChildren<T>(list: SourceNode, items: readonly T[], bind: (node: SourceNode, item: T, index: number) => SourceBinding | undefined, empty: string, options: Parameters<typeof cloneList<T>>[3] = {}): SourceBinding {
  return { children: items.length ? cloneList(list, items, bind, options) : <EmptyState text={empty} /> };
}
export function EmptyState({ text }: { text: string }) {
  return <p className="w-full py-[16px] text-center font-['Poppins:Regular'] text-[12px] leading-[1.5] text-[#8a8c90]">{text}</p>;
}
/** Porcentaje acotado a 0–100 (o null si falta alguno de los dos valores). */
export const percent = (value: number | null | undefined, total: number | null | undefined) =>
  value == null || total == null || total <= 0 ? null : Math.max(0, Math.min(100, (value / total) * 100));
/**
 * Barra del archivo partida en tramo lleno y tramo vacío: se reparte el ancho con el porcentaje
 * real en vez de ocultarla. Sin dato, la barra queda vacía (0 %), como el archivo dibuja un inicio.
 */
export function barFill(pct: number | null, part: 'filled' | 'empty'): SourceBinding {
  const value = pct ?? 0;
  const grow = part === 'filled' ? value : 100 - value;
  return { props: { style: { flex: `${grow} 1 0%`, minWidth: 0, paddingRight: 0, display: grow === 0 ? 'none' : undefined } } };
}
/** Arco de dona con los colores del archivo, para superponer al dibujo de ejemplo. */
/** Color rayado del tramo que falta (como el medidor del archivo). */
const hatchPattern = (color: string) => `repeating-linear-gradient(135deg, ${color} 0 2px, transparent 2px 6px)`;

export function Ring({ pct, color, track = 'transparent', thickness = 14, half = false, hatch }: { pct: number | null; color: string; track?: string; thickness?: number; half?: boolean; hatch?: string }) {
  const value = Math.max(0, Math.min(100, pct ?? 0));
  const turn = half ? 0.5 : 1;
  const start = half ? 270 : 0;
  const mask = `radial-gradient(farthest-side, transparent calc(100% - ${thickness}px), #000 calc(100% - ${thickness}px + 1px))`;
  const filled = (value / 100) * turn;
  const fill = `conic-gradient(from ${start}deg, ${color} 0turn ${filled}turn, ${track} ${filled}turn ${turn}turn, transparent ${turn}turn 1turn)`;
  const ring = { WebkitMask: mask, mask } as const;
  const layer = 'pointer-events-none absolute inset-0 block rounded-full';
  if (!hatch) return <span aria-hidden="true" className={layer} style={{ background: fill, ...ring }} />;
  // Tramo restante rayado, como el medidor del archivo: el anillo recorta a una capa de color y a otra de franjas
  // que solo se ve donde falta recorrer (máscara cónica propia, sin combinar máscaras).
  const rest = `conic-gradient(from ${start}deg, transparent 0turn ${filled}turn, #000 ${filled}turn ${turn}turn, transparent ${turn}turn 1turn)`;
  return <span aria-hidden="true" className={layer} style={ring}>
    <span className={layer} style={{ background: fill }} />
    <span className={layer} style={{ background: hatchPattern(hatch), WebkitMask: rest, mask: rest }} />
  </span>;
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
  useEffect(() => { const controller = new AbortController(); const attempt = ++generation.current; setFailure(null); void loader.current(controller.signal).then(value => { if (!controller.signal.aborted && attempt === generation.current) setState({ key, value }); }).catch(error => { if (!controller.signal.aborted && attempt === generation.current) setFailure({ key, text: friendlyError(error) }); }); return () => controller.abort(); }, [key, revision]);
  return { data: state?.key === key ? state.value : null, error: failure?.key === key ? failure.text : '', reload, setData: (value: T) => { if (currentKey.current !== key) return; generation.current += 1; setFailure(null); setState({ key, value }); } };
}
export function searchBinding(node: SourceNode, value: string, onChange: (value: string) => void, placeholder: string) {
  if (nodeName(node) !== 'Input-search') return undefined;
  const originalText = descendants(node).find(child => leaf(child) && Boolean(sourceText(child)));
  const input = <input type="search" aria-label={placeholder} placeholder={placeholder} value={value} onChange={event => onChange(event.target.value)} className={String(originalText?.props.className ?? '')} style={{ background: 'transparent', border: 0, outlineOffset: 3, minWidth: 0, width: '100%' }} />;
  return { children: node.children.map((child, index) => typeof child === 'object' && originalText && descendants(child).includes(originalText) ? input : typeof child === 'object' ? source(child, () => undefined, index) : null) };
}
export const errorText = (error: unknown) => friendlyError(error);
