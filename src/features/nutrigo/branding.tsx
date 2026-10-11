import planVLogo from '../../assets/plan-v-logo-256.png';
import { nodeName, renderSource, type SourceBinding, type SourceNode } from './SourceView';
import { translateSource } from './translation';

/** Keep the original logo slot and replace its mark with the approved Plan V asset. */
export function planVBrandBinding(node: SourceNode): SourceBinding | undefined {
  if (nodeName(node) !== 'Logo') return undefined;
  return {
    children: node.children.map((child, key) => renderSource(child, part =>
      nodeName(part) === 'symbol'
        ? { children: <img src={planVLogo} alt="Logo Plan V Nutrición" width={256} height={256} className="block h-full w-full object-contain" /> }
        : undefined,
    translateSource, key)),
  };
}
