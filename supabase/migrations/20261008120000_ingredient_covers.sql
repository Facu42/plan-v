-- Fotos de ingredientes: catálogo compartido, una foto por ingrediente normalizado.
-- Preparada y probada en descartable. Su aplicación en producción requiere el OK escrito de Facundo.
-- El catálogo no guarda datos de pacientes ni de consultorios: sólo la clave del ingrediente
-- (minúsculas, sin tildes, sin cantidades; ej. `tomate`, `aceite-de-oliva`) y el estado de su foto.
-- Sin lectura ni escritura directa para personas con sesión: sólo el servicio (la API lee con la clave de servicio,
-- limitada a las claves pedidas, y entrega la dirección de la foto dentro de la receta o el plan de la paciente).
begin;

create table public.ingredient_covers (
  key text primary key check (key ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(key) between 2 and 60),
  status text not null default 'queued' check (status in ('queued','generating','ready','failed')),
  attempts int not null default 0 check (attempts between 0 and 3),
  run_token uuid,
  lease_until timestamptz,
  run_after timestamptz not null default clock_timestamp(),
  last_attempt_at timestamptz,
  storage_path text,
  url text,
  alt text not null default '' check (char_length(alt) <= 300),
  ready_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  check ((status = 'ready') = (url is not null and storage_path is not null and ready_at is not null)),
  check ((status = 'generating') = (run_token is not null and lease_until is not null))
);
create index ingredient_covers_pending on public.ingredient_covers(run_after, created_at) where status in ('queued','generating');
create index ingredient_covers_attempted on public.ingredient_covers(last_attempt_at) where last_attempt_at is not null;

-- RLS activa y sin políticas: anon y authenticated no tienen ningún acceso.
alter table public.ingredient_covers enable row level security;
revoke all on public.ingredient_covers from public, anon, authenticated;
grant select, insert, update on public.ingredient_covers to service_role;

-- Intentos reales por día UTC y tipo (ingredientes y platos): reparte la cuota gratuita del proveedor.
create table public.cover_daily_usage (
  day date not null,
  kind text not null check (kind in ('ingredient','dish')),
  attempts int not null default 0 check (attempts >= 0),
  primary key (day, kind)
);
alter table public.cover_daily_usage enable row level security;
revoke all on public.cover_daily_usage from public, anon, authenticated;
grant select, insert, update on public.cover_daily_usage to service_role;

create function public.record_cover_attempt(usage_kind text)
returns int language plpgsql security definer set search_path = '' as $$
declare total int;
begin
  if usage_kind not in ('ingredient','dish') then raise exception using errcode = '22023', message = 'usage_kind'; end if;
  insert into public.cover_daily_usage(day, kind, attempts) values ((clock_timestamp() at time zone 'utc')::date, usage_kind, 1)
    on conflict (day, kind) do update set attempts = public.cover_daily_usage.attempts + 1
    returning attempts into total;
  return total;
end; $$;

-- Encola claves nuevas (máximo 200 por llamada). Idempotente: lo que ya existe no se toca, salvo un fallo
-- definitivo cuando se pide el reintento explícito. Las claves inválidas se ignoran.
create function public.enqueue_ingredient_covers(keys text[], retry_failed boolean default false)
returns int language plpgsql security definer set search_path = '' as $$
declare added int;
begin
  with wanted as (
    select distinct k from unnest((coalesce(keys, '{}'::text[]))[1:200]) as k
    where k ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(k) between 2 and 60
  ), written as (
    insert into public.ingredient_covers(key)
    select k from wanted
    on conflict (key) do update
      set status = 'queued', attempts = 0, run_after = clock_timestamp(), run_token = null, lease_until = null, updated_at = clock_timestamp()
      where retry_failed and ingredient_covers.status = 'failed'
    returning 1
  ) select count(*) into added from written;
  return added;
end; $$;

-- Reserva un ingrediente para generar su foto. Recupera reservas vencidas y respeta la cuota diaria (día UTC):
-- cuenta INTENTOS reales (no filas), los ingredientes usan como máximo la mitad de la cuota total y, sumados los
-- intentos de platos que registra el trabajador, nunca se pasa del total.
create function public.lease_ingredient_cover(ingredient_limit int default 30, total_limit int default 100)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare job public.ingredient_covers; token uuid := gen_random_uuid();
  today date := (clock_timestamp() at time zone 'utc')::date; allowed int; used_ingredient int; used_dish int;
begin
  update public.ingredient_covers set status = 'failed', run_token = null, lease_until = null, updated_at = clock_timestamp()
    where status = 'generating' and lease_until <= clock_timestamp() and attempts >= 3;
  update public.ingredient_covers set status = 'queued', run_token = null, lease_until = null, updated_at = clock_timestamp()
    where status = 'generating' and lease_until <= clock_timestamp() and attempts < 3;
  allowed := least(coalesce(ingredient_limit, 0), coalesce(total_limit, 0) / 2);
  if allowed < 1 then return null; end if;
  select coalesce(sum(attempts) filter (where kind = 'ingredient'), 0), coalesce(sum(attempts) filter (where kind = 'dish'), 0)
    into used_ingredient, used_dish from public.cover_daily_usage where day = today;
  if used_ingredient >= allowed or used_ingredient + used_dish >= total_limit then return null; end if;
  select * into job from public.ingredient_covers
    where status = 'queued' and attempts < 3 and run_after <= clock_timestamp()
    order by created_at, key limit 1 for update skip locked;
  if not found then return null; end if;
  update public.ingredient_covers set status = 'generating', attempts = attempts + 1, run_token = token,
    lease_until = clock_timestamp() + interval '3 minutes', last_attempt_at = clock_timestamp(), updated_at = clock_timestamp()
    where key = job.key;
  perform public.record_cover_attempt('ingredient');
  return jsonb_build_object('key', job.key, 'run_token', token);
end; $$;

-- Cierra la reserva con la clave secreta. Una foto sólo se acepta si está en el bucket público
-- `recipe-covers`, bajo `ingredients/<clave>.<ext>`, y el archivo existe de verdad.
create function public.finish_ingredient_cover(target_key text, expected_token uuid, result_url text, result_alt text, retry_delay_seconds int default 60, provider_blocked boolean default false)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare job public.ingredient_covers; path text; final_status text;
  delay int := greatest(60, least(86460, coalesce(retry_delay_seconds, 60)));
begin
  select * into job from public.ingredient_covers where key = target_key for update;
  if not found or job.status <> 'generating' or job.run_token is distinct from expected_token or job.lease_until <= clock_timestamp() then
    raise exception using errcode = 'PT409', message = 'ingredient_cover_stale';
  end if;
  if result_url is not null then
    if result_url !~ ('^https://[A-Za-z0-9.-]+/storage/v1/object/public/recipe-covers/ingredients/' || job.key || '[.](png|jpg|webp)$') then
      raise exception using errcode = '22023', message = 'cover_url';
    end if;
    path := split_part(result_url, '/storage/v1/object/public/recipe-covers/', 2);
    if not exists(select 1 from storage.objects where bucket_id = 'recipe-covers' and name = path) then
      raise exception using errcode = '22023', message = 'cover_object_missing';
    end if;
  end if;
  if result_url is null and provider_blocked then
    -- Caída del proveedor (401/403/429): no es culpa de la clave. Devuelve el intento y la cuota y espera.
    update public.ingredient_covers set status = 'queued', attempts = greatest(attempts - 1, 0), run_token = null, lease_until = null,
      updated_at = clock_timestamp(), run_after = clock_timestamp() + make_interval(secs => delay) where key = job.key;
    update public.cover_daily_usage set attempts = greatest(attempts - 1, 0)
      where kind = 'ingredient' and day = (coalesce(job.last_attempt_at, clock_timestamp()) at time zone 'utc')::date;
    return jsonb_build_object('key', job.key, 'status', 'queued', 'url', null);
  end if;
  final_status := case when result_url is not null then 'ready' when job.attempts >= 3 then 'failed' else 'queued' end;
  update public.ingredient_covers set status = final_status, url = result_url, storage_path = path,
    alt = case when result_url is null then '' else left(coalesce(result_alt, ''), 300) end,
    run_token = null, lease_until = null, updated_at = clock_timestamp(),
    ready_at = case when result_url is not null then clock_timestamp() end,
    run_after = case when final_status = 'queued' then clock_timestamp() + make_interval(secs => delay) else run_after end
    where key = job.key;
  return jsonb_build_object('key', job.key, 'status', final_status, 'url', result_url);
end; $$;

revoke all on function public.enqueue_ingredient_covers(text[], boolean), public.lease_ingredient_cover(int, int),
  public.finish_ingredient_cover(text, uuid, text, text, int, boolean), public.record_cover_attempt(text) from public, anon, authenticated;
grant execute on function public.enqueue_ingredient_covers(text[], boolean), public.lease_ingredient_cover(int, int),
  public.finish_ingredient_cover(text, uuid, text, text, int, boolean), public.record_cover_attempt(text) to service_role;

commit;
