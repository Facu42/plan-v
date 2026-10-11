-- Catálogo privado. No acepta snapshots desde el navegador ni entrega planes al paciente.
create table public.professional_models (
 id uuid primary key, owner_id uuid not null references public.nutritionists(id),
 kind text not null check(kind in ('plan','recommendations','avoid')),
 revision uuid not null default gen_random_uuid(), current jsonb not null,
 published jsonb, archived_at timestamptz, updated_at timestamptz not null default clock_timestamp()
);
alter table public.professional_models enable row level security;
create policy professional_models_read on public.professional_models for select to authenticated
 using(owner_id=public.my_nutritionist_id());
revoke all on public.professional_models from public, anon, authenticated;
grant select on public.professional_models to authenticated;

create function public.professional_model_json(model_row public.professional_models) returns jsonb
language sql stable set search_path='' as $$
 select to_jsonb(model_row)-'owner_id'
$$;
revoke all on function public.professional_model_json(public.professional_models) from public,anon,authenticated;

create function public.save_professional_model(payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare owner uuid:=public.recipe_assert_nutri(); old public.professional_models;
 model_id uuid:=(payload->>'id')::uuid; expected uuid:=(payload->>'expected_revision')::uuid;
 category text:=payload->>'kind'; title text:=btrim(payload->>'title'); description text:=btrim(payload->>'description');
 plan jsonb; source jsonb:=payload->'source'; source_version jsonb; copy jsonb;
 edit jsonb; amount jsonb; note jsonb; item jsonb; component jsonb; idx int; ci int; quantity numeric; grams numeric;
begin
 if jsonb_typeof(payload)<>'object' or exists(select 1 from jsonb_object_keys(payload) k where k not in ('id','expected_revision','kind','title','description','lines','source','overrides'))
 or model_id is null or category not in ('plan','recommendations','avoid') or title is null or length(title) not between 1 and 160 or description is null or length(description)>400
 or jsonb_typeof(payload->'lines') is distinct from 'array' or jsonb_array_length(payload->'lines')>50
 or jsonb_typeof(payload->'overrides') is distinct from 'array' or jsonb_array_length(payload->'overrides')>42 then raise exception using errcode='22023',message='invalid_model'; end if;
 if exists(select 1 from jsonb_array_elements(payload->'lines') l where jsonb_typeof(l)<>'string' or length(btrim(l#>>'{}')) not between 1 and 500)
 or category='plan' and jsonb_array_length(payload->'lines')>0
 or category<>'plan' and (source is not null or jsonb_array_length(payload->'overrides')>0) then raise exception using errcode='22023',message='invalid_content'; end if;
 perform pg_advisory_xact_lock(hashtextextended(model_id::text,11));
 select * into old from public.professional_models where id=model_id for update;
 if found and old.owner_id<>owner then raise exception using errcode='42501',message='model_owner'; end if;
 if old.revision is distinct from expected or old.archived_at is not null then raise exception using errcode='PT409',message='model_changed'; end if;
 if old.id is not null and old.kind<>category then raise exception using errcode='22023',message='model_kind'; end if;
 plan:=coalesce(old.current->'plan',jsonb_build_object('days',7,'items','[]'::jsonb));
 if source is not null then
  if jsonb_typeof(source)<>'object' or exists(select 1 from jsonb_object_keys(source) k where k not in ('patient_id','version','revision')) then raise exception using errcode='22023',message='invalid_source'; end if;
  perform public.intake_assert_access((source->>'patient_id')::uuid,true);
  select public.meal_plan_version_json(v.id) into source_version from public.meal_plan_versions v join public.meal_plans p on p.id=v.meal_plan_id
   where p.nutritionist_id=owner and p.patient_id=(source->>'patient_id')::uuid and v.version=(source->>'version')::int
   and v.version=(select max(w.version) from public.meal_plan_versions w where w.meal_plan_id=p.id);
  if source_version is null or source_version->>'revision' is distinct from source->>'revision' then raise exception using errcode='PT409',message='source_changed'; end if;
  plan:=jsonb_build_object('days',(source_version->>'period_end')::date-(source_version->>'period_start')::date+1,'items',
   coalesce((select jsonb_agg((i-'id'-'for_date'-'dish_card')||jsonb_build_object('day',(i->>'for_date')::date-(source_version->>'period_start')::date+1) order by n)
   from jsonb_array_elements(source_version->'items') with ordinality a(i,n)),'[]'::jsonb));
 end if;
 if exists(select 1 from jsonb_array_elements(payload->'overrides') e group by e->>'index' having count(*)>1) then raise exception using errcode='22023',message='duplicate_edit'; end if;
 for edit in select value from jsonb_array_elements(payload->'overrides') loop
  if jsonb_typeof(edit)<>'object' or exists(select 1 from jsonb_object_keys(edit) k where k not in ('index','public_note','portions','amounts','notes'))
   or jsonb_typeof(edit->'index') is distinct from 'number' or (edit->>'index')::numeric<>trunc((edit->>'index')::numeric)
   or jsonb_typeof(edit->'public_note') is distinct from 'string' or length(edit->>'public_note')>200
   or jsonb_typeof(edit->'amounts') is distinct from 'array' or jsonb_array_length(edit->'amounts')>12 then raise exception using errcode='22023',message='invalid_edit'; end if;
  idx:=(edit->>'index')::int; item:=plan->'items'->idx;
  if idx<0 or idx>41 or item is null then raise exception using errcode='22023',message='invalid_item'; end if;
  item:=jsonb_set(item,'{public_note}',edit->'public_note');
  if jsonb_typeof(coalesce(edit->'notes','[]'::jsonb)) is distinct from 'array' or jsonb_array_length(coalesce(edit->'notes','[]'::jsonb))>12
   or exists(select 1 from jsonb_array_elements(coalesce(edit->'notes','[]'::jsonb)) n group by n->>'id' having count(*)>1) then raise exception using errcode='22023',message='invalid_notes'; end if;
  for note in select value from jsonb_array_elements(coalesce(edit->'notes','[]'::jsonb)) loop
   if jsonb_typeof(note)<>'object' or exists(select 1 from jsonb_object_keys(note) k where k not in ('id','public_note')) or jsonb_typeof(note->'public_note') is distinct from 'string' or length(note->>'public_note')>200 then raise exception using errcode='22023',message='invalid_note'; end if;
   select c,n::int-1 into component,ci from jsonb_array_elements(item->'components') with ordinality a(c,n) where c->>'id'=note->>'id';
   if component is null then raise exception using errcode='22023',message='unknown_component'; end if;
   item:=jsonb_set(item,array['components',ci::text,'public_note'],note->'public_note');
  end loop;
  if edit ? 'portions' then
   quantity:=(edit->>'portions')::numeric;
   if jsonb_typeof(edit->'portions')<>'number' or quantity<=0 or quantity>50 or item ? 'components' or item->>'portions' is null then raise exception using errcode='22023',message='invalid_portions'; end if;
   item:=jsonb_set(item,'{portions}',edit->'portions');
  end if;
  if exists(select 1 from jsonb_array_elements(edit->'amounts') a group by a->>'id' having count(*)>1) then raise exception using errcode='22023',message='duplicate_amount'; end if;
  for amount in select value from jsonb_array_elements(edit->'amounts') loop
   if jsonb_typeof(amount)<>'object' or exists(select 1 from jsonb_object_keys(amount) k where k not in ('id','quantity')) or jsonb_typeof(amount->'quantity') is distinct from 'number' then raise exception using errcode='22023',message='invalid_amount'; end if;
   quantity:=(amount->>'quantity')::numeric;
   if quantity<=0 or quantity>100000 then raise exception using errcode='22023',message='invalid_quantity'; end if;
   select c,n::int-1 into component,ci from jsonb_array_elements(item->'components') with ordinality a(c,n) where c->>'id'=amount->>'id';
   if component is null then raise exception using errcode='22023',message='unknown_component'; end if;
   if component->>'kind'='food' then
    grams:=quantity;
    if component->>'measure' is not null then select quantity*(p->>'grams')::numeric into grams from jsonb_array_elements(component->'food_snapshot'->'portions') p where p->>'name'=component->>'measure'; end if;
    if grams is null or grams<=0 or grams>100000 then raise exception using errcode='22023',message='invalid_grams'; end if;
    component:=jsonb_set(component,'{quantity}',amount->'quantity');
   elsif component->>'kind'='recipe' or component ? 'recipe_proposal' then
    if quantity>50 then raise exception using errcode='22023',message='invalid_portions'; end if;
    component:=jsonb_set(component,'{portions}',amount->'quantity');
   else raise exception using errcode='22023',message='invalid_component'; end if;
   item:=jsonb_set(item,array['components',ci::text],component);
  end loop;
  plan:=jsonb_set(plan,array['items',idx::text],item);
 end loop;
 copy:=jsonb_build_object('version',coalesce((old.current->>'version')::int,1)+case when old.current->>'published_at' is not null then 1 else 0 end,
  'title',title,'description',description,'lines',payload->'lines','published_at',null);
 if category='plan' then copy:=copy||jsonb_build_object('plan',plan); end if;
 insert into public.professional_models(id,owner_id,kind,current) values(model_id,owner,category,copy)
 on conflict(id) do update set current=excluded.current,revision=gen_random_uuid(),updated_at=clock_timestamp() returning * into old;
 return public.professional_model_json(old);
end $$;

create function public.act_professional_model(model_id uuid,expected_revision uuid,action text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare owner uuid:=public.recipe_assert_nutri(); model_row public.professional_models; stamp text:=clock_timestamp()::text;
begin
 select * into model_row from public.professional_models where id=model_id for update;
 if not found or model_row.owner_id<>owner then raise exception using errcode='42501',message='model_owner'; end if;
 if model_row.revision is distinct from expected_revision or model_row.archived_at is not null then raise exception using errcode='PT409',message='model_changed'; end if;
 if action='publish' then
  if model_row.current->>'published_at' is not null or (case when model_row.kind='plan' then jsonb_array_length(model_row.current->'plan'->'items')=0 else jsonb_array_length(model_row.current->'lines')=0 end) then raise exception using errcode='22023',message='model_incomplete'; end if;
  update public.professional_models set current=jsonb_set(current,'{published_at}',to_jsonb(stamp)),published=jsonb_set(current,'{published_at}',to_jsonb(stamp)),revision=gen_random_uuid(),updated_at=clock_timestamp() where id=model_id returning * into model_row;
 elsif action='archive' then
  update public.professional_models set archived_at=clock_timestamp(),revision=gen_random_uuid(),updated_at=clock_timestamp() where id=model_id returning * into model_row;
 else raise exception using errcode='22023',message='invalid_action'; end if;
 return public.professional_model_json(model_row);
end $$;
revoke all on function public.save_professional_model(jsonb),public.act_professional_model(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.save_professional_model(jsonb),public.act_professional_model(uuid,uuid,text) to authenticated;
