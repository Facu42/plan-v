-- Referencias revisadas, marca y grupos propios. No altera publicaciones históricas.
-- Rollback de aplicación: volver al cliente anterior; conservar tablas y configuraciones para no perder datos.
begin;
set local lock_timeout='2s';
set local statement_timeout='30s';

create function private.valid_nutrition_settings(value jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare row jsonb; seen text[]:='{}'; label text;
begin
 if jsonb_typeof(value) is distinct from 'object' or not(value ?& array['approvals','micronutrients','brand']) or (select count(*) from jsonb_object_keys(value))<>3 then return false;end if;
 if jsonb_typeof(value->'approvals') is distinct from 'array' or jsonb_array_length(value->'approvals')>5 or jsonb_typeof(value->'micronutrients') is distinct from 'array' or jsonb_array_length(value->'micronutrients')>6 then return false;end if;
 for row in select * from jsonb_array_elements(value->'approvals') loop
  if jsonb_typeof(row) is distinct from 'object' or (select count(*) from jsonb_object_keys(row))<>3 or not(row ?& array['formula','citation','url']) then return false;end if;
  label:=row->>'formula';if jsonb_typeof(row->'formula') is distinct from 'string' or label not in ('mifflin','harris','fao','katch','scale') or label=any(seen) or jsonb_typeof(row->'citation')<>'string' or length(btrim(row->>'citation')) not between 3 and 500 or jsonb_typeof(row->'url')<>'string' or length(row->>'url')>500 or row->>'url' !~ '^https://[^/@[:space:]]+[^[:space:]]*$' then return false;end if;seen:=array_append(seen,label);
 end loop;
 seen:='{}';
 for row in select * from jsonb_array_elements(value->'micronutrients') loop
  if jsonb_typeof(row) is distinct from 'object' or (select count(*) from jsonb_object_keys(row))<>4 or not(row ?& array['key','value','citation','url']) then return false;end if;
  label:=row->>'key';if jsonb_typeof(row->'key') is distinct from 'string' or label not in ('sodium','calcium','iron','potassium','magnesium','vitamin_c') or label=any(seen) or jsonb_typeof(row->'value')<>'number' or (row->>'value')::numeric<=0 or (row->>'value')::numeric>100000 or jsonb_typeof(row->'citation')<>'string' or length(btrim(row->>'citation')) not between 3 and 500 or jsonb_typeof(row->'url')<>'string' or length(row->>'url')>500 or row->>'url' !~ '^https://[^/@[:space:]]+[^[:space:]]*$' then return false;end if;seen:=array_append(seen,label);
 end loop;
 row:=value->'brand';if jsonb_typeof(row) is distinct from 'object' or (select count(*) from jsonb_object_keys(row))<>3 or not(row ?& array['name','contact','logo']) then return false;end if;
 if jsonb_typeof(row->'name')<>'string' or length(row->>'name')>120 or jsonb_typeof(row->'contact')<>'string' or length(row->>'contact')>240 or jsonb_typeof(row->'logo')<>'string' or length(row->>'logo')>700000 or (row->>'logo'<>'' and row->>'logo' !~ '^data:image/(png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$') then return false;end if;
 return true;
exception when others then return false;
end $$;
revoke all on function private.valid_nutrition_settings(jsonb) from public,anon,authenticated;
create table public.nutrition_settings(owner_id uuid primary key references public.nutritionists(id),revision bigint not null default 1 check(revision>0),payload jsonb not null check(private.valid_nutrition_settings(payload)),updated_at timestamptz not null default now());
alter table public.nutrition_settings enable row level security;
revoke all on public.nutrition_settings from public,anon,authenticated;
grant select on public.nutrition_settings to authenticated;
create policy nutrition_settings_own_read on public.nutrition_settings for select to authenticated using(owner_id=public.my_nutritionist_id());
create function public.save_nutrition_settings(expected_revision bigint,settings jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare owner uuid:=public.recipe_assert_nutri(); current public.nutrition_settings;
begin
 if expected_revision is null or expected_revision<0 or not private.valid_nutrition_settings(settings) then raise exception using errcode='22023',message='nutrition_settings_data';end if;
 perform pg_advisory_xact_lock(hashtextextended(owner::text,81));select * into current from public.nutrition_settings where owner_id=owner for update;
 if coalesce(current.revision,0)<>expected_revision then raise exception using errcode='PT409',message='nutrition_settings_changed';end if;
 insert into public.nutrition_settings(owner_id,revision,payload) values(owner,expected_revision+1,settings) on conflict(owner_id) do update set revision=excluded.revision,payload=excluded.payload,updated_at=now() returning * into current;
 return jsonb_build_object('settings',current.payload,'revision',current.revision);
end $$;
revoke all on function public.save_nutrition_settings(bigint,jsonb) from public,anon;
grant execute on function public.save_nutrition_settings(bigint,jsonb) to authenticated;

create table public.nutrition_exchanges(id uuid primary key,owner_id uuid not null references public.nutritionists(id),revision bigint not null default 1 check(revision>0),payload jsonb not null,updated_at timestamptz not null default now());
alter table public.nutrition_exchanges enable row level security;
revoke all on public.nutrition_exchanges from public,anon,authenticated;
grant select on public.nutrition_exchanges to authenticated;
create policy nutrition_exchanges_own_read on public.nutrition_exchanges for select to authenticated using(owner_id=public.my_nutritionist_id());
create index nutrition_exchanges_owner on public.nutrition_exchanges(owner_id,id);
create function public.save_nutrition_exchange(request jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare owner uuid:=public.recipe_assert_nutri(); identity uuid; expected bigint; old public.nutrition_exchanges; item jsonb; food public.food_catalog; frozen jsonb:='[]'; seen uuid[]:='{}'; food_id uuid; amount numeric; saved public.nutrition_exchanges;
begin
 if jsonb_typeof(request) is distinct from 'object' or not(request ?& array['id','expected_revision','name','reference','reviewed','items']) or (select count(*) from jsonb_object_keys(request))<>6 or request->'reviewed' is distinct from 'true'::jsonb or jsonb_typeof(request->'name')<>'string' or length(btrim(request->>'name')) not between 2 and 80 or jsonb_typeof(request->'reference')<>'string' or length(btrim(request->>'reference')) not between 3 and 500 or jsonb_typeof(request->'items')<>'array' or jsonb_array_length(request->'items') not between 2 and 5 or jsonb_typeof(request->'expected_revision')<>'number' then raise exception using errcode='22023',message='exchange_data';end if;
 if(request->>'expected_revision')::numeric<>trunc((request->>'expected_revision')::numeric)then raise exception using errcode='22023',message='exchange_revision';end if; identity:=(request->>'id')::uuid;expected:=(request->>'expected_revision')::bigint;if expected<0 then raise exception using errcode='22023',message='exchange_revision';end if;
 perform pg_advisory_xact_lock(hashtextextended(owner::text,82));perform pg_advisory_xact_lock(hashtextextended(identity::text,82));select * into old from public.nutrition_exchanges where id=identity for update;
 if old.id is not null and old.owner_id<>owner then raise exception using errcode='42501',message='exchange_owner';end if;
 if old.id is null and (select count(*) from public.nutrition_exchanges e where e.owner_id=owner)>=100 then raise exception using errcode='22023',message='exchange_limit';end if; if coalesce(old.revision,0)<>expected then raise exception using errcode='PT409',message='exchange_changed';end if;
 for item in select * from jsonb_array_elements(request->'items') loop
  if jsonb_typeof(item) is distinct from 'object' or not(item ?& array['food_id','food_revision','grams']) or (select count(*) from jsonb_object_keys(item))<>3 or jsonb_typeof(item->'food_revision')<>'number' or jsonb_typeof(item->'grams')<>'number' then raise exception using errcode='22023',message='exchange_item';end if;
  if(item->>'food_revision')::numeric<1 or(item->>'food_revision')::numeric<>trunc((item->>'food_revision')::numeric)then raise exception using errcode='22023',message='exchange_food_revision';end if;food_id:=(item->>'food_id')::uuid;amount:=(item->>'grams')::numeric;
  if food_id=any(seen) or amount<=0 or amount>100000 then raise exception using errcode='22023',message='exchange_item';end if;seen:=array_append(seen,food_id);
  select * into food from public.food_catalog f where f.id=food_id and(f.owner_id=owner or f.owner_id is null) for share;
  if not found then raise exception using errcode='42501',message='exchange_food_scope';end if;
  if food.revision<>(item->>'food_revision')::bigint then raise exception using errcode='PT409',message='exchange_food_changed';end if;
  frozen:=frozen||jsonb_build_array(jsonb_build_object('grams',amount,'food',food.payload||jsonb_build_object('id',food.id,'revision',food.revision,'owner_id',food.owner_id,'updated_at',food.updated_at)));
 end loop;
 insert into public.nutrition_exchanges(id,owner_id,revision,payload) values(identity,owner,expected+1,jsonb_build_object('name',btrim(request->>'name'),'reference',btrim(request->>'reference'),'items',frozen)) on conflict(id) do update set revision=excluded.revision,payload=excluded.payload,updated_at=now() returning * into saved;
 return saved.payload||jsonb_build_object('id',saved.id,'owner_id',saved.owner_id,'revision',saved.revision,'updated_at',saved.updated_at);
end $$;
revoke all on function public.save_nutrition_exchange(jsonb) from public,anon;
grant execute on function public.save_nutrition_exchange(jsonb) to authenticated;

-- La validación y el cálculo siguen dentro de la base. La aprobación es de cada profesional.
alter function private.save_nutrition_target_versioned(uuid,jsonb,jsonb,boolean,bigint) rename to save_target_before_formula_selection;
revoke all on function private.save_target_before_formula_selection(uuid,jsonb,jsonb,boolean,bigint) from public,anon,authenticated;
create function private.save_nutrition_target_versioned(target uuid,target_inputs jsonb,target_result jsonb,publish boolean,expected_revision bigint) returns jsonb language plpgsql security definer set search_path='' as $$
declare owner uuid:=public.recipe_assert_nutri(); formula text:=coalesce(target_inputs->>'formula','mifflin');
begin
 perform public.intake_assert_access(target,true);
 if formula<>'mifflin' and not exists(select 1 from public.nutrition_settings s,jsonb_array_elements(s.payload->'approvals') a where s.owner_id=owner and a->>'formula'=formula) then raise exception using errcode='22023',message='formula_requires_professional_approval';end if;
 return private.save_target_before_formula_selection(target,target_inputs,target_result,publish,expected_revision);
end $$;
revoke all on function private.save_nutrition_target_versioned(uuid,jsonb,jsonb,boolean,bigint) from public,anon;
grant execute on function private.save_nutrition_target_versioned(uuid,jsonb,jsonb,boolean,bigint) to authenticated;

create or replace function public.calculate_nutrition_target(target_inputs jsonb)
returns jsonb language plpgsql immutable set search_path = '' as $$
declare
  key text;
  age_value double precision;
  weight_value double precision;
  height_value double precision;
  adjust_value double precision;
  protein_value double precision;
  fat_value double precision;
  factor double precision;
  bmr double precision;
  tdee double precision;
  kcal double precision;
  minimum double precision;
  protein_g double precision;
  fat_g double precision;
  carbs_g double precision;
  warnings jsonb := '[]'::jsonb;
begin
  if jsonb_typeof(target_inputs) is distinct from 'object' then
    raise exception using errcode='22023', message='nutrition_target_data';
  end if;
  if not(target_inputs ?& array['sex','age','weight_kg','height_cm','activity','goal','adjust_pct','protein_g_per_kg','fat_pct']) or exists(select 1 from jsonb_object_keys(target_inputs) k where k not in ('sex','age','weight_kg','height_cm','activity','goal','adjust_pct','protein_g_per_kg','fat_pct','formula','body_fat_pct','scale_bmr'))
    or coalesce(target_inputs->>'sex', '') not in ('femenino','masculino')
    or coalesce(target_inputs->>'activity', '') not in ('sedentaria','ligera','moderada','intensa','muy_intensa')
    or coalesce(target_inputs->>'goal', '') not in ('bajar','mantener','subir') then
    raise exception using errcode='22023', message='nutrition_target_data';
  end if;
  foreach key in array array['age','weight_kg','height_cm','adjust_pct','protein_g_per_kg','fat_pct'] loop
    if jsonb_typeof(target_inputs->key) is distinct from 'number' then
      raise exception using errcode='22023', message='nutrition_target_data';
    end if;
  end loop;
  begin
    age_value := (target_inputs->>'age')::double precision;
    weight_value := (target_inputs->>'weight_kg')::double precision;
    height_value := (target_inputs->>'height_cm')::double precision;
    adjust_value := (target_inputs->>'adjust_pct')::double precision;
    protein_value := (target_inputs->>'protein_g_per_kg')::double precision;
    fat_value := (target_inputs->>'fat_pct')::double precision;
  exception when numeric_value_out_of_range or invalid_text_representation then
    raise exception using errcode='22023', message='nutrition_target_data';
  end;
  if age_value not between 15 and 100 or age_value <> trunc(age_value)
    or weight_value not between 30 and 300 or height_value not between 120 and 230
    or adjust_value not between -30 and 25 or protein_value not between 0.8 and 3
    or fat_value not between 15 and 45 then
    raise exception using errcode='22023', message='nutrition_target_data';
  end if;
  factor := case target_inputs->>'activity'
    when 'sedentaria' then 1.2 when 'ligera' then 1.375 when 'moderada' then 1.55
    when 'intensa' then 1.725 else 1.9 end;
  bmr := 10 * weight_value + 6.25 * height_value - 5 * age_value
    + case when target_inputs->>'sex' = 'masculino' then 5 else -161 end;
  if target_inputs ? 'formula' and (jsonb_typeof(target_inputs->'formula')<>'string' or target_inputs->>'formula' not in ('mifflin','harris','fao','katch','scale')) then raise exception using errcode='22023',message='formula_data';end if;
  foreach key in array array['body_fat_pct','scale_bmr'] loop
    if target_inputs ? key and (jsonb_typeof(target_inputs->key)<>'number' or (target_inputs->>key)::double precision not between case when key='body_fat_pct' then 1 else 300 end and case when key='body_fat_pct' then 80 else 5000 end) then raise exception using errcode='22023',message='formula_measurement';end if;
  end loop;
  case coalesce(target_inputs->>'formula','mifflin')
    when 'harris' then bmr:=case when target_inputs->>'sex'='masculino' then 88.362+13.397*weight_value+4.799*height_value-5.677*age_value else 447.593+9.247*weight_value+3.098*height_value-4.33*age_value end;
    when 'fao' then bmr:=case when target_inputs->>'sex'='masculino' then case when age_value<18 then 17.5*weight_value+651 when age_value<30 then 15.3*weight_value+679 when age_value<60 then 11.6*weight_value+879 else 13.5*weight_value+487 end else case when age_value<18 then 12.2*weight_value+746 when age_value<30 then 14.7*weight_value+496 when age_value<60 then 8.7*weight_value+829 else 10.5*weight_value+596 end end;
    when 'katch' then if not(target_inputs ? 'body_fat_pct') then raise exception using errcode='22023',message='formula_missing_body_fat';end if;bmr:=370+21.6*weight_value*(1-(target_inputs->>'body_fat_pct')::double precision/100);
    when 'scale' then if not(target_inputs ? 'scale_bmr') then raise exception using errcode='22023',message='formula_missing_bmr';end if;bmr:=(target_inputs->>'scale_bmr')::double precision;
    else null;
  end case;
  tdee := bmr * factor;
  kcal := tdee * (1 + adjust_value / 100);
  minimum := case when target_inputs->>'sex' = 'masculino' then 1500 else 1200 end;
  if kcal < minimum then
    warnings := warnings || jsonb_build_array('La meta calculada quedaba por debajo de ' || minimum::int || ' kcal; se subió a ese mínimo. Revisala con criterio clínico.');
    kcal := minimum;
  end if;
  if age_value < 18 then
    warnings := warnings || jsonb_build_array('Es menor de 18 años: esta ecuación es para adultos, usá otra referencia para crecimiento.');
  end if;
  -- floor(x + 0.5) reproduce Math.round de la app, incluso en valores a medio camino.
  protein_g := floor(protein_value * weight_value + 0.5);
  fat_g := floor((kcal * fat_value / 100) / 9 + 0.5);
  carbs_g := greatest(0, floor((kcal - protein_g * 4 - fat_g * 9) / 4 + 0.5));
  if carbs_g = 0 then
    warnings := warnings || jsonb_build_array('Proteínas y grasas ya cubren toda la meta: los hidratos quedaron en cero. Bajá la proteína por kilo o el porcentaje de grasa.');
  end if;
  if floor(kcal + 0.5) not between 500 and 8000 then
    raise exception using errcode='22023', message='nutrition_target_data';
  end if;
  return jsonb_build_object(
    'bmr', floor(bmr + 0.5), 'tdee', floor(tdee + 0.5), 'kcal', floor(kcal + 0.5),
    'protein_g', protein_g, 'fat_g', fat_g, 'carbs_g', carbs_g,
    'protein_pct', floor(protein_g * 4 / kcal * 100 + 0.5),
    'fat_pct', floor(fat_g * 9 / kcal * 100 + 0.5),
    'carbs_pct', floor(carbs_g * 4 / kcal * 100 + 0.5), 'warnings', warnings
  );
end; $$;
revoke all on function public.calculate_nutrition_target(jsonb) from public, anon, authenticated;
grant execute on function public.calculate_nutrition_target(jsonb) to service_role;


create function public.search_food_catalog(filters jsonb,page integer,page_size integer) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare owner uuid:=public.recipe_assert_nutri(); result jsonb; ordering text:=coalesce(filters->>'order','name-asc');
begin
 if page is null or page<0 or page>100000 or page_size is null or page_size not between 1 and 100 or jsonb_typeof(filters) is distinct from 'object' or exists(select 1 from jsonb_object_keys(filters) k where k not in ('q','kind','scope','source','category','order')) or length(coalesce(filters->>'q',''))>160 or coalesce(filters->>'kind','food') not in ('food','supplement') or coalesce(filters->>'scope','all') not in ('all','own','platform') or ordering not in ('name-asc','name-desc','kcal-asc','kcal-desc') then raise exception using errcode='22023',message='food_search_filters';end if;
 with filtered as materialized(
  select f.* from public.food_catalog f where(f.owner_id=owner or f.owner_id is null)
  and f.payload->>'kind'=coalesce(filters->>'kind','food')
  and(coalesce(filters->>'scope','all')='all' or(filters->>'scope'='own' and f.owner_id=owner) or(filters->>'scope'='platform' and f.owner_id is null))
  and(coalesce(filters->>'source','')='' or f.payload->>'source'=filters->>'source')
  and(coalesce(filters->>'category','')='' or f.payload->>'category'=filters->>'category')
  and strpos(lower(translate(concat_ws(' ',f.payload->>'name',f.payload->>'brand',f.payload->>'category',f.payload->>'source'),'áéíóúüñ','aeiouun')),lower(translate(btrim(coalesce(filters->>'q','')),'áéíóúüñ','aeiouun')))>0
 ), ranked as(
  select f.*,row_number()over(order by
   case when ordering='kcal-asc' then(f.payload->'nutrients'->>'kcal')::numeric end asc nulls last,
   case when ordering='kcal-desc' then(f.payload->'nutrients'->>'kcal')::numeric end desc nulls last,
   case when ordering='name-desc' then lower(f.payload->>'name') end desc,
   case when ordering<>'name-desc' then lower(f.payload->>'name') end asc,f.id) as ordinal from filtered f
 ), paged as(select * from ranked order by ordinal offset(page::bigint*page_size) limit page_size)
 select jsonb_build_object('foods',coalesce((select jsonb_agg(p.payload||jsonb_build_object('id',p.id,'revision',p.revision,'owner_id',p.owner_id,'updated_at',p.updated_at) order by ordinal)from paged p),'[]'::jsonb),'total',(select count(*)from filtered),'page',page,'page_size',page_size,'summary',(select jsonb_build_object('total',count(*),'own',count(*)filter(where f.owner_id=owner),'platform',count(*)filter(where f.owner_id is null),'supplements',count(*)filter(where f.payload->>'kind'='supplement'),'foods',count(*)filter(where f.payload->>'kind'='food')) from public.food_catalog f where f.owner_id=owner or f.owner_id is null),'sources',(select coalesce(jsonb_agg(x.source order by x.source),'[]'::jsonb)from(select distinct f.payload->>'source' as source from public.food_catalog f where(f.owner_id=owner or f.owner_id is null)and f.payload->>'kind'=coalesce(filters->>'kind','food'))x),'categories',(select coalesce(jsonb_agg(x.category order by x.category),'[]'::jsonb)from(select distinct f.payload->>'category' as category from public.food_catalog f where(f.owner_id=owner or f.owner_id is null)and f.payload->>'kind'=coalesce(filters->>'kind','food')and f.payload->>'category'<>'')x)) into result;
 return result;
end $$;
revoke all on function public.search_food_catalog(jsonb,integer,integer) from public,anon;
grant execute on function public.search_food_catalog(jsonb,integer,integer) to authenticated;
-- Nombres de los seis momentos estables, guardados e inmutables por versión.
-- Nombre personalizado de cada momento estable, visible para profesional y paciente.
-- Se guarda por versión: queda fijo al publicar y pasa a la versión siguiente si el pedido no lo cambia.
alter table public.meal_plan_versions add column meal_labels jsonb;
create function public.guard_plan_meal_labels() returns trigger language plpgsql set search_path='' as $$
begin
 if tg_op='UPDATE' and old.status in ('published','archived') and new.meal_labels is distinct from old.meal_labels then raise exception using errcode='22023',message='meal_labels_immutable'; end if;
 if new.meal_labels is null then return new; end if;
 if jsonb_typeof(new.meal_labels) is distinct from 'object'
  or exists(select 1 from jsonb_each(new.meal_labels) e where e.key not in ('Desayuno','Colación','Almuerzo','Merienda','Cena','Extra')
   or jsonb_typeof(e.value) is distinct from 'string' or length(btrim(e.value#>>'{}')) not between 1 and 40) then
  raise exception using errcode='22023',message='meal_labels_shape';
 end if;
 if(select count(distinct translate(lower(regexp_replace(btrim(coalesce(new.meal_labels->>slot,slot)),'\s+',' ','g')),'áéíóúüñ','aeiouun')) from unnest(array['Desayuno','Colación','Almuerzo','Merienda','Cena','Extra'])slot)<>6 then raise exception using errcode='22023',message='meal_labels_duplicate';end if;
 return new;
end $$;
revoke all on function public.guard_plan_meal_labels() from public,anon,authenticated;
create trigger plan_meal_labels_guard before insert or update on public.meal_plan_versions for each row execute function public.guard_plan_meal_labels();

alter function public.meal_plan_version_json(uuid) rename to meal_plan_version_pre_meal_labels;
create function public.meal_plan_version_json(vid uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select public.meal_plan_version_pre_meal_labels(vid)||case when v.meal_labels is null then '{}'::jsonb else jsonb_build_object('meal_labels',v.meal_labels) end from public.meal_plan_versions v where v.id=vid;
$$;
revoke all on function public.meal_plan_version_pre_meal_labels(uuid),public.meal_plan_version_json(uuid) from public,anon,authenticated;

alter function public.list_published_meal_plan(uuid) rename to published_plan_pre_meal_labels;
-- This wrapper preserves the writable RPC contract: reading can promote a due
-- version and always locks versions; PostgREST must not use a read-only transaction.
create function public.list_published_meal_plan(target_patient uuid) returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare result jsonb; data jsonb;
begin
 result:=public.published_plan_pre_meal_labels(target_patient); if result is null then return null; end if;
 select v.meal_labels into data from public.meal_plan_versions v where v.meal_plan_id=(result->>'id')::uuid and v.version=(result->>'version')::int;
 return result||case when data is null then '{}'::jsonb else jsonb_build_object('meal_labels',data) end;
end $$;
revoke all on function public.published_plan_pre_meal_labels(uuid),public.list_published_meal_plan(uuid) from public,anon,authenticated;
grant execute on function public.list_published_meal_plan(uuid) to authenticated;

-- Un objeto vacío restaura los nombres originales; si no se envía, conserva la versión anterior.
alter function public.save_meal_plan_draft(uuid,jsonb) rename to save_plan_pre_meal_labels;
create function public.save_meal_plan_draft(target_patient uuid,payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare owner uuid:=public.recipe_assert_nutri(); result jsonb; prior jsonb;
begin
 perform public.intake_assert_access(target_patient,true);
 if jsonb_typeof(payload) is distinct from 'object' then raise exception using errcode='22023',message='plan_data'; end if;
 perform pg_advisory_xact_lock(hashtextextended(target_patient::text,3));
 select v.meal_labels into prior from public.meal_plan_versions v join public.meal_plans p on p.id=v.meal_plan_id
  where p.patient_id=target_patient and p.nutritionist_id=owner order by v.version desc limit 1;
 result:=public.save_plan_pre_meal_labels(target_patient,payload-'meal_labels');
 update public.meal_plan_versions set meal_labels=case when payload ? 'meal_labels' then nullif(payload->'meal_labels','{}'::jsonb) else prior end
  where id=(result->'current'->>'id')::uuid;
 return public.meal_plan_professional_json((result->>'id')::uuid);
end $$;
revoke all on function public.save_plan_pre_meal_labels(uuid,jsonb),public.save_meal_plan_draft(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.save_meal_plan_draft(uuid,jsonb) to authenticated;

-- Aplicar un modelo crea una versión nueva: conserva los nombres de la anterior.
alter function public.apply_professional_model(uuid,jsonb) rename to apply_model_pre_meal_labels;
create function public.apply_professional_model(model_id uuid,payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare owner uuid:=public.recipe_assert_nutri(); result jsonb; prior jsonb; patient uuid;
begin
 if jsonb_typeof(payload) is distinct from 'object' then raise exception using errcode='22023',message='model_review'; end if;
 patient:=(payload->>'patient_id')::uuid;
 select v.meal_labels into prior from public.meal_plan_versions v join public.meal_plans p on p.id=v.meal_plan_id
  where p.patient_id=patient and p.nutritionist_id=owner order by v.version desc limit 1;
 result:=public.apply_model_pre_meal_labels(model_id,payload);
 if prior is not null then update public.meal_plan_versions set meal_labels=prior where id=(result->'current'->>'id')::uuid; end if;
 return public.meal_plan_professional_json((result->>'id')::uuid);
end $$;
revoke all on function public.apply_model_pre_meal_labels(uuid,jsonb),public.apply_professional_model(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.apply_professional_model(uuid,jsonb) to authenticated;


commit;
