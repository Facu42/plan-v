import { getRequestDb } from '../db/supabase-client.js';
import { CareError } from '../care/errors.js';
import { registerDemoState } from '../demo/state.js';
import { foodInputSchema, normalizeFoodSearch, type Food, type FoodInput } from '../../src/types/foods.js';
import { sara2Foods } from './sara2.js';

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
  if (!persistent) return [...sara2Foods(),...foods.values()].filter(f => f.owner_id === null || f.owner_id === owner).map(f => structuredClone(f));
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
    if (!data?.length && result.length < total) throw new CareError(503, 'No pudimos cargar el catálogo completo. Reintentá.');
    for (const row of data ?? []) {
      if (ids.has(row.id)) throw new CareError(503, 'El catálogo cambió mientras se cargaba. Reintentá.');
      ids.add(row.id);
      const {composition,...payload}=row.payload;
      const { expected_revision: _, ...food } = foodInputSchema.parse({ ...payload,source:composition?'Referencia institucional validada':payload.source, id: row.id, expected_revision: 0 });
      if(composition)food.source=payload.source;
      result.push({ ...food,...(composition?{composition}:{}), revision: row.revision, owner_id: row.owner_id, updated_at: row.updated_at });
    }
  } while (result.length < total);
  return result;
}
export async function saveFood(owner: string, input: FoodInput, persistent: boolean): Promise<Food> {
  if (sara2Foods().some(food=>food.id===input.id)) throw new CareError(403,'La composición institucional es de sólo lectura. Creá un alimento propio con su fuente.');
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

export type FoodPageFilters={q:string;kind:'food'|'supplement';scope:'all'|'own'|'platform';source:string;category:string;order:'name-asc'|'name-desc'|'kcal-asc'|'kcal-desc'};
export async function searchFoodPage(owner:string,filters:FoodPageFilters,page:number,pageSize:number,persistent:boolean):Promise<{foods:Food[];total:number;page:number;page_size:number;summary?:{total:number;own:number;platform:number;supplements:number;foods:number};sources?:string[];categories?:string[]}>{
  if(persistent){const{data,error}=await getRequestDb().rpc('search_food_catalog',{filters,page,page_size:pageSize});foodDbError(error);return data;}
  const all=await listFoods(owner,false);
  const matches=filterFoods(all,filters.q,filters.kind,filters.scope==='all'?undefined:filters.scope).filter(food=>(!filters.source||food.source===filters.source)&&(!filters.category||food.category===filters.category));
  matches.sort((a,b)=>{const names=a.name.localeCompare(b.name,'es')||a.id.localeCompare(b.id);if(filters.order==='name-asc')return names;if(filters.order==='name-desc')return -names;const left=a.nutrients.kcal,right=b.nutrients.kcal;if(left===null&&right===null)return names;if(left===null)return 1;if(right===null)return -1;return(left-right)*(filters.order==='kcal-asc'?1:-1)||names;});
  return{foods:matches.slice(page*pageSize,(page+1)*pageSize),total:matches.length,page,page_size:pageSize,summary:{total:all.length,own:all.filter(food=>food.owner_id!==null).length,platform:all.filter(food=>food.owner_id===null).length,supplements:all.filter(food=>food.kind==='supplement').length,foods:all.filter(food=>food.kind==='food').length},sources:[...new Set(all.filter(food=>food.kind===filters.kind).map(food=>food.source))].sort(),categories:[...new Set(all.filter(food=>food.kind===filters.kind&&food.category).map(food=>food.category))].sort()};
}
