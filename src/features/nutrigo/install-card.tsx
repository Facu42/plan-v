import { nodeName, sourceText, type SourceBinding, type SourceNode } from './SourceView';
import type { InstallOffer } from '../../pwa/install-offer';

/**
 * La tarjeta amarilla del menú (el «Start your health journey… / Claim Now!» del archivo) es el lugar
 * donde Nutrigo pone sus avisos: ahí va la invitación a instalar, en vez de una franja arriba de todo.
 * Sin oferta devuelve undefined y la tarjeta queda como en el archivo.
 */
export function installCardBinding(node: SourceNode, offer: Pick<InstallOffer, 'card' | 'action'> | null, onInstall: () => void): SourceBinding | undefined {
  if (!offer) return undefined;
  const text = sourceText(node);
  if (node.tag === 'p' && /^Start your health journey/.test(text)) return { children: <span className="leading-[1.5] text-[12px]">{offer.card}</span> };
  // El botón conserva su <p> del archivo (Poppins Medium 12): solo cambia la acción y, en el <p>, el texto.
  if (nodeName(node) === 'Button' && text === 'Claim Now!') return { onClick: onInstall, label: offer.action };
  if (node.tag === 'p' && text === 'Claim Now!') return { text: offer.action };
  return undefined;
}
