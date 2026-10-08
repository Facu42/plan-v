# Integración: control clínico al asignar receta por día · 2026-10-08

## Origen y contraste

Hallazgo1 de la auditoría del hilo paciente, commit634b0c6. Confirmado en este checkout: `assignRecipeDay` y `assign_recipe_day` no invocaban el control existente al asignar una receta. Contraste visual previo con Nutriboost, demo Loom35b428b996314f9c8f5505de4a6297cb alrededor6:54: detalle con ingredientes, pasos y análisis. Ese tramo no demuestra un control de alergias al asignar; no se atribuye ese comportamiento al producto de referencia. El requisito surge del relevamiento de integración y de la política existente de PlanV.

## Alcance implementado localmente

Rama `codex/recipe-day-allergies`, basada en `codex/nutri-planificacion`/PR78. Se mantiene separado el cambio de asignación del apartado Planificación; revisión futura será contra esa base. No se modifica la app del paciente ni archivos del otro hilo.

- Demo: carga antecedentes vigentes y aplica el evaluador existente a título, ingredientes y pasos de la versión publicada antes de cualquier escritura.
- PostgreSQL: migración nueva20261008220000 reemplaza el recorrido por día conservando validación de rol/propiedad/paciente/versión/fecha; bloquea lectura de ingreso durante la transacción y aplica `assert_health_publishable` sobre contenido publicado antes de insertar/asignar.
- Rechazo por alergia, restricción o antecedentes desconocidos: no genera asignación por día ni «Mis recetas», y conserva la anterior. Mensajes de este recorrido dicen «asignar», en lugar de «publicar».
- Los catálogos siguen siendo generales; una receta publicada no significa compatible con todos los pacientes. Se revalida al asignar.

## Evidencia

ECC: pruebas primero. Tres casos de API inicialmente devolvían200 en lugar409; prueba PostgreSQL inicialmente asignaba pese a conflicto. Después:29pruebas dirigidas aprobadas, suite2140aprobadas/2omitidas, tipos/build/migraciones/secretos aprobados. SQL descartable prueba alergia, restricción, datos desconocidos, paciente/otra profesional rechazados y asignación anterior conservada.

Navegador local ficticio: se declaró temporalmente «Lentejas» en LucíaF., se intentó asignar «Ensalada de lentejas y vegetales» el9/10. Respuesta409 y lectura de día con0asignaciones. Antecedentes ficticios restaurados. Sin datos reales ni llamadas IA. Captura `evidencia-integracion/receta-alergia-bloqueada.png`.

Ensayo firmado preparado: modifica temporalmente la alergia de una identidad descartable, intenta desde ventana, comprueba ausencia en día y catálogo paciente, restaura enfinally y confirma receta compatible. No ejecutado aún enCI para esta rama. No se acredita como aprobado.

Revisión de código/atomicidad y pruebas sin bloqueantes. La evidencia visual detectó un problema independiente de comodidad: el error global queda detrás de la ventana, por lo que no explica el rechazo dentro del contexto de asignación.

## Pausa por experiencia: decisión pendiente

Siguiendo el pedido explícito de Facundo, se frena el ajuste de la ventana hasta resolver juntos dónde presentar el error. Se mostró captura y se consultó:

1. Recomendado: dentro de ventana, justo encima de Confirmar asignación.
2. Al inicio, junto a paciente y fecha.

La lógica de rechazo está implementada; el incremento completo no se declara terminado ni publicado. Después de respuesta: ubicar mensaje visible, comprobar foco/lectura y mantener ventana/paciente/fecha al rechazar; repetir ensayo firmado con selección segura tras resolver antecedentes.

## Límites

Reutiliza la política existente de coincidencias por palabras y alias; no es una certificación de ausencia de alérgenos ni cubre contaminación cruzada. La revisión profesional sigue vigente. No retira retroactivamente asignaciones previas si después cambian los antecedentes; ese recorrido requiere evaluación independiente. No cambia el motor de IA ni amplía acceso. No se aplicó migración ni cambio alguno en producción.
