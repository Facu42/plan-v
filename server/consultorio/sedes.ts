// Sede de cada turno que carga la nutri o la secretaria (tabla appointment_locations).
// Los turnos de la página pública ya traen su sede en scheduling_bookings.calendar_id.
// Sin la migración, leer devuelve «no instalada» y guardar avisa con un mensaje claro: el resto de la agenda sigue igual.
import { CareError } from '../care/errors.js';
import { getRequestDb } from '../db/supabase-client.js';
import { readAllRows } from '../crm/repository.js';
import { profile } from '../scheduling/repository.js';

const memoria = new Map<string, Map<string, string>>();
export function resetSedesMemory() { memoria.clear(); }

const FALTA_TABLA = ['42P01', 'PGRST205', 'PGRST202'];
export const SEDES_SIN_INSTALAR = 'Para guardar la sede de cada turno falta instalar una tabla nueva en la base.';
export const faltaTabla = (error: { code?: string } | null | undefined) => FALTA_TABLA.includes(error?.code ?? '');

export type SedesDeTurnos = { instalada: boolean; turnos: Record<string, string> };

export async function leerSedesDeTurnos(nid: string, persistent: boolean): Promise<SedesDeTurnos> {
  if (!persistent) return { instalada: true, turnos: Object.fromEntries(memoria.get(nid) ?? new Map()) };
  const db = getRequestDb();
  try {
    const rows = await readAllRows((offset, end) => db.from('appointment_locations').select('appointment_id,location_id').eq('nutritionist_id', nid).order('appointment_id').range(offset, end));
    return { instalada: true, turnos: Object.fromEntries(rows.map(r => [String(r.appointment_id), String(r.location_id)])) };
  } catch (error) {
    if (faltaTabla(error as { code?: string }) || (error instanceof CareError && error.status === 501)) return { instalada: false, turnos: {} };
    throw error;
  }
}

/** Guarda (o borra, con null) la sede de un turno. La sede tiene que existir en la configuración del consultorio. */
export async function guardarSedeDeTurno(nid: string, appointmentId: string, locationId: string | null, persistent: boolean): Promise<void> {
  if (locationId) {
    const config = (await profile(nid, persistent)).config;
    if (!config.calendars.some(c => c.id === locationId)) throw new CareError(400, 'Esa sede ya no existe. Elegí otra.');
  }
  if (!persistent) {
    const mapa = memoria.get(nid) ?? new Map<string, string>();
    if (locationId) mapa.set(appointmentId, locationId); else mapa.delete(appointmentId);
    memoria.set(nid, mapa);
    return;
  }
  const db = getRequestDb();
  const r = locationId
    ? await db.from('appointment_locations').upsert({ appointment_id: appointmentId, nutritionist_id: nid, location_id: locationId, updated_at: new Date().toISOString() }, { onConflict: 'appointment_id' })
    : await db.from('appointment_locations').delete().eq('appointment_id', appointmentId).eq('nutritionist_id', nid);
  if (faltaTabla(r.error)) throw new CareError(503, SEDES_SIN_INSTALAR);
  if (r.error) throw new CareError(r.error.code === '42501' ? 403 : 503, r.error.code === '42501' ? 'No podés cambiar la sede de ese turno.' : 'No pudimos guardar la sede. Probá de nuevo en un momento.');
}
