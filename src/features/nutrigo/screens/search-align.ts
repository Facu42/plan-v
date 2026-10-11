import { cloneElement, isValidElement } from 'react';
import type { SourceBinding } from '../SourceView';

/**
 * El texto de ejemplo del buscador del archivo va centrado (`text-center`) porque es una etiqueta de ancho fijo.
 * Un campo donde se escribe ocupa todo el ancho: se alinea a la izquierda, como el resto de los campos del archivo.
 */
export function leftAlignedSearch(binding: SourceBinding | undefined): SourceBinding | undefined {
  if (!binding || !Array.isArray(binding.children)) return binding;
  const children = binding.children.map(child => isValidElement<{ className?: string }>(child) && child.type === 'input'
    ? cloneElement(child, { className: String(child.props.className ?? '').replace('text-center', 'text-left') })
    : child);
  return { ...binding, children };
}
