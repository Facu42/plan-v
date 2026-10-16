import { readFileSync,writeFileSync } from 'node:fs';
import { sara2Foods } from '../server/foods/sara2.js';
const directory=new URL('../supabase/migrations/',import.meta.url);
function body(file:string,name:string){const sql=readFileSync(new URL(file,directory),'utf8');const match=new RegExp(`create (?:or replace )?function public\\.${name}\\(`).exec(sql);if(!match)throw new Error('Function not found');const start=sql.indexOf('function ',match.index),end=sql.indexOf('$$;',sql.indexOf('as $$',start));if(end<0)throw new Error('Function end not found');return 'create or replace '+sql.slice(start,end+3);}
let recipe=body('20261007173000_recipe_catalog_composition.sql','save_recipe_draft');
recipe=recipe.replace('grams numeric; weight','native_quantity numeric; native_unit text; grams numeric; weight')
 .replace('food:=null; grams:=null;','food:=null; grams:=null; native_quantity:=null;')
 .replace("grams:=(item->>'quantity')::numeric;", "native_unit:=coalesce(food#>>'{composition,basis,unit}','g');\n      if food ? 'composition' and ref->'measure'='null'::jsonb and item->>'unit'<>native_unit then raise exception using errcode='22023',message='recipe_native_unit'; end if;\n      grams:=(item->>'quantity')::numeric;")
 .replace("clean_items:=clean_items||jsonb_build_array((item-'catalog_ref')||jsonb_build_object('quantity',grams,'unit','g'));", "native_quantity:=grams;\n      clean_items:=clean_items||jsonb_build_array((item-'catalog_ref')||jsonb_build_object('quantity',native_quantity,'unit',native_unit));\n      if native_unit='ml' then grams:=null; end if;")
 .replace("jsonb_build_object('grams',grams,'food',food)","jsonb_build_object('grams',grams,'native_quantity',native_quantity,'food',food)")
 .replace("entry->>'grams' is null", "coalesce(entry->>'native_quantity',entry->>'grams') is null")
 .replace("*(entry->>'grams')::numeric/100", "*coalesce(entry->>'native_quantity',entry->>'grams')::numeric/100")
 .replace('totals:=totals||',"if key='carbs' and (select count(distinct coalesce(x->'food'->'composition'->>'carbohydrates','source_declared')) from jsonb_array_elements(frozen_lines) x where x->'food'<>'null'::jsonb)>1 then total:=null; end if;\n      totals:=totals||")
 .replace("'ingredient_weight_g',case", "'carbohydrates',case when (select count(distinct coalesce(x->'food'->'composition'->>'carbohydrates','source_declared')) from jsonb_array_elements(frozen_lines) x where x->'food'<>'null'::jsonb)>1 then 'mixed' when exists(select 1 from jsonb_array_elements(frozen_lines) x where x->'food' ? 'composition') then 'available' else 'source_declared' end,\n      'ingredient_weight_g',case");
let shopping=body('20261007230000_meal_components.sql','shopping_list_json').replace('public.shopping_list_json(', 'public.shopping_list_json_before_vigencia(')
 .replace("quantity,'g'::text unit", "quantity,coalesce(c->'food_snapshot'#>>'{composition,basis,unit}','g')::text unit");
let exchange=body('20261011180000_nutrition_capabilities.sql','save_nutrition_exchange').replace('amount numeric;','amount numeric; native_unit text;')
 .replace("not(item ?& array['food_id','food_revision','grams']) or (select count(*) from jsonb_object_keys(item))<>3 or jsonb_typeof(item->'food_revision')<>'number' or jsonb_typeof(item->'grams')<>'number'", "not(item ?& array['food_id','food_revision']) or jsonb_typeof(item->'food_revision')<>'number' or not (((select count(*) from jsonb_object_keys(item))=3 and jsonb_typeof(item->'grams')='number') or ((select count(*) from jsonb_object_keys(item))=4 and jsonb_typeof(item->'quantity')='number' and item->>'unit' in ('g','ml'))) or exists(select 1 from jsonb_object_keys(item) k where k not in ('food_id','food_revision','grams','quantity','unit'))")
 .replace("amount:=(item->>'grams')::numeric;", "amount:=coalesce(item->>'quantity',item->>'grams')::numeric;")
 .replace("frozen:=frozen||jsonb_build_array(jsonb_build_object('grams',amount,'food'", "native_unit:=coalesce(food.payload#>>'{composition,basis,unit}','g');\n  if (item ? 'unit' and item->>'unit'<>native_unit) or (not(item ? 'unit') and native_unit<>'g') then raise exception using errcode='22023',message='exchange_native_unit'; end if;\n  frozen:=frozen||jsonb_build_array(jsonb_build_object('quantity',amount,'unit',native_unit,'grams',case when native_unit='g' then amount else null end,'food'");
const rows=sara2Foods().map(({id,owner_id:_,revision:__,updated_at:___,...payload})=>({id,payload}));
const seed=JSON.stringify(rows).replaceAll("'","''");
const sql=`-- Fuente numérica SARA 2 edición 2022. Adición; no modifica planes ni recetas existentes.
-- Rollback operativo: volver al cliente anterior conservando catálogo y copias históricas.
-- No eliminar alimentos referenciados. Sin PDF distribuido ni licencia comercial presumida.
begin;
set local lock_timeout='2s';
set local statement_timeout='30s';
alter function public.valid_food_payload(jsonb) rename to valid_food_payload_before_sara2;
create function public.valid_food_payload(value jsonb) returns boolean language plpgsql immutable security invoker set search_path='' as $$
declare c jsonb;
begin
 if not (value ? 'composition') then return public.valid_food_payload_before_sara2(value); end if;
 c:=value->'composition';
 return public.valid_food_payload_before_sara2(value-'composition')
  and value->>'source'='SARA 2 · Ministerio de Salud · 2022'
  and jsonb_typeof(c)='object' and (select count(*) from jsonb_object_keys(c))=6
  and c->>'dataset'='sara2-2022-v1'
  and c->>'source_sha256'='14706a46e0262e2223b0c44d4c77c31090e3554cf63602fe58ab765f32b81c7f'
  and c->>'carbohydrates'='available' and c->>'record_id' ~ '^SARA2-2022-P[0-9]+-T[^ ]+-R[0-9]+$'
  and c->'basis' in ('{"amount":100,"unit":"g"}'::jsonb,'{"amount":100,"unit":"ml"}'::jsonb)
  and jsonb_typeof(c->'source_page')='number' and (c->>'source_page')::numeric between 18 and 139;
exception when others then return false;
end;$$;
revoke all on function public.valid_food_payload(jsonb),public.valid_food_payload_before_sara2(jsonb) from public,anon;
grant execute on function public.valid_food_payload(jsonb),public.valid_food_payload_before_sara2(jsonb) to authenticated,service_role;
alter table public.food_catalog drop constraint food_catalog_payload_check;
alter table public.food_catalog add constraint food_catalog_payload_check check(public.valid_food_payload(payload));
alter table public.food_catalog add constraint food_catalog_institutional_owner check ((not(payload ? 'composition') and payload->>'source'<>'SARA 2 · Ministerio de Salud · 2022') or owner_id is null);
alter function public.save_food_catalog_item(uuid,bigint,jsonb) rename to save_food_catalog_item_before_sara2;
create function public.save_food_catalog_item(food_id uuid,expected_revision bigint,food_payload jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
begin
 if food_payload ? 'composition' or food_payload->>'source'='SARA 2 · Ministerio de Salud · 2022' then raise exception using errcode='42501',message='institutional_readonly'; end if;
 return public.save_food_catalog_item_before_sara2(food_id,expected_revision,food_payload);
end;$$;
revoke all on function public.save_food_catalog_item(uuid,bigint,jsonb) from public,anon;
grant execute on function public.save_food_catalog_item(uuid,bigint,jsonb) to authenticated;
-- SARA2_SEED_BEGIN
do $sara2$ declare item jsonb;existing public.food_catalog; begin
 for item in select value from jsonb_array_elements('${seed}'::jsonb) loop
  select * into existing from public.food_catalog where id=(item->>'id')::uuid for update;
  if found then
   if existing.owner_id is not null or existing.revision<>1 or existing.payload is distinct from item->'payload' then
    raise exception using errcode='23505',message='sara2_seed_collision';
   end if;
  else
   insert into public.food_catalog(id,owner_id,revision,payload,updated_at) values((item->>'id')::uuid,null,1,item->'payload','2022-07-01T00:00:00Z');
  end if;
 end loop;
end;$sara2$;
-- SARA2_SEED_END
${recipe}
revoke all on function public.save_recipe_draft(jsonb) from public,anon;
grant execute on function public.save_recipe_draft(jsonb) to authenticated;
${shopping}
revoke all on function public.shopping_list_json_before_vigencia(uuid) from public,anon,authenticated;
${exchange}
revoke all on function public.save_nutrition_exchange(jsonb) from public,anon;
grant execute on function public.save_nutrition_exchange(jsonb) to authenticated;
commit;
`;
writeFileSync(new URL('20261014180000_sara2_catalog.sql',directory),sql,'utf8');
console.log('SARA 2: 930 registros; migración generada localmente.');
