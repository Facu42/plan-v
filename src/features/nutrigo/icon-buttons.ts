import { nodeName, type SourceNode } from './SourceView';
import type { ShowroomPage } from '../../components/nutrigo/ShowroomPanels';

/** Qué hace un botón de solo ícono del archivo: avisos, una pantalla o el menú de siempre. */
export type IconButtonAction = { kind: 'notices' } | { kind: 'page'; page: ShowroomPage } | { kind: 'menu' };

type Context = { section: string; parent: string };

/** Cada botón de solo ícono con el widget que lo contiene y su padre directo (el árbol del archivo no cambia). */
export function mapIconButtons(root: SourceNode): WeakMap<SourceNode, Context> {
  const found = new WeakMap<SourceNode, Context>();
  const walk = (node: SourceNode, section: string, parent: string) => {
    const name = nodeName(node);
    const here = /^(Widget|Section) /.test(name) ? name : section;
    if (name === 'Button Icon' || name === 'Button More') found.set(node, { section: here, parent });
    for (const child of node.children) if (typeof child === 'object' && child) walk(child, here, name);
  };
  walk(root, '', '');
  return found;
}

const hasBadge = (node: SourceNode): boolean => node.children.some(child => typeof child === 'object' && child && (nodeName(child) === 'Badge' || hasBadge(child)));

const SECTION_PAGES: Array<[RegExp, ShowroomPage]> = [
  [/Weight/, 'progreso'], [/Calories Intake|Recent Activity/, 'diario'], [/Recommended Menu|Popular Menu|Featured Menu/, 'recetas'],
  [/Recommended Exercises/, 'ejercicio'], [/Calendar/, 'agenda'], [/Grocery/, 'compras'],
];

export function iconButtonAction(node: SourceNode, context: Context | undefined): IconButtonAction {
  if (hasBadge(node)) return { kind: 'notices' };
  if (context?.parent === 'Header Menu') return { kind: 'page', page: 'mensajes' };
  const page = SECTION_PAGES.find(([pattern]) => pattern.test(context?.section ?? ''))?.[1];
  return page ? { kind: 'page', page } : { kind: 'menu' };
}

export const iconButtonLabel = (action: IconButtonAction): string =>
  action.kind === 'notices' ? 'Ver avisos' : action.kind === 'page' ? ({ mensajes: 'Ir a mis mensajes', progreso: 'Ver mi progreso', diario: 'Ver mi diario', recetas: 'Ver el menú', ejercicio: 'Ver mi ejercicio', agenda: 'Ver mi agenda', compras: 'Ver mis compras' } as Record<string, string>)[action.page] ?? 'Abrir' : 'Abrir acciones';
