-- Completa 20261017010000_performance_indexes (2026-10-17). Aquella daba por cubierta una clave
-- foránea con cualquier índice que empezara por sus columnas, aunque fuera parcial (con WHERE),
-- inválido o sin terminar de construirse. Ninguno de esos sirve para buscar o borrar por la
-- clave. Al 17/10 quedaban 4 en producción (meal_logs, patient_charges, ops_deliveries y
-- scheduling_checkout_intents). Crea un índice completo para cada una; no borra nada y se puede
-- correr dos veces. Nombre: <tabla>_<columnas>_fk_full_idx.

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
          and i.indisvalid and i.indisready and i.indpred is null
          and (i.indkey::int2[])[0:array_length(c.conkey, 1) - 1] @> c.conkey
          and (i.indkey::int2[])[0:array_length(c.conkey, 1) - 1] <@ c.conkey)
    order by 1, 2, 3
  loop
    execute format('create index if not exists %I on %I.%I (%s)',
      left(fk.relname || '_' || array_to_string(fk.cols, '_') || '_fk_full_idx', 63),
      fk.nspname, fk.relname,
      (select string_agg(format('%I', col), ', ') from unnest(fk.cols) as col));
  end loop;
end $$;
