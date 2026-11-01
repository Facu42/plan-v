export type FilaBorrador = { name: string; value: string; unit: string; range: string; reviewed: boolean };

/** Nada se guarda si falta la revisión de una fila o si el borrador está vacío. */
export function borradorListo(rows: readonly FilaBorrador[]) {
  return rows.length > 0 && rows.every(row => row.reviewed && row.name.trim().length > 0 && row.value.trim().length > 0);
}

export function pedidoLaboratorio(rows: readonly FilaBorrador[]) {
  if (!borradorListo(rows)) return null;
  return rows.map(row => ({ ...row, reviewed: true as const }));
}
