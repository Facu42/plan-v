import type { SourceBinding, SourceNode } from './SourceView';

/** Clases de fondo del archivo que alternan según el estado (verde activo, gris, blanco, naranja). */
export const GREEN_BG = 'bg-[#c2e66e]';
export const GREY_BG = 'bg-[#f6f6f7]';
export const WHITE_BG = 'bg-white';
export const ORANGE_BG = 'bg-[#ffa257]';
export const CREAM_BG = 'bg-[#fefcfb]';
/**
 * Cambia el fondo de un nodo del archivo por otra clase del propio archivo (sin estilos en línea con colores sueltos).
 * Se usa cuando el estado de los datos decide qué tono corresponde (botón activo, barra sin puntaje, momento de la comida).
 */
export function swapBackground(node: SourceNode, from: readonly string[], to: string): SourceBinding {
  const kept = String(node.props.className ?? '').split(/\s+/).filter(name => name && !from.includes(name));
  return { props: { className: [...kept, to].join(' ') } };
}
