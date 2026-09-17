# Plan V: avance verificado el 17 de septiembre de 2026

Revisión del código en `5123acf` y de los tres commits de implementación posteriores al checkpoint `37f3a22`. Se ejecutaron verificaciones locales. No se aplicaron migraciones ni se accedió a datos de pacientes, proveedores o despliegues.

## Resultado

**El desarrollo avanzó, pero el dashboard estaba desactualizado:** su archivo de seguimiento seguía vacío. Se actualizó con 6 entregas cerradas, 3 en revisión, 2 en curso, 2 bloqueadas y 26 pendientes. El **15% corresponde al plan restante (6/39), no a toda la aplicación**. Las seis cerradas son tareas de fundación/diseño con evidencia local; no acreditan que el producto esté listo para pacientes.

| Commit | Trabajo incorporado |
| --- | --- |
| `bf791ed` | Modos explícitos, privacidad, errores de IA/DB, CI, contrato piloto y Nutrigo autenticado |
| `dd779cd` | Cliente ligado al JWT, invitaciones, persistencia parcial y consultas/sesiones |
| `5123acf` | Intake versionado y onboarding conectado a API con guardado/reanudación |

El título del último commit no prueba persistencia durable: el intake se almacena en `Map` dentro del proceso y sus endpoints Supabase responden `501`.

## Verificaciones nuevas

| Verificación | Resultado | Interpretación |
| --- | --- | --- |
| `npm test` | **471 aprobadas, 1 fallida, 2 omitidas**, 474 pruebas; 92 archivos aprobados y 1 fallido | Suite en rojo. La prueba de onboarding espera 6 pantallas; ahora hay 9. |
| `npm run check` | Aprobado | TypeScript cliente y servidor |
| `npm run build` | Aprobado; **194 módulos** | Emite JS/CSS de `NutrigoShowroom`; la brecha del bundle está corregida. |
| `npm run check:migrations` | Aprobado | No hay drafts en migraciones; tampoco hay una migración productiva nueva. |
| `npm run dashboard:test` | **8/8 aprobadas** | Parser, dependencias, evidencia, persistencia, concurrencia, errores y límites HTTP |

Las dos omitidas corresponden a acceso cruzado RLS con JWT contra Supabase descartable. Las pruebas de invitaciones y persistencia usan mocks; no acreditan un ciclo contra una instancia real. El workflow CI existe; no se consultó una ejecución remota de GitHub.

## Estado por entrega revisada

| Entrega | Estado del tablero | Evidencia y condición pendiente |
| --- | --- | --- |
| PV-01 | Completada | Checkpoint, inventario y baseline en `docs/release-baseline.md`. Árbol limpio al iniciar esta revisión. No implica publicación remota. |
| PV-02 | Completada | `server/config/runtime.ts` exige modo explícito; rechaza configuración productiva incompleta y demo en producción. Pruebas de runtime/auth aprobadas. |
| PV-03 | Completada | `toPatientSelfView` construye una respuesta explícita y excluye timeline/notas internas. Pruebas de contratos y privacidad aprobadas. Defensa RLS pendiente en PV-08. |
| PV-04 | Completada | Fallos del proveedor generan error sin sustituir análisis live por mock. Errores DB se propagan. Pruebas específicas aprobadas. Atomicidad pendiente en PV-08/PV-10. |
| PV-05 | Completada | Workflow de CI, runtime y guarda de SQL implementados. La guarda pasa; los borradores están fuera de migraciones. La regresión de PV-13 debe corregirse para recuperar la suite verde. |
| PV-06 | Completada | Contrato ampliado 016b y diccionario/permisos/políticas entregados. Propuesta documental: revisión de retención y aprobación de migraciones pendientes. |
| PV-07 | En revisión | Nutrigo entra al build, usa roles de sesión y rutas `/app` y `/crm`; pruebas de rutas aprobadas. Falta recorrido de navegador con sesiones sintéticas reales, atrás/adelante y enlaces directos en staging. |
| PV-08 | Bloqueada | JWT por solicitud implementado. Faltan migraciones revisadas, políticas completas, instancia descartable y evidencia de matriz RLS. Los dos casos live disponibles fueron omitidos. |
| PV-09 | En revisión | Provisión, invitación de un uso, email verificado y recuperación implementados/probados con mocks. Falta verificar circuito persistente con Auth/RPC reales; depende de PV-08. |
| PV-10 | En curso | Persistencia parcial de ficha, hábitos, menú, turno y objetivos. Siguen operaciones 501; falta read-back tras reinicio real. `sbSetBrief` conserva delete/insert/update no atómicos. |
| PV-11 | En revisión | Directorio paginado, detalle bajo demanda, cache de sesión y cancelación. Pruebas locales aprobadas; falta validar sesiones/volumen reales sobre schema aplicado. |
| PV-12 | En curso | Payload de ingreso, consentimientos con versión/hash y vistas separadas implementados. Datos y consentimientos en memoria; endpoints Supabase siguen 501. |
| PV-13 | Bloqueada | Nueve pantallas con autoguardado, revisión y reanudación vía API. Suite roja por expectativa antigua; falta persistencia durable y prueba de recuperación/concurrencia. |
| PV-14…39 | Pendientes | No se acreditó su criterio de cierre. Superficies demo preexistentes y borradores de contrato no se cuentan como implementación productiva. |

No se asignaron personas: DEV/UX/NUT/QA/OPS/PRIV son roles, no responsables nominales confirmados.

## Los cinco problemas originales

| Problema | Situación actual |
| --- | --- |
| Nutrigo fuera del build | **Corregido en el bundle.** Falta validación autenticada PV-07 y paridad final PV-37. |
| Onboarding incompleto | **Avance parcial.** Más pantallas y API; intake/consentimientos todavía sin Supabase. |
| IA sin menús/recetas y con resultados simulados ante errores | **Error simulado corregido.** Generación de menús/recetas PV-27/28 pendiente. |
| Historial profesional expuesto al paciente | **Respuesta de API corregida y probada localmente.** Falta demostrar RLS real. |
| Operaciones sin persistencia | **Avance parcial.** Adaptadores nuevos; schema aplicado, RLS y paridad completa pendientes. |

## Orden inmediato recomendado

1. Resolver la prueba de onboarding para el flujo de nueve pantallas y ejecutar toda la suite. Verificar el recorrido esperado antes de cambiar la aserción.
2. Cerrar PV-08 en una instancia descartable: revisar/convertir 016/016b, completar políticas y ejecutar matriz de aislamiento. Esta revisión no aplicó SQL.
3. Persistir intake y consentimientos, con lectura tras reinicio y desde otro dispositivo; completar PV-12/13 y verificar invitaciones/sesiones PV-09/11.
4. Completar revisión profesional y Storage privado (PV-14/15/16), antes de recibir estudios o fotos corporales.
5. Seguir con recetas/planes versionados y generación IA supervisada (PV-18/19/27/28).

En PV-13 debe verificarse también la coordinación entre el autoguardado de 800 ms y el guardado al avanzar: ambos llaman a `persist` con la misma referencia de revisión y no hay una cola visible. Es un riesgo de conflicto a reproducir antes del cierre, no un fallo de navegador confirmado aquí.

## Dashboard

Ejecutar `npm run dashboard` y abrir <http://127.0.0.1:4317>. Estado, evidencias e historial: `tasks/implementation-status.json`. La última revisión aparece en Vista general y Documentación.

El tablero relee el plan y el seguimiento cada 15 segundos. **No deduce automáticamente el avance desde los commits**: cada cierre requiere evidencia. Los resultados son una captura de `5123acf`, no CI en vivo.
