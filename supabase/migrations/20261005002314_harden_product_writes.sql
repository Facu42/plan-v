-- Cierre funcional: revisiones de contenido, títulos publicados y reintentos seguros.
-- No recupera títulos históricos perdidos: inicializa las versiones con el título disponible.
begin;
alter table public.recipe_versions add column revision uuid not null default gen_random_uuid();
alter table public.meal_plan_versions add column revision uuid not null default gen_random_uuid();
alter table public.recipe_versions add column title text;
alter table public.recipe_versions disable trigger recipe_versions_immutable;
update public.recipe_versions v set title=r.title from public.recipes r where r.id=v.recipe_id;
alter table public.recipe_versions enable trigger recipe_versions_immutable;
alter table public.recipe_versions alter column title set not null;
create function private.capture_recipe_version_title() returns trigger language plpgsql security definer set search_path='' as $$
begin
  select r.title into new.title from public.recipes r where r.id=new.recipe_id;
  return new;
end; $$;
revoke all on function private.capture_recipe_version_title() from public,anon,authenticated;
create trigger recipe_version_title_insert before insert on public.recipe_versions for each row execute function private.capture_recipe_version_title();
revoke insert,update,delete on public.recipes,public.recipe_versions,public.recipe_ingredients,public.ingredients,public.meal_plans,public.meal_plan_versions,public.meal_plan_items from authenticated;

alter function public.recipe_version_json(uuid) rename to recipe_version_json_pre_product;
create function public.recipe_version_json(vid uuid) returns jsonb language sql stable security definer set search_path='' as $$
  select public.recipe_version_json_pre_product(vid)||jsonb_build_object('title',v.title,'revision',v.revision) from public.recipe_versions v where v.id=vid;
$$;
revoke all on function public.recipe_version_json_pre_product(uuid),public.recipe_version_json(uuid) from public,anon,authenticated;
alter function public.meal_plan_version_json(uuid) rename to meal_plan_version_json_pre_product;
create function public.meal_plan_version_json(vid uuid) returns jsonb language sql stable security definer set search_path='' as $$
  select public.meal_plan_version_json_pre_product(vid)||jsonb_build_object('revision',v.revision) from public.meal_plan_versions v where v.id=vid;
$$;
revoke all on function public.meal_plan_version_json_pre_product(uuid),public.meal_plan_version_json(uuid) from public,anon,authenticated;

alter function public.save_recipe_draft(jsonb) rename to save_recipe_draft_pre_product;
create function public.save_recipe_draft(payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare rid uuid; nid uuid; current_revision uuid; result jsonb;
begin
  nid:=public.recipe_assert_nutri(); rid:=(payload->>'id')::uuid;
  perform pg_advisory_xact_lock(hashtextextended(rid::text,4));
  perform pg_advisory_xact_lock(hashtextextended(rid::text,0));
  if exists(select 1 from public.recipes r where r.id=rid and r.nutritionist_id<>nid) then raise exception using errcode='42501',message='recipe_owner'; end if;
  select v.revision into current_revision from public.recipe_versions v where v.recipe_id=rid order by v.version desc limit 1;
  if current_revision is distinct from (payload->>'expected_revision')::uuid then raise exception using errcode='PT409',message='recipe_revision_changed'; end if;
  result:=public.save_recipe_draft_pre_product(payload-'expected_revision'-'card');
  if payload ? 'card' then perform public.set_recipe_card((result->'current'->>'id')::uuid,payload->'card'); end if;
  update public.recipe_versions set title=payload->>'title',revision=gen_random_uuid() where id=(result->'current'->>'id')::uuid;
  return public.recipe_professional_json(rid);
end; $$;
revoke all on function public.save_recipe_draft_pre_product(jsonb) from public,anon,authenticated;
revoke all on function public.save_recipe_draft(jsonb) from public,anon;
grant execute on function public.save_recipe_draft(jsonb) to authenticated;

alter function public.save_meal_plan_draft(uuid,jsonb) rename to save_meal_plan_draft_pre_product;
create function public.save_meal_plan_draft(target_patient uuid,payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare current_revision uuid; result jsonb;
begin
  perform public.recipe_assert_nutri(); perform public.intake_assert_access(target_patient,true);
  perform pg_advisory_xact_lock(hashtextextended(target_patient::text,3));
  perform pg_advisory_xact_lock(hashtextextended(target_patient::text,1));
  select v.revision into current_revision from public.meal_plan_versions v join public.meal_plans p on p.id=v.meal_plan_id
    where p.patient_id=target_patient order by v.version desc limit 1;
  if current_revision is distinct from (payload->>'expected_revision')::uuid then raise exception using errcode='PT409',message='meal_plan_revision_changed'; end if;
  result:=public.save_meal_plan_draft_pre_product(target_patient,payload-'expected_revision');
  update public.meal_plan_versions set revision=gen_random_uuid() where id=(result->'current'->>'id')::uuid;
  return public.meal_plan_professional_json((payload->>'id')::uuid);
end; $$;
revoke all on function public.save_meal_plan_draft_pre_product(uuid,jsonb) from public,anon,authenticated;
revoke all on function public.save_meal_plan_draft(uuid,jsonb) from public,anon;
grant execute on function public.save_meal_plan_draft(uuid,jsonb) to authenticated;

alter function public.publish_recipe(uuid,int) rename to publish_recipe_pre_product;
create function public.publish_recipe(target_recipe uuid,expected_version int,expected_revision uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare nid uuid; current_revision uuid;
begin
  nid:=public.recipe_assert_nutri();
  perform pg_advisory_xact_lock(hashtextextended(target_recipe::text,4));
  perform pg_advisory_xact_lock(hashtextextended(target_recipe::text,0));
  if not exists(select 1 from public.recipes r where r.id=target_recipe and r.nutritionist_id=nid) then raise exception using errcode='42501',message='recipe_owner'; end if;
  select v.revision into current_revision from public.recipe_versions v where v.recipe_id=target_recipe order by v.version desc limit 1;
  if expected_revision is null or current_revision is distinct from expected_revision then raise exception using errcode='PT409',message='recipe_revision_changed'; end if;
  return public.publish_recipe_pre_product(target_recipe,expected_version);
end; $$;
revoke all on function public.publish_recipe_pre_product(uuid,int) from public,anon,authenticated;
revoke all on function public.publish_recipe(uuid,int,uuid) from public,anon;
grant execute on function public.publish_recipe(uuid,int,uuid) to authenticated;

-- La base de escritura pertenece al job, se captura antes de generar y nunca se toma del modelo.
alter function public.enqueue_ai_job(jsonb) rename to enqueue_ai_job_pre_product;
create function public.enqueue_ai_job(payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare base jsonb; result jsonb; nid uuid;
begin
  nid:=public.recipe_assert_nutri();
  if payload->>'job_type'='menu_draft' then
    select jsonb_build_object('plan_id',p.id,'revision',v.revision) into base from public.meal_plans p
      join public.meal_plan_versions v on v.meal_plan_id=p.id where p.patient_id=(payload->>'patient_id')::uuid and p.nutritionist_id=nid order by v.version desc limit 1;
    base:=coalesce(base,jsonb_build_object('plan_id',gen_random_uuid(),'revision',null));
  else base:=jsonb_build_object('recipe_id',gen_random_uuid(),'revision',null); end if;
  payload:=jsonb_set(payload,'{request}',coalesce(payload->'request','{}'::jsonb)||jsonb_build_object('_write_base',base));
  result:=public.enqueue_ai_job_pre_product(payload);
  return result;
end; $$;
revoke all on function public.enqueue_ai_job_pre_product(jsonb) from public,anon,authenticated;
revoke all on function public.enqueue_ai_job(jsonb) from public,anon;
grant execute on function public.enqueue_ai_job(jsonb) to authenticated;


create or replace function public.recipe_card_json(vid uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select k.card || jsonb_build_object(
    'cover_status', coalesce(c.status, 'none'),
    'cover_url', c.url,
    'cover_alt', coalesce(nullif(c.alt, ''), v.title)
  )
  from public.recipe_version_cards k
  join public.recipe_versions v on v.id = k.recipe_version_id
  join public.recipes r on r.id = v.recipe_id
  left join public.recipe_covers c on c.recipe_version_id = k.recipe_version_id
  where k.recipe_version_id = vid;
$$;

create or replace function public.recipe_day_json(aid uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', d.id,
    'patient_id', d.patient_id,
    'for_date', to_char(d.for_date, 'YYYY-MM-DD'),
    'slot', d.slot,
    'recipe_id', d.recipe_id,
    'recipe_version', v.version,
    'title', v.title,
    'yield_portions', v.yield_portions,
    'nutrition',coalesce(v.nutrition,case when v.nutrient_source<>'' and jsonb_typeof(public.recipe_card_json(v.id)->'macros'->'kcal')='number' and jsonb_typeof(public.recipe_card_json(v.id)->'macros'->'protein_g')='number' and jsonb_typeof(public.recipe_card_json(v.id)->'macros'->'carbs_g')='number' and jsonb_typeof(public.recipe_card_json(v.id)->'macros'->'fat_g')='number' then jsonb_build_object('origin','declared','source',v.nutrient_source,'per_portion',public.recipe_card_json(v.id)->'macros') end),
    'ingredients', public.recipe_version_json(v.id)->'ingredients',
    'card', coalesce(public.recipe_card_json(v.id), jsonb_build_object(
      'category', d.slot,
      'prep_minutes', null,
      'macro_status', 'unavailable',
      'macros', null,
      'cover_status', coalesce(c.status, 'none'),
      'cover_url', c.url,
      'cover_alt', coalesce(nullif(c.alt, ''), v.title)
    )),
    'registered_meal_id', d.registered_meal_id
  )
  from public.recipe_day_assignments d
  join public.recipes r on r.id = d.recipe_id
  join public.recipe_versions v on v.id = d.recipe_version_id
  left join public.recipe_covers c on c.recipe_version_id = v.id
  where d.id = aid;
$$;

create or replace function public.list_assigned_recipes(target uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.intake_assert_access(target);
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', r.id,
      'title', v.title,
      'version', v.version,
      'yield_portions', v.yield_portions,
      'steps', v.steps,
      'nutrient_source', v.nutrient_source,
      'ingredients', public.recipe_version_json(v.id)->'ingredients',
      'nutrition',v.nutrition,
      'cover_status', coalesce(c.status, 'none'),
      'cover_url', c.url,
      'cover_alt', coalesce(c.alt, ''),
      'card', public.recipe_card_json(v.id),
      'assigned_at', a.assigned_at,
      'published_at', v.published_at
    ) order by a.assigned_at desc)
    from public.recipe_assignments a
    join public.recipes r on r.id = a.recipe_id
    join public.recipe_versions v on v.id = a.recipe_version_id
    left join public.recipe_covers c on c.recipe_version_id = v.id
    where a.patient_id = target and v.published_at is not null
  ), '[]'::jsonb);
end; $$;

create or replace function public.meal_plan_item_json(iid uuid)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object(
    'id', i.id,
    'for_date', i.for_date,
    'slot', public.meal_plan_slot_label(i.slot),
    'recipe_id', rec.id,
    'recipe_version', v.version,
    'recipe_title', v.title,
    'recipe', case when v.id is null then null else
      public.recipe_version_json(v.id) || jsonb_build_object('title', v.title)
    end,
    'free_text', i.free_text,
    'portions', i.portions,
    'public_note', i.public_note
  ) || case when i.recipe_proposal is null then '{}'::jsonb
    else jsonb_build_object('recipe_proposal', i.recipe_proposal) end
  from public.meal_plan_items i
  left join public.recipe_versions v on v.id = i.recipe_version_id
  left join public.recipes rec on rec.id = v.recipe_id
  where i.id = iid;
$$;

alter function public.assign_recipe(uuid,uuid,int) rename to assign_recipe_pre_product;
create function public.assign_recipe(target_recipe uuid,target_patient uuid,expected_version int) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; frozen_title text;
begin
  result:=public.assign_recipe_pre_product(target_recipe,target_patient,expected_version);
  select title into frozen_title from public.recipe_versions where recipe_id=target_recipe and version=expected_version;
  return result||jsonb_build_object('title',frozen_title);
end; $$;
revoke all on function public.assign_recipe_pre_product(uuid,uuid,int) from public,anon,authenticated;
revoke all on function public.assign_recipe(uuid,uuid,int) from public,anon;
grant execute on function public.assign_recipe(uuid,uuid,int) to authenticated;

create or replace function public.get_patient_library(target_patient uuid, query text default '')
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  snapshot jsonb;
  term text := lower(btrim(coalesce(query, '')));
  professional boolean := public.is_assigned_patient(target_patient);
begin
  perform public.intake_assert_access(target_patient);
  select jsonb_build_object(
    'patient_id', target_patient,
    'resources', coalesce((
      select jsonb_agg(public.resource_row_json(r) order by r.title)
      from public.resources r
      where r.kind = 'operational'
        and (
          (professional and (r.published or r.nutritionist_id is not distinct from public.my_nutritionist_id() or r.nutritionist_id is null))
          or (not professional and r.published)
        )
    ), '[]'::jsonb),
    'articles', coalesce((
      select jsonb_agg(public.resource_row_json(r) order by r.title)
      from public.resources r
      where r.kind = 'clinical'
        and (
          (professional and (r.nutritionist_id is not distinct from public.my_nutritionist_id() or r.nutritionist_id is null))
          or public.patient_can_see_resource(r, target_patient)
        )
    ), '[]'::jsonb),
    'recipes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', rec.id,
        'title', rv.title,
        'assigned_at', a.assigned_at
      ) order by a.assigned_at desc)
      from public.recipe_assignments a
      join public.recipes rec on rec.id = a.recipe_id
      join public.recipe_versions rv on rv.id=a.recipe_version_id
      where a.patient_id = target_patient
    ), '[]'::jsonb),
    'plan_b', case when professional then (
      select case when btrim(p.plan_b) = '' then null
        else jsonb_build_object('patient_id', p.id, 'title', p.plan_b) end
      from public.patients p where p.id = target_patient
    ) else null end,
    'assignments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id,
        'patient_id', a.patient_id,
        'resource_id', r.slug,
        'slug', r.slug,
        'assigned_at', a.assigned_at,
        'read_at', a.first_read_at
      ) order by a.assigned_at desc)
      from public.resource_assignments a
      join public.resources r on r.id = a.resource_id
      where a.patient_id = target_patient
    ), '[]'::jsonb),
    'favorites', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', f.id,
        'patient_id', f.patient_id,
        'item_kind', f.item_kind,
        'item_id', coalesce(fr.id::text, f.item_id),
        'title', f.title,
        'created_at', f.created_at
      ) order by f.created_at desc)
      from public.favorites f
      left join lateral (
        select r.id from public.resources r
        where f.item_kind in ('resource','article') and (r.id::text=f.item_id or r.slug=f.item_id)
        order by (r.id::text=f.item_id) desc
        limit 1
      ) fr on true
      where f.patient_id = target_patient
        and (f.patient_id is not distinct from public.my_patient_id() or professional)
    ), '[]'::jsonb)
  ) into snapshot;

  snapshot := snapshot || jsonb_build_object('hits', (
    select coalesce(jsonb_agg(hit), '[]'::jsonb)
    from (
      select jsonb_build_object('kind', 'resource', 'id', r.slug, 'title', r.title, 'summary', r.summary, 'category', r.category) as hit
      from public.resources r
      where r.kind = 'operational' and r.published
        and (term = '' or position(term in lower(r.title || ' ' || r.summary || ' ' || r.category || ' ' || array_to_string(r.tags, ' '))) > 0)
      union all
      select jsonb_build_object('kind', 'article', 'id', r.slug, 'title', r.title, 'summary', r.summary, 'category', r.category)
      from public.resources r
      where r.kind = 'clinical'
        and (
          (professional and r.published)
          or public.patient_can_see_resource(r, target_patient)
        )
        and (term = '' or position(term in lower(r.title || ' ' || r.summary || ' ' || r.category || ' ' || array_to_string(r.tags, ' '))) > 0)
      union all
      select jsonb_build_object('kind', 'recipe', 'id', rec.id::text, 'title', rv.title, 'summary', '', 'category', 'Receta')
      from public.recipe_assignments a
      join public.recipes rec on rec.id = a.recipe_id
      join public.recipe_versions rv on rv.id=a.recipe_version_id
      where a.patient_id = target_patient
        and (term = '' or position(term in lower(rv.title)) > 0)
      union all
      select jsonb_build_object('kind', 'plan_b', 'id', p.id::text, 'title', p.plan_b, 'summary', 'Plan B de la ficha', 'category', 'Plan B')
      from public.patients p
      where professional and p.id = target_patient and btrim(p.plan_b) <> ''
        and (term = '' or position(term in lower(p.plan_b)) > 0)
    ) visible
  ));
  return snapshot;
end;
$$;

create or replace function public.toggle_favorite(target_patient uuid, input_kind text, input_item text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  nid uuid;
  title text;
  rec public.resources%rowtype;
  canonical_item text := btrim(input_item);
begin
  if target_patient is distinct from public.my_patient_id() then
    raise exception using errcode = '42501', message = 'favorite_patient_only';
  end if;
  select nutritionist_id into nid from public.patients where id = target_patient;
  if nid is null then
    raise exception using errcode = 'P0002', message = 'patient_missing';
  end if;
  if input_kind not in ('resource', 'article', 'recipe') then
    raise exception using errcode = '22023', message = 'favorite_kind';
  end if;
  if input_kind in ('resource','article') then
    select * into rec from public.resources r
    where r.id::text=canonical_item or r.slug=canonical_item
    order by (r.id::text=canonical_item) desc limit 1;
    if not found then raise exception using errcode='42501',message='favorite_hidden'; end if;
    canonical_item := rec.id::text;
  end if;
  if exists (
    select 1 from public.favorites f
    where f.patient_id = target_patient and f.item_kind = input_kind
      and (f.item_id=canonical_item or (f.item_id=rec.slug and not exists (
        select 1 from public.resources r where r.id::text=rec.slug and r.id<>rec.id
      )))
  ) then
    delete from public.favorites
    where patient_id = target_patient and item_kind = input_kind
      and (item_id=canonical_item or (item_id=rec.slug and not exists (
        select 1 from public.resources r where r.id::text=rec.slug and r.id<>rec.id
      )));
    return public.get_patient_library(target_patient, '');
  end if;

  if input_kind in ('resource', 'article') then
    if not public.patient_can_see_resource(rec, target_patient) then
      raise exception using errcode = '42501', message = 'favorite_hidden';
    end if;
    if (input_kind = 'article' and rec.kind is distinct from 'clinical')
      or (input_kind = 'resource' and rec.kind is distinct from 'operational') then
      raise exception using errcode = '22023', message = 'favorite_kind';
    end if;
    title := rec.title;
  elsif input_kind = 'recipe' then
    select v.title into title
    from public.recipe_assignments a
    join public.recipes on recipes.id = a.recipe_id
    join public.recipe_versions v on v.id=a.recipe_version_id
    where a.patient_id = target_patient and recipes.id = input_item::uuid;
    if title is null then
      raise exception using errcode = '42501', message = 'favorite_hidden';
    end if;
  end if;

  insert into public.favorites (patient_id, nutritionist_id, item_kind, item_id, title)
  values (target_patient, nid, input_kind, canonical_item, title);
  return public.get_patient_library(target_patient, '');
end;
$$;

create or replace function public.recipe_version_haystack(target_version uuid)
returns text language sql stable set search_path='' as $$
  select coalesce(v.title, '') || ' ' || coalesce(v.steps::text, '') || ' ' || coalesce((
    select string_agg(ing.name, ' ')
    from public.recipe_ingredients ri
    join public.ingredients ing on ing.id = ri.ingredient_id
    where ri.recipe_version_id = v.id
  ), '')
  from public.recipe_versions v
  join public.recipes r on r.id = v.recipe_id
  where v.id = target_version;
$$;

create or replace function public.meal_plan_version_haystack(target_version uuid)
returns text language sql stable set search_path='' as $$
  select public.meal_plan_version_haystack_base(target_version)||' '||coalesce((
    select string_agg(coalesce(recipe_proposal->>'title','')||' '||coalesce((recipe_proposal->'ingredients')::text,'')||' '||coalesce((recipe_proposal->'steps')::text,''),' ')
    from public.meal_plan_items where meal_plan_version_id=target_version),'');
$$;

-- Procedencia pública de nutrientes; no se inventa para registros históricos.
alter table public.meal_logs add column nutrition_origin text check(nutrition_origin in ('declared','ai_estimate'));
create or replace view public.meal_logs_patient_view as
  select id,patient_id,meal_slot_id,slot_label,photo_path,description,foods,macros,confidence,status,logged_at,analysis_status,nutrition_origin
  from public.meal_logs where patient_id=public.my_patient_id() and public.patient_has_full_access(public.my_patient_id());
-- Conserva las escrituras heredadas sujetas a RLS, sin permitir declarar o borrar la procedencia.
revoke insert,update on public.meal_logs from authenticated;
grant insert(id,patient_id,meal_slot_id,slot_label,photo_path,description,foods,macros,confidence,note_for_nutri,status,logged_at,client_id,analysis_status),
  update(id,patient_id,meal_slot_id,slot_label,photo_path,description,foods,macros,confidence,note_for_nutri,status,logged_at,client_id,analysis_status)
  on public.meal_logs to authenticated;
alter function public.meal_log_json(uuid) rename to meal_log_json_pre_product;
create function public.meal_log_json(lid uuid) returns jsonb language sql stable security definer set search_path='' as $$
  select (case when public.is_assigned_patient(l.patient_id) then public.meal_log_json_pre_product(lid)
    else public.meal_log_json_pre_product(lid)-'note_for_nutri' end)||jsonb_build_object('nutrition_origin',l.nutrition_origin)
  from public.meal_logs l where l.id=lid;
$$;
revoke all on function public.meal_log_json_pre_product(uuid),public.meal_log_json(uuid) from public,anon,authenticated;
alter function public.record_meal_analysis(jsonb) rename to record_meal_analysis_pre_product;
create function public.record_meal_analysis(payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; lid uuid; existing public.meal_logs; accepted boolean;
begin
  begin lid:=(payload->>'meal_id')::uuid;
  exception when invalid_text_representation then raise exception using errcode='22023',message='diary_invalid'; end;
  if lid is null then raise exception using errcode='22023',message='diary_invalid'; end if;
  select * into existing from public.meal_logs where id=lid;
  if not found then raise exception using errcode='PT404',message='meal_missing'; end if;
  perform public.diary_assert_access(existing.patient_id,false);
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(lid::text,0));
  select * into existing from public.meal_logs where id=lid;
  accepted:=existing.status='pending_review' and existing.analysis_status is distinct from 'succeeded' and payload->>'status'='succeeded';
  result:=public.record_meal_analysis_pre_product(payload);
  if accepted then
    update public.meal_logs set nutrition_origin='ai_estimate' where id=lid and nutrition_origin is null and analysis_status='succeeded' and macros is not null;
  end if;
  return public.meal_log_json(lid);
end; $$;
revoke all on function public.record_meal_analysis_pre_product(jsonb) from public,anon,authenticated;
revoke all on function public.record_meal_analysis(jsonb) from public,anon;
grant execute on function public.record_meal_analysis(jsonb) to authenticated;

-- La revisión y el análisis usan el mismo lock; un resultado tardío no sustituye lo confirmado.
alter function public.review_meal_log(jsonb) rename to review_meal_log_pre_product;
create function public.review_meal_log(payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare lid uuid; pid uuid;
begin
  begin lid:=(payload->>'meal_id')::uuid;
  exception when invalid_text_representation then raise exception using errcode='22023',message='diary_invalid'; end;
  if lid is null then raise exception using errcode='22023',message='diary_invalid'; end if;
  select patient_id into pid from public.meal_logs where id=lid;
  if not found then raise exception using errcode='PT404',message='meal_missing'; end if;
  perform public.diary_assert_access(pid,true);
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(lid::text,0));
  return public.review_meal_log_pre_product(payload);
end; $$;
revoke all on function public.review_meal_log_pre_product(jsonb) from public,anon,authenticated;
revoke all on function public.review_meal_log(jsonb) from public,anon;
grant execute on function public.review_meal_log(jsonb) to authenticated;

create or replace function public.register_recipe_day(payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  pid uuid;
  aid uuid;
  cid uuid;
  asg public.recipe_day_assignments;
  saved jsonb;
  meal uuid;
  declared jsonb;
  macros jsonb;
  foods jsonb;
begin
  begin
    pid := (payload->>'patient_id')::uuid;
    aid := (payload->>'assignment_id')::uuid;
    cid := (payload->>'client_id')::uuid;
  exception when others then
    raise exception using errcode = '22023', message = 'recipe_day';
  end;
  if pid is null or aid is null or cid is null then
    raise exception using errcode = '22023', message = 'recipe_day';
  end if;
  perform public.diary_assert_access(pid, false);
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(aid::text, 0));
  select * into asg from public.recipe_day_assignments where id = aid and patient_id = pid;
  if not found then
    raise exception using errcode = 'PT404', message = 'recipe_day_missing';
  end if;
  if asg.registered_meal_id is not null then
    return jsonb_build_object('assignment', public.recipe_day_json(aid), 'duplicate', true);
  end if;
  saved := public.save_meal_log(jsonb_build_object(
    'patient_id', pid,
    'client_id', cid,
    'slot', asg.slot,
    'description', (select v.title from public.recipe_versions v where v.id=asg.recipe_version_id)
  ));
  meal := (saved->'log'->>'id')::uuid;
  foods := coalesce((
    select jsonb_agg(jsonb_build_object(
      'name', i.name,
      'portion_est', case when ri.unit in ('g','ml','u') then least(ri.quantity, 10000) else null end,
      'portion_unit', case when ri.unit in ('g','ml','u') then ri.unit else 'u' end,
      'confidence', 1
    ) order by i.name_normalized)
    from (
      select * from public.recipe_ingredients x where x.recipe_version_id = asg.recipe_version_id
      order by x.id limit 8
    ) ri
    join public.ingredients i on i.id = ri.ingredient_id
  ), '[]'::jsonb);
  select k.card into declared from public.recipe_version_cards k where k.recipe_version_id = asg.recipe_version_id;
  if declared->>'macro_status' = 'declared'
    and jsonb_typeof(declared->'macros'->'kcal') = 'number'
    and jsonb_typeof(declared->'macros'->'protein_g') = 'number'
    and jsonb_typeof(declared->'macros'->'carbs_g') = 'number'
    and jsonb_typeof(declared->'macros'->'fat_g') = 'number' then
    macros := jsonb_build_object(
      'kcal', declared->'macros'->'kcal',
      'protein_g', declared->'macros'->'protein_g',
      'carbs_g', declared->'macros'->'carbs_g',
      'fat_g', declared->'macros'->'fat_g'
    );
  end if;
  perform public.record_meal_analysis(jsonb_build_object(
    'meal_id', meal,
    'status', case when macros is null then 'failed' else 'succeeded' end,
    'foods', foods,
    'macros', macros,
    'confidence', case when macros is null then 0 when (select nutrition->>'origin' from public.recipe_versions where id=asg.recipe_version_id)='ai_estimate' then 0.5 else 1 end,
    'note_for_nutri', case when macros is null
      then 'Registrada desde la receta asignada. Sin macros declarados.'
      when (select nutrition->>'origin' from public.recipe_versions where id=asg.recipe_version_id)='ai_estimate' then 'Registrada desde la receta asignada. Nutrientes estimados por IA y revisados por la nutricionista.'
      else 'Registrada desde la receta asignada. Macros declarados por la nutricionista, no estimados por IA.' end,
    'error_code', case when macros is null then 'macros_unavailable' else null end
  ));
  update public.meal_logs m set nutrition_origin=case when (select nutrition->>'origin' from public.recipe_versions where id=asg.recipe_version_id)='ai_estimate' then 'ai_estimate' else 'declared' end where m.id=meal and m.macros is not null;
  update public.recipe_day_assignments set registered_meal_id = meal, client_id = cid where id = aid;
  return jsonb_build_object('assignment', public.recipe_day_json(aid), 'duplicate', coalesce((saved->>'duplicate')::boolean, false));
end; $$;

revoke all on function public.recipe_card_json(uuid),public.recipe_day_json(uuid),public.meal_plan_item_json(uuid),public.recipe_version_haystack(uuid),public.meal_plan_version_haystack(uuid),public.assign_recipe_base(uuid,uuid,int) from public,anon,authenticated;


create or replace function public.meal_plan_version_haystack_base(target_version uuid)
returns text language sql stable set search_path='' as $$
  select coalesce(string_agg(part, ' '), '')
  from (
    select coalesce(i.free_text, '') || ' ' || coalesce(i.public_note, '') as part
    from public.meal_plan_items i
    where i.meal_plan_version_id = target_version
    union all
    select coalesce(v.title, '') || ' ' || coalesce(v.steps::text, '')
    from public.meal_plan_items i
    join public.recipe_versions v on v.id = i.recipe_version_id
    join public.recipes r on r.id = v.recipe_id
    where i.meal_plan_version_id = target_version
    union all
    select coalesce(ing.name, '')
    from public.meal_plan_items i
    join public.recipe_ingredients ri on ri.recipe_version_id = i.recipe_version_id
    join public.ingredients ing on ing.id = ri.ingredient_id
    where i.meal_plan_version_id = target_version
  ) parts;
$$;

-- Recibos privados de operación: el mismo actor/UUID nunca puede escribir dos contenidos.
-- Alta e invitación en una sola transacción. Un reintento de la misma alta no deja fichas huérfanas.
create function public.create_patient_with_invite(payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare nid uuid; pname text; mail text; goal text; pid uuid; invitation public.patient_invites; existing public.patients;
begin
  nid:=public.my_nutritionist_id();
  if nid is null then raise exception using errcode='42501',message='patient_create_forbidden'; end if;
  if jsonb_typeof(payload) is distinct from 'object' or octet_length(payload::text)>4000
    or jsonb_typeof(payload->'name') is distinct from 'string' or jsonb_typeof(payload->'email') is distinct from 'string' or jsonb_typeof(payload->'goal') is distinct from 'string'
    or exists(select 1 from jsonb_object_keys(payload) k where k not in ('name','email','goal')) then
    raise exception using errcode='22023',message='patient_create_invalid';
  end if;
  pname:=btrim(coalesce(payload->>'name',''));mail:=lower(btrim(coalesce(payload->>'email','')));goal:=btrim(coalesce(payload->>'goal',''));
  if char_length(pname) not between 2 and 80 or char_length(goal) not between 2 and 240 or char_length(mail)>254
    or mail!~'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception using errcode='22023',message='patient_create_invalid';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(nid::text||':patient-create:'||mail,9));
  -- El recibo del alta sigue siendo recuperable después de usar, revocar o vencer el enlace.
  select * into invitation from public.patient_invites where nutritionist_id=nid and email=mail order by created_at desc,id desc limit 1;
  if found then
    select * into existing from public.patients where id=invitation.patient_id and nutritionist_id=nid;
    if existing.full_name is distinct from pname or existing.goal is distinct from goal or existing.deactivated_at is not null or existing.anonymized_at is not null then
      raise exception using errcode='PT409',message='patient_create_conflict';
    end if;
    return jsonb_build_object('patient_id',existing.id,'invite',to_jsonb(invitation),'duplicate',true);
  end if;
  insert into public.patients(nutritionist_id,full_name,initials,tone,status,billing_status,stage,goal,adherence_score,next_focus)
    values(nid,pname,upper(left(split_part(pname,' ',1),1)||case when position(' ' in pname)>0 then left(split_part(pname,' ',2),1) else '' end),'mint','Ingreso','pending','ingreso',goal,0,'Completar evaluación inicial') returning id into pid;
  insert into public.patient_invites(patient_id,nutritionist_id,email,status) values(pid,nid,mail,'not_sent') returning * into invitation;
  insert into public.patient_invite_events(invite_id,event) values(invitation.id,'created');
  return jsonb_build_object('patient_id',pid,'invite',to_jsonb(invitation),'duplicate',false);
end; $$;
revoke all on function public.create_patient_with_invite(jsonb) from public,anon;
grant execute on function public.create_patient_with_invite(jsonb) to authenticated;

create table private.product_write_receipts(
  actor_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null, patient_id uuid not null references public.patients(id) on delete cascade,
  operation text not null, payload jsonb not null, created_at timestamptz not null default now(),
  primary key(actor_id,client_id)
);
alter table private.product_write_receipts enable row level security;
revoke all on private.product_write_receipts from public,anon,authenticated;
create function private.product_write_seen(target uuid,cid uuid,op text,body jsonb) returns boolean
language plpgsql security definer set search_path='' as $$
declare receipt private.product_write_receipts;
begin
  if auth.uid() is null then raise exception using errcode='42501',message='product_write_auth'; end if;
  if cid is null then raise exception using errcode='22023',message='product_write_client_id'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||':'||cid::text,9));
  select * into receipt from private.product_write_receipts r where r.actor_id=auth.uid() and r.client_id=cid;
  if not found then return false; end if;
  if receipt.patient_id is distinct from target or receipt.operation is distinct from op or receipt.payload is distinct from body then
    raise exception using errcode='PT409',message='product_write_conflict';
  end if;
  return true;
end; $$;
revoke all on function private.product_write_seen(uuid,uuid,text,jsonb) from public,anon,authenticated;


alter function public.record_patient_payment(uuid,int,date,text,text) rename to record_patient_payment_pre_product;
create function public.record_patient_payment(target uuid,amount int,paid_on date,method text,note text default '',client_id uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare body jsonb; result jsonb;
begin
  perform public.billing_assert_owner(target);
  body:=jsonb_build_object('amount',amount,'paid_on',paid_on,'method',method,'note',btrim(coalesce(note,'')));
  if private.product_write_seen(target,client_id,'record_patient_payment',body) then return public.get_patient_ledger(target); end if;
  result:=public.record_patient_payment_pre_product(target,amount,paid_on,method,btrim(coalesce(note,'')));
  insert into private.product_write_receipts(actor_id,client_id,patient_id,operation,payload) values(auth.uid(),client_id,target,'record_patient_payment',body);
  return result;
end; $$;
revoke all on function public.record_patient_payment_pre_product(uuid,int,date,text,text) from public,anon,authenticated;
revoke all on function public.record_patient_payment(uuid,int,date,text,text,uuid) from public,anon;
grant execute on function public.record_patient_payment(uuid,int,date,text,text,uuid) to authenticated;

alter function public.report_patient_payment(uuid,int,date,text,text) rename to report_patient_payment_pre_product;
create function public.report_patient_payment(target uuid,amount int,paid_on date,method text,note text default '',client_id uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare body jsonb; result jsonb;
begin
  if not exists(select 1 from public.patients p where p.id=target and p.user_id=auth.uid() and p.archived_at is null) then raise exception using errcode='42501',message='payment_patient_only'; end if;
  body:=jsonb_build_object('amount',amount,'paid_on',paid_on,'method',method,'note',btrim(coalesce(note,'')));
  if private.product_write_seen(target,client_id,'report_patient_payment',body) then return public.get_patient_ledger(target); end if;
  result:=public.report_patient_payment_pre_product(target,amount,paid_on,method,btrim(coalesce(note,'')));
  insert into private.product_write_receipts(actor_id,client_id,patient_id,operation,payload) values(auth.uid(),client_id,target,'report_patient_payment',body);
  return result;
end; $$;
revoke all on function public.report_patient_payment_pre_product(uuid,int,date,text,text) from public,anon,authenticated;
revoke all on function public.report_patient_payment(uuid,int,date,text,text,uuid) from public,anon;
grant execute on function public.report_patient_payment(uuid,int,date,text,text,uuid) to authenticated;

alter function public.log_patient_activity(uuid,text,int,text,text,uuid,int,int) rename to log_patient_activity_pre_product;
create function public.log_patient_activity(target_patient uuid,input_activity text,input_duration int,input_intensity text,input_note text default null,input_assignment uuid default null,input_sets int default null,input_reps int default null,client_id uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare body jsonb; result jsonb;
begin
  if target_patient is distinct from public.my_patient_id() or not public.patient_has_full_access(target_patient) then raise exception using errcode='42501',message='activity_patient_only'; end if;
  body:=jsonb_build_object('activity',btrim(input_activity),'duration',input_duration,'intensity',input_intensity,'note',nullif(btrim(coalesce(input_note,'')),''),'assignment',input_assignment,'sets',input_sets,'reps',input_reps);
  if private.product_write_seen(target_patient,client_id,'activity',body) then return public.get_patient_exercise(target_patient); end if;
  result:=public.log_patient_activity_pre_product(target_patient,input_activity,input_duration,input_intensity,input_note,input_assignment,input_sets,input_reps);
  insert into private.product_write_receipts(actor_id,client_id,patient_id,operation,payload) values(auth.uid(),client_id,target_patient,'activity',body);
  return result;
end; $$;
revoke all on function public.log_patient_activity_pre_product(uuid,text,int,text,text,uuid,int,int) from public,anon,authenticated;
revoke all on function public.log_patient_activity(uuid,text,int,text,text,uuid,int,int,uuid) from public,anon;
grant execute on function public.log_patient_activity(uuid,text,int,text,text,uuid,int,int,uuid) to authenticated;
revoke insert,delete on public.activity_logs from authenticated;
revoke all on function public.set_recipe_card(uuid,jsonb) from public,anon,authenticated;

-- El job conserva su base de escritura aun si un cliente altera el payload del proveedor.
alter function public.finish_ai_job(jsonb) rename to finish_ai_job_pre_product;
create function public.finish_ai_job(payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare base jsonb; job public.ai_jobs;
begin
  perform public.recipe_assert_nutri();
  select * into job from public.ai_jobs where id=(payload->>'id')::uuid;
  if job.nutritionist_id is distinct from public.my_nutritionist_id() then raise exception using errcode='42501',message='ai_job_forbidden'; end if;
  base:=job.request->'_write_base';
  if coalesce(nullif(payload->>'status',''),'succeeded')='succeeded' and payload ? 'artifact' then
    if base is null then raise exception using errcode='PT409',message='ai_job_context_changed'; end if;
    payload:=jsonb_set(payload,'{artifact,payload}',coalesce(payload#>'{artifact,payload}','{}'::jsonb)||jsonb_build_object('id',coalesce(base->'plan_id',base->'recipe_id'),'expected_revision',base->'revision'));
  end if;
  return public.finish_ai_job_pre_product(payload);
end; $$;
revoke all on function public.finish_ai_job_pre_product(jsonb) from public,anon,authenticated;
revoke all on function public.finish_ai_job(jsonb) from public,anon;
grant execute on function public.finish_ai_job(jsonb) to authenticated;


-- La publicación expuesta exige la copia revisada; el helper antiguo sigue siendo interno.
revoke all on function public.publish_meal_plan(uuid,int) from public,anon,authenticated;
create function private.preserve_ingredient_identity() returns trigger language plpgsql set search_path='' as $$
begin
  if new.name_normalized is distinct from old.name_normalized then raise exception using errcode='PT409',message='ingredient_identity_immutable'; end if;
  new.name:=old.name; new.base_unit:=old.base_unit;
  return new;
end; $$;
revoke all on function private.preserve_ingredient_identity() from public,anon,authenticated;
create trigger preserve_ingredient_identity before update on public.ingredients for each row execute function private.preserve_ingredient_identity();
create or replace function private.save_manual_recipe_cover(target_recipe uuid, expected_version int,
  expected_cover_url text, cover_url text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare nid uuid; vid uuid; version_number int; previous_url text; title text; result jsonb;
begin
  nid := public.recipe_assert_nutri();
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(target_recipe::text, 0));
  select r.title into title from public.recipes r
    where r.id=target_recipe and r.nutritionist_id=nid and r.status <> 'archived';
  if not found then raise exception using errcode='42501',message='recipe_forbidden'; end if;
  select v.id,v.version,v.title into vid,version_number,title from public.recipe_versions v
    where v.recipe_id=target_recipe and v.published_at is not null
    order by v.version desc limit 1 for update;
  if vid is null or expected_version is null or version_number is distinct from expected_version then
    raise exception using errcode='PT409',message='recipe_cover_version_changed';
  end if;
  select c.url into previous_url from public.recipe_covers c where c.recipe_version_id=vid;
  if previous_url is distinct from expected_cover_url then
    raise exception using errcode='PT409',message='recipe_cover_changed';
  end if;
  result := public.set_recipe_cover(vid,'ready',cover_url,title);
  -- La finalización IA toma FOR UPDATE sobre la misma versión. Un resultado
  -- pendiente no puede sobrescribir la foto elegida por la profesional.
  update public.recipe_cover_requests set token=gen_random_uuid(),finished_at=clock_timestamp()
    where recipe_version_id=vid;
  return result;
end; $$;

commit;

