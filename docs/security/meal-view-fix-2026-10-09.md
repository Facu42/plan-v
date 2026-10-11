# Cierre de escrituras en vistas de paciente · 2026-10-09

Pedido de Facundo: reproducir fuera de producción; revocar INSERT/UPDATE/DELETE y activar security_invoker en meal_logs_patient_view y vistas equivalentes; pruebas A/B, advisors antes/después y PR sin aplicar producción.

## Relevamiento de producción (sólo catálogo y advisors)
Proyecto wvosvlxpfytokwfbcero, Postgres 17. Se revisaron las seis vistas de public. meal_logs_patient_view: dueño postgres, sin security_invoker y con escritura anon/authenticated. patients_patient_view y patient_access_view: owner-permission explícito, pero sólo SELECT authenticated, filtro de identidad y security_barrier; no pertenecen al patrón vulnerable de escritura y se conservan. Las otras tres vistas ya tienen invoker=true. No se consultaron datos de pacientes reales.

Advisor anterior: docs/security/meal-view-advisors-before-2026-10-09.json. Detecta tres vistas definer. [Guía de Supabase](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view). Las dos vistas readonly de ficha/acceso conservan esa advertencia intencional; este arreglo no promete resolver todos los advisors.

## ECC: reproducción y corrección
Reglas locales de affaan-m/ECC ef648e0: plan, prueba primero, mínimo arreglo, verificación y revisión. Commit RED c612908: en PostgreSQL descartable con esquema auth/storage y ACL por defecto de Supabase se reproduce INSERT A→B y reasignación A→B dentro de transacción revertida. Tres regresiones fallan antes del arreglo. La lectura API tiene otra regresión previa: debe usar RPC protegida, no la vista cerrada.

Migración creada con CLI Supabase 2.120.0: 20261009141501_readonly_patient_meal_views.sql. Revoca escritura de tabla/columna y PUBLIC, activa invoker. Revisa dinámicamente otras vistas public sin invoker y con permisos efectivos de escritura. Preserva SELECT existente en esas vistas. En la vista de comidas SELECT sólo authenticated. Idempotencia y una segunda vista ficticia con UPDATE por columna/PUBLIC verificadas.

La tabla meal_logs intencionalmente no permite SELECT a la paciente para proteger note_for_nutri/client_id. Hacer invoker la vista hereda ese cierre; no se abre RLS crudo para evitar exponer notas. get_patient_meal_logs exige identidad autenticada igual a my_patient_id, acceso pleno, devuelve sólo columnas públicas y máximo 20 registros. La API paciente cambia a esta lectura; lectura profesional conserva sus notas y permisos. Se prueban pacientes distintos, anon, ausencia de identidad, acceso pendiente y privacidad.

## Verificación
Suite local: 306 archivos, 2120 pruebas aprobadas y 2 omitidas. Compilación aprobada. Tipos/secretos/migraciones en cierre. Revisión de seguridad/código/realidad solicitada antes de PR.

Docker local no inicia; no hay rama Supabase existente y el conector de costos no está disponible. No se crea servicio pago. El ensayo de CI usa Supabase temporal completo (Auth/PostgREST), reproduce INSERT cruzado antes de migrar, ejecuta advisors CLI antes/después y guarda ambos JSON como artifact security-view-advisors. Prueba sesiones firmadas: A no lee B, nadie escribe la vista, lectura propia/RPC y API preservadas. Resultado remoto pendiente de acreditar. No se sustituye esa evidencia con advisors de producción tras un cambio que no fue aplicado.

## Producción
No se aplica ninguna migración ni cambio de configuración en wvosvlxpfytokwfbcero. PR sobre main independiente del dashboard. Aplicación productiva sólo tras aprobación escrita de Facundo y revisión del resultado CI.

Cierre local: tipos, migraciones y secretos aprobados; revisión de código/seguridad sin bloqueantes. El ensayo remoto es requisito pendiente de acreditación, no se declara aprobado todavía.

## Ensayo Supabase real: primera ejecución
Run 37943817585: reprodujo INSERT A→B con datos ficticios y transacción revertida. Advisors descargados en meal-view-advisors-local-2026-10-09: seis avisos de vistas definer antes, dos después (patient_access_view y patients_patient_view); desaparece meal_logs_patient_view y se corrigen también las tres vistas de la instantánea local con ACL vulnerables. Permanece el aviso anterior de search_path en storage_object_patient_id, fuera del alcance. Producción tenía otras opciones ya invoker en esas tres vistas, por eso su baseline era tres.

27 pruebas firmadas aprobadas; una falló al intentar abrir API de una paciente retirada en una prueba anterior. Además se añadió regresión de RPC tras deactivated_at: falló antes y pasa al incorporar intake_assert_access. La prueba positiva se ejecuta antes del retiro, y la prueba de retiro verifica explícitamente que la misma sesión ya no llama la RPC. No se reabre la paciente ni se debilita la prueba. Segundo ensayo pendiente.

## Cierre acreditado
Código de90635: ejecución Supabase temporal https://github.com/Facu42/plan-v/actions/runs/37944764953 aprobada. Reproducción INSERT previa y advisors before/after aprobados; sesiones firmadas y recorrido de navegador aprobados, incluido bloqueo RPC tras retiro con la misma sesión. Ambos informes finales en meal-view-advisors-confirmed-2026-10-09; artifact 11623278022. Se mantienen sólo las dos vistas readonly de identidad y el aviso anterior de search_path fuera de alcance. CI general 37944764960 aprobado. Suite local repetida tras el cierre: 2120 aprobadas, 2 omitidas. No se aplicó producción.

PR: https://github.com/Facu42/plan-v/pull/83. Aplicación productiva requiere aprobación específica de Facundo.
