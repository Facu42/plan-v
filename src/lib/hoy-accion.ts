// Rail Hoy de la nutri: como máximo una acción humana por paciente.
// No envía nada. El clic abre la pantalla real; done_at se guarda al ejecutar.
import type { Patient, SuggestedAction } from '../types';

export const VENTANA_DIAS = 7;
export const ACCIONES = ['mensaje', 'ajuste_menu', 'turno'] as const;
export type AccionHumana = (typeof ACCIONES)[number];

export const TITULO_ACCION: Record<AccionHumana, string> = {
  mensaje: 'Mandarle un mensaje',
  ajuste_menu: 'Ajustar el menú',
  turno: 'Proponer un turno',
};

export type FotoPendiente = { id: string; patientId: string };
export type HechoAccion = {
  patientId: string;
  action: AccionHumana;
  sourceKey: string;
  doneAt: string;
};

export type ItemHoy = {
  patientId: string;
  nombre: string;
  action: AccionHumana;
  titulo: string;
  cuerpo: string;
  borrador: string | null;
  sourceKey: string;
  href: string;
};

const esAccion = (valor: string | null | undefined): valor is AccionHumana =>
  valor === 'mensaje' || valor === 'ajuste_menu' || valor === 'turno';

const activo = (patient: Patient) => !patient.archived_at && !patient.deactivated_at && !patient.anonymized_at;

const recortar = (texto: string, tope: number) => texto.length <= tope ? texto : `${texto.slice(0, tope - 1).trimEnd()}…`;

/** Ids de fotos/comidas pendientes que ya trae la cola (`meal:<id>`) o el diario de la paciente. */
export function fotosDeCola(items: readonly { id: string; kind: string; patient_id: string }[]): FotoPendiente[] {
  return items.filter(item => item.kind === 'meal').map(item => ({
    id: item.id.startsWith('meal:') ? item.id.slice('meal:'.length) : item.id,
    patientId: item.patient_id,
  }));
}

function fotosDe(patient: Patient, cola: readonly FotoPendiente[]) {
  const ids = new Set<string>();
  for (const log of patient.meal_logs ?? []) if (log.status === 'pending_review' && log.id) ids.add(log.id);
  for (const foto of cola) if (foto.patientId === patient.id && foto.id) ids.add(foto.id);
  return [...ids].sort();
}

function claveFotos(ids: readonly string[]) {
  const muestra = ids.slice(0, 8).join(',');
  return `fotos:${ids.length}:${muestra}`;
}

function cubierto(hechos: readonly HechoAccion[], patientId: string, sourceKey: string, now: Date) {
  const desde = now.getTime() - VENTANA_DIAS * 86_400_000;
  return hechos.some(hecho => hecho.patientId === patientId && hecho.sourceKey === sourceKey && Date.parse(hecho.doneAt) >= desde);
}

function enlace(patientId: string, action: AccionHumana, sourceKey: string) {
  const params = new URLSearchParams({ paciente: patientId, accion: action, origen: sourceKey });
  if (action === 'turno') return `/crm/agenda?${params}`;
  params.set('seccion', action === 'ajuste_menu' ? 'plan' : 'resumen');
  return `/crm/ficha?${params}`;
}

function item(patient: Patient, action: AccionHumana, cuerpo: string, borrador: string | null, sourceKey: string): ItemHoy {
  return {
    patientId: patient.id,
    nombre: patient.name,
    action,
    titulo: TITULO_ACCION[action],
    cuerpo: recortar(cuerpo, 240),
    borrador: borrador ? recortar(borrador.trim(), 500) : null,
    sourceKey,
    href: enlace(patient.id, action, sourceKey),
  };
}

function candidato(patient: Patient, cola: readonly FotoPendiente[]): { action: AccionHumana; sourceKey: string; cuerpo: string; borrador: string | null } | null {
  const brief = patient.brief;
  if (esAccion(brief?.suggested_action) && !patient.briefDismissed) {
    const fuentes = [...(brief.source_ids ?? [])].sort().join(',') || 'sin-fuente';
    return {
      action: brief.suggested_action,
      sourceKey: `brief:${brief.suggested_action}:${fuentes}`,
      cuerpo: brief.up_next_body?.trim() || TITULO_ACCION[brief.suggested_action],
      borrador: brief.suggested_action === 'mensaje' ? brief.draft_message : null,
    };
  }
  const fotos = fotosDe(patient, cola);
  if (fotos.length) {
    const n = fotos.length;
    return {
      action: 'mensaje',
      sourceKey: claveFotos(fotos),
      cuerpo: n === 1
        ? 'Hay 1 foto sin revisar. Un toque corto para retomar el registro, no un sermón.'
        : `Hay ${n} fotos sin revisar. Un toque corto para retomar el registro, no un sermón.`,
      borrador: `Hola, vi que ${n === 1 ? 'quedó una comida' : `quedaron ${n} comidas`} para mirar. ¿Las vemos hoy?`,
    };
  }
  const tienePlan = (patient.todayPlan?.length ?? 0) > 0 || (patient.weekPlan ?? []).some(dia => dia.meals.length > 0);
  if (patient.adherence_score > 0 && patient.adherence_score < 65 && tienePlan) {
    return {
      action: 'ajuste_menu',
      sourceKey: `menu:${patient.adherence_score}`,
      cuerpo: 'La adherencia de esta semana está baja. Conviene simplificar un momento del menú. No se reescribe solo.',
      borrador: null,
    };
  }
  const tieneTurno = Boolean(patient.appointment?.starts_at || patient.appointment?.when);
  if (patient.adherence_score >= 65 && patient.adherence_score < 80 && !tieneTurno) {
    return {
      action: 'turno',
      sourceKey: 'turno:sin-proximo',
      cuerpo: 'No tiene un turno próximo. Podés proponerle uno. No se agenda solo.',
      borrador: null,
    };
  }
  return null;
}

/** Una acción o nada. Si la misma fuente ya se hizo en los últimos 7 días, no vuelve a salir. */
export function elegirUna(patient: Patient, cola: readonly FotoPendiente[], hechos: readonly HechoAccion[], now: Date): ItemHoy | null {
  if (!activo(patient)) return null;
  const elegido = candidato(patient, cola);
  if (!elegido || cubierto(hechos, patient.id, elegido.sourceKey, now)) return null;
  return item(patient, elegido.action, elegido.cuerpo, elegido.borrador, elegido.sourceKey);
}

export function railHoy(patients: readonly Patient[], cola: readonly FotoPendiente[], hechos: readonly HechoAccion[], now: Date): ItemHoy[] {
  const vistos = new Set<string>();
  const items: ItemHoy[] = [];
  for (const patient of patients) {
    if (vistos.has(patient.id)) continue;
    vistos.add(patient.id);
    const elegido = elegirUna(patient, cola, hechos, now);
    if (elegido) items.push(elegido);
  }
  return items.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

export function contarHechos(hechos: readonly HechoAccion[], now: Date, dias = VENTANA_DIAS) {
  const desde = now.getTime() - dias * 86_400_000;
  return hechos.filter(hecho => Date.parse(hecho.doneAt) >= desde).length;
}

export function textoHechas(cantidad: number) {
  return cantidad === 1 ? '1 hecha en 7 días' : `${cantidad} hechas en 7 días`;
}
