# Corte 33 — Directorio de pacientes

Estado: completado en modo demo/memoria.

## Implementado

- Vista específica de Pacientes con métricas de activos, atención, próximas consultas y archivados.
- Búsqueda por nombre, estado, objetivo, etapa y foco.
- Filtros de activos, pacientes con adherencia menor a 70% y archivados.
- Edición de nombre, estado visible, etapa, horario sensible, Plan B y próximo foco.
- Archivo lógico reversible con confirmación; las fichas archivadas salen del contador y de las vistas operativas sin perder historial.
- Endpoints `PATCH /api/patients/:id/profile` y `PATCH /api/patients/:id/archive`.
- Acciones de autorización `edit_patient` y `archive_patient` para la nutricionista asignada.
- Respuesta explícita 501 con Supabase activo hasta aprobar `archived_at`, contrato 016 y RLS.
- Estados vacíos, error, guardado y estilos claro/oscuro con adaptación móvil.

## Verificado

- TDD: la integración de perfil/archivo y los helpers de búsqueda/filtros comenzaron en rojo.
- Pruebas focalizadas: 44 aprobadas.
- Suite completa: 33 archivos, 183 pruebas aprobadas.
- TypeScript frontend/backend: aprobado.
- Build: 118 módulos transformados.
- Auditoría: 0 vulnerabilidades; firmas y attestations verificadas.
- Browser Harness: búsqueda, edición, API, archivo, exclusión de la lista operativa, filtro de archivados y restauración aprobados.
- Captura real a 1440×1000 revisada: sin solapamientos ni cortes; contraste y jerarquía correctos en tema oscuro.
- `git diff --check`: aprobado.

## No incluido

- Persistencia real en Supabase.
- Migración de `archived_at` y pruebas RLS con usuarios sintéticos.
- Importación masiva, segmentación avanzada o borrado legal.
- Automatizaciones externas al archivar/restaurar.

## Próximo corte sugerido

Guardado: guardar, quitar y reutilizar recursos o planes dentro del CRM, manteniendo persistencia temporal hasta aprobar el contrato de datos.
