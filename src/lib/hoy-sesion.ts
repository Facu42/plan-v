// La intención queda en el navegador. Nada se manda al elegirla.
import { api } from '../api/client';
import type { AccionHumana, ItemHoy } from './hoy-accion';

export const HOY_HECHO = 'plan-v:hoy-hecho';
const CLAVE = 'planv-hoy';

export type IntencionHoy = {
  patientId: string;
  action: AccionHumana;
  sourceKey: string;
  borrador: string | null;
};

const esAccion = (valor: unknown): valor is AccionHumana =>
  valor === 'mensaje' || valor === 'ajuste_menu' || valor === 'turno';

export function guardarIntencion(item: Pick<ItemHoy, 'patientId' | 'action' | 'sourceKey' | 'borrador'>) {
  if (typeof sessionStorage === 'undefined') return;
  const intencion: IntencionHoy = {
    patientId: item.patientId,
    action: item.action,
    sourceKey: item.sourceKey,
    borrador: item.borrador,
  };
  sessionStorage.setItem(CLAVE, JSON.stringify(intencion));
}

export function leerIntencion(): IntencionHoy | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const crudo = sessionStorage.getItem(CLAVE);
    if (!crudo) return null;
    const parsed = JSON.parse(crudo) as Partial<IntencionHoy>;
    if (!parsed.patientId || !parsed.sourceKey || !esAccion(parsed.action)) return null;
    return {
      patientId: parsed.patientId,
      action: parsed.action,
      sourceKey: parsed.sourceKey,
      borrador: typeof parsed.borrador === 'string' ? parsed.borrador : null,
    };
  } catch {
    return null;
  }
}

export function borradorHoy(patientId: string) {
  const intencion = leerIntencion();
  if (!intencion || intencion.patientId !== patientId || intencion.action !== 'mensaje') return null;
  return intencion.borrador?.trim() || null;
}

/** Anota done_at solo si esta pantalla sigue siendo la acción elegida. No envía nada. */
export async function marcarHechoSiCorresponde(patientId: string, action: AccionHumana) {
  const intencion = leerIntencion();
  if (!intencion || intencion.patientId !== patientId || intencion.action !== action) return;
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('accion') !== action || params.get('paciente') !== patientId) return;
  }
  await api.registrarHechoHoy(patientId, { action, source_key: intencion.sourceKey });
  window.dispatchEvent(new Event(HOY_HECHO));
}
