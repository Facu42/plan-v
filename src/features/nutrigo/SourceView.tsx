import { cloneElement, createElement, isValidElement, type ReactNode } from 'react';

export type SourceNode = { tag: string; props: Record<string, unknown>; children: (SourceNode | string | number)[] };
export type SourceBinding = {
  text?: ReactNode;
  children?: ReactNode;
  hidden?: boolean;
  onClick?: () => void;
  label?: string;
  tag?: string;
  props?: Record<string, unknown>;
};
export type SourceResolver = (node: SourceNode) => SourceBinding | undefined;
const assets = import.meta.glob('./assets/*.svg', { eager: true, query: '?no-inline', import: 'default' }) as Record<string, string>;
export const nodeId = (node: SourceNode) => String(node.props['data-node-id'] ?? node.props.id ?? '');
export const nodeName = (node: SourceNode) => String(node.props['data-name'] ?? '');
export function findSource(node: SourceNode, test: (node: SourceNode) => boolean): SourceNode | undefined {
  if (test(node)) return node;
  for (const child of node.children) if (typeof child === 'object') { const found = findSource(child, test); if (found) return found; }
}
export function sourceText(node: SourceNode): string {
  return node.children.map(child => typeof child === 'object' ? sourceText(child) : String(child)).join(' ').replace(/\s+/g, ' ').trim();
}
export function renderSource(node: SourceNode | string | number, resolve: SourceResolver, translate: (text: string) => string, key?: string | number): ReactNode {
  if (typeof node !== 'object') return typeof node === 'string' ? translate(node) : node;
  const binding = resolve(node);
  if (binding?.hidden) return null;
  const tag = binding?.tag ?? (binding?.onClick ? 'button' : node.tag);
  const props: Record<string, unknown> = { ...node.props, ...binding?.props, key };
  if (props.id) { props['data-source-id'] = props.id; delete props.id; }
  if (typeof props.src === 'string' && props.src.startsWith('asset:')) props.src = assets[`./assets/${props.src.slice(6)}`];
  if (binding?.onClick) { props.onClick = binding.onClick; props.type = 'button'; }
  if (binding?.label) props['aria-label'] = binding.label;
  if (tag === 'button' && !props.type) props.type = 'button';
  let children = binding && 'children' in binding ? binding.children : binding && 'text' in binding ? binding.text : node.children.map((child, i) => renderSource(child, resolve, translate, i));
  // A controller can clone this same source subtree to bind its descendants.
  // Reuse its content, not another copy of the frame with duplicated padding.
  if (isValidElement<Record<string, unknown>>(children) && children.type === node.tag) {
    const childProps = children.props;
    const sourceId = nodeId(node);
    const sameSource = sourceId ? String(childProps['data-node-id'] ?? childProps['data-source-id'] ?? '') === sourceId
      : childProps['data-name'] === node.props['data-name'] && childProps.className === node.props.className;
    if (sameSource) children = childProps.children as ReactNode;
  }
  if(Array.isArray(children))children=children.map((child,index)=>isValidElement(child)&&child.key===null?cloneElement(child,{key:`source-${index}`}):child);
  return ['img','input','br','hr','source'].includes(tag) ? createElement(tag, props) : createElement(tag, props, children);
}
export function SourceView({ source, resolve = () => undefined, translate }: { source: SourceNode; resolve?: SourceResolver; translate: (text: string) => string }) {
  return renderSource(source, resolve, translate);
}
