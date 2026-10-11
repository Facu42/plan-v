# Prueba de navegador publicado (2026-10-01)

**Par ficticio autenticado aprobado tras corregir una regresión del PR #43.** La paciente recuperó su ficha y las notas profesionales siguen cerradas. Migración `20261001222659_explicit_patient_view_boundary.sql` aplicada en `plan-v-app`, sin contratar recursos.

## Problema encontrado y corrección

El PR #43 comprobó definiciones y permisos de lectura de las vistas, pero omitió sus opciones publicadas. Ambas tenían `security_invoker=true`; las migraciones originales usaban permisos del propietario. Al quitar `patients_self_select`, producción dejó de devolver la ficha de una paciente vinculada. A las 22:15 UTC: `/api/me/patient` devolvió 200 con `patient:null`, detalle propio 403 y pantalla de cuenta sin vínculo. JWT y vínculo correspondían a la misma cuenta ficticia. El cierre de la tabla cruda sí funcionaba.

La nueva migración define ambas vistas con `security_invoker=false`, `security_barrier=true`, propietario `postgres` y filtros de identidad. La ficha exige `user_id=auth.uid()`; la vista de acceso exige paciente propia o profesional asignada y fila no retirada ni anonimizada. No expone `next_focus`, `adherence_why`, `plan_b` ni `sensitive_hours`. La tabla cruda conserva únicamente `patients_nutri_all`.

La revisión detectó que `CREATE OR REPLACE` conserva permisos heredados: se revocaron los de PUBLIC, anon y authenticated, incluidos permisos por columna, y se concedió solo SELECT autenticado **antes de aplicar**. El catálogo posterior confirmó SELECT autenticado, INSERT/UPDATE/DELETE denegados, SELECT anónimo denegado y cero concesiones por columna. La migración no cambia filas.

## Recorrido observado

Web: https://plan-v-eight.vercel.app. API: https://api-production-aad6.up.railway.app.
Se utilizó `/browse` de gstack y las dos cuentas existentes marcadas como prueba, fuera del modo demo. La nueva contraseña permitió entrar; la anterior había sido rechazada. No se cambiaron claves ni se mandaron recuperaciones. Se guardan estados y comprobaciones, sin claves, JWT ni datos de salud reales.

| Control | Resultado |
| --- | --- |
| Nutricionista: ficha y directorio | 200, únicamente su paciente ficticia |
| Nutricionista: nota privada ficticia | Visible, también tras recargar |
| Nutricionista: administración protegida | 403 |
| Paciente: ficha y detalle propios tras corregir | 200, identidad propia, nota privada ausente |
| Paciente: vista permitida | 200, una fila propia |
| Paciente: tabla cruda con columna privada | 200, cero filas |
| Ambas cuentas: PATCH de cobro por ambas vistas | 403 / `42501` |
| Paciente: directorio y administración protegida | 403 |
| Paciente: cambio de nota profesional por API | 403; profesional confirmó nota intacta |
| Paciente: identificador inexistente | 403; no prueba acceso a otra paciente |
| Recarga y cambio paciente → profesional → paciente | Ficha propia y permisos de cada rol conservados |
| Cierre final de sesión | Login visible, sesión ausente, tres rutas protegidas 401 |

La paciente completó los nueve pasos de ingreso con nombre ficticio, consentimiento de atención y opciones “No lo sé”. Se saltearon hábitos, sin cargar medidas, fotos ni estudios. Inicio, Plan semanal, Progreso y Mensajes abrieron correctamente. Plan y conversación vacíos corresponden a esta cuenta sin comidas ni mensajes; Progreso cargó registros vacíos y controles opcionales deshabilitados sin permiso. No se enviaron mensajes ni se pidieron alternativas con IA.

Observaciones posteriores: 22:28–22:36 UTC; recarga paciente 22:33:40, recarga profesional 22:35:29, regreso a paciente 22:36:27. Cierre sin sesión 22:37:08: API lista 200 con SHA `0f1745f7bf8c81ebde02dfab5d8ff0d2ac44f439` (PR #43, con corrección de base aplicada). El código se publica al juntar este cambio con `main`.

## Preparación y limpieza

El par ficticio estaba parcialmente preparado. Se envió su invitación por la API de Plan V (registro interno, sin correo externo), la paciente aceptó, se aceptaron textos legales y la profesional dejó su cobranza en `waived`. Se completó el ingreso ficticio. Esos estados quedan para usar las cuentas; no se cambiaron usuarias reales, precios ni planes contratados.

Se escribió una nota privada ficticia para comprobar visibilidad profesional y ocultamiento a paciente. Se eliminó por la API profesional a las 22:35:36: respuesta 200, lectura posterior sin nota y `next_focus=''` confirmado en la fila ficticia. Coincide con el valor predeterminado del campo. La preparación interrumpida perdió el valor anterior: **no se afirma restauración exacta**. Se cerró la sesión y se retiraron claves auxiliares de QA del almacenamiento del navegador.

## Pruebas y avisos

Cuatro pruebas SQL reproducen la pérdida de ficha, recuperan lectura propia, excluyen otra fila y columnas privadas, y rechazan INSERT, UPDATE de cobros/vínculos y DELETE de paciente y profesional por ambas vistas con `42501`, sin alterar filas. Se siembran permisos heredados de tabla, columna y PUBLIC. La reaplicación conserva el cierre.

Suite general: **213 archivos, 1113 aprobadas, 2 omitidas**; tipos y migraciones aprobados. La matriz de cuatro cuentas con Auth/PostgREST locales, ahora con opciones publicadas de vistas, obtuvo **16 aprobadas sin omisiones** en commit `bdd2d8536e594f561aa85406b99eb7413c946a40`: [sesiones 36935338163](https://github.com/Facu42/plan-v/actions/runs/36935338163). Entorno temporal y datos eliminados. [CI 36935338146](https://github.com/Facu42/plan-v/actions/runs/36935338146) aprobado.

Supabase informa 16 avisos de tablas internas, 116 advertencias de funciones inventariadas y **dos errores `security_definer_view`** para estas vistas. No se afirma “cero avisos”. Son una excepción documentada al modelo general invoker: la paciente necesita una proyección limitada mientras los campos profesionales de la tabla cruda quedan cerrados. La autorización depende de filtros explícitos de identidad, columnas enumeradas, barrera y permisos exclusivos de lectura, comprobados con catálogo y sesiones reales. Cambios futuros deben revisar esta excepción. Referencias: [vistas y RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [aviso de vistas con permisos del propietario](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view).

## Límites

Producción: **un par ficticio**. Dos profesionales y dos pacientes se probaron en la matriz temporal, sin afirmar ese recorrido en dos consultorios publicados. No se certifican todos los módulos, las 116 funciones ni el contrato pendiente de borrado/exportación. La autorización escrita de este hilo cubre las correcciones y su despliegue. Se usaron servicios existentes, sin proyectos ni ramas hospedadas nuevos.
