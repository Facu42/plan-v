-- Optional follow-up AI permission. Existing menu grants do not authorize this purpose.
-- Historical consent events remain unchanged; no patient is opted in by this migration.
insert into public.consent_catalog(purpose,text_version,text_hash,body,required) values
('ai_followup','ai_followup.v1','e7bac0ad92e2d95a010c0be3eb9a3110b673998111f0d08f5e5af381368420f2','Autorizo a Plan V a enviar a un proveedor externo de IA mis indicadores de adherencia, hidratación y cantidad de comidas registradas para preparar sugerencias y borradores de mensajes para mi nutricionista. No se envían mi nombre, notas clínicas ni mensajes. Nada se me envía sin revisión profesional. Este permiso es opcional y puedo retirarlo.',false);
