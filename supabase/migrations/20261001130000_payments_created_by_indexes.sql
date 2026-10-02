-- Base de datos (apartado E, 2026-10-01): índices para las dos claves nuevas de cobros
-- (quién cargó cada pago). Sin índice, borrar o buscar por esa persona recorre la tabla
-- entera. La prueba server/db-performance.postgres.test.ts exige un índice por clave.

create index if not exists patient_payments_created_by_fk_idx on public.patient_payments (created_by);
create index if not exists service_payments_created_by_fk_idx on public.service_payments (created_by);
