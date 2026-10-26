import { careErrorMessage } from '../../api/care';
import { aiJobsApi } from '../../api/ai-jobs';
import { plansApi } from '../../api/plans';
import { MAX_DIETARY_PREFERENCE_LENGTH, MAX_DIETARY_PREFERENCES, type AiJobView } from '../../types/ai-jobs';
import { planDateLabel, planTakesEffectNow } from '../../types/plan-handover';
import { emptyGuidance, type PlanGuidance } from '../../types/plan-guidance';
import { mealPlanDraftSchema, type PlanItemView, type PlanSlot, type PlanVersionView, type ProfessionalMealPlan } from '../../types/plans';
import { COMIDAS_EDITOR, fechasDeSemana, paraGuardar, sumarDias } from './planes-editor';

export const AVISO_PROGRAMAR = 'Próximamente. Todavía no se puede elegir una fecha y una hora aparte. Al publicar, la paciente ve el plan desde el inicio del período. Si ese día es más adelante, sigue con el plan anterior hasta entonces.';

const AVISO_SIN_PROPUESTA = 'El asistente no pudo armar la propuesta. El plan no cambió.';
const AVISO_LISTA = 'La propuesta está lista para revisar. Todavía no se publicó.';
const AVISO_BORRADOR = 'La propuesta quedó como borrador privado. Revisala y publicala cuando quieras.';

/** El servidor acepta como máximo 21 días y 42 comidas por propuesta. */
export function periodoAsistente(inicio: string, fin: string, semana: number) {
  const fechas = fechasDeSemana(inicio, fin, semana);
  const desde = fechas[0] ?? inicio;
  const hastaSemana = fechas[fechas.length - 1] ?? desde;
  const maxDias = Math.min(22, Math.floor(42 / COMIDAS_EDITOR.length));
  const hastaTope = sumarDias(desde, maxDias - 1);
  const hasta = hastaSemana < hastaTope ? hastaSemana : hastaTope;
  return { desde, hasta: hasta < desde ? desde : hasta, slots: [...COMIDAS_EDITOR] };
}

export function propuestaDe(job: AiJobView | null) {
  if (job?.status !== 'succeeded' || job.artifact?.kind !== 'menu_draft' || job.applied_at) return null;
  const parsed = mealPlanDraftSchema.safeParse(job.artifact.payload);
  return parsed.success ? parsed.data : null;
}

export function borradorDistinto(
  version: PlanVersionView,
  items: readonly PlanItemView[],
  horas: Partial<Record<PlanSlot, string>>,
  guidance: PlanGuidance,
) {
  if (JSON.stringify(version.items.map(paraGuardar)) !== JSON.stringify(items.map(paraGuardar))) return true;
  if (JSON.stringify(version.meal_times ?? {}) !== JSON.stringify(horas)) return true;
  const guia = version.guidance ?? emptyGuidance();
  return JSON.stringify(guia.recommendations) !== JSON.stringify(guidance.recommendations)
    || JSON.stringify(guia.avoid) !== JSON.stringify(guidance.avoid);
}

export function bloqueoAlPublicar(input: {
  hayPlan: boolean;
  esBorrador: boolean;
  cantidad: number;
  vacias: number;
  revisado: boolean;
}) {
  if (!input.hayPlan) return 'Primero guardá un borrador para publicar.';
  if (!input.esBorrador) return 'No hay cambios nuevos para publicar. La versión publicada se conserva.';
  if (!input.cantidad) return 'El borrador necesita al menos una comida para publicarse.';
  if (input.vacias) return 'Hay comidas sin alimentos. Completalas antes de publicar.';
  if (!input.revisado) return 'Marcá que revisaste el plan completo antes de publicar.';
  return null;
}

export function avisoTrasPublicar(plan: ProfessionalMealPlan, hoy: string) {
  const vigente = Boolean(plan.published && plan.published.status !== 'archived');
  const inicio = plan.scheduled?.period_start ?? plan.current.period_start;
  if (plan.current.status === 'scheduled' || plan.scheduled) {
    return `Plan publicado. La paciente sigue con el plan anterior hasta el ${planDateLabel(inicio)}.`;
  }
  if (vigente && !planTakesEffectNow(plan.current.period_start, hoy, true)) {
    return `Plan publicado. La paciente sigue con el plan anterior hasta el ${planDateLabel(plan.current.period_start)}.`;
  }
  return 'Plan publicado. La paciente ya puede ver la versión revisada.';
}

export async function publicarPlanRevisado(input: {
  plan: ProfessionalMealPlan;
  vacias: number;
  cantidad: number;
  revisado: boolean;
  hoy: string;
  publish?: typeof plansApi.publish;
}) {
  const bloqueo = bloqueoAlPublicar({
    hayPlan: true,
    esBorrador: input.plan.current.status === 'draft',
    cantidad: input.cantidad,
    vacias: input.vacias,
    revisado: input.revisado,
  });
  if (bloqueo) return { ok: false as const, aviso: bloqueo };
  try {
    const publicar = input.publish ?? plansApi.publish;
    const respuesta = await publicar(input.plan.id, input.plan.current.version, input.plan.current);
    return { ok: true as const, plan: respuesta.plan, aviso: avisoTrasPublicar(respuesta.plan, input.hoy) };
  } catch (razon) {
    return { ok: false as const, aviso: careErrorMessage(razon) };
  }
}

export async function esperarPropuesta(
  inicial: AiJobView,
  leer: (id: string) => Promise<AiJobView>,
  vigente: () => boolean,
  esperar: (ms: number) => Promise<void> = (ms) => new Promise(resolve => setTimeout(resolve, ms)),
) {
  let job = inicial;
  for (let intento = 0; intento < 40 && vigente() && (job.status === 'queued' || job.status === 'running'); intento += 1) {
    await esperar(1500);
    if (!vigente()) return job;
    job = await leer(job.id);
  }
  return job;
}

/** El pedido de la IA acepta hasta 10 preferencias de 80 caracteres. */
export function recortarPreferencias(lineas: readonly string[]) {
  const vistos = new Set<string>();
  const salida: string[] = [];
  for (const linea of lineas) {
    const texto = linea.trim().slice(0, MAX_DIETARY_PREFERENCE_LENGTH);
    const clave = texto.toLocaleLowerCase('es');
    if (!texto || vistos.has(clave)) continue;
    vistos.add(clave);
    salida.push(texto);
    if (salida.length >= MAX_DIETARY_PREFERENCES) break;
  }
  return salida;
}

export async function pedirPropuesta(input: {
  patientId: string;
  desde: string;
  hasta: string;
  preferencias?: readonly string[];
  vigente?: () => boolean;
  enqueue?: typeof aiJobsApi.enqueue;
  leer?: (id: string) => Promise<AiJobView>;
  esperar?: (ms: number) => Promise<void>;
}) {
  const vigente = input.vigente ?? (() => true);
  const preferencias = recortarPreferencias(input.preferencias ?? []);
  try {
    const encolar = input.enqueue ?? aiJobsApi.enqueue;
    const respuesta = await encolar({
      patient_id: input.patientId,
      job_type: 'menu_draft',
      period_start: input.desde,
      period_end: input.hasta,
      slots: [...COMIDAS_EDITOR],
      ...(preferencias.length ? { dietary_preferences: preferencias } : {}),
    });
    if (!vigente()) return { ok: false as const, aviso: '' };
    const job = await esperarPropuesta(
      respuesta.job,
      input.leer ?? (async (id) => (await aiJobsApi.get(id)).job),
      vigente,
      input.esperar,
    );
    if (!vigente()) return { ok: false as const, aviso: '' };
    if (propuestaDe(job)) return { ok: true as const, job, aviso: AVISO_LISTA };
    if (job.error_code === 'stale_context') {
      return { ok: false as const, aviso: 'Cambiaron el ingreso, la meta o el plan después de esta propuesta. Regenerala con los datos nuevos. El plan no cambió.' };
    }
    return { ok: false as const, aviso: AVISO_SIN_PROPUESTA };
  } catch (razon) {
    return { ok: false as const, aviso: `El asistente no pudo armar la propuesta. ${careErrorMessage(razon)}` };
  }
}

export async function guardarPropuestaComoBorrador(input: {
  jobId: string;
  patientId: string;
  apply?: typeof aiJobsApi.apply;
  leer?: typeof plansApi.professional;
}) {
  try {
    await (input.apply ?? aiJobsApi.apply)(input.jobId);
    const lectura = await (input.leer ?? plansApi.professional)(input.patientId);
    if (!lectura.plan) return { ok: false as const, aviso: 'No se pudo usar la propuesta. No encontramos el borrador actualizado.' };
    return { ok: true as const, plan: lectura.plan, aviso: AVISO_BORRADOR };
  } catch (razon) {
    return { ok: false as const, aviso: `No se pudo usar la propuesta. ${careErrorMessage(razon)}` };
  }
}
