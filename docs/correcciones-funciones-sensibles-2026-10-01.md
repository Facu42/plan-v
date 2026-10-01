# Correcciones de funciones sensibles — 01/10/2026

Continuación de los puntos 1 y 2 posteriores al PR #40. Facundo autorizó por escrito:
«aplicalo y continua con el punto 2». Las tres correcciones del
[informe inicial](revision-funciones-sensibles-2026-10-01.md) se aplicaron en la base
existente `plan-v-app`, sin contratar recursos, crear ramas hospedadas ni cambiar el plan.

## Lo aplicado en producción

| Migración registrada y archivo local | Resultado |
| --- | --- |
| `20261001163415_service_months_anchor.sql` | Los pagos consecutivos suman meses desde su comienzo común, sin perder días al pasar por meses cortos |
| `20261001163424_harden_nutrition_target_access.sql` | Bloquea datos corporales y metas tras el retiro, valida los datos en la base y recalcula las metas; actualiza los vencimientos ya calculados |

Ambas aplicaciones devolvieron éxito y sus versiones se corroboraron en el historial.
Los archivos locales usan las versiones devueltas por Supabase. El archivo anterior
de meses era `20261001130000_service_months_anchor.sql`; se renombró conservando su
contenido para evitar presentar una migración aplicada como pendiente.

### Retiro y permisos

Las tres funciones para guardar datos corporales, pedir su actualización y guardar
metas verifican la identidad, el vínculo vigente y que la paciente no esté desactivada
ni anonimizada. Bloquean la fila de la paciente mientras guardan: el retiro y el
cambio de dueña no pueden intercalarse con el cambio autorizado sobre esa fila.

Las seis políticas de lectura de `nutrition_targets`, `patient_body_data` y
`patient_body_data_requests` comprueban también ese estado. El ayudante vive en el
esquema `private`, comprueba titularidad y devuelve un booleano; permite usar estas
políticas sin dar a la paciente acceso adicional a la tabla cruda de pacientes.

Se retiraron los permisos de escritura directa de `authenticated` sobre esas tres
tablas, y todo acceso de `anon`. El uso normal conserva lectura acotada por fila y
guardado por las funciones públicas autorizadas. Los pedidos de privacidad siguen
accesibles para la propia paciente después de desactivar su cuenta.

### Validación y cálculo

Las entradas de metas deben tener los mismos campos, tipos y rangos que exige la
API. Un resultado vacío, nulo, incompleto o con calorías enviadas como texto se
rechaza. La base recalcula calorías, macronutrientes, porcentajes y avisos a partir
de las entradas válidas: las cifras y los textos manipulados del resultado no se
guardan. Se conserva la firma de la función que usa la API y la ecuación existente.

El cálculo auxiliar no es ejecutable por `anon` ni `authenticated`; lo llaman las
funciones autorizadas. Los datos corporales requieren fechas válidas, edades entre
15 y 100 años y tipos/rangos correctos para sexo, altura y peso. La edad usa fecha UTC.

### Meses pagados

La corrección se aplica a futuros cálculos y vuelve a calcular los vencimientos
existentes que tenían cobertura o pagos confirmados. No crea ni modifica pagos,
montos o precios. La consulta agregada previa encontró **0 pagos confirmados** en
producción; no se copiaron datos de cuentas ni de pacientes.

## Verificación

- Antes del cambio, cuatro pruebas nuevas fallaron reproduciendo el guardado tras
  desactivar, el guardado tras anonimizar, el resultado vacío y la fecha futura.
- Después, `npm test -- --maxWorkers=4`: **211 archivos, 1071 pruebas aprobadas y
  2 omitidas**; tipos, compilación, comprobación de migraciones y secretos aprobados.
- Después de aplicar, se extrajeron otra vez los cuerpos reales de las funciones
  y se ejecutaron localmente con cuentas ficticias: **7 archivos, 47 pruebas aprobadas**.
  Incluyen lectura/escritura cerrada tras pedir y completar el retiro, anonimización,
  permisos de terceros, borrador/publicación, cálculo equivalente a la API y pagos
  conservados al corregir un vencimiento guardado del 30/01 al 31/01/2027.
- Comparación de 167 cuerpos: las seis funciones nuevas o modificadas coinciden
  con el código probado. Solo difiere un comentario previo en
  `set_organization_subscription_status`.
- Consulta de cálculo puro en producción con entradas ficticias: 1601 kcal,
  117 g de proteínas, 50 g de grasas y 171 g de hidratos, coincidentes con la API;
  comprobación de actividad sin identidad: falso.
- Políticas y permisos reales corroborados después de aplicar: lectura con RLS,
  sin `SELECT` anónimo ni escritura directa de usuarias en las tres tablas.
- Revisión de `code-reviewer` y `reality-checker` sin bloqueos antes de aplicar.

La [evidencia JSON posterior](security/correcciones-funciones-2026-10-01.json)
conserva versiones, permisos, políticas, hashes y resultados. El inventario inicial
se mantiene como registro de lo observado antes de las correcciones.

## Estado del punto 2 y avisos restantes

Se cerraron los problemas confirmados en las operaciones sensibles revisadas.
Las **34 funciones internas** cerradas en septiembre permanecen cerradas. Se
mantienen **165 funciones públicas con permisos elevados**, **116 ejecutables con
sesión** y **ninguna ejecutable por `anon`**. El cálculo nuevo es una función sin
permisos elevados y su ejecución por usuarias está cerrada; el ayudante de lectura
no está en el esquema público.

El asesor sigue mostrando **116 advertencias** por funciones ejecutables con
sesión y **16 avisos informativos** por tablas sin políticas. Las correcciones
internas no eliminan el aviso sobre el tipo de función. Se conservaron los accesos
necesarios en vez de retirar las 116 operaciones en bloque. Referencias:
[funciones ejecutables](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)
y [tablas sin políticas](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

La clasificación de esas 16 tablas corresponde al punto 3. La revisión y corrección
no cubren las 116 funciones en su totalidad, ni reparan metas históricas malformadas.
La carrera entre transacciones se revisó por sus bloqueos, sin una prueba simultánea
independiente. Las pruebas usan identidad simulada; las dos pruebas con sesiones
reales siguen omitidas. El contrato de finalización de exportación/borrado por llamada
directa sigue registrado en el informe inicial para una revisión separada.
