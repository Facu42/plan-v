# Corte 32 · Gestión de Objetivos

**Estado:** completado en modo demo/memoria.

## Implementado

- Módulo Objetivos con métricas de activos, en pausa, completados y avance medio.
- Filtros por estado.
- Tarjetas por paciente con objetivo, estado, porcentaje de avance y fecha de actualización.
- Editor para modificar objetivo, estado, progreso y nota de seguimiento.
- Historial cronológico de cambios por paciente.
- Evento profesional en la línea de tiempo por cada actualización.
- Endpoint `PATCH /api/patients/:id/goal` con validación Zod.
- Acción de autorización profesional `edit_goal` y rechazo para pacientes/no asignados.
- Las notas del historial se excluyen de la vista serializada del paciente.
- Datos demo iniciales en los tres estados para mostrar el módulo completo.

## Verificado

- TDD rojo/verde para flujo API y normalización/filtros del frontend.
- Flujo Browser Harness: abrir Objetivos, editar meta, cambiar a `En pausa`, guardar, filtrar y comprobar respuesta API.
- Revisión visual en tema oscuro de la vista y del modal.
- Pipeline completo: 31 archivos / 174 tests, TypeScript cliente y servidor, build, auditoría, firmas y `git diff --check`.

## No incluido

- Persistencia Supabase: el endpoint autoriza y devuelve `501` mientras el contrato 016 siga sin aprobarse.
- Cálculo automático del avance: el porcentaje es profesional/manual y no se deriva de la adherencia.
- Recordatorios o notificaciones vinculadas al objetivo.

## Próximo corte sugerido

Completar el módulo Pacientes con búsqueda, filtros, edición y archivado en memoria, manteniendo `501` para las escrituras sin contrato Supabase aprobado.
