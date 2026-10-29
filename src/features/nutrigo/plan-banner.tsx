import { nodeName, sourceText, type SourceBinding, type SourceNode } from './SourceView';

/**
 * Plan nuevo publicado: la tarjeta amarilla del archivo («Start your health journey… / Claim Now!»), que es donde
 * Nutrigo pone sus avisos, cuenta el cambio y su botón abre «Qué cambia en el plan». Sin aviso devuelve undefined.
 */
export function planBannerBinding(node: SourceNode, notice: string | null, onOpen: () => void): SourceBinding | undefined {
  if (!notice) return undefined;
  const text = sourceText(node);
  if (node.tag === 'p' && /^Start your health journey/.test(text)) return { children: <span className="leading-[1.5] text-[12px]">{notice}</span> };
  if (nodeName(node) === 'Button' && text === 'Claim Now!') return { onClick: onOpen, label: 'Ver qué cambia en el plan' };
  if (node.tag === 'p' && text === 'Claim Now!') return { text: 'Ver qué cambia' };
  return undefined;
}
