import type { Patient } from '../../types';
import type { PortfolioAnswer } from '../../types/portfolio';
import { fondoAvatar, inicialesDe } from './seguimiento-presentacion';

export const SUGERENCIAS = [
  'Resumen de la cartera',
  '¿Quiénes no tienen registros?',
  '¿Qué comidas están por revisar?',
] as const;

export const PERIODOS = [7, 30, 90] as const;
export type PeriodoAsistente = (typeof PERIODOS)[number];

export function esPeriodo(valor: number): valor is PeriodoAsistente {
  return valor === 7 || valor === 30 || valor === 90;
}

export function fichaRegistros(id: string) {
  return `/crm/ficha?paciente=${encodeURIComponent(id)}&seccion=alimentario`;
}

export function fichaResumen(id: string) {
  return `/crm/ficha?paciente=${encodeURIComponent(id)}&seccion=resumen`;
}

export type PropuestaVista = { clave: string; texto: string; ficha: string | null; nombre: string | null };
export type FuenteVista = { id: string; nombre: string; registros: number; iniciales: string; fondo: string; ficha: string };

/** Con la IA apagada, o si la respuesta no es de la IA, no hay propuestas. Los números siguen en el texto. */
export function propuestasDe(respuesta: PortfolioAnswer, usarIa: boolean): PropuestaVista[] {
  if (!usarIa || respuesta.mode !== 'ai') return [];
  const propias = respuesta.proposals.map((propuesta, indice) => ({
    clave: `p:${propuesta.patient_id}:${indice}`,
    texto: propuesta.text.trim(),
    ficha: fichaResumen(propuesta.patient_id),
    nombre: null as string | null,
  }));
  const generales = (respuesta.general_proposals ?? []).map((texto, indice) => ({
    clave: `g:${indice}`,
    texto: texto.trim(),
    ficha: null,
    nombre: null,
  }));
  return [...propias, ...generales].filter(propuesta => propuesta.texto.length > 0);
}

export function fuentesDe(respuesta: PortfolioAnswer, pacientes: readonly Pick<Patient, 'id' | 'name' | 'initials' | 'tone'>[]): FuenteVista[] {
  const ficha = new Map(pacientes.map(persona => [persona.id, persona]));
  return respuesta.sources.map(fila => {
    const persona = ficha.get(fila.patient_id);
    return {
      id: fila.patient_id,
      nombre: fila.name,
      registros: fila.meal_count,
      iniciales: inicialesDe(fila.name, persona?.initials),
      fondo: fondoAvatar(persona?.tone),
      ficha: fichaRegistros(fila.patient_id),
    };
  });
}

export function nombresDePropuestas(propuestas: PropuestaVista[], fuentes: FuenteVista[]): PropuestaVista[] {
  return propuestas.map(propuesta => {
    if (!propuesta.ficha) return propuesta;
    const id = new URL(propuesta.ficha, 'https://plan.v').searchParams.get('paciente') ?? '';
    return { ...propuesta, nombre: fuentes.find(fuente => fuente.id === id)?.nombre ?? null };
  });
}

export function textoPermiso(excluidas: number) {
  const regla = 'Una propuesta no le llega hasta que vos la revisás.';
  if (excluidas > 0) {
    const quienes = excluidas === 1 ? '1 paciente no dio permiso y queda afuera' : `${excluidas} pacientes no dieron permiso y quedan afuera`;
    return `${quienes}. ${regla}`;
  }
  return `Quien no dio permiso queda afuera. ${regla}`;
}

export function textoIdeas(prendidas: boolean, hayPropuesta: boolean, aviso: string) {
  if (!prendidas) return 'Prendé las propuestas si querés ideas. Nada se manda solo.';
  if (aviso && !hayPropuesta) return 'Seguís viendo los números. Esta respuesta no trajo propuestas.';
  return 'La idea queda en la conversación, para mirar.';
}
