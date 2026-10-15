# Ingreso persistente

Migraciones ejecutables para **esquema vacío / instancia descartable**:

- `supabase/migrations/20260917190000_core.sql`: núcleo derivado del contrato 016.
- `supabase/migrations/20260917190100_intake.sql`: intake, consentimientos y notas clínicas.
- `supabase/migrations/20260918010000_care.sql`: seguimiento, fotos y reemplazos revisados.

No aplican a un proyecto con pacientes reales. Los borradores históricos `supabase/contracts/016*_draft.sql` se conservan como referencia y siguen fuera de la cadena de migraciones. Las escrituras de ingreso pasan por RPC con el JWT del actor.

El paciente recupera el borrador antes de editar. El guardado y los cambios de pantalla se serializan; el envío se puede confirmar otra vez si se pierde su respuesta. Un conflicto de revisión detiene los guardados hasta recuperar el servidor. No se almacenan declaraciones sensibles en localStorage.

La ficha profesional permite leer la declaración, registrar observaciones privadas y marcar el ingreso revisado. La respuesta paciente omite las notas y la identidad del revisor. Ambas pantallas tienen reintento de carga.

Ver [evidencia y límites de la verificación](revision-avance-2026-09-17.md). `npm run apply:disposable` aplica las mismas migraciones a `DISPOSABLE_DATABASE_URL` y aborta si `public.patients` ya tiene filas. No apunta al draft 016.

El 2026-09-18 esas migraciones se aplicaron al proyecto Supabase **Plan V** (`acevlqrkvdinelgxnaki`) porque el esquema estaba vacío (0 pacientes). Auth/PostgREST/Storage reales contra esa instancia todavía no están verificados desde la app: falta el `.env` de staging. La matriz RLS live sigue abierta en [pending-work](pending-work.md).
