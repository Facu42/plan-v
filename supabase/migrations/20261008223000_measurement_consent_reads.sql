-- Retirar el consentimiento oculta el historial sin eliminarlo.
alter policy care_records_read on public.care_records using (
  public.care_can_read(patient_id)
  and (data->>'kind'<>'payment' or public.is_assigned_patient(patient_id))
  and (data->>'kind' not in ('weight','waist','hip') or public.care_consent(patient_id,'measurement'))
);

create or replace function public.review_care_record(target uuid,record_id uuid) returns void
language plpgsql security definer set search_path='' as $$
declare record_kind text;
begin
  perform public.intake_assert_access(target,true);
  select data->>'kind' into record_kind from public.care_records where id=record_id and patient_id=target;
  if not found then raise exception using errcode='22023',message='care_missing'; end if;
  if record_kind in ('weight','waist','hip') and not public.care_consent(target,'measurement') then
    raise exception using errcode='42501',message='measurement_consent_required';
  end if;
  update public.care_records set reviewed_at=coalesce(reviewed_at,clock_timestamp()) where id=record_id and patient_id=target;
end; $$;
revoke all on function public.review_care_record(uuid,uuid) from public,anon;
grant execute on function public.review_care_record(uuid,uuid) to authenticated;
