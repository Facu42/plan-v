# Sesiones firmadas y cierre de lectura cruda (2026-10-01)

Punto 4 de la revisión posterior al PR #40. Se comprobó el aislamiento con
sesiones emitidas por Supabase Auth y aceptadas por PostgREST, en un entorno
temporal con cuatro cuentas ficticias. **Se encontró una exposición adicional
de notas profesionales a la propia paciente por acceso directo a la tabla.**
La corrección está preparada y probada; **todavía no está aplicada en producción**.

## Qué se encontró

El catálogo publicado de `plan-v-app` tiene la política `patients_self_select`,
para `authenticated`, con condición `user_id = auth.uid()`. No aparece en la
cadena de migraciones del repositorio. Ese rol tiene SELECT sobre toda la tabla
`patients`, incluidos `adherence_why`, `sensitive_hours`, `plan_b` y
`next_focus`, que el contrato de la app reserva a la profesional.

Una paciente puede llamar directamente a PostgREST para leer esos campos de su
propia fila. La interfaz de Plan V los oculta, pero eso no protege la API de datos.
No se observó acceso a filas de otra paciente en esta matriz.

Solo se consultaron permisos y políticas del catálogo publicado: **ninguna fila
de pacientes reales ni credenciales de usuarias**. El contenido devuelto en la
prueba es un texto ficticio escrito en la base temporal.

## Prueba anterior y corrección

- Antes: ejecución [36915168369](https://github.com/Facu42/plan-v/actions/runs/36915168369),
  commit `72c6923`: **14 casos aprobados y 1 fallido**. El caso fallido recibió
  la nota profesional ficticia con la sesión real de la paciente.
- Corrección: `20261001193156_close_legacy_patient_row_access.sql` elimina
  exclusivamente esa política antigua. No modifica filas, cuentas, vínculos,
  precios o cobros; tampoco elimina permisos de la profesional asignada.
- Después: ejecución [36915652255](https://github.com/Facu42/plan-v/actions/runs/36915652255),
  commit `06adf4d`: **15 casos aprobados, sin omisiones**; el entorno y sus
  datos fueron eliminados al finalizar.
- La paciente conserva `patients_patient_view` y `patient_access_view`.
  La API ya usa esas vistas para la identidad, autorización y lectura de su
  ficha. No se encontró acceso a la tabla cruda desde el frontend.
- Dos pruebas SQL locales reproducen la lectura anterior y verifican el cierre,
  la conservación de las dos vistas, la lectura profesional y la segunda
  aplicación sin cambios en datos.
- La revisión agregó un caso de compatibilidad para `/api/me/patient` y
  `/api/patients/:id`: ficha propia sin nota privada, ficha profesional con la
  nota y denegación a otra paciente. Ejecución final
  [36916424527](https://github.com/Facu42/plan-v/actions/runs/36916424527), commit
  `0a5aea0`: **16 casos aprobados, sin omisiones**, con eliminación confirmada
  del entorno temporal y los datos ficticios.

La [evidencia de catálogo y ejecuciones](security/sesiones-aislamiento-2026-10-01.json)
distingue el estado publicado de la corrección local.

## Qué cubre la matriz

Dos nutricionistas y sus dos pacientes. Cada cuenta se crea con la API local de
Auth y entra con contraseña; se valida su identidad con Auth y una operación
positiva de PostgREST. Las llamadas directas a la API de datos de las cuatro
usuarias usan su JWT y la clave pública. La preparación usa la clave privilegiada
y SQL locales para crear/verificar cuentas y cargar los datos ficticios. La API
de Plan V conserva sus consultas privilegiadas internas habituales, sujetas a sus
controles de acceso. Ninguno de esos clientes apunta al proyecto publicado.

Se comprueban lecturas y escritura de terceros, ficha propia, notas
profesionales, metas y datos corporales, borrador/publicación, función interna
de mensajes, 16 tablas internas, intento de elevar el rol, administración,
ausencia de sesión, firma alterada y cierre de metas/datos corporales tras el
retiro con un token emitido antes. La otra paciente sigue funcionando.
Los casos positivos y los errores específicos evitan contar una API rota como
una denegación correcta.

`npm run test:auth-isolation` inicia un proyecto **local y temporal** con CLI
Supabase 2.107.0, aplica las migraciones y reproduce la política legacy del
catálogo antes de aplicar la corrección. No ejecuta `link`, `db push` ni
crea proyectos o ramas hospedadas. Solo acepta direcciones de bucle local.
Elimina claves de proveedores y alertas externas del entorno de prueba, no
imprime tokens ni claves y elimina únicamente su proyecto temporal.

Docker Desktop no pudo iniciar en esta PC por un error del motor. Por eso la
prueba se ejecutó en el runner Linux de GitHub, con Supabase dentro de sus
contenedores locales. No se contrató ningún recurso de Supabase.
La prueba usa una configuración separada de Vitest para impedir el modo demo.
El workflow también cubre cambios de servidor, clientes, dependencias,
configuración y PR, con cancelación de ejecuciones reemplazadas.

## Validación y límites

Suite general: **213 archivos, 1111 pruebas aprobadas y 2 omitidas**.
Tipos y comprobación de migraciones aprobados. Las dos pruebas antiguas que
requieren sesiones externas siguen omitidas en la suite general; esta matriz
dedicada obtuvo sus propias sesiones reales en el entorno temporal.

La API de Plan V se prueba por `app.request` de Hono, con sus manejadores y
middleware reales, que consultan Auth/PostgREST locales. **No es una prueba de
navegador ni de la aplicación publicada con cuentas de producción**. Se reproducen
las migraciones y la política legacy confirmada; no se afirma que sea una copia
íntegra del esquema hospedado. Tampoco certifica las 116 funciones públicas, el
contrato pendiente de finalización de exportación/borrado ni todos los módulos
de la app.

Para cerrar la exposición publicada falta aplicar la migración y comprobar el
catálogo posterior. La autorización escrita ya consta en este hilo: «hacelo,
aplica la migracion y configura el despliegue» y las instrucciones posteriores
de continuar las correcciones de seguridad, manteniendo el límite de no contratar
recursos de Supabase. No se solicita otra autorización para ese mismo trabajo.
Referencia de la plataforma: [flujo de desarrollo local de Supabase](https://supabase.com/docs/guides/local-development/cli-workflows).

