-- Inicio del consultorio: «Tus próximas acciones» se pueden descartar.
-- Cada descarte pertenece al consultorio de la profesional y a una paciente suya; queda
-- atado al hecho que lo originó (fingerprint: último registro, o último pedido y cantidad),
-- así la acción reaparece sólo si ese hecho cambia. Lectura por RLS; escritura sólo por RPC.
create table if not exists public.crm_action_dismissals (
  id uuid not null default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  nutritionist_id uuid not null references public.nutritionists(id) on delete cascade,
  signal text not null check (signal in ('no_records', 'many_replacements')),
  fingerprint text not null check (char_length(fingerprint) between 1 and 80),
  dismissed_by uuid not null references public.profiles(id) on delete cascade,
  dismissed_at timestamptz not null default clock_timestamp(),
  primary key (patient_id, signal, fingerprint)
);

create index if not exists crm_action_dismissals_nutri_idx on public.crm_action_dismissals (nutritionist_id);

alter table public.crm_action_dismissals enable row level security;

drop policy if exists crm_action_dismissals_select on public.crm_action_dismissals;
create policy crm_action_dismissals_select on public.crm_action_dismissals
  for select using (nutritionist_id = (select public.my_nutritionist_id()));

revoke all on public.crm_action_dismissals from public, anon, authenticated;
grant select on public.crm_action_dismissals to authenticated;

create or replace function public.dismiss_crm_action(target uuid, action_signal text, action_fingerprint text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  nid uuid := public.my_nutritionist_id();
  actor uuid := auth.uid();
begin
  if actor is null or nid is null then
    raise exception using errcode = '42501', message = 'crm_pro_only';
  end if;
  if action_signal is null or action_signal not in ('no_records', 'many_replacements')
     or action_fingerprint is null or char_length(action_fingerprint) not between 1 and 80 then
    raise exception using errcode = '22023', message = 'crm_action_invalid';
  end if;
  if not exists (
    select 1 from public.patients p
    where p.id = target and p.nutritionist_id = nid
      and p.deactivated_at is null and p.anonymized_at is null
  ) then
    raise exception using errcode = '42501', message = 'crm_forbidden';
  end if;
  insert into public.crm_action_dismissals (patient_id, nutritionist_id, signal, fingerprint, dismissed_by)
  values (target, nid, action_signal, action_fingerprint, actor)
  on conflict do nothing;
end; $$;

revoke all on function public.dismiss_crm_action(uuid, text, text) from public, anon;
grant execute on function public.dismiss_crm_action(uuid, text, text) to authenticated;
