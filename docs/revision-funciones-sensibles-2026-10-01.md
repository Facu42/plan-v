# Revisión de funciones sensibles — 01/10/2026

Punto 1 pedido por Facundo después del PR [#40](https://github.com/Facu42/plan-v/pull/40).
Revisión de la base existente `plan-v-app`, comparada con `main` en
`44f95c1abeb01e08085c092f77b414101088c717`. Solo se consultaron definiciones,
permisos, políticas e historial de migraciones. No se consultaron filas de pacientes,
no se escribieron datos en producción y no se contrataron recursos ni servicios.

## Resultado

Hay **tres problemas confirmados**, detallados abajo. No se encontró acceso entre
pacientes ajenas en los escenarios probados. Eso no equivale a una auditoría completa
de las 116 funciones públicas ni reemplaza una prueba con sesiones reales.

| Comprobación en la base | Resultado |
| --- | --- |
| Funciones públicas `SECURITY DEFINER` | 165, todas propiedad de `postgres` |
| Ejecutables sin sesión (`anon`) | 0 |
| Ejecutables con sesión (`authenticated`) | 116: coinciden exactamente con `ALLOWED` actual |
| Funciones internas cerradas en septiembre | Las 34 siguen cerradas a ambos roles |
| Diferencia frente a las 95 permitidas del 29/9 | 21 incorporaciones previstas y registradas en el test; ninguna de las 95 se quitó |
| Esquema de búsqueda | Las 165 tienen `search_path` vacío |
| Definiciones distintas al reconstruir las migraciones | 2: una diferencia funcional y un comentario |
| Alcance de revisión de cuerpos y controles | 36 funciones ejecutables sensibles y 8 auxiliares internas |

Las 116 advertencias del asesor identifican funciones con permisos elevados que una
persona autenticada puede ejecutar; no demuestran por sí solas 116 vulnerabilidades.
Su autorización debe comprobarse dentro de cada función. Ver la
[explicación del aviso de Supabase](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).
Los 16 avisos de tablas sin políticas quedan para el punto 3; aquí solo se examinaron
las tablas que sostienen las operaciones sensibles.

## Correcciones a resolver, en este orden

### 1. Cerrar datos corporales y metas tras desactivar la cuenta — P2

`save_my_body_data`, `request_body_data` y `save_nutrition_target` comprueban la
identidad o la relación con la paciente, pero no `deactivated_at` ni `anonymized_at`.
Los ayudantes `my_patient_id` e `is_assigned_patient` conservan esa relación después
de `complete_privacy_delete`. Las políticas reales de lectura de
`patient_body_data`, `patient_body_data_requests` y `nutrition_targets` tampoco
excluyen esos estados.

**Reproducción:** en una base local con las definiciones extraídas de producción y
dos cuentas ficticias, la paciente pidió el borrado y completó el pedido. Después
pudo guardar sus datos corporales; su nutricionista pudo pedir otra actualización,
publicar una meta y leer una fila de datos corporales y una de metas.

**Impacto:** el cierre solicitado no bloquea este tratamiento nuevo de datos de
salud. No se demostró una fuga hacia otra paciente ni hacia otra nutricionista.
La anonimización no se reprodujo: comparte la ausencia de comprobación, pero se
debe probar por separado antes de afirmar su comportamiento completo.

**Corrección propuesta:** validar el estado activo dentro de las tres funciones y
sus políticas de lectura, siguiendo el criterio de `intake_assert_access`. Añadir
pruebas de rechazo tras desactivación y anonimización, además del uso normal.
Conservar por separado el acceso a pedidos de privacidad y datos que deban retenerse.

### 2. Rechazar metas vacías al llamar directamente a la base — P2

`save_nutrition_target` acepta `{}` o `{"kcal": null}` como resultado. La condición
`kcal NOT BETWEEN 500 AND 8000` devuelve SQL `NULL` y el `IF` no rechaza el pedido.
La tabla no agrega una restricción que lo impida.

**Reproducción:** ambas variantes se guardaron con `published_at` completo mediante
la nutricionista ficticia autorizada, usando la definición real de producción en
la base local. La validación de la API no alcanza a una llamada directa a la función.

**Corrección propuesta:** exigir calorías presentes, numéricas y dentro del rango,
validar la estructura y coherencia de los macronutrientes, y comprobar los datos
corporales directamente en la base. Revisar también la fecha de nacimiento futura:
el cuerpo actual y su tabla solo exigen una fecha no nula; este caso adicional no se
ejecutó en la reproducción de esta revisión.

### 3. Aplicar la corrección pendiente del vencimiento por meses — P2

`service_recompute` usa todavía la versión anterior en producción. La migración
`20261001130000_service_months_anchor.sql` está en el repositorio y no figura con
nombre `service_months_anchor` en el historial consultado. Además, la definición
real confirma que su cambio funcional no está aplicado.

**Reproducción:** desde el 31/10/2026, pagar 1 mes y luego 2 meses termina el
**30/01/2027** con la función publicada, en lugar del **31/01/2027** con las
migraciones actuales. La función permanece interna: no es una apertura de permisos.

**Corrección propuesta:** aplicar la migración existente y comprobar definición y
vencimientos resultantes. No se aplicó durante esta auditoría ni se recalcularon
suscripciones reales.

La otra diferencia, en `set_organization_subscription_status`, es un comentario;
sus controles y comportamiento coinciden. La dueña solo puede cancelar su
consultorio; conceder estados de pago o gratuidad exige ser administradora.

## Controles que se corroboraron

| Grupo | Funciones sensibles con sesión | Control observado |
| --- | ---: | --- |
| Administración y suscripción de consultorio | 11 | Las nueve operaciones del panel exigen `service_assert_admin`; `is_platform_admin` usa una lista privada; la suscripción exige administración o cancelación por la responsable |
| Cobranzas de pacientes | 9 | Dueña asignada para modificar cuotas/pagos; paciente propia para informar pagos; lectura acotada a esas identidades |
| Privacidad y consentimiento | 7 | La paciente propia controla pedidos, paquete, finalización, registro de acceso y consentimiento; versión y hash del consentimiento deben coincidir |
| Invitaciones y cambios de acceso | 6 | Invitación de paciente con mail confirmado y coincidente; invitación del consultorio ligada a su destinataria; delegación y transferencia exigen dueña y pertenencia activa |
| Datos corporales y metas | 3 | Identidad y vínculo comprobados; persisten los huecos de estado y validación indicados arriba |

Los permisos y políticas reales de las tablas sensibles también se consultaron:
la lista de administradoras, las suscripciones internas y las tablas internas de
privacidad no permiten escrituras directas de `authenticated`. No se obtiene el
rol administrador al cambiar los metadatos editables de la cuenta.

Las nuevas pruebas comprueban rechazo de operaciones administrativas para pacientes,
nutricionistas y sesiones sin identidad; rechazo de una anulación de pago no
autorizada; metadatos de rol falsos; finalización, descarga y registro de pedidos
de privacidad ajenos; y aceptación de invitación, delegación, revocación y
transferencia por terceros. Comprobaron también que los estados ajenos no cambian.

## Las 21 incorporaciones frente al registro anterior

`admin_extend_trial`, `admin_get_service_board`, `admin_log_service_event`,
`admin_mark_test_account`, `admin_record_service_payment`, `admin_set_service_note`,
`admin_set_service_override`, `admin_set_service_settings`, `admin_void_service_payment`,
`get_billing_board`, `get_patient_ledger`, `is_platform_admin`,
`record_patient_payment`, `report_patient_payment`, `request_body_data`,
`review_patient_payment`, `save_my_body_data`, `save_nutrition_target`,
`set_patient_charge_waived`, `set_patient_fee`, `set_payment_settings`.

## Evidencia, pruebas y límites

El [inventario JSON](security/inventario-funciones-2026-10-01.json) registra firmas,
permisos efectivos, hashes de las definiciones reales y locales, tablas/políticas,
historial de migraciones, comparación histórica y resultados de la reproducción.
No contiene filas de pacientes ni credenciales. Los hashes normalizan saltos de
línea y extremos; conservan los comentarios, por eso las dos diferencias se
clasificaron también mediante lectura de los cuerpos.

- **Migraciones actuales:** seis archivos de pruebas de base, 36 pruebas aprobadas.
- **Verificación general del cambio:** `npm test -- --maxWorkers=4`, 210 archivos,
  1060 pruebas aprobadas y 2 omitidas; `npm run check` aprobado. Las omitidas
  requieren credenciales específicas para una prueba con sesiones reales.
- **Definiciones reales reproducidas localmente:** las mismas seis suites,
  33 aprobadas y 3 fallidas. Dos fallos reproducen el vencimiento incorrecto y
  el tercero deriva de la primera interrupción, que evita registrar la anulación
  esperada. No se interpreta como una falla adicional de autorización.
- **Prueba separada con cuentas ficticias y cuerpos reales:** confirmó las dos
  metas inválidas publicadas, las tres escrituras posteriores al borrado y las
  lecturas mencionadas, además del vencimiento 30/01 frente al esperado 31/01.
- **Permisos predeterminados de funciones en producción:** `postgres` crea
  funciones cerradas a `anon` y `authenticated`. `supabase_admin` conserva permisos
  predeterminados abiertos: el cierre no puede extrapolarse a funciones futuras
  creadas por cualquier propietario. Todas las 165 revisadas son de `postgres`.
- **Sin prueba de JWT real:** las pruebas de base usan identidades simuladas con
  roles de PostgreSQL y datos ficticios; no comprueban todo el servicio Auth o
  el recorrido real por PostgREST.
- **Exportación y borrado:** la función de exportación acepta el paquete que aporta
  la paciente y comprueba titularidad, pero no certifica su origen en el servidor.
  La función de borrado marca desactivación y finalización; la limpieza de archivos
  y el trabajo posterior corresponden al recorrido por la API. Revisar estos
  contratos antes de afirmar que una llamada directa equivale al proceso completo.

Estas observaciones justifican corregir casos concretos y conservar los accesos
necesarios. No se recomienda retirar las 116 funciones en bloque para ocultar el aviso.
