# Equivalencias: visibilidad real y publicación de grupos revisados

## Contrato

- `GET /api/nutrition/exchange-visibility` devuelve `{enabled, revision}` para la nutricionista titular. Sin fila devuelve `false, 0`; no inventa una configuración guardada.
- `PUT /api/nutrition/exchange-visibility` exige exactamente `{enabled: boolean, expected_revision: integer}`. Guarda con CAS; una versión antigua responde 409. No acepta `owner_id` en el cuerpo ni parámetros de consulta.
- `GET /api/patients/:id/nutrition/exchanges` deriva el consultorio del paciente autorizado. Nutricionista titular y paciente propia pueden leer; administrador (aun con perfil nutri), recepción, otra profesional y otra paciente no pueden. Pacientes archivadas, desactivadas o anonimizadas quedan excluidas.
- Apagado devuelve `{enabled:false,groups:[]}`. Encendido devuelve todos los grupos del consultorio guardados por el flujo que exige `reviewed:true`, con su revisión y copias congeladas de alimentos. No modifica planes ni habilita reemplazos automáticos.
- La proyección incluye solo grupo `id/name/revision`, e ítems `quantity/unit/food`. El alimento devuelve `id/name`, cuatro nutrientes y porciones declaradas. No expone el UUID del consultorio, referencias profesionales, titularidad de alimentos ni su metadato interno.

Los grupos se muestran globalmente a las pacientes activas del consultorio cuando se activa el interruptor. El nombre del grupo y del alimento son datos publicables; no deben contener notas privadas. Las equivalencias siguen requiriendo revisión de alergias, tolerancias y contexto por la profesional.

## Persistencia y seguridad

Migración generada por CLI: `20261029195500_nutrition_exchange_visibility.sql`. Tabla separada `private.nutrition_exchange_visibility`, con RLS habilitado y sin permisos directos de paciente o profesional. Tres funciones privadas con permisos de dueño verifican identidad/rol/relación; los wrappers públicos son `SECURITY INVOKER`. Todas usan `search_path=''`; anónimo/PUBLIC no recibe ejecución.

La función de guardado toma un bloqueo por consultorio antes de leer la revisión y escribir. Evita que dos escritores con la misma revisión se pisen. La lectura clínica deriva la titularidad desde `patients`; no confía en un owner enviado por cliente.

Si la migración todavía no está instalada, la API devuelve 501 con explicación; no guarda solo en el navegador ni finge éxito. Demo utiliza su estado en memoria registrado en el mecanismo existente, con el mismo CAS y la misma proyección de campos.

## Verificación local

- 5 pruebas HTTP/memoria: apagado inicial, dos escritores, aislamiento de consultorio, publicación/retirada de grupos reales, campos privados ausentes, tipos inválidos, propietario arbitrario, roles ajenos y error de migración ausente.
- 6 pruebas PGlite sobre **toda la cadena SQL actual**, con inventario de 38 archivos del manifiesto (30 pendientes + ocho baselines). Dos profesionales y dos pacientes, administrador con perfil nutri y recepción sin identidad profesional. CAS real, acceso cruzado denegado, permisos directos denegados y ciclo de vida de paciente.
- La cadena completa incluye SARA 2. Prueba adicional con un alimento institucional en **ml** y otro en **g**: publica 50 ml y 100 g sin inventar densidad ni un peso en gramos para el primero. El guardado rechaza enviar gramos para ese alimento en ml.
- Otras 25 pruebas de rutas nutricionales, permisos globales de funciones y manifiesto pasaron junto a las primeras diez: **35 aprobadas en cinco archivos** antes de ampliar el caso PostgreSQL a seis. La ampliación PostgreSQL terminó **6/6**.
- `npm run check`, `check:migrations`, `check:release-manifest` y `git diff --check` pasaron. No se ejecutó ningún SQL remoto.

## Regression Guard · paso 10

- Flujos críticos: activar, recargar, desactivar, leer como paciente propia y negar acceso cruzado; cubiertos por HTTP y PostgreSQL local. El recorrido de navegador y la integración del frente pertenecen al PR principal.
- Regresiones: estado falso en cliente, CAS omitido y exposición de notas/propietarios quedan cubiertos.
- Contratos: schemas estrictos de entrada, proyección de lectura pública y RPC sin owner libre.
- Áreas frágiles: funciones con permisos de dueño y g/ml. Autorización repetida en SQL, sin confiar solo en la API; lectura de unidades sin densidades inferidas.
- Migración: aditiva, estado inicial apagado. Sin producción. Rollback operativo: desactivar con la última revisión y volver al cliente anterior, conservando tabla y grupos. No borrar grupos ni estados durante una reversión. Aplicación de la migración en producción requiere autorización concreta del usuario.
- Fire test: omitir intencionalmente la comprobación CAS en el repositorio de demo hizo fallar dos pruebas; archivo restaurado y controles posteriores verdes. Un servidor iniciado durante la mutación necesita reiniciarse para descargar el módulo de prueba; no se usó producción.
- Automatización: la nueva cobertura entra en `npm test`; manifiesto incluye huella exacta de la migración nueva.
- Veredicto de este alcance: código backend verificado localmente; publicación y activación quedan sujetas al gate completo del PR y a la autorización específica de la migración de producción.

## Documentación consultada y limitaciones de herramientas

Se descargó el índice oficial [Supabase Changelog](https://supabase.com/changelog.md) y se revisaron los avisos de [TLS de octubre](https://supabase.com/changelog/cbc-tls-ciphers-deprecated) y [PostgreSQL minor de septiembre](https://supabase.com/changelog/postgres-15-19-17-11-breaking-changes). Ninguno modifica el patrón de RLS/RPC usado aquí. Se consultaron [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) y [funciones](https://supabase.com/docs/guides/database/functions).

La revisión automática bloqueó un envío de telemetría de la CLI a PostHog. La CLI ya había creado el archivo local de migración antes del bloqueo; se conservó ese nombre y no se reintentó ni se eludió la restricción. Toda validación posterior se hizo con archivos locales/PGlite; no se afirma haber ejecutado advisors remotos ni aplicado cambios a Supabase.
