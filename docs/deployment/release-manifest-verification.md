# Integridad del paquete de migraciones

**Actualización 15/10, main `9c56854`:** el paquete mantiene 17 SQL nuevas pendientes y ahora controla **3 SQL exactas de base ya aplicada (20 locales)**. Se incorporó `activity_kcal`, publicada en PR122 y observada en Supabase bajo el alias `20261015173356`; no se vuelve a aplicar. `mainBase` y `observedOn` se actualizaron a esa referencia/fecha. Las versiones locales y alias de vistas/síntomas no cambiaron. La CLI primero rechazó el nuevo archivo desconocido (RED); catorce casos y el nuevo inventario aprobaron tras registrar su identidad/hash verificados. Los números anteriores que siguen documentan el checkpoint previo.

El manifiesto `nutridesk-migrations-2026-10-13.json` usa `hashScheme: sha256-utf8-lf-v1` y `firstVersion: 20261011140000`. Cada `sha256` corresponde al contenido UTF-8 validado de su SQL, sustituyendo CRLF y CR por LF. No se normalizan espacios, BOM, otros caracteres ni el salto final. Windows y Linux pueden usar saltos distintos sin cambiar la identidad aprobada; un cambio de contenido sí invalida el paquete.

`npm run check:release-manifest` enumera todos los archivos SQL desde esa versión y exige que cada uno pertenezca exactamente al paquete pendiente (`migrations`) o a la base aplicada identificada (`baselineMigrations`). Valida nombre/versión, orden, unicidad entre ambos conjuntos y hash normalizado; ninguna SQL desconocida se excluye por rango. Rechaza rutas alternativas y archivos simbólicos. Sólo lee el manifiesto y SQL locales: no carga `.env`, no obtiene credenciales, no se conecta a Supabase y no ejecuta SQL. La comprobación también está en CI, antes de cualquier habilitación autorizada.

Antes de revisar/aplicar el paquete, comprobar el manifiesto del commit o artefacto seleccionado. Si cambia un SQL o se añade una migración, la comprobación falla y exige regenerar el manifiesto y volver a revisar ese paquete. Un resultado verde verifica integridad, no autoriza aplicación ni publicación. El paquete pendiente contiene 17 migraciones y conserva su orden numérico/dependencias; no se sigue el orden comercial de las entregas/PR. Los tres archivos de `baselineMigrations` ya fueron observados aplicados mediante alias: no pertenecen al paquete pendiente y no deben volver a ejecutarse.

## Regression Guard (pasos 1–10)

1. **Flujos críticos:** verificación Windows/Linux, inventario completo y contenido aprobado cubiertos. Aplicación de SQL externa no forma parte de este verificador.
2. **Regresión:** los hashes de ocho archivos CRLF sólo coincidían en Windows. RED real: el verificador con esquema explícito rechazó `20261011150000_consultation_sessions.sql`; hashes regenerados con LF canónico y GREEN para el paquete real.
3. **Contratos:** esquema de hash, versión inicial fija, nombres sin rutas, versiones/orden y digest; no cambia el SQL ni sus permisos.
4. **Acoplamiento:** script independiente de API, trabajador y entorno de servicios. El paso CI depende de archivos locales únicamente.
5. **Migraciones:** ninguna nueva migración ni reescritura de SQL; sólo cambia el cálculo documentado de su evidencia. Retroceder este checker no altera datos ni tablas; conservar el manifiesto canónico para revisar el artefacto.
6. **Verificación:** catorce pruebas focales pasan y CLI verifica 17 pendientes más 3 archivos exactos de base aplicada (20 locales). Pruebas de contenido cambiado, faltante, extra, versión/ruta/duplicación/orden y CRLF/CR/LF; también impiden reclasificar la base aplicada al omitir o cambiar `mainBase`. `npm run check`, secretos y diferencias pasan. La nueva suite global corresponde al cierre del integrador.
7. **Área frágil:** Git normaliza CRLF en checkout/commit; esquema explícito y el checker evitan aprobar hashes ligados a un sistema operativo.
8. **Fire test:** en directorios temporales privados, modificar contenido/quitar/agregar SQL causa rechazo. Los directorios se comprueban antes de eliminarlos. No se toca producción ni el SQL del repositorio para probar el fallo.
9. **Automatización:** comando reproducible y gate CI, sin pasos dependientes de memoria del operador ni claves del servicio.
10. **Veredicto:** SHIP para revisión de esta corrección local; HOLD de producción heredado del cierre general por configuración, pruebas externas y autorización. No afirmar que validar el manifiesto valida entrega de correos, IA o pagos reales.

## Base MAIN comprobada el 15/10/2026

La referencia `mainBase` es `9c568541a4c72633bfdb65090a231c3724a3588d` y `observedOn` es `2026-10-15`. PR110, PR112 y PR122 ya forman parte de esa base. La auditoría de metadatos de Supabase, de sólo lectura y realizada por el integrador, observó estos alias; el checker local no consulta ni revalida el estado remoto:

| Archivo local | Versión observada aplicada | Nombre observado aplicado |
|---|---|---|
| 20261015090000_patient_views_read_only.sql | 20261014215529 | patient_views_read_only |
| 20261015100000_habit_symptoms.sql | 20261014215543 | habit_symptoms |
| 20261015210000_activity_kcal.sql | 20261015173356 | activity_kcal |

Cada entrada `baselineMigrations` declara `file`, `version`, `sha256`, `observedAppliedVersion` y `observedAppliedName`. Se aceptan exclusivamente estas tres identidades y alias, con esa referencia y fecha; se comprueba el hash LF del archivo y se rechazan duplicados/solapamientos con pendientes. La migración local usa su nombre versionado original; no se crea ni ejecuta otro archivo con la versión del alias remoto. `productionApplied:false` sigue refiriéndose al paquete pendiente de 17, no a la base ya observada.

Checkpoint histórico 14/10 — ECC RED real: tras incorporar MAIN, la CLI anterior rechazó ambas SQL como `extra`; las pruebas consumidoras del checker dieron 7 PASS/6 FAIL. GREEN: 13 PASS/0 FAIL/0 omitidas; CLI 17 pendientes +2 base aplicada, con el esquema UTF-8/LF intacto. Casos de base alterada, faltante, SQL desconocida o alias como archivo, duplicación, solapamiento e identidad/evidencia incorrectas están cubiertos en directorios temporales. Evidencia TEMP: planv-manifest-baseline-red-20261014.json y planv-manifest-baseline-green-20261014.json. La suite global y revisión independiente del merge corresponden al integrador; estos conteos no las reemplazan.

Revisión independiente del 15/10/2026 detectó y reprodujo un P2: mover ambas SQL aplicadas a `migrations`, dejar vacía la base y omitir `mainBase` permitía aprobar incorrectamente 19 pendientes. La presencia de sus nombres exactos en el inventario local ahora exige la base aplicada con referencia y evidencia correctas, independientemente de los metadatos opcionales del manifiesto. La nueva prueba consumidora cubre `mainBase` ausente, cambiado y original: RED 13 PASS/1 FAIL; GREEN 14 PASS/0 FAIL/0 omitidas. El reproductor sobre una copia TEMP completa pasó de aceptar 19 pendientes a rechazarlas, mientras el candidato real conserva 17+2. Evidencia TEMP: `planv-manifest-reclassification-red-20261015.json`, `planv-manifest-reclassification-green-20261015.json` y `planv-manifest-reclassification-review-20261015.mjs`. No cambió el manifiesto, SQL, índice Git ni producción.

Revisión independiente del tercer archivo: 14 casos aprobados y cuatro variantes incorrectas rechazadas en una copia TEMP completa (reclasificar las tres SQL como pendientes/omitir evidencia, alias incorrecto de actividad, fecha anterior y hash alterado). Informe: `%TEMP%/planv-manifest3-independent-review-20261015.md`. Sin P1/P2 abiertos ni operaciones remotas.
