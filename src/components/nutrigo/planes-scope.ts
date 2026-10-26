import { careErrorMessage } from '../../api/care';
import { plansApi } from '../../api/plans';
import { snapshotBorrador } from '../../types/plan-draft';
import { type PlanSlot, type ProfessionalMealPlan } from '../../types/plans';

import { COMIDAS_EDITOR } from './planes-editor';

export type AplicacionIA = { anterior: ProfessionalMealPlan; revisionAplicada: string };
export type CambioIA = { id: number; titulo: 'Propuesta aplicada' | 'Aplicación deshecha'; detalle: string; hora: string };

export function alcanceDelPedido(alcance: number, fecha: string, comida: PlanSlot, inicio: string, fin: string, incluyeExtra = false) {
  const desde = alcance === 2 ? inicio : fecha;
  const hasta = alcance === 2 ? fin : fecha;
  const slots = alcance === 1 ? [comida] : [...COMIDAS_EDITOR, ...(incluyeExtra ? ['Extra' as const] : [])];
  const dias = (Date.parse(hasta) - Date.parse(desde)) / 86_400_000 + 1;
  if (dias > 22 || dias * slots.length > 42) throw new Error('Todo el plan supera las 42 comidas que acepta la IA por pedido. Elegí un día o una comida; no se modificó el plan.');
  return { desde, hasta, slots };
}

export function puedeDeshacerAplicacion(plan: ProfessionalMealPlan | null, aplicacion: AplicacionIA | null) {
  return Boolean(plan && aplicacion && plan.id === aplicacion.anterior.id && plan.patient_id === aplicacion.anterior.patient_id
    && plan.current.status === 'draft' && plan.current.revision === aplicacion.revisionAplicada);
}

export async function deshacerAplicacion(plan: ProfessionalMealPlan, aplicacion: AplicacionIA, save = plansApi.save) {
  if (!puedeDeshacerAplicacion(plan, aplicacion)) return { ok: false as const, aviso: 'El borrador cambió después de aplicar. No se deshizo para conservar los cambios posteriores.' };
  try {
    const copia = snapshotBorrador(aplicacion.anterior);
    const respuesta = await save(plan.patient_id, { ...copia, expected_revision: aplicacion.revisionAplicada });
    return { ok: true as const, plan: respuesta.plan, aviso: 'Se deshizo la última aplicación IA. El borrador anterior quedó restaurado; no se publicó ni se avisó a la paciente.' };
  } catch (error) {
    return { ok: false as const, aviso: `No se pudo deshacer. ${careErrorMessage(error)}` };
  }
}
