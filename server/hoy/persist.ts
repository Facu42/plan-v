import type { AccionHumana, HechoAccion } from '../../src/lib/hoy-accion.js';
import { TITULO_ACCION } from '../../src/lib/hoy-accion.js';
import { privilegedDb } from '../db/supabase-client.js';
import { SchemaUnavailableError } from '../db/supabase-repo.js';

const faltaColumna = (error: { code?: string; message?: string } | null) =>
  error?.code === '42703' || /done_at/.test(error?.message ?? '');

function fila(row: { patient_id: string; suggested_action: string; source_ids: string[] | null; done_at: string }): HechoAccion | null {
  if (row.suggested_action !== 'mensaje' && row.suggested_action !== 'ajuste_menu' && row.suggested_action !== 'turno') return null;
  const sourceKey = row.source_ids?.[0];
  if (!sourceKey || !row.done_at) return null;
  return { patientId: row.patient_id, action: row.suggested_action, sourceKey, doneAt: row.done_at };
}

export async function listarHechosPersistidos(nutritionistId: string): Promise<HechoAccion[]> {
  const db = privilegedDb();
  const { data, error } = await db.from('ai_briefs')
    .select('patient_id,suggested_action,source_ids,done_at')
    .eq('nutritionist_id', nutritionistId)
    .eq('status', 'done')
    .not('done_at', 'is', null)
    .order('done_at', { ascending: false })
    .limit(200);
  if (error) {
    if (faltaColumna(error)) throw new SchemaUnavailableError('Falta la columna done_at. La migración no está aplicada.');
    throw error;
  }
  return (data ?? []).map(row => fila(row as { patient_id: string; suggested_action: string; source_ids: string[] | null; done_at: string })).filter((item): item is HechoAccion => Boolean(item));
}

export async function guardarHechoPersistido(nutritionistId: string, patientId: string, action: AccionHumana, sourceKey: string, doneAt: string): Promise<HechoAccion> {
  const db = privilegedDb();
  const { data: previos, error: lectura } = await db.from('ai_briefs')
    .select('patient_id,suggested_action,source_ids,done_at')
    .eq('nutritionist_id', nutritionistId)
    .eq('patient_id', patientId)
    .eq('status', 'done')
    .eq('suggested_action', action)
    .contains('source_ids', [sourceKey])
    .limit(1);
  if (lectura) {
    if (faltaColumna(lectura)) throw new SchemaUnavailableError('Falta la columna done_at. La migración no está aplicada.');
    throw lectura;
  }
  const ya = (previos ?? []).map(row => fila(row as { patient_id: string; suggested_action: string; source_ids: string[] | null; done_at: string })).find(Boolean);
  if (ya) return ya;
  const { error } = await db.from('ai_briefs').insert({
    nutritionist_id: nutritionistId,
    patient_id: patientId,
    suggested_action: action,
    up_next_title: TITULO_ACCION[action],
    up_next_body: 'Hecha por la profesional.',
    draft_message: null,
    source_ids: [sourceKey],
    adherence_why: '',
    status: 'done',
    done_at: doneAt,
  });
  if (error) {
    if (faltaColumna(error)) throw new SchemaUnavailableError('Falta la columna done_at. La migración no está aplicada.');
    throw error;
  }
  return { patientId, action, sourceKey, doneAt };
}
