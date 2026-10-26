import { periodoAsistente, recortarPreferencias } from './planes-parte-3';
import { sumarDias } from './planes-editor';

export const DURACIONES_PLAN = ['1 día', '7 días', '14 días', '4 semanas'] as const;
export const DIETAS_PLAN = ['General', 'Mediterránea', 'Vegetariana', 'Vegana', 'Pescetariana', 'Flexitariana', 'DASH'] as const;
export const ESTRATEGIAS_PLAN = ['Alta en proteínas', 'Baja en carbohidratos', 'Alta en fibra', 'Baja en fibra', 'Cetogénica'] as const;
export const CUIDADOS_PLAN = ['Celiaquía', 'Sin lactosa', 'Hierro bajo', 'Hipotiroidismo', 'Acidez o reflujo', 'Hígado graso', 'Prediabetes', 'Hipertensión', 'Colesterol alto', 'Menopausia', 'Embarazo', 'Lactancia', 'Colon irritable', 'Sin azúcar agregada'] as const;
export const FORMATOS_PLAN = ['Grilla semanal', 'Lista por día', 'Cuadro para imprimir'] as const;
export const MEDIDAS_PLAN = ['Gramos', 'Medidas caseras', 'Las dos'] as const;
export const INCLUIR_PLAN = ['Grupos de intercambio', 'Mi recetario', 'Alternativas por alimento', 'Lista de compras', 'Costo estimado'] as const;
export const SUGERENCIAS_ASISTENTE = ['Cambiá la merluza por pollo', 'Más hierro en los almuerzos', 'Bajá las calorías de la cena', 'Completá el día con una colación'] as const;
export const IDEAS_ARMADO = ['Cenas livianas y temprano', 'Viandas para el trabajo', 'Usá mis recetas y lo que ya come'] as const;

export const AVISO_DESHACER = 'Próximamente. Deshacer un cambio del asistente todavía no vuelve atrás el borrador. En Versiones podés restaurar una copia anterior: queda como borrador y no se publica.';
export const AVISO_DICTAR = 'Próximamente. Dictar el pedido todavía no está disponible.';
export const AVISO_ADJUNTAR = 'Próximamente. Adjuntar una referencia todavía no está disponible.';
export const AVISO_MAIL = 'Próximamente. Enviar el plan por mail todavía no está disponible.';
export const AVISO_IMPRESO = 'Próximamente. La copia impresa, distinta del PDF, todavía no está disponible.';
export const AVISO_FICHA = 'La ficha guardada igual la lee el asistente. «No usar» solo saca esa línea de las preferencias de este pedido.';
export const AVISO_FORMATO = 'El formato, las medidas y qué incluir todavía no cambian el documento. El asistente arma la semana de comidas.';
export const AVISO_COPIAR_OTRA = 'Próximamente. Copiar este plan a otra paciente queda para después.';
export const AVISO_COMPARTIR_APP = 'La entrega en la app se confirma en Publicar plan revisado. Desde acá no se publica sola.';
export const AVISO_META_ARMADO = 'La meta diaria se edita en el plan, en Ajustes del plan.';
export const AVISO_ALCANCE = 'Preparé una propuesta de la semana visible. Todavía no se publicó. Elegir un día o una comida no recorta este pedido.';

export type DuracionArmado = 0 | 1 | 2 | 3;
export type DatoFicha = { titulo: string; texto: string; usar: boolean };

export function periodoDesdeDuracion(duracion: DuracionArmado, hoy: string) {
  const dias = [1, 7, 14, 28][duracion];
  const pedido = sumarDias(hoy, dias - 1);
  const periodo = periodoAsistente(hoy, pedido, 0);
  return { ...periodo, recortado: periodo.hasta < pedido };
}

export function datosDeFicha(paciente: { goal: string; plan_b: string; next_focus: string; sensitive_hours: string }): DatoFicha[] {
  return [
    ['Objetivo', paciente.goal],
    ['Plan B', paciente.plan_b],
    ['Foco de la consulta', paciente.next_focus],
    ['Horario sensible', paciente.sensitive_hours],
  ].map(([titulo, texto]) => ({ titulo, texto: texto.trim() || 'Sin dato', usar: true }));
}

export function preferenciasDelArmado(input: {
  pedido: string;
  dieta: string;
  estrategias: readonly string[];
  cuidados: readonly string[];
  ficha: readonly DatoFicha[];
}) {
  return recortarPreferencias([
    input.pedido,
    input.dieta !== 'General' ? `Alimentación: ${input.dieta}` : '',
    ...input.estrategias.map(item => `Estrategia: ${item}`),
    ...input.cuidados.map(item => `Cuidado: ${item}`),
    ...input.ficha.filter(item => item.usar && item.texto !== 'Sin dato').map(item => `${item.titulo}: ${item.texto}`),
  ]);
}

export function lineasDePropuesta(items: readonly { for_date: string; slot: string; free_text?: string | null }[]) {
  return items.slice(0, 4).map(item => ({
    etiqueta: `${item.slot} · ${item.for_date.slice(8, 10)}/${item.for_date.slice(5, 7)}`,
    texto: item.free_text?.trim() || 'Comida propuesta',
  }));
}

export function notaDuracion(recortado: boolean) {
  return recortado
    ? '14 días y 4 semanas superan lo que el asistente puede armar de una vez. La propuesta queda en la primera semana. El resto se completa después.'
    : '';
}
