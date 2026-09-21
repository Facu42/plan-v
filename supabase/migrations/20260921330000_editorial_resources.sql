-- PV-36: recursos editoriales con autoría/revisión, asignación persistida,
-- favoritos unificados y búsqueda acotada por permisos.
-- Fuera de aplicar 016/016b. Solo Postgres vacío/descartable.
-- apply:disposable aborta si public.patients tiene filas.
-- No aplicar en un proyecto hospedado con pacientes.
-- Publicar exige reviewed_at + reviewed_by. Sin imágenes remotas inventadas.
-- Paciente: guías operativas publicadas; artículos clínicos sólo publicados y asignados.

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (char_length(btrim(slug)) between 2 and 80),
  kind text not null check (kind in ('operational', 'clinical')),
  nutritionist_id uuid references public.nutritionists(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 2 and 150),
  summary text not null check (char_length(btrim(summary)) between 2 and 400),
  category text not null check (char_length(btrim(category)) between 2 and 40),
  eyebrow text not null default '',
  minutes int not null check (minutes between 1 and 30),
  icon text not null default 'sparkle',
  tags text[] not null default '{}',
  sections jsonb not null default '[]'::jsonb,
  related_slugs text[] not null default '{}',
  action_label text not null default '',
  action_page text not null default '',
  author_name text not null check (char_length(btrim(author_name)) between 2 and 80),
  author_id uuid references public.profiles(id) on delete set null,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  published boolean not null default false,
  license_kind text not null check (license_kind in ('internal_operational', 'placeholder', 'declared')),
  license_note text not null default '',
  cover_url text,
  created_at timestamptz not null default clock_timestamp(),
  check (jsonb_typeof(sections) = 'array'),
  check (cover_url is null),
  check (published = false or reviewed_at is not null)
);

create table if not exists public.resource_assignments (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  patient_id uuid not null,
  nutritionist_id uuid not null,
  assigned_by uuid not null references public.profiles(id),
  assigned_at timestamptz not null default clock_timestamp(),
  first_read_at timestamptz,
  unique (resource_id, patient_id),
  foreign key (patient_id, nutritionist_id) references public.patients (id, nutritionist_id) on delete cascade
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null,
  nutritionist_id uuid not null,
  item_kind text not null check (item_kind in ('resource', 'article', 'recipe', 'plan_b')),
  item_id text not null check (char_length(btrim(item_id)) between 1 and 80),
  title text not null check (char_length(btrim(title)) between 1 and 150),
  created_at timestamptz not null default clock_timestamp(),
  unique (patient_id, item_kind, item_id),
  foreign key (patient_id, nutritionist_id) references public.patients (id, nutritionist_id) on delete cascade
);

create index if not exists resource_assignments_patient_idx
  on public.resource_assignments (patient_id, assigned_at desc);
create index if not exists favorites_patient_idx
  on public.favorites (patient_id, created_at desc);
create index if not exists resources_kind_published_idx
  on public.resources (kind, published, slug);

insert into public.resources (
  id, slug, kind, title, summary, category, eyebrow, minutes, icon, tags, sections, related_slugs,
  action_label, action_page, author_name, reviewed_at, published, license_kind, license_note, cover_url
) values
  (
    '22222222-2222-4222-a222-000000000001', 'leer-plan-semanal', 'operational',
    'Cómo leer tu plan semanal',
    'Ubicá cada indicación por día y momento, buscá títulos y consultá cualquier cambio con tu nutricionista.',
    'Mi plan', 'EMPEZÁ POR ACÁ', 3, 'list',
    array['plan semanal','días','comidas'],
    '[{"title":"Una semana, siete días","body":"En Mi plan podés recorrer los siete días publicados por tu nutricionista. Cada tarjeta conserva el título y el momento de comida que forman parte del plan vigente."},{"title":"Sólo mostramos lo que fue indicado","body":"Plan V no completa por su cuenta porciones, cantidades ni información nutricional. Si una indicación necesita más detalle, usá Mensajes para consultarlo."},{"title":"Encontrá una preparación","body":"El buscador recorre títulos, días y momentos. Menú saludable reúne los mismos títulos para ver rápidamente dónde aparecen durante la semana."}]'::jsonb,
    array['compras-desde-plan','registrar-comida'],
    'Abrir mi plan', 'plan',     'Plan V',
    '2026-09-16T12:00:00Z', true,
    'internal_operational', 'Texto original de Plan V. Sin imagen de terceros ni URL remota.', null
  ),
  (
    '22222222-2222-4222-a222-000000000002', 'registrar-comida', 'operational',
    'Registrar una comida sin perder contexto',
    'Sumá una foto o una descripción al Diario para compartir el registro con tu nutricionista.',
    'Diario', 'TU REGISTRO', 2, 'camera',
    array['diario','foto','seguimiento'],
    '[{"title":"Foto o descripción","body":"Elegí el momento de comida y registrá una foto o un texto. La entrada queda asociada a tu ficha y visible para la profesional que te acompaña."},{"title":"Revisión profesional","body":"Cuando exista una revisión, el Diario muestra únicamente la devolución habilitada para vos. Las notas privadas de trabajo profesional permanecen fuera de tu vista."},{"title":"Análisis disponible","body":"Si el análisis asistido está habilitado, Plan V lo procesa dentro del circuito existente. Si no está disponible, tu registro igualmente conserva el contenido que enviaste."}]'::jsonb,
    array['leer-plan-semanal','progreso-semanal'],
    'Abrir mi diario', 'diario',     'Plan V',
    '2026-09-16T12:00:00Z', true,
    'internal_operational', 'Texto original de Plan V. Sin imagen de terceros ni URL remota.', null
  ),
  (
    '22222222-2222-4222-a222-000000000003', 'compras-desde-plan', 'operational',
    'Preparar la compra desde el plan',
    'Usá la lista derivada del plan vigente y marcá en este dispositivo lo que ya resolviste.',
    'Organización', 'ORGANIZÁ TU SEMANA', 2, 'check',
    array['compras','organización','plan'],
    '[{"title":"Una ayuda basada en tu plan","body":"La lista reúne conservadoramente los títulos publicados para la semana y los organiza para facilitar el repaso antes de comprar."},{"title":"Sin cantidades inventadas","body":"Si el plan no incluye ingredientes, cantidades o unidades, la lista tampoco los agrega. Ante una duda sobre qué comprar, consultá a tu nutricionista."},{"title":"Checklist de este dispositivo","body":"Las marcas de completado son una comodidad local, separada de tu información clínica. Podés reiniciarlas cuando empiece una nueva compra."}]'::jsonb,
    array['leer-plan-semanal','registrar-comida'],
    'Abrir lista de compras', 'compras',     'Plan V',
    '2026-09-16T12:00:00Z', true,
    'internal_operational', 'Texto original de Plan V. Sin imagen de terceros ni URL remota.', null
  ),
  (
    '22222222-2222-4222-a222-000000000004', 'contacto-nutricionista', 'operational',
    'Coordinar con tu nutricionista',
    'Encontrá tu próxima consulta y mantené la conversación en el mismo hilo privado de Plan V.',
    'Acompañamiento', 'SEGUÍ EN CONTACTO', 2, 'message',
    array['mensajes','agenda','consulta'],
    '[{"title":"Una conversación continua","body":"Mensajes conserva el intercambio con tu nutricionista dentro de tu ficha. Es el lugar indicado para consultar una indicación o compartir contexto."},{"title":"Tu próxima consulta","body":"Agenda muestra la próxima ocurrencia disponible, junto con modalidad y duración cuando esos datos fueron definidos por la profesional."},{"title":"Sin estados supuestos","body":"Plan V no muestra confirmaciones de lectura o entrega que todavía no estén persistidas. El hilo presenta únicamente los mensajes disponibles."}]'::jsonb,
    array['leer-plan-semanal','registrar-comida'],
    'Abrir mensajes', 'mensajes',     'Plan V',
    '2026-09-16T12:00:00Z', true,
    'internal_operational', 'Texto original de Plan V. Sin imagen de terceros ni URL remota.', null
  ),
  (
    '22222222-2222-4222-a222-000000000005', 'progreso-semanal', 'operational',
    'Entender tu progreso semanal',
    'Revisá los registros disponibles de los últimos siete días sin confundirlos con una evaluación clínica.',
    'Seguimiento', 'TUS ÚLTIMOS DÍAS', 3, 'trend',
    array['progreso','hábitos','semana'],
    '[{"title":"Una ventana de siete días","body":"Progreso organiza los datos que ya existen en tu ficha para mostrar una vista breve de comidas revisadas y hábitos registrados."},{"title":"Datos disponibles, no estimaciones","body":"Cuando falta un registro, Plan V no lo completa ni lo reemplaza con valores aproximados. La vista se limita a la información disponible."},{"title":"Contexto para conversar","body":"Usá esta pantalla como apoyo para reconocer patrones y preparar preguntas. La interpretación profesional corresponde a tu nutricionista."}]'::jsonb,
    array['registrar-comida','actividad-autodeclarada'],
    'Ver mi progreso', 'progreso',     'Plan V',
    '2026-09-16T12:00:00Z', true,
    'internal_operational', 'Texto original de Plan V. Sin imagen de terceros ni URL remota.', null
  ),
  (
    '22222222-2222-4222-a222-000000000006', 'actividad-autodeclarada', 'operational',
    'Registrar actividad autodeclarada',
    'Anotá tipo, duración e intensidad percibida sin convertir el registro en una rutina indicada.',
    'Movimiento', 'TU ACTIVIDAD', 2, 'heart',
    array['actividad','duración','intensidad'],
    '[{"title":"Contá lo que hiciste","body":"Podés registrar el nombre de la actividad, los minutos, la intensidad que percibiste y una nota opcional."},{"title":"Un registro personal","body":"La pantalla conserva lo que declaraste y lo comparte con tu nutricionista. No agrega distancia, pasos, frecuencia cardíaca ni otros resultados que no ingresaste."},{"title":"Separado de una rutina","body":"Anotar una actividad no crea una recomendación ni reemplaza la indicación de una persona habilitada para trabajar sobre ejercicio."}]'::jsonb,
    array['progreso-semanal','contacto-nutricionista'],
    'Registrar actividad', 'ejercicio',     'Plan V',
    '2026-09-16T12:00:00Z', true,
    'internal_operational', 'Texto original de Plan V. Sin imagen de terceros ni URL remota.', null
  ),
  (
    '33333333-3333-4333-a333-000000000001', 'hidratacion-cotidiana', 'clinical',
    'Registrar agua sin convertirla en una pauta',
    'Cómo usar el registro de hidratación de Plan V para conversar con tu nutricionista, sin cantidades prescritas por la app.',
    'Hábitos', 'ARTÍCULO REVISADO', 4, 'sparkle',
    array['agua','hábitos','registro'],
    '[{"title":"Lo que sí registra Plan V","body":"El vaso de hidratación cuenta lo que vos marcás. No estima sed, no completa vasos faltantes y no convierte el recuento en una indicación clínica."},{"title":"Autoría y revisión","body":"Este artículo fue escrito por el equipo editorial de Plan V y marcado como revisado antes de publicarse. No se publica solo desde un borrador de IA."},{"title":"Qué consultar","body":"Si tu profesional indicó una cantidad o un horario, esa indicación vive en el plan o en Mensajes. Este texto no la reemplaza ni la infiere."}]'::jsonb,
    array['progreso-semanal'],
    'Ver mi progreso', 'progreso',     'Equipo editorial Plan V',
    '2026-09-16T15:00:00Z', true,
    'placeholder', 'Artículo revisado de Plan V. Portada ilustrativa local; no hay imagen licenciada remota.', null
  ),
  (
    '33333333-3333-4333-a333-000000000002', 'comidas-fuera-de-casa', 'clinical',
    'Comer fuera con el plan publicado',
    'Cómo apoyarte en el plan vigente cuando comés fuera, sin que Plan V arme un menú alternativo por su cuenta.',
    'Organización', 'ARTÍCULO REVISADO', 4, 'leaf',
    array['plan','fuera de casa','organización'],
    '[{"title":"Partí del plan publicado","body":"Si hay un título o un momento publicado para ese día, usalo como referencia. Plan V no inventa un plato equivalente ni calcula porciones de un restaurante."},{"title":"Registro honesto","body":"Si comiste algo distinto, el Diario admite foto o texto. Eso no cambia el plan vigente ni genera una receta nueva."},{"title":"Límite editorial","body":"Este artículo no diagnostica intolerancias ni prescribe un reemplazo. La decisión clínica queda en tu nutricionista."}]'::jsonb,
    array['leer-plan-semanal','compras-desde-plan'],
    'Abrir mi plan', 'plan',     'Equipo editorial Plan V',
    '2026-09-16T15:00:00Z', true,
    'placeholder', 'Artículo revisado de Plan V. Portada ilustrativa local; no hay imagen licenciada remota.', null
  )
on conflict (id) do nothing;

alter table public.resources enable row level security;
alter table public.resource_assignments enable row level security;
alter table public.favorites enable row level security;

revoke all on public.resources, public.resource_assignments, public.favorites
  from public, anon, authenticated;
grant select on public.resources, public.resource_assignments, public.favorites to authenticated;
grant insert, delete on public.favorites to authenticated;

drop policy if exists resources_visible_select on public.resources;
create policy resources_visible_select on public.resources
  for select to authenticated
  using (
    (kind = 'operational' and published)
    or (
      kind = 'clinical' and published and exists (
        select 1 from public.resource_assignments a
        where a.resource_id = public.resources.id
          and a.patient_id is not distinct from public.my_patient_id()
      )
    )
    or public.my_nutritionist_id() is not null
  );

drop policy if exists resource_assignments_select on public.resource_assignments;
create policy resource_assignments_select on public.resource_assignments
  for select to authenticated
  using (
    public.is_assigned_patient(patient_id)
    or patient_id is not distinct from public.my_patient_id()
  );

drop policy if exists favorites_patient_select on public.favorites;
create policy favorites_patient_select on public.favorites
  for select to authenticated
  using (
    patient_id is not distinct from public.my_patient_id()
    or public.is_assigned_patient(patient_id)
  );

drop policy if exists favorites_patient_insert on public.favorites;
create policy favorites_patient_insert on public.favorites
  for insert to authenticated
  with check (patient_id is not distinct from public.my_patient_id());

drop policy if exists favorites_patient_delete on public.favorites;
create policy favorites_patient_delete on public.favorites
  for delete to authenticated
  using (patient_id is not distinct from public.my_patient_id());

create or replace function public.resource_row_json(r public.resources)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', r.id,
    'slug', r.slug,
    'kind', r.kind,
    'title', r.title,
    'category', r.category,
    'eyebrow', r.eyebrow,
    'summary', r.summary,
    'minutes', r.minutes,
    'icon', r.icon,
    'tags', to_jsonb(r.tags),
    'sections', r.sections,
    'related', to_jsonb(r.related_slugs),
    'action_label', r.action_label,
    'action_page', r.action_page,
    'author_name', r.author_name,
    'reviewed_at', r.reviewed_at,
    'published', r.published,
    'license_kind', r.license_kind,
    'license_note', r.license_note,
    'cover_url', r.cover_url
  );
$$;

create or replace function public.patient_can_see_resource(r public.resources, target_patient uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select r.published and (
    r.kind = 'operational'
    or exists (
      select 1 from public.resource_assignments a
      where a.resource_id = r.id and a.patient_id = target_patient
    )
  );
$$;

create or replace function public.get_patient_library(target_patient uuid, query text default '')
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  snapshot jsonb;
  term text := lower(btrim(coalesce(query, '')));
  professional boolean := public.is_assigned_patient(target_patient);
begin
  perform public.intake_assert_access(target_patient);
  select jsonb_build_object(
    'patient_id', target_patient,
    'resources', coalesce((
      select jsonb_agg(public.resource_row_json(r) order by r.title)
      from public.resources r
      where r.kind = 'operational'
        and (
          (professional and (r.published or r.nutritionist_id is not distinct from public.my_nutritionist_id() or r.nutritionist_id is null))
          or (not professional and r.published)
        )
    ), '[]'::jsonb),
    'articles', coalesce((
      select jsonb_agg(public.resource_row_json(r) order by r.title)
      from public.resources r
      where r.kind = 'clinical'
        and (
          (professional and (r.nutritionist_id is not distinct from public.my_nutritionist_id() or r.nutritionist_id is null))
          or public.patient_can_see_resource(r, target_patient)
        )
    ), '[]'::jsonb),
    'recipes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', rec.id,
        'title', rec.title,
        'assigned_at', a.assigned_at
      ) order by a.assigned_at desc)
      from public.recipe_assignments a
      join public.recipes rec on rec.id = a.recipe_id
      where a.patient_id = target_patient
    ), '[]'::jsonb),
    'plan_b', case when professional then (
      select case when btrim(p.plan_b) = '' then null
        else jsonb_build_object('patient_id', p.id, 'title', p.plan_b) end
      from public.patients p where p.id = target_patient
    ) else null end,
    'assignments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id,
        'patient_id', a.patient_id,
        'resource_id', r.slug,
        'slug', r.slug,
        'assigned_at', a.assigned_at,
        'read_at', a.first_read_at
      ) order by a.assigned_at desc)
      from public.resource_assignments a
      join public.resources r on r.id = a.resource_id
      where a.patient_id = target_patient
    ), '[]'::jsonb),
    'favorites', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', f.id,
        'patient_id', f.patient_id,
        'item_kind', f.item_kind,
        'item_id', f.item_id,
        'title', f.title,
        'created_at', f.created_at
      ) order by f.created_at desc)
      from public.favorites f
      where f.patient_id = target_patient
        and (f.patient_id is not distinct from public.my_patient_id() or professional)
    ), '[]'::jsonb)
  ) into snapshot;

  snapshot := snapshot || jsonb_build_object('hits', (
    select coalesce(jsonb_agg(hit), '[]'::jsonb)
    from (
      select jsonb_build_object('kind', 'resource', 'id', r.slug, 'title', r.title, 'summary', r.summary, 'category', r.category) as hit
      from public.resources r
      where r.kind = 'operational' and r.published
        and (term = '' or position(term in lower(r.title || ' ' || r.summary || ' ' || r.category || ' ' || array_to_string(r.tags, ' '))) > 0)
      union all
      select jsonb_build_object('kind', 'article', 'id', r.slug, 'title', r.title, 'summary', r.summary, 'category', r.category)
      from public.resources r
      where r.kind = 'clinical'
        and (
          (professional and r.published)
          or public.patient_can_see_resource(r, target_patient)
        )
        and (term = '' or position(term in lower(r.title || ' ' || r.summary || ' ' || r.category || ' ' || array_to_string(r.tags, ' '))) > 0)
      union all
      select jsonb_build_object('kind', 'recipe', 'id', rec.id::text, 'title', rec.title, 'summary', '', 'category', 'Receta')
      from public.recipe_assignments a
      join public.recipes rec on rec.id = a.recipe_id
      where a.patient_id = target_patient
        and (term = '' or position(term in lower(rec.title)) > 0)
      union all
      select jsonb_build_object('kind', 'plan_b', 'id', p.id::text, 'title', p.plan_b, 'summary', 'Plan B de la ficha', 'category', 'Plan B')
      from public.patients p
      where professional and p.id = target_patient and btrim(p.plan_b) <> ''
        and (term = '' or position(term in lower(p.plan_b)) > 0)
    ) visible
  ));
  return snapshot;
end;
$$;

create or replace function public.assign_editorial_resource(resource_slug text, patient_ids uuid[])
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  nid uuid;
  rid uuid;
  pid uuid;
  assigned_count int := 0;
  existing_count int := 0;
begin
  nid := public.my_nutritionist_id();
  if nid is null then
    raise exception using errcode = '42501', message = 'resource_assign_role';
  end if;
  select id into rid from public.resources r
  where r.slug = btrim(resource_slug) and r.published;
  if rid is null then
    raise exception using errcode = '22023', message = 'resource_unknown';
  end if;
  if patient_ids is null or array_length(patient_ids, 1) is null then
    raise exception using errcode = '22023', message = 'resource_patients';
  end if;
  foreach pid in array patient_ids
  loop
    if not public.is_assigned_patient(pid) then
      raise exception using errcode = '42501', message = 'resource_not_assigned';
    end if;
    insert into public.resource_assignments (resource_id, patient_id, nutritionist_id, assigned_by)
    values (rid, pid, nid, auth.uid())
    on conflict (resource_id, patient_id) do nothing;
    if found then
      assigned_count := assigned_count + 1;
    else
      existing_count := existing_count + 1;
    end if;
  end loop;
  return jsonb_build_object(
    'assigned_count', assigned_count,
    'existing_count', existing_count,
    'resource_id', btrim(resource_slug)
  );
end;
$$;

create or replace function public.mark_editorial_resource_read(target_patient uuid, resource_slug text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if target_patient is distinct from public.my_patient_id() then
    raise exception using errcode = '42501', message = 'resource_read_patient';
  end if;
  update public.resource_assignments a
  set first_read_at = clock_timestamp()
  from public.resources r
  where a.resource_id = r.id
    and a.patient_id = target_patient
    and r.slug = btrim(resource_slug)
    and a.first_read_at is null;
  if not found then
    if not exists (
      select 1 from public.resource_assignments a
      join public.resources r on r.id = a.resource_id
      where a.patient_id = target_patient and r.slug = btrim(resource_slug)
    ) then
      raise exception using errcode = 'P0002', message = 'resource_assignment_missing';
    end if;
  end if;
  return public.get_patient_library(target_patient, '');
end;
$$;

create or replace function public.toggle_favorite(target_patient uuid, input_kind text, input_item text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  nid uuid;
  title text;
  rec public.resources%rowtype;
begin
  if target_patient is distinct from public.my_patient_id() then
    raise exception using errcode = '42501', message = 'favorite_patient_only';
  end if;
  select nutritionist_id into nid from public.patients where id = target_patient;
  if nid is null then
    raise exception using errcode = 'P0002', message = 'patient_missing';
  end if;
  if input_kind not in ('resource', 'article', 'recipe') then
    raise exception using errcode = '22023', message = 'favorite_kind';
  end if;
  if exists (
    select 1 from public.favorites f
    where f.patient_id = target_patient and f.item_kind = input_kind and f.item_id = btrim(input_item)
  ) then
    delete from public.favorites
    where patient_id = target_patient and item_kind = input_kind and item_id = btrim(input_item);
    return public.get_patient_library(target_patient, '');
  end if;

  if input_kind in ('resource', 'article') then
    select * into rec from public.resources r where r.slug = btrim(input_item);
    if not found or not public.patient_can_see_resource(rec, target_patient) then
      raise exception using errcode = '42501', message = 'favorite_hidden';
    end if;
    if (input_kind = 'article' and rec.kind is distinct from 'clinical')
      or (input_kind = 'resource' and rec.kind is distinct from 'operational') then
      raise exception using errcode = '22023', message = 'favorite_kind';
    end if;
    title := rec.title;
  elsif input_kind = 'recipe' then
    select recipes.title into title
    from public.recipe_assignments a
    join public.recipes on recipes.id = a.recipe_id
    where a.patient_id = target_patient and recipes.id = input_item::uuid;
    if title is null then
      raise exception using errcode = '42501', message = 'favorite_hidden';
    end if;
  end if;

  insert into public.favorites (patient_id, nutritionist_id, item_kind, item_id, title)
  values (target_patient, nid, input_kind, btrim(input_item), title);
  return public.get_patient_library(target_patient, '');
end;
$$;

create or replace function public.save_editorial_resource(
  input_slug text,
  input_title text,
  input_summary text,
  input_category text,
  input_sections jsonb,
  input_kind text default 'clinical'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  nid uuid;
  rid uuid;
begin
  nid := public.my_nutritionist_id();
  if nid is null then
    raise exception using errcode = '42501', message = 'resource_assign_role';
  end if;
  if input_kind is distinct from 'clinical' then
    raise exception using errcode = '22023', message = 'resource_kind';
  end if;
  if jsonb_typeof(input_sections) is distinct from 'array' or jsonb_array_length(input_sections) < 1 then
    raise exception using errcode = '22023', message = 'resource_sections';
  end if;
  insert into public.resources (
    slug, kind, nutritionist_id, title, summary, category, eyebrow, minutes, icon,
    tags, sections, author_name, published, license_kind, license_note, cover_url
  ) values (
    btrim(input_slug), 'clinical', nid, btrim(input_title), btrim(input_summary), btrim(input_category),
    'BORRADOR', 3, 'sparkle', '{}', input_sections, 'Equipo editorial Plan V', false,
    'placeholder', 'Borrador sin publicar. Sin imagen remota.', null
  )
  returning id into rid;
  return public.resource_row_json((select r from public.resources r where r.id = rid));
end;
$$;

create or replace function public.publish_editorial_resource(target uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  nid uuid;
  rec public.resources%rowtype;
begin
  nid := public.my_nutritionist_id();
  if nid is null then
    raise exception using errcode = '42501', message = 'resource_assign_role';
  end if;
  select * into rec from public.resources r where r.id = target;
  if not found then
    raise exception using errcode = 'P0002', message = 'resource_missing';
  end if;
  if rec.nutritionist_id is distinct from nid then
    raise exception using errcode = '42501', message = 'resource_not_owner';
  end if;
  if jsonb_typeof(rec.sections) is distinct from 'array' or jsonb_array_length(rec.sections) < 1 then
    raise exception using errcode = '22023', message = 'resource_sections';
  end if;
  if btrim(rec.author_name) = '' then
    raise exception using errcode = '22023', message = 'resource_author';
  end if;
  update public.resources
  set reviewed_by = auth.uid(),
      reviewed_at = clock_timestamp(),
      published = true,
      eyebrow = 'ARTÍCULO REVISADO'
  where id = target
  returning * into rec;
  return public.resource_row_json(rec);
end;
$$;

revoke all on function public.resource_row_json(public.resources) from public, anon;
revoke all on function public.patient_can_see_resource(public.resources, uuid) from public, anon;
revoke all on function public.get_patient_library(uuid, text) from public, anon;
revoke all on function public.assign_editorial_resource(text, uuid[]) from public, anon;
revoke all on function public.mark_editorial_resource_read(uuid, text) from public, anon;
revoke all on function public.toggle_favorite(uuid, text, text) from public, anon;
revoke all on function public.save_editorial_resource(text, text, text, text, jsonb, text) from public, anon;
revoke all on function public.publish_editorial_resource(uuid) from public, anon;

grant execute on function public.resource_row_json(public.resources) to authenticated;
grant execute on function public.patient_can_see_resource(public.resources, uuid) to authenticated;
grant execute on function public.get_patient_library(uuid, text) to authenticated;
grant execute on function public.assign_editorial_resource(text, uuid[]) to authenticated;
grant execute on function public.mark_editorial_resource_read(uuid, text) to authenticated;
grant execute on function public.toggle_favorite(uuid, text, text) to authenticated;
grant execute on function public.save_editorial_resource(text, text, text, text, jsonb, text) to authenticated;
grant execute on function public.publish_editorial_resource(uuid) to authenticated;
