# Consultorio profesional — ejecución del plan aprobado

**Objetivo:** organizar la gestión completa del nutricionista y comprobar las doce superficies del paciente contra Nutrigo.
**Base:** origin/main c11a1c6; copia aislada, sin incorporar WIP de otros directorios.
**Arquitectura:** React, API Hono y repositorios actuales. Lectura agregada profesional sin duplicar los modelos ni modificar producción. Las acciones conservan la autorización por sesión y las lecturas posteriores al guardado.
**Especificación:** plan aprobado por Facundo en este chat el 5/10/2026.

## Restricciones
- Español; Poppins y tokens Nutrigo; escritorio 1440 y móvil 390.
- IA gratuita, aprobación profesional explícita; fotos manuales.
- Notas y borradores privados. No datos clínicos reales en herramientas externas.
- Una rama/PR por apartado; producción sólo bajo autorización escrita específica.

## Etapas e interfaces
- [x] Bandeja: `GET /api/crm/work-queue`, filtros paciente/tipo, paginación, contadores y enlaces. Archivos `server/crm`, `src/types/crm-work.ts`, `src/api/crm-work.ts`. Pruebas: rol, pertenencia, paginación, trabajos aplicados/rechazados y ausencia de campos privados.
- [x] Consultorio: ocho destinos principales, compatibilidad de enlaces, Inicio y Seguimiento conectados a la bandeja. Archivos `showroom-nav`, `app-location`, `ProfessionalWorkQueue` y `NutrigoShowroom`. Pruebas: destinos, filtros, estados, navegación con paciente.
- [x] Ficha: siete pestañas y contexto persistente, reutilizando ingreso, evolución, plan, consultas, mensajes y cobranzas. Cobros inicializan la selección indicada por la URL. Formularios advierten cambios pendientes.
- [x] Planes: editor fechado único con revisión y publicación; información de alergias/permisos, borrador vs publicado y procedencia estimada conservados. Pruebas existentes de IA/versionado más regresiones de cambios sin guardar y paciente.
- [x] Paciente: inspeccionar `src/features/nutrigo` frente a `design/figma-reference/original`, reparar desviaciones y acciones. Documentar las doce superficies y limitaciones verificadas.
- [x] Cierre: tests, check, build, migraciones/secretos, sesiones nativas y navegador gstack. Revisiones independientes de código y funcionamiento antes del PR; sin afirmar producción ni paridad total sin evidencia.


## Evidencia de ejecución

- Suite general: 243 archivos, 1388 aprobadas y 2 omitidas. Tipos, build, migraciones y secretos aprobados.
- Gstack: 14 confirmaciones y 60 medidas de doce superficies en cinco tamaños; sin desbordamiento del documento.
- Revisiones independientes cerradas sin bloqueo concreto para PR. Sesiones firmadas: 27 aprobadas. Recorrido persistente: 42 confirmaciones aprobadas, incluido reinicio de la API temporal.
- Registros por apartado: docs/consultorio-backend-2026-10-05.md, consultorio-interfaz-2026-10-05.md, consultorio-planes-2026-10-05.md y paciente-nutrigo-2026-10-05.md.

Cierre del código e95d3df: las cuatro entregas aprobaron CI, secretos y sesiones. Evidencia nativa: https://github.com/Facu42/plan-v/actions/runs/37397726321. Producción no modificada; migración preparada pendiente de autorización escrita.
