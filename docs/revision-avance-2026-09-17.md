# Plan V: avance verificado el 17 de septiembre de 2026

## Continuación sobre el trabajo de Cursor — corte vigente

Se retomó `532ff27` (migraciones ejecutables, ingreso y revisión profesional), conservando los cambios previos. Este corte agrega correcciones locales de recuperación y guardado; no es un despliegue.

- El autoguardado actualiza la revisión dentro de la cola. Avanzar, volver, saltear y enviar esperan las escrituras previas; una cola reiniciada descarta tareas de la ficha anterior.
- Si se pierde la respuesta de un envío aceptado, se reintenta el mismo envío sin intentar editar el ingreso ya enviado. El paciente ve **Confirmar envío**.
- Si falla la carga inicial, no se habilita la edición ni se guardan valores vacíos. **Recuperar ingreso guardado** vuelve a leer el servidor. Un conflicto requiere recuperar la versión guardada y avisa que reemplaza los cambios de la pantalla.
- La decisión de consentimiento se refleja después de confirmarse; tanto otorgar como retirar pasan por la cola.
- El CRM permite reintentar la carga y actualizar una revisión en conflicto, conserva las notas privadas y muestra la fecha de revisión. El cambio de ficha limpia el contenido anterior.
- Se estilizaron los campos de intención y alimentos, foco visible, estados deshabilitados y transición breve compatible con movimiento reducido.

| Verificación nueva | Resultado |
| --- | --- |
| `npm test` | **494 aprobadas, 2 omitidas; 97 archivos aprobados** |
| `npm run check` | Aprobado, frontend y servidor |
| `npm run build` | Aprobado, **198 módulos** |
| `npm run check:migrations` | Aprobado |
| `npm run dashboard:test` | **8/8 aprobadas** |
| Navegador `/browse`, demo aislada | Respuesta de envío perdida → mismo envío confirmado; carga inicial fallida → recuperación sin escrituras; revisión y nota privada → respuesta paciente sin notas; fallo de carga en CRM → reintento y cambio de ficha |
| Responsive | 390 px paciente/CRM y 1440 px CRM, sin desborde horizontal en los recorridos verificados |

Evidencia visual: `.scratch/intake-recovery-2026-09-17/sent-mobile.png`, `crm-reviewed-desktop.png`, `crm-reviewed-mobile.png`. Scripts de los casos comprobados: `submission.js`, `load-recovery.js`, `crm.js` en esa misma carpeta. Pruebas de latencia y cancelación: `intake-session.test.ts`; contrato HTTP/RPC y privacidad: `server/intake-supabase.integration.test.ts`.

**Límite de esta evidencia:** el navegador usa datos sintéticos en memoria. La suite SQL ejecuta PostgreSQL mediante PGlite con shims de Auth/Storage y verifica persistencia al reabrir la base. Esto no sustituye Supabase Auth, PostgREST, Storage ni una prueba de dos conexiones reales simultáneas. Los dos casos JWT contra Supabase descartable siguen omitidos por falta de configuración; no se aplicó SQL a una instancia externa ni se usaron datos reales.

El dashboard mantiene **6 completadas, 6 en revisión, 2 en curso y 25 pendientes**. PV-12/13/14 quedan en revisión hasta verificar el circuito con Auth real; no se infla el porcentaje de cierre. Próxima salida de este bloque: completar PV-08/09 en instancia descartable y después Storage privado y archivos opcionales (PV-15/16). `scripts/apply-disposable.mjs` aplica las migraciones ejecutables de `supabase/migrations/` y se niega si ya hay pacientes.

## Revisión histórica de la mañana — base 5123acf

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
