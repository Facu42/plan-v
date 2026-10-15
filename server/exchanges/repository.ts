import { getRequestDb } from '../db/supabase-client.js';
import { CareError } from '../care/errors.js';
import { registerDemoState } from '../demo/state.js';
import { exchangeEntryFromRow, exchangePayloadOf, type ExchangeEntry, type ExchangeInput } from '../../src/types/exchanges.js';

const entries = new Map<string, ExchangeEntry & { archived_at: string | null }>();
registerDemoState('exchanges', () => ({ entries }));
export function resetExchangesMemory() { entries.clear(); }
/** Sólo para pruebas y demostración local: las listas de Sistema reales las carga el servicio en la base. */
export function seedSystemExchangesMemory(inputs: ExchangeInput[]) {
  for (const input of inputs) {
    const { expected_revision: _revision, ...entry } = input;
    entries.set(input.id, { ...entry, revision: 1, owner_id: null, updated_at: new Date().toISOString(), archived_at: null } as ExchangeEntry & { archived_at: string | null });
  }
}

export function exchangeDbError(error: { code?: string } | null) {
  if (!error) return;
  const code = error.code ?? '';
  if (['42P01', '42883', 'PGRST202', 'PGRST205'].includes(code)) throw new CareError(501, 'Equivalencias todavía no está habilitado en este entorno.');
  if (code === '42501') throw new CareError(403, 'No tenés permiso para modificar esa equivalencia.');
  if (['PT409', '23505'].includes(code)) throw new CareError(409, 'La equivalencia cambió o ya no está disponible. Recargá antes de guardar.');
  if (['23514', '22023', '22P02'].includes(code)) throw new CareError(400, 'Revisá el nombre, las cantidades y los alimentos elegidos.');
  throw new CareError(503, 'No pudimos confirmar el guardado. Tus cambios siguen en el formulario.');
}

export async function listExchanges(owner: string, persistent: boolean): Promise<ExchangeEntry[]> {
  if (!persistent) {
    return [...entries.values()]
      .filter(e => e.archived_at === null && (e.owner_id === null || e.owner_id === owner))
      .map(({ archived_at: _archived, ...entry }) => structuredClone(entry) as ExchangeEntry);
  }
  const result: ExchangeEntry[] = [];
  const ids = new Set<string>();
  let total: number | undefined;
  do {
    const { data, error, count } = await getRequestDb().from('exchange_catalog')
      .select('id,owner_id,kind,revision,payload,updated_at', { count: 'exact' })
      .is('archived_at', null).order('id').range(result.length, result.length + 999);
    exchangeDbError(error);
    if (count === null || count === undefined) throw new CareError(503, 'No pudimos cargar las equivalencias completas. Reintentá.');
    if (total !== undefined && total !== count) throw new CareError(503, 'Las equivalencias cambiaron mientras se cargaban. Reintentá.');
    total = count;
    if (total > 2000) throw new CareError(503, 'Esta pantalla necesita búsqueda paginada antes de incorporar más equivalencias.');
    if (!data?.length && result.length < total) throw new CareError(503, 'No pudimos cargar las equivalencias completas. Reintentá.');
    for (const row of data ?? []) {
      if (ids.has(row.id)) throw new CareError(503, 'Las equivalencias cambiaron mientras se cargaban. Reintentá.');
      ids.add(row.id);
      result.push(exchangeEntryFromRow(row));
    }
  } while (result.length < total);
  return result;
}

export async function saveExchange(owner: string, input: ExchangeInput, persistent: boolean): Promise<ExchangeEntry> {
  if (persistent) {
    const { data, error } = await getRequestDb().rpc('save_exchange_entry', {
      entry_id: input.id, entry_kind: input.kind, expected_revision: input.expected_revision, entry_payload: exchangePayloadOf(input),
    });
    exchangeDbError(error);
    if (!data) throw new CareError(503, 'No pudimos confirmar el guardado.');
    return exchangeEntryFromRow(data);
  }
  const old = entries.get(input.id);
  if (old && old.owner_id !== owner) throw new CareError(403, 'No tenés permiso para modificar esa equivalencia.');
  if (old && old.kind !== input.kind) throw new CareError(400, 'El tipo de una equivalencia no se puede cambiar.');
  if (old && (old.archived_at !== null || old.revision !== input.expected_revision)) {
    throw new CareError(409, 'La equivalencia cambió o ya no está disponible. Recargá antes de guardar.');
  }
  if (!old && input.expected_revision !== 0) throw new CareError(409, 'La equivalencia cambió o ya no está disponible. Recargá antes de guardar.');
  const { expected_revision: _revision, ...entry } = input;
  const saved = { ...entry, revision: (old?.revision ?? 0) + 1, owner_id: owner, updated_at: new Date().toISOString(), archived_at: null } as ExchangeEntry & { archived_at: string | null };
  entries.set(input.id, saved);
  const { archived_at: _archived, ...view } = saved;
  return structuredClone(view) as ExchangeEntry;
}

export async function archiveExchange(owner: string, id: string, expectedRevision: number, persistent: boolean): Promise<{ id: string; revision: number }> {
  if (persistent) {
    const { data, error } = await getRequestDb().rpc('archive_exchange_entry', { entry_id: id, expected_revision: expectedRevision });
    exchangeDbError(error);
    if (!data) throw new CareError(503, 'No pudimos confirmar la operación.');
    return { id: data.id, revision: data.revision };
  }
  const old = entries.get(id);
  if (!old || old.owner_id !== owner) throw new CareError(403, 'No tenés permiso para modificar esa equivalencia.');
  if (old.archived_at !== null || old.revision !== expectedRevision) throw new CareError(409, 'La equivalencia cambió o ya no está disponible. Recargá antes de guardar.');
  old.archived_at = new Date().toISOString(); old.revision += 1; old.updated_at = old.archived_at;
  return { id, revision: old.revision };
}
