-- Aditiva en datos (sin cambiar tablas). Nueva versión del permiso «Borradores de menú con IA»: ahora dice que viajan la ficha, el peso, las medidas y los laboratorios revisados.
-- El catálogo tiene una fila por permiso, así que se actualiza esa fila. Las aceptaciones anteriores quedan guardadas con su texto v1; las pacientes tienen que volver a aceptar para que la IA use su ficha.
-- Rollback operativo: volver a poner la fila v1 (texto en 20260917190100_intake.sql) y revertir el PR.
update public.consent_catalog
   set text_version='ai_menu_draft.v2',
       text_hash='56a8bfbc376ffa831bcaf932a38107b7c6e4314006ac7ec48c60ad81819ebcbb',
       body='Mi nutricionista puede usar IA para proponer menús o recetas. Para eso, Plan V envía a un proveedor externo de IA datos de mi ficha: alergias, restricciones, objetivo, notas de condiciones, hábitos, peso y medidas, y valores de laboratorio ya revisados. No se envían mi nombre ni mis datos de contacto. Puede contener datos de salud. Nada se publica ni se me envía sin su revisión. Este permiso es opcional y puedo retirarlo.'
 where purpose='ai_menu_draft';
