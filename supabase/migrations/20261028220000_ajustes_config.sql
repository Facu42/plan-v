-- Ajustes completo: datos del consultorio, plantillas de formularios y certificados, avisos automáticos.
-- Aditiva: tablas nuevas y una función reemplazada (sin DROP) para que la marca acepte los campos nuevos.
-- No se aplica sin la frase de Facundo.
begin;
set local lock_timeout='2s';
set local statement_timeout='30s';

-- La marca del consultorio suma matrícula, CUIT, dirección, teléfono, mail, título, matrícula provincial, especialidad y firma.
create or replace function private.valid_nutrition_settings(value jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare row jsonb; seen text[]:='{}'; label text;
begin
 if jsonb_typeof(value) is distinct from 'object' or not(value ?& array['approvals','micronutrients','brand']) or (select count(*) from jsonb_object_keys(value))<>3 then return false;end if;
 if jsonb_typeof(value->'approvals') is distinct from 'array' or jsonb_array_length(value->'approvals')>5 or jsonb_typeof(value->'micronutrients') is distinct from 'array' or jsonb_array_length(value->'micronutrients')>6 then return false;end if;
 for row in select * from jsonb_array_elements(value->'approvals') loop
  if jsonb_typeof(row) is distinct from 'object' or (select count(*) from jsonb_object_keys(row))<>3 or not(row ?& array['formula','citation','url']) then return false;end if;
  label:=row->>'formula';if jsonb_typeof(row->'formula') is distinct from 'string' or label not in ('mifflin','harris','fao','katch','scale') or label=any(seen) or jsonb_typeof(row->'citation')<>'string' or length(btrim(row->>'citation')) not between 3 and 500 or jsonb_typeof(row->'url')<>'string' or length(row->>'url')>500 or row->>'url' !~ '^https://[^/@[:space:]]+[^[:space:]]*$' then return false;end if;seen:=array_append(seen,label);
 end loop;
 seen:='{}';
 for row in select * from jsonb_array_elements(value->'micronutrients') loop
  if jsonb_typeof(row) is distinct from 'object' or (select count(*) from jsonb_object_keys(row))<>4 or not(row ?& array['key','value','citation','url']) then return false;end if;
  label:=row->>'key';if jsonb_typeof(row->'key') is distinct from 'string' or label not in ('sodium','calcium','iron','potassium','magnesium','vitamin_c') or label=any(seen) or jsonb_typeof(row->'value')<>'number' or (row->>'value')::numeric<=0 or (row->>'value')::numeric>100000 or jsonb_typeof(row->'citation')<>'string' or length(btrim(row->>'citation')) not between 3 and 500 or jsonb_typeof(row->'url')<>'string' or length(row->>'url')>500 or row->>'url' !~ '^https://[^/@[:space:]]+[^[:space:]]*$' then return false;end if;seen:=array_append(seen,label);
 end loop;
 row:=value->'brand';if jsonb_typeof(row) is distinct from 'object' or not(row ?& array['name','contact','logo']) or exists(select 1 from jsonb_object_keys(row) k where k<>all(array['name','contact','logo','cuit','address','phone','email','degree','license','province_license','specialty','signature'])) then return false;end if;
 for label in select k from jsonb_object_keys(row) k where k not in ('name','contact','logo','signature') loop
  if jsonb_typeof(row->label)<>'string' or length(row->>label)>case label when 'address' then 160 when 'cuit' then 20 when 'phone' then 40 when 'license' then 40 when 'province_license' then 60 else 120 end then return false;end if;
 end loop;
 if row ? 'signature' and (jsonb_typeof(row->'signature')<>'string' or length(row->>'signature')>700000 or (row->>'signature'<>'' and row->>'signature' !~ '^data:image/(png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$')) then return false;end if;
 if jsonb_typeof(row->'name')<>'string' or length(row->>'name')>120 or jsonb_typeof(row->'contact')<>'string' or length(row->>'contact')>240 or jsonb_typeof(row->'logo')<>'string' or length(row->>'logo')>700000 or (row->>'logo'<>'' and row->>'logo' !~ '^data:image/(png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$') then return false;end if;
 return true;
exception when others then return false;
end $$;

create table if not exists public.nutrition_templates (
 id uuid not null,
 owner_id uuid not null references public.nutritionists(id) on delete cascade,
 payload jsonb not null check (jsonb_typeof(payload)='object' and pg_column_size(payload) < 20000 and payload->>'kind' in ('Formulario','Certificado')),
 updated_at timestamptz not null default clock_timestamp(),
 primary key (owner_id, id)
);
alter table public.nutrition_templates enable row level security;
create policy nutrition_templates_select on public.nutrition_templates for select to authenticated using (owner_id=public.my_nutritionist_id());
create policy nutrition_templates_insert on public.nutrition_templates for insert to authenticated with check (owner_id=public.my_nutritionist_id());
create policy nutrition_templates_update on public.nutrition_templates for update to authenticated using (owner_id=public.my_nutritionist_id()) with check (owner_id=public.my_nutritionist_id());
create policy nutrition_templates_delete on public.nutrition_templates for delete to authenticated using (owner_id=public.my_nutritionist_id());
revoke all on public.nutrition_templates from public, anon;
grant select, insert, update, delete on public.nutrition_templates to authenticated;

create table if not exists public.notice_settings (
 owner_id uuid not null references public.nutritionists(id) on delete cascade,
 key text not null check (key ~ '^[a-z0-9_]{3,40}$'),
 enabled boolean not null default false,
 when_text text check (when_text is null or char_length(when_text) between 3 and 120),
 message text check (message is null or char_length(message) between 5 and 500),
 updated_at timestamptz not null default clock_timestamp(),
 primary key (owner_id, key)
);
alter table public.notice_settings enable row level security;
create policy notice_settings_select on public.notice_settings for select to authenticated using (owner_id=public.my_nutritionist_id());
create policy notice_settings_insert on public.notice_settings for insert to authenticated with check (owner_id=public.my_nutritionist_id());
create policy notice_settings_update on public.notice_settings for update to authenticated using (owner_id=public.my_nutritionist_id()) with check (owner_id=public.my_nutritionist_id());
revoke all on public.notice_settings from public, anon;
grant select, insert, update on public.notice_settings to authenticated;
commit;
