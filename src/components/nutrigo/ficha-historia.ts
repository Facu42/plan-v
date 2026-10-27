// Historia clínica de la Ficha v29: cada dato tiene fecha, origen y, si se dio de baja, hasta cuándo. Todo se calcula «a una fecha» para poder ver cómo estaba.
import type { HistoryEntry, HistorySource, HistoryTopic } from '../../api/patient-history';

export const TEMAS_HISTORIA: ReadonlyArray<readonly [HistoryTopic, string]> = [
  ['motivo', 'Motivo y objetivo'], ['diag', 'Diagnósticos'], ['med', 'Medicación y suplementos'], ['alerg', 'Alergias e intolerancias'],
  ['fam', 'Antecedentes familiares'], ['halim', 'Historia alimentaria'], ['r24', 'Recordatorio de 24 h'], ['hab', 'Hábitos'],
  ['act', 'Actividad física'], ['sue', 'Sueño y estrés'], ['dig', 'Digestión'], ['ciclo', 'Ciclo menstrual'],
  ['emb', 'Embarazo y lactancia'], ['pref', 'Preferencias y rechazos'],
];
export const tituloDelTema = (tema: HistoryTopic) => TEMAS_HISTORIA.find(([clave]) => clave === tema)?.[1] ?? tema;

export const ORIGEN: Record<HistorySource, { texto: (nombre: string) => string; clase: string }> = {
  professional: { texto: () => 'Vos', clase: '' },
  patient: { texto: nombre => `${nombre}, en la app`, clase: 's-s' },
  import: { texto: () => 'Importado', clase: 's-i' },
  recording: { texto: () => 'Consulta grabada', clase: 's-g' },
  form: { texto: () => 'Formulario', clase: '' },
};

/** «2026-10-14» → «14/10/26». */
export const fechaLarga = (fecha: string) => `${fecha.slice(8, 10)}/${fecha.slice(5, 7)}/${fecha.slice(2, 4)}`;

const deTema = (entradas: readonly HistoryEntry[], tema: HistoryTopic) => entradas.filter(e => e.topic === tema);
/** Los datos que valen a esa fecha: ya cargados y todavía no dados de baja. */
export const vigentes = (entradas: readonly HistoryEntry[], tema: HistoryTopic, a: string) => deTema(entradas, tema).filter(e => e.recorded_on <= a && (!e.ended_on || e.ended_on > a));
/** Los que ya se habían dado de baja a esa fecha («Antes»). */
export const anteriores = (entradas: readonly HistoryEntry[], tema: HistoryTopic, a: string) => deTema(entradas, tema).filter(e => e.ended_on !== null && e.ended_on <= a);
export const ultimoCambio = (entradas: readonly HistoryEntry[], tema: HistoryTopic, a: string) =>
  deTema(entradas, tema).flatMap(e => [e.recorded_on, e.ended_on, e.edited_on]).filter((f): f is string => f !== null && f <= a).sort().pop() ?? '';

export type ResumenTema = { clave: HistoryTopic; titulo: string; cantidad: number; ultimo: string; completo: boolean };
export const resumenDeTemas = (entradas: readonly HistoryEntry[], a: string): ResumenTema[] =>
  TEMAS_HISTORIA.map(([clave, titulo]) => { const n = vigentes(entradas, clave, a).length; return { clave, titulo, cantidad: n, ultimo: ultimoCambio(entradas, clave, a), completo: n > 0 || anteriores(entradas, clave, a).length > 0 }; });

export const subtituloDelTema = (tema: ResumenTema) => tema.completo ? `${tema.cantidad} ${tema.cantidad === 1 ? 'dato' : 'datos'} · ${fechaLarga(tema.ultimo)}` : 'Falta completar';

export type CambioDelDia = { tipo: 'n' | 'b' | 'e'; tema: string; texto: string; detalle: string };
export type DiaDeCambios = { fecha: string; cambios: CambioDelDia[] };
/** Lo que pasó cada día (datos nuevos, editados y dados de baja), del más nuevo al más viejo, hasta la fecha elegida. */
export function cambiosPorFecha(entradas: readonly HistoryEntry[], a: string, nombre: string): DiaDeCambios[] {
  const dias = new Map<string, CambioDelDia[]>();
  const sumar = (fecha: string, cambio: CambioDelDia) => dias.set(fecha, [...(dias.get(fecha) ?? []), cambio]);
  for (const e of entradas) {
    const tema = tituloDelTema(e.topic);
    if (e.recorded_on <= a) sumar(e.recorded_on, { tipo: 'n', tema, texto: e.text, detalle: ORIGEN[e.source].texto(nombre) });
    if (e.edited_on && e.edited_on <= a) sumar(e.edited_on, { tipo: 'e', tema, texto: e.text, detalle: '' });
    if (e.ended_on && e.ended_on <= a) sumar(e.ended_on, { tipo: 'b', tema, texto: e.text, detalle: e.ended_reason });
  }
  return [...dias.entries()].sort(([x], [y]) => y.localeCompare(x)).map(([fecha, cambios]) => ({ fecha, cambios }));
}

export const fechasDeCambio = (entradas: readonly HistoryEntry[]) =>
  [...new Set(entradas.flatMap(e => [e.recorded_on, e.edited_on, e.ended_on]).filter((f): f is string => f !== null))].sort().reverse();

/** Temas que condicionan el plan: lo que se evita, se toma o se padece. */
export const TEMAS_QUE_CAMBIAN_EL_PLAN: readonly HistoryTopic[] = ['alerg', 'diag', 'med', 'pref'];
export const datosQueCambianElPlan = (entradas: readonly HistoryEntry[], a: string) => TEMAS_QUE_CAMBIAN_EL_PLAN.flatMap(tema => vigentes(entradas, tema, a).map(e => e.text));

export const metaDelEncabezado = (entradas: readonly HistoryEntry[], tema: HistoryTopic, a: string) => {
  const ultimo = ultimoCambio(entradas, tema, a);
  return ultimo ? `Último cambio el ${fechaLarga(ultimo)}` : 'Sin cambios todavía';
};
