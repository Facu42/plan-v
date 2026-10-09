# Coordinación del dashboard y app del paciente · 2026-10-08

## Fuentes y estado

Leída la definición de producto y auditoría de conexión del hilo paciente, disponibles en `origin/claude/inspiring-lovelace-nfsot9`, commit `634b0c6`. Corresponden al documento referido por Facundo como `/home/user/plan-v/docs/producto-definicion-2026-10-08.md`. No está en este checkout Windows ni en main; se consultó desde Git sin integrar la rama ni modificar archivos del otro hilo.

Los hallazgos del relevamiento se incorporan como backlog compartido, no como prueba nueva de producción. Se corroboró en este checkout que `server/recipes/day.ts` asigna por día sin control propio de alergias/restricciones. Falta verificar y corregir todos los caminos persistentes con pruebas antes de cerrar el hallazgo.

El núcleo de catálogos, recetas, planes y modelos ya fue publicado. Planificación (meta→borrador, IMC, referencias, comparación) está en PR #78, no publicada. Los controles generales del último incremento pasaron; signed-auth sigue en ejecución al crear este registro. La sincronización de la meta resuelve parte del hallazgo7, pero no acredita por sí sola el caso de una propuesta de IA generada con contexto viejo.

## Decisión de secuencia

Empezar integración ahora, por recorridos completos de profesional a paciente y vuelta. No esperar a terminar todos los apartados del dashboard. La app existente ya comparte API y datos; el trabajo es cerrar inconsistencias y definir el mismo comportamiento entre ambas vistas.

Se mantiene desktop para el desarrollo del dashboard y se verifica la app de paciente ya existente. No equivale a iniciar una app nativa ni al dashboard mobile. Academy excluida. Mantener Nutrigo y frenar los problemas de comodidad según instrucciones de Facundo.

## Orden y criterios de cierre

| Orden | Recorrido y responsabilidad | Cierre comprobable |
| --- | --- | --- |
| 1 | Receta asignada por día: CRM + servidor. Consentimientos/lecturas: coordinación con paciente | Alergia/restricción comprobada antes de asignar; retiro de permisos corta lectura protegida; prueba con otra cuenta y datos ficticios |
| 2 | Plan y meta: CRM + paciente | Confirmar meta actualiza borrador; revisión y publicación entregan la misma versión, cantidades, recomendaciones y alimentos a evitar; compras coherentes; borradores privados; caso IA con meta cambiada revisado |
| 3 | Diario, medidas y seguimiento: paciente + servidor + CRM | Registro en fecha argentina visible en ambas caras; pasos y actividad reales; adherencia calculada con definición explícita; cero distinguido de ausencia |
| 4 | Agenda y comunicación: ambos | Consulta visible durante su duración; edición conserva confirmación cuando corresponda; mensajes/no leídos coinciden en más de un paciente; avisos y actualización sin recargar |
| 5 | Objetivos, recursos y cuota: ambos | Texto/estado/avance persistidos según decisión de producto; recursos con autor y publicación correctos; pago visible en ambas caras; cambiar vencimiento no duplica cuota |

Cada incremento debe incluir lectura nueva desde ambos roles y recarga, aislamiento, permisos vigentes y error honesto. Datos ficticios, sin proveedores pagos nuevos. Un responsable por cambio de contrato/tabla; avisar a Facundo antes de intervenir archivos del otro hilo. No enviar mensajes al otro hilo sin autorización explícita.

## Lo que aún falta en el dashboard completo

- Planificación: referencias de composición corporal y otras fórmulas acreditadas; objetivos sin exigir peso numérico (decisión vigente de Facundo).
- Ficha/mediciones: historial y gráficos completos, importaciones con revisión de unidades/fechas/duplicados, campos de ingreso no visibles y reapertura solicitada por profesional.
- Seguimiento/Inicio: adherencia real, indicadores y señales coherentes con registros, pasos y actividad; bandeja global correcta.
- Productividad: equivalencias/alternativas, expansión de fuentes alimentarias autorizadas, recomendaciones y entregables restantes.
- Comunicación: asistente sobre cartera con revisión profesional, avisos, actualización y paginación.
- Agenda/página pública/cobros: disponibilidad y reservas, paquetes y pagos por proveedor, completar recorridos actuales. Ayuda y demás expansión de v3 después del circuito principal.

Son grupos de backlog; cada punto se revalida contra código actual y Nutriboost antes de implementar. La auditoría detecta errores en funciones ya existentes, que tienen prioridad sobre ampliar la paridad.

## Decisiones de producto pendientes

D1–D7 del relevamiento del hilo paciente se conservan pendientes; sus recomendaciones no se convierten en decisiones de Facundo automáticamente. En particular: visibilidad de objetivo/avance, deuda y acceso, canales de avisos, corrección de registros revisados, diario sin IA, cuentas archivadas y transición temporal de planes. No confundir objetivo de seguimiento con objetivo energético del plan.

## Publicación

Integración de permisos de medidas preparada y verificada localmente: [alcance y evidencia](integracion-permiso-medidas-2026-10-08.md). Recetas por día: PR #79, todos los controles de CI aprobados, incluido navegador con usuarios autenticados. Sin producción.

La preparación y las pruebas de integración pueden empezar ya. La publicación de Planificación y cualquier migración productiva conservan la autorización específica requerida. No mezclar ni fusionar automáticamente la rama del hilo paciente: primero revisar compatibilidad con main y #78 y repartir cambios compartidos.
