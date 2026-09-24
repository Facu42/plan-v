# Corte 49 — Centro de trabajo profesional Nutrigo

## Implementado

- `ShowroomWorkCenter` reemplaza las aperturas legacy de los cinco módulos profesionales restantes:
  - **Reciente:** movimientos almacenados en las fichas, con orden relativo explícito y acceso a la ficha correspondiente.
  - **Guardado:** Planes B personales registrados, sin tratarlos como plantillas reutilizables entre pacientes.
  - **Centro de seguimiento:** priorización por adherencia existente y comidas pendientes, con acceso a Ficha o Diario.
  - **Paneles:** pacientes activos, comidas pendientes, adherencia media, próximas consultas, distribución por bandas y atención prioritaria.
  - **Videollamadas:** próximas consultas de video derivadas del modelo existente, enlaces HTTPS seguros y acceso a `ShowroomConsultations`.
- `CRM_PAGE` ahora mapea los once módulos profesionales a superficies Nutrigo; el menú ya no necesita abrir `CrmModuleView` legacy para ningún módulo.
- Fichas se mapea directamente a `ficha`; Actividades a `diario`; Agenda, Objetivos y Pacientes conservan sus superficies ya migradas.
- Acciones de filas mantienen el paciente correcto al navegar a Ficha, Diario o Consultas.
- Los módulos agregados usan ancho completo, sin `ProfessionalActions`, rail diario ni frame legacy.
- No se inventaron timestamps globales para Timeline, scores nuevos, consultas históricas, macros ni datos clínicos.

## Verificación

- RED inicial: el test importó `ShowroomWorkCenter` inexistente.
- `showroom-work-center.test.tsx`: 9 pruebas de agregados, prioridad, actividad, cinco renders y acciones/enlaces.
- Browser QA: `{"checks":3,"views":30,"modules":5,"patients":3,"errors":[]}`.
  - Abrió los cinco módulos desde el menú.
  - Confirmó 11 módulos, `aria-current`, ausencia de legacy/rail/toolbar y contexto multipaciente.
  - Ejercitó Reciente→Ficha, Guardado→Ficha, Seguimiento→Diario, Paneles→Ficha y Videollamadas→Consultas.
  - Matriz de 30 vistas: cinco módulos × 1440/800/390 × claro/oscuro, sin overflow horizontal ni errores JS.
  - Capturas inspeccionadas: Paneles 1440 claro, Seguimiento 390 oscuro y Videollamadas 390 oscuro; sin defectos bloqueantes.
- Gate global: 275/275 pruebas, 116/116 suites, 51 archivos, TypeScript frontend/servidor, build 121 módulos, auditoría 0 vulnerabilidades, firmas/attestations y `git diff --check` aprobados.
- Chrome QA `9232` cerrado. API `3010` y frontend `5180` continúan activos; frontend HTTP 200.

## No incluido

- La fidelidad visual general aún requiere aprobación explícita del usuario.
- Reciente no es una cronología clínica longitudinal: `TimelineEvent` sólo conserva `atLabel`, no un timestamp en el contrato frontend.
- Agenda/Videollamadas siguen limitadas a una próxima consulta textual por paciente.
- Persistencia Supabase y datos reales continúan bloqueados por contrato 016/RLS.
