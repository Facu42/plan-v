-- Reabre sólo la ficha propia mediante CAS. Conserva la versión anterior exacta
-- en un historial privado desde este cambio; no inventa revisiones anteriores.
-- Preparada para ensayo. Producción requiere aprobación concreta del usuario.
begin;
set local lock_timeout = '2s';
set local statement_timeout = '30s';

create table private.intake_revision_history (
  patient_id uuid not null references public.patients(id) on delete cascade,
  revision integer not null,
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  preserved_at timestamptz not null default clock_timestamp(),
  primary key (patient_id, revision)
);
alter table private.intake_revision_history enable row level security;
revoke all on private.intake_revision_history from public, anon, authenticated;
grant all on private.intake_revision_history to service_role;

create function private.reopen_patient_intake(target uuid, expected_revision integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare current_record public.intake_sessions;
begin
  perform public.intake_assert_access(target);
  if target is distinct from public.my_patient_id() then
    raise exception using errcode='42501', message='intake_patient_only';
  end if;
  select * into current_record from public.intake_sessions where patient_id=target for update;
  if not found or current_record.revision is distinct from expected_revision then
    raise exception using errcode='PT409', message='intake_revision_conflict';
  end if;
  if current_record.status='draft' then return public.intake_bundle(target); end if;
  insert into private.intake_revision_history(patient_id,revision,snapshot)
    values(target,current_record.revision,to_jsonb(current_record));
  update public.intake_sessions set status='draft',step='profile',revision=revision+1,
    submitted_revision=null,submitted_at=null,reviewed_by=null,reviewed_at=null,
    updated_at=clock_timestamp() where patient_id=target;
  return public.intake_bundle(target);
end; $$;
revoke all on function private.reopen_patient_intake(uuid,integer) from public, anon;
grant execute on function private.reopen_patient_intake(uuid,integer) to authenticated;

create function public.reopen_patient_intake(target uuid, expected_revision integer)
returns jsonb language sql security invoker set search_path = '' as $$
  select private.reopen_patient_intake(target,expected_revision);
$$;
revoke all on function public.reopen_patient_intake(uuid,integer) from public, anon;
grant execute on function public.reopen_patient_intake(uuid,integer) to authenticated;

commit;
