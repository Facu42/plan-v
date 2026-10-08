import type { CSSProperties } from 'react';

/** Texto de varios renglones del archivo que, si el dato es más largo, se corta con elipsis en el renglón indicado. */
export const lineClamp = (lines: number): CSSProperties => ({ display: '-webkit-box', WebkitLineClamp: lines, WebkitBoxOrient: 'vertical', overflow: 'hidden', overflowWrap: 'anywhere', whiteSpace: 'normal' });
/** Texto de una sola línea del archivo (nowrap) que no se sale de su caja: elipsis al final. */
export const oneLineEllipsis: CSSProperties = { minWidth: 0, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
/** Las cajas del archivo no se encogen (shrink-0): hace falta permitirlo en la cadena de cajas para que la elipsis actúe. */
export const shrinkable: CSSProperties = { minWidth: 0, flexShrink: 1 };
