-- Velocidad de la base (retoma el PR #27, 2026-10-17): lo que marca el asesor de rendimiento
-- de Supabase. No cambia quién puede ver o hacer qué y no borra nada.
--
-- 1. Siete reglas de acceso llamaban a auth.uid() una vez por fila. Envolverlo en
--    (select auth.uid()) hace que se calcule una sola vez por consulta; el resultado es el
--    mismo. Se reescribe con ALTER POLICY sobre la expresión que tiene hoy cada regla, y solo
--    si la regla existe y todavía no está envuelta (se puede correr dos veces).
-- 2. Toda clave que apunta a otra tabla (public y private) recibe un índice que empieza por
--    esas columnas. Sin índice, buscar o borrar por esas columnas recorre la tabla entera.
--    Al 17/10 eran 114 en producción. Nombre: <tabla>_<columnas>_fk_idx.

do $$
declare
  p record;
  wrapped text := '(select auth.uid())';
begin
  for p in
    select tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (tablename, policyname) in (
        ('profiles', 'profiles_select_own'),
        ('profiles', 'profiles_update_own'),
        ('nutritionists', 'nutritionists_select_own'),
        ('patients', 'patients_self_select'),
        ('messages', 'messages_nutri_insert'),
        ('messages', 'messages_patient_insert'),
        ('meal_reviews', 'meal_reviews_nutri_insert'),
        ('patient_import_authorizations', 'import_authorization_owner'))
  loop
    if p.qual is not null and p.qual ~ 'auth\.uid\(\)' and p.qual !~* 'select auth\.uid\(\)' then
      execute format('alter policy %I on public.%I using (%s)',
        p.policyname, p.tablename, replace(p.qual, 'auth.uid()', wrapped));
    end if;
    if p.with_check is not null and p.with_check ~ 'auth\.uid\(\)' and p.with_check !~* 'select auth\.uid\(\)' then
      execute format('alter policy %I on public.%I with check (%s)',
        p.policyname, p.tablename, replace(p.with_check, 'auth.uid()', wrapped));
    end if;
  end loop;
end $$;

do $$
declare
  fk record;
begin
  for fk in
    select n.nspname, t.relname,
      (select array_agg(a.attname order by k.ord)
         from unnest(c.conkey) with ordinality k(attnum, ord)
         join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum) as cols
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where c.contype = 'f' and n.nspname in ('public', 'private')
      and not exists (
        select 1 from pg_index i
        where i.indrelid = c.conrelid
          and (i.indkey::int2[])[0:array_length(c.conkey, 1) - 1] @> c.conkey
          and (i.indkey::int2[])[0:array_length(c.conkey, 1) - 1] <@ c.conkey)
    order by 1, 2, 3
  loop
    execute format('create index if not exists %I on %I.%I (%s)',
      left(fk.relname || '_' || array_to_string(fk.cols, '_') || '_fk_idx', 63),
      fk.nspname, fk.relname,
      (select string_agg(format('%I', col), ', ') from unnest(fk.cols) as col));
  end loop;
end $$;
