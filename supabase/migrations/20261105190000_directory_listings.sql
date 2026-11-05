-- Directorio de nutris matriculadas (2026-11-05).
-- La nutricionista sube la foto o el PDF de su matrícula; el administrador la revisa y la aprueba o la rechaza.
-- Solo las aprobadas que eligieron aparecer (y tienen la página pública prendida) salen en el directorio.
--
-- Solo agrega: una tabla nueva y un bucket privado nuevo. No cambia ni borra nada existente.
-- - directory_listings: una fila por nutricionista con el número declarado, el archivo y el estado de la revisión.
--   Lectura directa por RLS solo para la dueña. Las escrituras las hace el servidor con service_role,
--   después de comprobar quién es (la nutri sobre su fila; el administrador con dos pasos para aprobar).
-- - license-files: bucket privado, sin políticas para anon ni authenticated: solo el servidor lo lee y escribe.
--   El administrador ve el archivo con un enlace firmado de un minuto.
-- Reversión: dejar de usar las rutas; conservar la tabla y el bucket como evidencia de lo verificado.

create table if not exists public.directory_listings (
  nutritionist_id uuid primary key references public.nutritionists(id) on delete cascade,
  license_number text not null check (char_length(license_number) between 2 and 40),
  license_scope text not null check (license_scope in ('nacional', 'provincial')),
  license_province text not null default '' check (char_length(license_province) <= 60),
  file_path text not null check (char_length(file_path) between 10 and 200),
  file_mime text not null check (file_mime in ('application/pdf', 'image/jpeg', 'image/png')),
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  listed boolean not null default true,
  reject_reason text not null default '' check (char_length(reject_reason) <= 200),
  submitted_at timestamptz not null default clock_timestamp(),
  reviewed_at timestamptz,
  reviewed_by uuid,
  updated_at timestamptz not null default clock_timestamp()
);
create index if not exists directory_listings_public_idx
  on public.directory_listings (status, listed) where status = 'verified' and listed;
create index if not exists directory_listings_pending_idx
  on public.directory_listings (submitted_at) where status = 'pending';

alter table public.directory_listings enable row level security;
create policy directory_listings_own_select on public.directory_listings
  for select to authenticated using (nutritionist_id = (select public.my_nutritionist_id()));
revoke all on public.directory_listings from public, anon, authenticated;
grant select on public.directory_listings to authenticated;
grant all on public.directory_listings to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('license-files', 'license-files', false, 5242880, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;
