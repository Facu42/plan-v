import type { ShowroomPage } from '../../components/nutrigo/ShowroomPanels';
import { nodeId, nodeName, sourceText, type SourceBinding, type SourceNode } from './SourceView';
import { patientNavBinding } from './patient-navigation';

/** Nutrigo no define Pagos/Ficha: reutilizar su shell sin indicar que es Plan. */
export function patientExtraBinding(node: SourceNode, page: 'pagos' | 'ficha', onNavigate: (page: ShowroomPage) => void): SourceBinding | undefined {
  const id = nodeId(node);
  if (id.endsWith(';2:4460') || id.endsWith(';433:18077')) return { text: page === 'pagos' ? 'Mis pagos' : 'Mi ficha' };
  if (nodeName(node) === 'Header-Section') return { hidden: true };
  if (nodeName(node) === 'SubMenu' && sourceText(node) === 'Meal Plan') {
    const nav = patientNavBinding(node, onNavigate, 0);
    return { ...nav, props: { ...nav?.props, style: { background: 'transparent' } } };
  }
}
