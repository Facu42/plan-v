# Ingreso persistente

Migraciones ejecutables para **esquema vacío / instancia descartable**:

- `supabase/migrations/20260917190000_core.sql`: núcleo derivado del contrato 016.
- `supabase/migrations/20260917190100_intake.sql`: intake, consentimientos y notas clínicas.
- `supabase/migrations/20260918010000_care.sql`: seguimiento, fotos y reemplazos revisados.

No aplican a un proyecto con pacientes reales. Los borradores históricos `supabase/contracts/016*_draft.sql` se conservan como referencia y siguen fuera de la cadena de migraciones. Las escrituras de ingreso pasan por RPC con el JWT del actor.

El paciente recupera el borrador antes de editar. El guardado y los cambios de pantalla se serializan; el envío se puede confirmar otra vez si se pierde su respuesta. Un conflicto de revisión detiene los guardados hasta recuperar el servidor. No se almacenan declaraciones sensibles en localStorage.

La ficha profesional permite leer la declaración, registrar observaciones privadas y marcar el ingreso revisado. La respuesta paciente omite las notas y la identidad del revisor. Ambas pantallas tienen reintento de carga.

Ver [evidencia y límites de la verificación](revision-avance-2026-09-17.md). `npm run apply:disposable` aplica las migraciones ejecutables (`core`, `intake`, `care`) a `DISPOSABLE_DATABASE_URL` y aborta si `public.patients` ya tiene filas. No apunta al draft 016. Las migraciones se verificaron en PGlite; Auth/Storage reales siguen pendientes.

El 2026-09-18 el WIP local registró que `core` / `intake` / `care` se habían aplicado al proyecto Supabase **Plan V** (`acevlqrkvdinelgxnaki`) porque el esquema estaba vacío (0 pacientes). Esa nota no viajó con `cursor/professional-app-ai-ca47`. El registro, lo que el WIP afirma que se aplicó después y la prohibición de reaplicarlo están en [integración del WIP local](integracion-wip-local-2026-09-21.md).
