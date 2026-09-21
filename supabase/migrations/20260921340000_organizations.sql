-- PV-38: organizaciones, equipos, múltiples vínculos, delegación y
-- suscripción B2B como modelo de estado (sin claves de cobro).
-- Fuera del piloto 016/016b. Solo Postgres vacío/descartable.
-- apply:disposable aborta si public.patients tiene filas.
-- No aplicar en un proyecto hospedado con pacientes.
-- El dueño clínico sigue en patients.nutritionist_id. La transferencia
-- reescribe hijos con FK compuesta en una transacción. is_assigned_patient
-- no cambia: el delegado no hereda RLS clínica existente.

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) between 2 and 80),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default clock_timestamp()
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  nutritionist_id uuid not null references public.nutritionists(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')),
  status text not null check (status in ('active', 'invited', 'revoked')),
  invited_by uuid references public.profiles(id),
  joined_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  primary key (organization_id, nutritionist_id),
  check (status <> 'active' or joined_at is not null)
);

create table if not exists public.organization_subscriptions (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  status text not null check (status in ('trialing', 'active', 'past_due', 'canceled', 'waived')),
  plan_code text not null default 'b2b_team' check (char_length(btrim(plan_code)) between 2 and 40),
  valid_until date,
  note text not null default '',
  updated_at timestamptz not null default clock_timestamp()
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 80),
  created_at timestamptz not null default clock_timestamp(),
  unique (organization_id, name)
);

create table if not exists public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  nutritionist_id uuid not null references public.nutritionists(id) on delete cascade,
  primary key (team_id, nutritionist_id)
);

create table if not exists public.patient_care_links (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  nutritionist_id uuid not null references public.nutritionists(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  link_role text not null check (link_role in ('owner', 'delegate', 'observer')),
  granted_by uuid not null references public.profiles(id),
  granted_at timestamptz not null default clock_timestamp(),
  revoked_at timestamptz
);

create unique index if not exists patient_care_links_one_active
  on public.patient_care_links (patient_id, nutritionist_id)
  where revoked_at is null;

create table if not exists public.ownership_transfer_events (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  from_nutritionist_id uuid not null references public.nutritionists(id),
  to_nutritionist_id uuid not null references public.nutritionists(id),
  organization_id uuid references public.organizations(id),
  actor_id uuid not null references public.profiles(id),
  reason text not null default '',
  occurred_at timestamptz not null default clock_timestamp(),
  detail jsonb not null default '{}'::jsonb,
  check (jsonb_typeof(detail) = 'object'),
  check (from_nutritionist_id <> to_nutritionist_id)
);

create index if not exists organization_members_nutri_idx
  on public.organization_members (nutritionist_id, status);
create index if not exists patient_care_links_patient_idx
  on public.patient_care_links (patient_id, revoked_at);
create index if not exists ownership_transfer_patient_idx
  on public.ownership_transfer_events (patient_id, occurred_at desc);

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_subscriptions enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.patient_care_links enable row level security;
alter table public.ownership_transfer_events enable row level security;

revoke all on public.organizations, public.organization_members, public.organization_subscriptions,
  public.teams, public.team_members, public.patient_care_links, public.ownership_transfer_events
  from public, anon, authenticated;
grant select on public.organizations, public.organization_members, public.organization_subscriptions,
  public.teams, public.team_members, public.patient_care_links, public.ownership_transfer_events
  to authenticated;

create or replace function public.org_subscription_allows_care(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_subscriptions s
    where s.organization_id = org_id
      and s.status in ('waived', 'trialing', 'active')
  );
$$;

create or replace function public.is_org_manager(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = org_id
      and m.nutritionist_id is not distinct from public.my_nutritionist_id()
      and m.status = 'active'
      and m.role in ('owner', 'admin')
  );
$$;

create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = org_id
      and m.nutritionist_id is not distinct from public.my_nutritionist_id()
      and m.status = 'active'
  );
$$;

create or replace function public.can_care_for_patient(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_assigned_patient(target)
  or exists (
    select 1
    from public.patient_care_links l
    where l.patient_id = target
      and l.nutritionist_id is not distinct from public.my_nutritionist_id()
      and l.revoked_at is null
      and l.link_role = 'delegate'
      and public.org_subscription_allows_care(l.organization_id)
  );
$$;

drop policy if exists organizations_member_select on public.organizations;
create policy organizations_member_select on public.organizations
  for select to authenticated
  using (public.is_org_member(id));

drop policy if exists organization_members_select on public.organization_members;
create policy organization_members_select on public.organization_members
  for select to authenticated
  using (public.is_org_member(organization_id));

drop policy if exists organization_subscriptions_select on public.organization_subscriptions;
create policy organization_subscriptions_select on public.organization_subscriptions
  for select to authenticated
  using (public.is_org_member(organization_id));

drop policy if exists teams_member_select on public.teams;
create policy teams_member_select on public.teams
  for select to authenticated
  using (public.is_org_member(organization_id));

drop policy if exists team_members_select on public.team_members;
create policy team_members_select on public.team_members
  for select to authenticated
  using (exists (
    select 1 from public.teams t
    where t.id = team_id and public.is_org_member(t.organization_id)
  ));

drop policy if exists patient_care_links_select on public.patient_care_links;
create policy patient_care_links_select on public.patient_care_links
  for select to authenticated
  using (
    public.is_assigned_patient(patient_id)
    or nutritionist_id is not distinct from public.my_nutritionist_id()
  );

drop policy if exists ownership_transfer_select on public.ownership_transfer_events;
create policy ownership_transfer_select on public.ownership_transfer_events
  for select to authenticated
  using (
    public.is_assigned_patient(patient_id)
    or from_nutritionist_id is not distinct from public.my_nutritionist_id()
    or to_nutritionist_id is not distinct from public.my_nutritionist_id()
  );

-- Transferencia de ownership: las FK compuestas deben poder diferirse.
do $$
declare
  r record;
  del_action text;
begin
  for r in
    select c.oid, c.conname, c.conrelid::regclass as tbl, c.confdeltype
    from pg_constraint c
    where c.contype = 'f'
      and c.confrelid = 'public.patients'::regclass
      and pg_get_constraintdef(c.oid) like '%(patient_id, nutritionist_id)%'
      and not c.condeferrable
  loop
    del_action := case r.confdeltype
      when 'c' then 'cascade'
      when 'r' then 'restrict'
      when 'n' then 'set null'
      when 'd' then 'set default'
      else 'no action'
    end;
    execute format('alter table %s drop constraint %I', r.tbl, r.conname);
    execute format(
      'alter table %s add constraint %I foreign key (patient_id, nutritionist_id) references public.patients (id, nutritionist_id) on delete %s deferrable initially immediate',
      r.tbl, r.conname, del_action
    );
  end loop;
end $$;

create or replace function public.org_snapshot(org_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  nid uuid := public.my_nutritionist_id();
  rec public.organizations%rowtype;
  mine public.organization_members%rowtype;
  sub public.organization_subscriptions%rowtype;
begin
  select * into rec from public.organizations o where o.id = org_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'org_missing';
  end if;
  select * into mine
  from public.organization_members m
  where m.organization_id = org_id and m.nutritionist_id = nid;
  if not found or mine.status = 'revoked' then
    raise exception using errcode = '42501', message = 'org_forbidden';
  end if;
  select * into sub from public.organization_subscriptions s where s.organization_id = org_id;
  return jsonb_build_object(
    'id', rec.id,
    'name', rec.name,
    'slug', rec.slug,
    'created_at', rec.created_at,
    'my_role', mine.role,
    'my_status', mine.status,
    'subscription', jsonb_build_object(
      'organization_id', sub.organization_id,
      'status', sub.status,
      'plan_code', sub.plan_code,
      'valid_until', sub.valid_until,
      'note', sub.note,
      'updated_at', sub.updated_at
    ),
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
        'nutritionist_id', m.nutritionist_id,
        'role', m.role,
        'status', m.status,
        'invited_by', m.invited_by,
        'joined_at', m.joined_at
      ) order by m.created_at)
      from public.organization_members m
      where m.organization_id = org_id
    ), '[]'::jsonb),
    'teams', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id,
        'name', t.name,
        'member_ids', coalesce((
          select jsonb_agg(tm.nutritionist_id)
          from public.team_members tm
          where tm.team_id = t.id
        ), '[]'::jsonb)
      ) order by t.created_at)
      from public.teams t
      where t.organization_id = org_id
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.create_organization(input_name text, input_slug text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  nid uuid := public.my_nutritionist_id();
  oid uuid;
  tid uuid;
  slug text := lower(btrim(input_slug));
begin
  if nid is null then
    raise exception using errcode = '42501', message = 'org_role';
  end if;
  if char_length(btrim(input_name)) not between 2 and 80 or slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception using errcode = '22023', message = 'org_invalid';
  end if;
  insert into public.organizations (name, slug, created_by)
  values (btrim(input_name), slug, auth.uid())
  returning id into oid;
  insert into public.organization_members (organization_id, nutritionist_id, role, status, invited_by, joined_at)
  values (oid, nid, 'owner', 'active', auth.uid(), clock_timestamp());
  insert into public.teams (organization_id, name) values (oid, 'consultorio') returning id into tid;
  insert into public.team_members (team_id, nutritionist_id) values (tid, nid);
  insert into public.organization_subscriptions (organization_id, status, plan_code, note)
  values (oid, 'waived', 'b2b_team', 'piloto gratuito manual');
  return public.org_snapshot(oid);
end;
$$;

create or replace function public.list_my_organizations()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  nid uuid := public.my_nutritionist_id();
begin
  if nid is null then
    raise exception using errcode = '42501', message = 'org_role';
  end if;
  return coalesce((
    select jsonb_agg(public.org_snapshot(m.organization_id) order by m.created_at)
    from public.organization_members m
    where m.nutritionist_id = nid and m.status in ('active', 'invited')
  ), '[]'::jsonb);
end;
$$;

create or replace function public.invite_org_member(org_id uuid, target_nutritionist uuid, input_role text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  nid uuid := public.my_nutritionist_id();
  role text := btrim(input_role);
begin
  if nid is null or not public.is_org_manager(org_id) then
    raise exception using errcode = '42501', message = 'org_forbidden';
  end if;
  if role not in ('admin', 'member') then
    raise exception using errcode = '22023', message = 'org_role_invalid';
  end if;
  if not exists (select 1 from public.nutritionists n where n.id = target_nutritionist) then
    raise exception using errcode = 'P0002', message = 'org_member_missing';
  end if;
  if target_nutritionist = nid then
    raise exception using errcode = '22023', message = 'org_self';
  end if;
  insert into public.organization_members (organization_id, nutritionist_id, role, status, invited_by)
  values (org_id, target_nutritionist, role, 'invited', auth.uid())
  on conflict (organization_id, nutritionist_id) do update
    set role = excluded.role,
        status = case
          when public.organization_members.status = 'active' then public.organization_members.status
          else 'invited'
        end,
        invited_by = excluded.invited_by
  where public.organization_members.status <> 'active';
  if not found then
    raise exception using errcode = '22023', message = 'org_already_member';
  end if;
  return public.org_snapshot(org_id);
end;
$$;

create or replace function public.accept_org_invite(org_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  nid uuid := public.my_nutritionist_id();
  tid uuid;
begin
  if nid is null then
    raise exception using errcode = '42501', message = 'org_role';
  end if;
  update public.organization_members
  set status = 'active', joined_at = clock_timestamp()
  where organization_id = org_id and nutritionist_id = nid and status = 'invited';
  if not found then
    raise exception using errcode = '42501', message = 'org_invite_missing';
  end if;
  select t.id into tid from public.teams t where t.organization_id = org_id order by t.created_at limit 1;
  if tid is not null then
    insert into public.team_members (team_id, nutritionist_id)
    values (tid, nid)
    on conflict do nothing;
  end if;
  return public.org_snapshot(org_id);
end;
$$;

create or replace function public.get_organization_subscription(org_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_org_member(org_id) then
    raise exception using errcode = '42501', message = 'org_forbidden';
  end if;
  return (public.org_snapshot(org_id))->'subscription';
end;
$$;

create or replace function public.set_organization_subscription_status(org_id uuid, input_status text, input_note text default '')
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_status text := btrim(input_status);
begin
  if not public.is_org_manager(org_id) then
    raise exception using errcode = '42501', message = 'org_forbidden';
  end if;
  if new_status = 'active' then
    raise exception using errcode = '22023', message = 'org_subscription_provider';
  end if;
  if new_status not in ('trialing', 'waived', 'canceled', 'past_due') then
    raise exception using errcode = '22023', message = 'org_subscription_invalid';
  end if;
  update public.organization_subscriptions
  set status = new_status,
      note = coalesce(nullif(btrim(input_note), ''), note),
      updated_at = clock_timestamp()
  where organization_id = org_id;
  return (public.org_snapshot(org_id))->'subscription';
end;
$$;

create or replace function public.list_patient_care_links(target_patient uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (
    public.is_assigned_patient(target_patient)
    or exists (
      select 1 from public.patient_care_links l
      where l.patient_id = target_patient
        and l.nutritionist_id is not distinct from public.my_nutritionist_id()
        and l.revoked_at is null
    )
  ) then
    raise exception using errcode = '42501', message = 'org_forbidden';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', l.id,
      'patient_id', l.patient_id,
      'nutritionist_id', l.nutritionist_id,
      'organization_id', l.organization_id,
      'link_role', l.link_role,
      'granted_by', l.granted_by,
      'granted_at', l.granted_at,
      'revoked_at', l.revoked_at
    ) order by l.granted_at)
    from public.patient_care_links l
    where l.patient_id = target_patient
  ), '[]'::jsonb);
end;
$$;

create or replace function public.delegate_patient_care(
  target_patient uuid,
  delegate_nutritionist uuid,
  input_role text,
  org_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  nid uuid := public.my_nutritionist_id();
  role text := btrim(input_role);
  lid uuid;
begin
  if nid is null or not public.is_assigned_patient(target_patient) then
    raise exception using errcode = '42501', message = 'org_forbidden';
  end if;
  if role not in ('delegate', 'observer') then
    raise exception using errcode = '22023', message = 'care_role_invalid';
  end if;
  if not public.is_org_member(org_id) or not public.org_subscription_allows_care(org_id) then
    raise exception using errcode = '22023', message = 'org_subscription_blocked';
  end if;
  if not exists (
    select 1 from public.organization_members m
    where m.organization_id = org_id
      and m.nutritionist_id = delegate_nutritionist
      and m.status = 'active'
  ) then
    raise exception using errcode = '22023', message = 'org_peer_required';
  end if;
  if delegate_nutritionist = nid then
    raise exception using errcode = '22023', message = 'care_self';
  end if;
  insert into public.patient_care_links (
    patient_id, nutritionist_id, organization_id, link_role, granted_by
  ) values (target_patient, delegate_nutritionist, org_id, role, auth.uid())
  returning id into lid;
  return public.list_patient_care_links(target_patient);
end;
$$;

create or replace function public.revoke_patient_care(link_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  rec public.patient_care_links%rowtype;
begin
  select * into rec from public.patient_care_links l where l.id = link_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'care_missing';
  end if;
  if not public.is_assigned_patient(rec.patient_id) and rec.granted_by is distinct from auth.uid() then
    raise exception using errcode = '42501', message = 'org_forbidden';
  end if;
  update public.patient_care_links
  set revoked_at = clock_timestamp()
  where id = link_id and revoked_at is null;
  return public.list_patient_care_links(rec.patient_id);
end;
$$;

create or replace function public.transfer_patient_ownership(
  target_patient uuid,
  to_nutritionist uuid,
  reason text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  nid uuid := public.my_nutritionist_id();
  from_id uuid;
  org_id uuid;
  rec record;
  child_tables text[] := '{}';
  eid uuid;
begin
  if nid is null then
    raise exception using errcode = '42501', message = 'org_role';
  end if;
  select p.nutritionist_id into from_id
  from public.patients p
  where p.id = target_patient;
  if from_id is null then
    raise exception using errcode = 'P0002', message = 'patient_missing';
  end if;
  if from_id is distinct from nid then
    raise exception using errcode = '42501', message = 'org_forbidden';
  end if;
  if to_nutritionist = from_id then
    raise exception using errcode = '22023', message = 'transfer_self';
  end if;
  if not exists (select 1 from public.nutritionists n where n.id = to_nutritionist) then
    raise exception using errcode = 'P0002', message = 'org_member_missing';
  end if;
  select m.organization_id into org_id
  from public.organization_members m
  join public.organization_members peer
    on peer.organization_id = m.organization_id
   and peer.nutritionist_id = to_nutritionist
   and peer.status = 'active'
  where m.nutritionist_id = nid
    and m.status = 'active'
    and public.org_subscription_allows_care(m.organization_id)
  order by m.created_at
  limit 1;
  if org_id is null then
    raise exception using errcode = '22023', message = 'org_peer_required';
  end if;

  set constraints all deferred;

  for rec in
    select c.table_name
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.column_name = 'nutritionist_id'
      and exists (
        select 1 from information_schema.columns p
        where p.table_schema = 'public'
          and p.table_name = c.table_name
          and p.column_name = 'patient_id'
      )
      and c.table_name not in ('patients', 'patient_care_links', 'ownership_transfer_events')
  loop
    execute format(
      'update public.%I set nutritionist_id = $1 where patient_id = $2 and nutritionist_id = $3',
      rec.table_name
    ) using to_nutritionist, target_patient, from_id;
    child_tables := array_append(child_tables, rec.table_name);
  end loop;

  update public.patients
  set nutritionist_id = to_nutritionist
  where id = target_patient and nutritionist_id = from_id;

  update public.patient_care_links
  set revoked_at = clock_timestamp()
  where patient_id = target_patient
    and nutritionist_id in (from_id, to_nutritionist)
    and revoked_at is null;

  insert into public.patient_care_links (
    patient_id, nutritionist_id, organization_id, link_role, granted_by
  ) values (target_patient, to_nutritionist, org_id, 'owner', auth.uid());

  insert into public.ownership_transfer_events (
    patient_id, from_nutritionist_id, to_nutritionist_id, organization_id, actor_id, reason, detail
  ) values (
    target_patient, from_id, to_nutritionist, org_id, auth.uid(), coalesce(reason, ''),
    jsonb_build_object('child_tables', to_jsonb(child_tables))
  ) returning id into eid;

  return jsonb_build_object(
    'id', eid,
    'patient_id', target_patient,
    'from_nutritionist_id', from_id,
    'to_nutritionist_id', to_nutritionist,
    'organization_id', org_id,
    'actor_id', auth.uid(),
    'reason', coalesce(reason, ''),
    'occurred_at', clock_timestamp(),
    'child_tables', to_jsonb(child_tables)
  );
end;
$$;

revoke all on function public.org_subscription_allows_care(uuid) from public, anon;
revoke all on function public.is_org_manager(uuid) from public, anon;
revoke all on function public.is_org_member(uuid) from public, anon;
revoke all on function public.can_care_for_patient(uuid) from public, anon;
revoke all on function public.org_snapshot(uuid) from public, anon;
revoke all on function public.create_organization(text, text) from public, anon;
revoke all on function public.list_my_organizations() from public, anon;
revoke all on function public.invite_org_member(uuid, uuid, text) from public, anon;
revoke all on function public.accept_org_invite(uuid) from public, anon;
revoke all on function public.get_organization_subscription(uuid) from public, anon;
revoke all on function public.set_organization_subscription_status(uuid, text, text) from public, anon;
revoke all on function public.list_patient_care_links(uuid) from public, anon;
revoke all on function public.delegate_patient_care(uuid, uuid, text, uuid) from public, anon;
revoke all on function public.revoke_patient_care(uuid) from public, anon;
revoke all on function public.transfer_patient_ownership(uuid, uuid, text) from public, anon;

grant execute on function public.org_subscription_allows_care(uuid) to authenticated;
grant execute on function public.is_org_manager(uuid) to authenticated;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.can_care_for_patient(uuid) to authenticated;
grant execute on function public.org_snapshot(uuid) to authenticated;
grant execute on function public.create_organization(text, text) to authenticated;
grant execute on function public.list_my_organizations() to authenticated;
grant execute on function public.invite_org_member(uuid, uuid, text) to authenticated;
grant execute on function public.accept_org_invite(uuid) to authenticated;
grant execute on function public.get_organization_subscription(uuid) to authenticated;
grant execute on function public.set_organization_subscription_status(uuid, text, text) to authenticated;
grant execute on function public.list_patient_care_links(uuid) to authenticated;
grant execute on function public.delegate_patient_care(uuid, uuid, text, uuid) to authenticated;
grant execute on function public.revoke_patient_care(uuid) to authenticated;
grant execute on function public.transfer_patient_ownership(uuid, uuid, text) to authenticated;
