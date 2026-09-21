# Plan V: revisión de avance y próxima entrega

Fecha: 19 de septiembre de 2026. Revisión del repositorio local y del árbol de trabajo sobre `ffe0d80`, rama `cursor/professional-app-ai-ca47`.

## Evaluación

Hay un avance funcional importante respecto del plan del 16/09: las fundaciones están registradas como completas, ingreso/archivos tienen implementación, y ya existen primeras versiones de recetas, planes, diario, mensajes, agenda y propuestas de IA. El desarrollo llegó a H3/H4, pero H1 —identidad y datos con cuentas reales sintéticas— todavía no cumple su condición de salida. Por eso varias entregas posteriores permanecen en revisión o en curso.

La prioridad recomendada es cerrar el circuito persistente en staging y corregir los problemas encontrados en el plan publicado. La PWA sigue dentro del piloto; no reemplaza esta validación pendiente.

## Verificación ejecutada hoy

| Comprobación | Resultado |
| --- | --- |
| `npm test -- --reporter=dot` | 110 archivos aprobados; 551 pruebas aprobadas y 2 omitidas |
| `npm run check` | TypeScript cliente y servidor aprobado |
| `npm run build` | Aprobado, 310 módulos; avisos no bloqueantes de anotaciones de Zod |
| `npm run check:migrations` | Aprobado |
| `npm run dashboard:test` | 8/8 aprobadas |
| Prueba sintética de selección de plan | Publicar la semana del 21/09 devuelve esa semana incluso cuando la semana actual es la del 14/09 |

Las dos pruebas omitidas son de aislamiento A/B contra Supabase con JWT. La suite PostgreSQL local usa PGlite con sustitutos de Auth/Storage y ejecuta las once migraciones actuales; esa evidencia no equivale a un recorrido real de Supabase Auth, PostgREST y Storage. El runner live disponible contiene sólo dos casos de RLS-02: configurar credenciales no ejecutará automáticamente toda la matriz RLS-01…23.

Esta revisión no hizo QA de navegador ni consultó el estado remoto de Supabase, CI o despliegues. La aplicación de migraciones remotas que figura en el backlog es evidencia histórica del 18/09, no una comprobación nueva. En la carpeta de la app sólo está `.env.example`, sin `.env` local; tampoco se verificó una configuración externa del proceso.

## Estado frente al plan

El archivo de seguimiento registra **6 completas, 10 en revisión y 11 en curso**. Los otros **12 tickets** de los 39 siguen pendientes por defecto. Estos números describen entregas del plan, no un porcentaje de producto listo.

| Bloque | Avance observado | Condición pendiente |
| --- | --- | --- |
| H0 / PV-01…07 | Modos explícitos, privacidad de respuestas, CI, contrato ampliado y Nutrigo dentro del build | PV-07: recorrido autenticado, navegación y enlaces directos |
| H1 / PV-08…11 | Migraciones, cliente JWT, provisión, invitaciones, recuperación y consultas aisladas por sesión | Auth/RLS live, paridad de persistencia y lectura tras reinicio |
| H2 / PV-12…17 | Ingreso de nueve pantallas, consentimiento versionado, revisión privada, estudios y medidas con unidad/origen | Recorrido entre dispositivos y cuentas; completar subida firmada desde el cliente, tratamiento de WebP y limpieza durable de archivos |
| H3 / PV-18…21 | Catálogo de recetas, versiones de planes, publicación separada del borrador y lectura paciente | Semana correcta y errores de carga; recetas completas; compras por cantidades/unidades con checks sincronizados |
| H4 / PV-22…28 | Captura de comida antes de IA, reintentos sin duplicación, recibos de mensajes, turnos con conflictos, IA privada y 30 escenarios sintéticos | Auth real, actualización entre dispositivos, adjuntos, notificaciones remotas, worker durable y revisión de Verónica del set de IA |
| H5 / PV-29…33 | Pendiente de cierre operativo | PWA, staging desplegado, recuperación/exportación, operación y E2E del piloto |
| H6 / PV-34…39 | Hay superficies demo y seguimiento reutilizable | Paridad completa, recursos/rutinas y expansión posteriores al piloto |

## Hallazgos que deben entrar en el próximo corte

1. **PV-19/20: selección de semana incorrecta.** `server/plans/repository.ts:56` elige la última publicación sin filtrar `period_start`. `ShowroomPatientPlan.tsx:48` coloca sus comidas sobre `buildCalendarWeek(now)`. Reproducción en memoria: publicar 14/09, publicar 21/09, cargar el tablero con fecha de referencia 19/09 → devuelve 21/09. Publicar anticipadamente puede sustituir el contenido que la pantalla presenta como semana actual. Debe seleccionarse una semana explícita y alinear datos/calendario, conservando un vacío real cuando no hay publicación para ese período.

2. **PV-20: fallo de carga oculto por el contenido anterior.** `usePublishedPlan.ts` devuelve `loaded` y `error`, pero Plan, Menú y Compras sólo consumen `published`. Si no hay publicación cargada, `weekPlanForPatient` vuelve a `patient.weekPlan`; la pantalla puede seguir diciendo “Plan publicado” sin mostrar el fallo. Hallazgo de lectura de código, sin reproducción de navegador en esta revisión. Separar carga, error con reintento, ausencia de publicación y compatibilidad con planes anteriores.

3. **PV-08/09 es una condición pendiente transversal.** No hay evidencia nueva de invitación → sesión → ingreso → ficha contra Supabase real. Ampliar y ejecutar la matriz RLS con dos profesionales y dos pacientes ficticios, incluyendo los módulos nuevos; verificar las migraciones efectivamente aplicadas antes de intervenir el esquema.

4. **Persistencia todavía parcial.** `server/index.ts` conserva respuestas 501 explícitas para archivo operativo, rutas de actividad, recursos y avisos. El módulo care tiene registros propios; eso no completa todas las rutas heredadas. `sbSetBrief` sigue con delete/insert/update sin una transacción. Delimitar y resolver las operaciones necesarias para el piloto.

5. **Entrega reproducible y documentación.** Antes de esta revisión había 69 archivos versionados modificados y 56 sin seguimiento, incluyendo código, migraciones y evidencia. El último commit es el de archivos privados; buena parte del avance posterior sólo está en el árbol local. La cabecera de auditoría del dashboard todavía informa 518 pruebas/198 módulos, aunque sus tickets incluyen IA posterior. Consolidar por cortes y actualizar la evidencia al cerrarlos. No se modificaron estados ni se hicieron commits en esta revisión.

## Orden propuesto

1. **Próximo corte: “Circuito real de prueba, de la invitación al plan”.** Corregir los dos puntos del plan publicado; preparar staging de Plan V y verificar su esquema; crear dos profesionales/dos pacientes sintéticos; ampliar RLS y probar invitación, consentimiento, ingreso, revisión, publicación y lectura desde otra sesión. Completar la subida firmada y comprobar acceso/retiro de un estudio. Confirmar que los datos sobreviven al reinicio y que una cuenta nunca lee los de otra. Consolidar código/migraciones y registrar la evidencia.
2. **Completar acompañamiento e IA sobre esa misma base.** Comida guardada aunque falle el proveedor, mensajes/lecturas entre sesiones, agenda sin solapamientos, propuesta IA → revisión → publicación. Revisión del set de IA con Verónica y resolución de las brechas de persistencia que afecten ese circuito.
3. **Preparar el piloto instalable y operable — PV-29/30/31/33.** PWA y validación Android/iPhone, worker durable, observabilidad y límites, restauración DB+Storage, exportación/retiro y E2E final. Notificaciones/cobros según el alcance acordado.
4. **Retomar las extensiones.** Compras completas, adjuntos, recursos, rutinas y paridad final de Nutrigo, siguiendo las prioridades del plan.

La salida del primer corte debe ser una demostración repetible con cuentas de prueba y persistencia entre sesiones. Eso permite cerrar entregas con evidencia en lugar de acumular más funciones pendientes de validación.
