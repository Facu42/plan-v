# Ingreso persistente

Migraciones ejecutables para **esquema vacío / instancia descartable**:

- `supabase/migrations/20260917190000_core.sql`: núcleo derivado del contrato 016.
- `supabase/migrations/20260917190100_intake.sql`: intake, consentimientos y notas clínicas.

No aplican a un proyecto con pacientes reales. Los borradores históricos `supabase/contracts/016*_draft.sql` se conservan como referencia y siguen fuera de la cadena de migraciones. Las escrituras de ingreso pasan por RPC con el JWT del actor.
