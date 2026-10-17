-- Scoped historical export, without granting access to the current clinical workspace.
begin;
create function public.export_patient_imported_history(target uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare n uuid:=public.my_nutritionist_id();p public.patients;permissions jsonb;history jsonb;measures jsonb;
begin
  select * into p from public.patients where id=target and nutritionist_id=n
    and deactivated_at is null and anonymized_at is null for share;
  if n is null or not found then raise exception using errcode='42501',message='imported_export_scope';end if;
  -- Reuse the same live-purpose decision as the RLS policies and import UI.
  permissions:=public.patient_import_authorization_state(target)->'allowed';
  if not exists(select 1 from jsonb_each_text(permissions)where value='true')then
    raise exception using errcode='42501',message='imported_export_authorization';end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',h.id,'patient_id',h.patient_id,'category',h.category,
    'body',h.body,'origin',h.origin,'created_at',h.created_at)order by h.created_at desc,h.id),'[]'::jsonb)into history
    from public.patient_import_history h where h.patient_id=target and h.nutritionist_id=n
      and coalesce((permissions->>h.category)::boolean,false);
  select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'patient_id',m.patient_id,'kind',m.kind,'value',m.value,
    'unit',m.unit,'recorded_on',m.recorded_on,'origin',m.origin,'created_at',m.created_at)order by m.recorded_on desc,m.id),'[]'::jsonb)into measures
    from public.patient_import_measurements m where m.patient_id=target and m.nutritionist_id=n
      and coalesce((permissions->>'measurement')::boolean,false);
  insert into public.audit_events(actor_id,actor_role,source,action,object_type,object_id,patient_id,nutritionist_id)
    values(auth.uid(),'nutri','user','imported_clinical_export','patient_import_history',target::text,target,n);
  return jsonb_build_object('patient',jsonb_build_object('id',p.id,'name',p.full_name),'imported_history',history,'imported_measurements',measures);
end;$$;
revoke all on function public.export_patient_imported_history(uuid)from public,anon,authenticated;
grant execute on function public.export_patient_imported_history(uuid)to authenticated;
commit;
