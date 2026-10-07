import { getRequestDb } from '../db/supabase-client.js';
import { CareError } from '../care/errors.js';
import { registerDemoState } from '../demo/state.js';
import { foodInputSchema, normalizeFoodSearch, type Food, type FoodInput } from '../../src/types/foods.js';

const foods = new Map<string, Food>();
registerDemoState('foods', () => ({ foods }));
export function resetFoodsMemory() { foods.clear(); }
export function foodDbError(error: { code?: string } | null) {
  if (!error) return;
  if (['42P01', '42883', 'PGRST202', 'PGRST205'].includes(error.code ?? '')) throw new CareError(501, 'El catálogo de alimentos todavía no está habilitado en este entorno.');
  if (error.code === '42501') throw new CareError(403, 'No tenés permiso para modificar ese alimento.');
  if (['PT409', '23505'].includes(error.code ?? '')) throw new CareError(409, 'El alimento cambió. Recargá el catálogo antes de guardar.');
  if (['23514', '22023', '22P02'].includes(error.code ?? '')) throw new CareError(400, 'Revisá los datos y las medidas del alimento.');
  throw new CareError(503, 'No pudimos confirmar el guardado. Tus cambios siguen en el formulario.');
}
export async function listFoods(owner: string, persistent: boolean): Promise<Food[]> {
  if (!persistent) return [...foods.values()].filter(f => f.owner_id === null || f.owner_id === owner).map(f => structuredClone(f));
  const result: Food[] = [];
  const ids = new Set<string>();
  let total: number | undefined;
  do {
    const { data, error, count } = await getRequestDb().from('food_catalog')
      .select('id,owner_id,revision,payload,updated_at', { count: 'exact' })
      .order('id').range(result.length, result.length + 999);
    foodDbError(error);
    if (count === null || count === undefined) throw new CareError(503, 'No pudimos cargar el catálogo completo. Reintentá.');
    if (total !== undefined && total !== count) throw new CareError(503, 'El catálogo cambió mientras se cargaba. Reintentá.');
    total = count;
    // La primera entrega limita el volumen en el navegador y nunca oculta resultados.
    if (total > 5000) throw new CareError(503, 'Este catálogo necesita búsqueda paginada antes de incorporar más alimentos.');
    if (!data?.length && result.length < total) throw new CareError(503, 'No pudimos cargar el catálogo completo. Reintentá.');
    for (const row of data ?? []) {
      if (ids.has(row.id)) throw new CareError(503, 'El catálogo cambió mientras se cargaba. Reintentá.');
      ids.add(row.id);
      const { expected_revision: _, ...food } = foodInputSchema.parse({ ...row.payload, id: row.id, expected_revision: 0 });
      result.push({ ...food, revision: row.revision, owner_id: row.owner_id, updated_at: row.updated_at });
    }
  } while (result.length < total);
  return result;
}
export async function saveFood(owner: string, input: FoodInput, persistent: boolean): Promise<Food> {
  const { expected_revision, id, ...payload } = input;
  if (persistent) {
    const { data, error } = await getRequestDb().rpc('save_food_catalog_item', { food_id: id, expected_revision, food_payload: payload });
    foodDbError(error);
    if (!data) throw new CareError(503, 'No pudimos confirmar el guardado.');
    return { ...payload, id: data.id, revision: data.revision, owner_id: data.owner_id, updated_at: data.updated_at };
  }
  const old = foods.get(id);
  if (old && old.owner_id !== owner) throw new CareError(403, 'No tenés permiso para modificar ese alimento.');
  if (old && old.revision !== expected_revision) {
    const { revision: _, updated_at: __, owner_id: ___, ...current } = old;
    if (old.revision === expected_revision + 1 && JSON.stringify(current) === JSON.stringify({ ...payload, id })) return structuredClone(old);
    throw new CareError(409, 'El alimento cambió. Recargá el catálogo antes de guardar.');
  }
  if (!old && expected_revision !== 0) throw new CareError(409, 'El alimento ya no está disponible. Recargá el catálogo.');
  const food = { ...payload, id, revision: expected_revision + 1, owner_id: owner, updated_at: new Date().toISOString() };
  foods.set(id, structuredClone(food)); return structuredClone(food);
}
export function filterFoods(items: Food[], q: string, kind?: string, scope?: string) {
  const needle = normalizeFoodSearch(q);
  return items.filter(f => (!kind || f.kind === kind) && (!scope || (scope === 'own' ? f.owner_id !== null : f.owner_id === null)) && normalizeFoodSearch(`${f.name} ${f.brand} ${f.category} ${f.source}`).includes(needle)).sort((a, b) => a.name.localeCompare(b.name, 'es'));
}
