# Integridad del paquete de migraciones

El manifiesto `nutridesk-migrations-2026-10-13.json` usa `hashScheme: sha256-utf8-lf-v1` y `firstVersion: 20261011140000`. Cada `sha256` corresponde al contenido UTF-8 validado de su SQL, sustituyendo CRLF y CR por LF. No se normalizan espacios, BOM, otros caracteres ni el salto final. Windows y Linux pueden usar saltos distintos sin cambiar la identidad aprobada; un cambio de contenido sí invalida el paquete.

`npm run check:release-manifest` enumera archivos SQL nuevos desde esa versión, exige inventario exacto, nombre/versión coincidentes, versiones únicas y crecientes y hashes normalizados iguales. Rechaza rutas alternativas y archivos simbólicos. Sólo lee el manifiesto y SQL locales: no carga `.env`, no obtiene credenciales, no se conecta a Supabase y no ejecuta SQL. La comprobación también está en CI, antes de cualquier habilitación autorizada.

Antes de revisar/aplicar el paquete, comprobar el manifiesto del commit o artefacto seleccionado. Si cambia un SQL o se añade una migración, la comprobación falla y exige regenerar el manifiesto y volver a revisar ese paquete. Un resultado verde verifica integridad, no autoriza aplicación ni publicación. Las 17 migraciones se aplican en su orden numérico, conservando dependencias; no en el orden comercial de las entregas/PR.

## Regression Guard (pasos 1–10)

1. **Flujos críticos:** verificación Windows/Linux, inventario completo y contenido aprobado cubiertos. Aplicación de SQL externa no forma parte de este verificador.
2. **Regresión:** los hashes de ocho archivos CRLF sólo coincidían en Windows. RED real: el verificador con esquema explícito rechazó `20261011150000_consultation_sessions.sql`; hashes regenerados con LF canónico y GREEN para el paquete real.
3. **Contratos:** esquema de hash, versión inicial fija, nombres sin rutas, versiones/orden y digest; no cambia el SQL ni sus permisos.
4. **Acoplamiento:** script independiente de API, trabajador y entorno de servicios. El paso CI depende de archivos locales únicamente.
5. **Migraciones:** ninguna nueva migración ni reescritura de SQL; sólo cambia el cálculo documentado de su evidencia. Retroceder este checker no altera datos ni tablas; conservar el manifiesto canónico para revisar el artefacto.
6. **Verificación:** siete pruebas focales pasan y CLI verifica las 17 migraciones. Pruebas de contenido cambiado, faltante, extra, versión/ruta/duplicación/orden y CRLF/CR/LF. `npm run check`, secretos y diferencias pasan. La nueva suite global corresponde al cierre del integrador.
7. **Área frágil:** Git normaliza CRLF en checkout/commit; esquema explícito y el checker evitan aprobar hashes ligados a un sistema operativo.
8. **Fire test:** en directorios temporales privados, modificar contenido/quitar/agregar SQL causa rechazo. Los directorios se comprueban antes de eliminarlos. No se toca producción ni el SQL del repositorio para probar el fallo.
9. **Automatización:** comando reproducible y gate CI, sin pasos dependientes de memoria del operador ni claves del servicio.
10. **Veredicto:** SHIP para revisión de esta corrección local; HOLD de producción heredado del cierre general por configuración, pruebas externas y autorización. No afirmar que validar el manifiesto valida entrega de correos, IA o pagos reales.
