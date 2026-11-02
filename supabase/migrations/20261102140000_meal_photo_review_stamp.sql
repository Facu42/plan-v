-- Sello de revisión de la foto de comida.
-- reviewed_at / reviewed_by quedan en la fila. La paciente no los escribe
-- y no recibe la nota interna ni el id de quien revisó.
-- No aplicar en producción sin la frase escrita de Facundo.

alter table public.meal_logs
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references public.profiles(id);

create index if not exists meal_logs_reviewed_by_fk_full_idx
  on public.meal_logs (reviewed_by);

create index if not exists meal_logs_pending_logged_idx
  on public.meal_logs (logged_at, id)
  where status = 'pending_review';

revoke insert (reviewed_at, reviewed_by), update (reviewed_at, reviewed_by)
  on public.meal_logs from public, anon, authenticated;

create or replace function public.my_care_nutritionist_name()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select btrim(n.display_name)
  from public.patients p
  join public.nutritionists n on n.id = p.nutritionist_id
  where p.user_id = auth.uid()
    and p.deactivated_at is null
    and p.anonymized_at is null
  limit 1;
$$;

revoke all on function public.my_care_nutritionist_name() from public, anon;
grant execute on function public.my_care_nutritionist_name() to authenticated;

create or replace function public.review_meal_log(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  lid uuid;
  pid uuid;
begin
  begin
    lid := (payload->>'meal_id')::uuid;
  exception when invalid_text_representation then
    raise exception using errcode = '22023', message = 'diary_invalid';
  end;
  if lid is null then
    raise exception using errcode = '22023', message = 'diary_invalid';
  end if;
  select patient_id into pid from public.meal_logs where id = lid;
  if not found then
    raise exception using errcode = 'PT404', message = 'meal_missing';
  end if;
  perform public.diary_assert_access(pid, true);
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(lid::text, 0));
  perform public.review_meal_log_pre_product(payload);
  update public.meal_logs
    set reviewed_at = clock_timestamp(),
        reviewed_by = auth.uid()
    where id = lid;
  return public.meal_log_json(lid);
end;
$$;

revoke all on function public.review_meal_log(jsonb) from public, anon;
grant execute on function public.review_meal_log(jsonb) to authenticated;

create or replace function public.meal_log_json(lid uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select (
    case
      when public.is_assigned_patient(l.patient_id) then
        public.meal_log_json_pre_product(lid)
        || jsonb_build_object('reviewed_at', l.reviewed_at, 'reviewed_by', l.reviewed_by)
      else
        (public.meal_log_json_pre_product(lid) - 'note_for_nutri' - 'reviewed_by')
        || jsonb_build_object('reviewed_at', l.reviewed_at, 'reviewer_name', btrim(n.display_name))
    end
  ) || jsonb_build_object('nutrition_origin', l.nutrition_origin)
  from public.meal_logs l
  join public.patients p on p.id = l.patient_id
  join public.nutritionists n on n.id = p.nutritionist_id
  where l.id = lid;
$$;

revoke all on function public.meal_log_json(uuid) from public, anon;

notify pgrst, 'reload schema';
