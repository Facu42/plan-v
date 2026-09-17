# Corte 53 — Plan semanal paciente Nutrigo

## Implementado

- Se auditó la vista paciente anterior, el editor profesional Nutrigo y el modelo seguro del showroom antes de crear otra superficie.
- `ShowroomPatientPlan` reemplaza el detalle genérico de `plan` para el rol paciente.
- Presenta los siete días de la semana actual, resumen de días/comidas, selección diaria y búsqueda en todo el plan.
- Reutiliza `buildCalendarWeek` y exclusivamente `ShowroomPatient.weekPlan`/`todayPlan`.
- Las horas se muestran sólo cuando están realmente publicadas para el día actual.
- La vista es de sólo lectura y queda separada del editor profesional multipaciente.
- Se añadió el token estable `--nv-forest` para el fondo oscuro de alto contraste del hero y del día seleccionado.
- El rail genérico no se reserva en esta página.

## Verificado

- RED inicial por módulo inexistente; GREEN con 4 pruebas focalizadas.
- Browser QA: `{"checks":5,"views":6,"patient":"pat-sofia","days":7,"private":14,"errors":[]}`.
- Los siete días responden a selección y sólo uno queda activo.
- La búsqueda encuentra títulos publicados en toda la semana y presenta vacío honesto.
- Se comprobaron seis combinaciones: 1440/800/390 px × claro/oscuro.
- No hubo overflow documental, rail residual, entrada legacy ni errores de navegador.
- Catorce valores privados profesionales quedaron fuera del DOM paciente.
- Capturas inspeccionadas:
  - `patient-plan-light-1440.png`
  - `patient-plan-dark-390.png`
- Se corrigió durante la inspección el hero y el domingo invisibles en tema claro por un token CSS faltante; el segundo QA confirmó el arreglo.
- Gate global: 55 archivos, 124 suites y 290/290 pruebas; TypeScript frontend/servidor, build (121 módulos), auditoría, firmas y `git diff --check` aprobados.

## No incluido

- Semanas fechadas o versionadas e historial longitudinal.
- Navegación hacia semanas futuras/pasadas.
- Recetas, ingredientes, cantidades, unidades, porciones o macros inferidas.
- Plantillas y duplicación de semanas.
- Plan B en el allowlist del showroom.
- Persistencia real/Supabase, bloqueada por contrato 016 y RLS.
- Aprobación visual general del producto.
