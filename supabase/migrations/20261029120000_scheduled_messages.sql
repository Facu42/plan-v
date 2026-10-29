-- «Mensaje a varias» con «Mañana a las 9»: la nutri deja el mensaje programado y el worker lo manda a la hora.
-- Aditiva: una tabla nueva y dos funciones nuevas. No toca filas ni tablas existentes.
-- Cada fila es el mensaje ya personalizado para una paciente, con su client_id: al mandarlo entra al hilo
-- igual que un mensaje escrito a mano y, si el worker reintenta, no se duplica.
-- No aplicar en la base hospedada hasta la frase escrita de Facundo.
begin;
set local lock_timeout='2s';
set local statement_timeout='30s';

create table if not exists public.scheduled_messages (
 id uuid primary key default gen_random_uuid(),
 nutritionist_id uuid not null references public.nutritionists(id) on delete cascade,
 patient_id uuid not null references public.patients(id) on delete cascade,
 author_id uuid not null references public.profiles(id) on delete cascade,
 client_id uuid not null,
 body text not null check (char_length(btrim(body)) between 1 and 2000),
 send_at timestamptz not null,
 state text not null default 'pending' check (state in ('pending','sent','skipped')),
 message_id uuid references public.messages(id) on delete set null,
 created_at timestamptz not null default clock_timestamp(),
 processed_at timestamptz,
 unique (patient_id, client_id)
);
create index if not exists scheduled_messages_due_idx on public.scheduled_messages (send_at) where state = 'pending';
create index if not exists scheduled_messages_owner_idx on public.scheduled_messages (nutritionist_id, send_at desc);
create index if not exists scheduled_messages_author_idx on public.scheduled_messages (author_id);
create index if not exists scheduled_messages_message_idx on public.scheduled_messages (message_id);

-- La nutri ve sus programados; se escriben solo por las funciones de abajo.
alter table public.scheduled_messages enable row level security;
create policy scheduled_messages_select on public.scheduled_messages for select to authenticated using (nutritionist_id = public.my_nutritionist_id());
revoke all on public.scheduled_messages from public, anon, authenticated;
grant select on public.scheduled_messages to authenticated;

-- payload = { send_at, items: [{ patient_id, client_id, text }] }, hasta 300 pacientes, entre 1 minuto y 8 días adelante.
create or replace function public.schedule_thread_messages(payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 nid uuid := public.my_nutritionist_id();
 due timestamptz;
 item jsonb;
 pid uuid;
 cid uuid;
 body text;
 created int := 0;
 n int;
begin
 if auth.uid() is null or nid is null then
  raise exception using errcode='42501', message='schedule_forbidden';
 end if;
 if jsonb_typeof(payload) is distinct from 'object' or octet_length(payload::text) > 900000
  or jsonb_typeof(payload->'items') is distinct from 'array' or jsonb_array_length(payload->'items') not between 1 and 300
  or jsonb_typeof(payload->'send_at') is distinct from 'string' then
  raise exception using errcode='22023', message='schedule_invalid';
 end if;
 begin
  due := (payload->>'send_at')::timestamptz;
 exception when others then
  raise exception using errcode='22023', message='schedule_invalid';
 end;
 if due < clock_timestamp() + interval '1 minute' or due > clock_timestamp() + interval '8 days' then
  raise exception using errcode='22023', message='schedule_when';
 end if;
 for item in select * from jsonb_array_elements(payload->'items') loop
  begin
   pid := (item->>'patient_id')::uuid;
   cid := (item->>'client_id')::uuid;
  exception when others then
   raise exception using errcode='22023', message='schedule_invalid';
  end;
  if pid is null or cid is null or jsonb_typeof(item->'text') is distinct from 'string' then
   raise exception using errcode='22023', message='schedule_invalid';
  end if;
  body := btrim(item->>'text');
  if char_length(body) not between 1 and 2000 then
   raise exception using errcode='22023', message='thread_text';
  end if;
  if not public.is_assigned_patient(pid) then
   raise exception using errcode='42501', message='schedule_forbidden';
  end if;
  insert into public.scheduled_messages (nutritionist_id, patient_id, author_id, client_id, body, send_at)
  values (nid, pid, auth.uid(), cid, body, due)
  on conflict (patient_id, client_id) do nothing;
  get diagnostics n = row_count;
  created := created + n;
 end loop;
 return jsonb_build_object('scheduled', created, 'send_at', due);
end; $$;

revoke all on function public.schedule_thread_messages(jsonb) from public, anon, authenticated;
grant execute on function public.schedule_thread_messages(jsonb) to authenticated;

-- Solo el worker (service role): manda los vencidos al hilo y devuelve a qué pacientes les llegó, para el aviso al teléfono.
-- Si la paciente ya no está con esa nutri, fue dada de baja o la nutri cambió de usuario, la fila queda «skipped».
create or replace function public.deliver_due_scheduled_messages(p_limit int default 50)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 r public.scheduled_messages;
 patient_user uuid;
 owner uuid;
 nutri_user uuid;
 gone boolean;
 mid uuid;
 delivered jsonb := '[]'::jsonb;
begin
 for r in
  select * from public.scheduled_messages
  where state = 'pending' and send_at <= clock_timestamp()
  order by send_at, id
  limit greatest(1, least(coalesce(p_limit, 50), 200))
  for update skip locked
 loop
  select p.user_id, p.nutritionist_id, n.user_id, (p.deactivated_at is not null or p.anonymized_at is not null)
   into patient_user, owner, nutri_user, gone
  from public.patients p join public.nutritionists n on n.id = p.nutritionist_id
  where p.id = r.patient_id;
  if owner is distinct from r.nutritionist_id or nutri_user is distinct from r.author_id or coalesce(gone, true) then
   update public.scheduled_messages set state = 'skipped', processed_at = clock_timestamp() where id = r.id;
   continue;
  end if;
  mid := null;
  insert into public.messages (nutritionist_id, patient_id, author_id, body, suggested_by_ai, sent_at, client_id)
  values (r.nutritionist_id, r.patient_id, r.author_id, r.body, false, clock_timestamp(), r.client_id)
  on conflict (patient_id, client_id) where client_id is not null do nothing
  returning id into mid;
  if mid is null then
   select id into mid from public.messages where patient_id = r.patient_id and client_id = r.client_id;
  end if;
  if patient_user is not null then
   insert into public.message_receipts (message_id, user_id, delivered_at, read_at)
   values (mid, patient_user, null, null)
   on conflict (message_id, user_id) do nothing;
  end if;
  update public.scheduled_messages set state = 'sent', message_id = mid, processed_at = clock_timestamp() where id = r.id;
  delivered := delivered || to_jsonb(r.patient_id::text);
 end loop;
 return delivered;
end; $$;

revoke all on function public.deliver_due_scheduled_messages(int) from public, anon, authenticated;
grant execute on function public.deliver_due_scheduled_messages(int) to service_role;

commit;
notify pgrst, 'reload schema';
