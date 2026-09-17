# Corte 54 — Agenda paciente Nutrigo

## Implementado

- Se auditó la tarjeta paciente existente, `PatientApp`, el calendario profesional, el modelo seguro del showroom y el contrato 016 antes de desarrollar.
- `ShowroomPatientAgenda` reemplaza la tarjeta genérica de `agenda` para el rol paciente.
- Presenta calendario mensual, una próxima ocurrencia, estado, modalidad, duración y detalle de sólo lectura.
- **Escribirle a Verónica** abre la mensajería Nutrigo real.
- Los enlaces de videollamada se muestran sólo si son HTTPS y abren con `target="_blank"` + `rel="noopener noreferrer"`.
- `ShowroomPatient.appointment` amplía su allowlist con `duration` y `meet_url`; no incorpora `prep_note` ni campos profesionales.
- `nextAppointmentDate` ahora falla de forma segura: un `when` inválido no genera un lunes 14:30 ficticio.
- La página no reserva el rail genérico y permanece separada de reagendar/cancelar/guardar.

## Verificado

- RED inicial por componente inexistente y RED separado por allowlist incompleta.
- 5 archivos focalizados / 32 pruebas aprobadas, incluyendo Consultas, Agenda profesional, Work Center y modelo seguro.
- Browser QA: `{"checks":4,"views":6,"patient":"pat-sofia","calendarCells":35,"private":14,"errors":[]}`.
- Se validó apertura desde Agenda, una única fecha marcada, detalle real y acceso a Mensajes.
- Se comprobaron 1440/800/390 px en claro y oscuro, sin overflow documental, rail residual, entrada legacy ni errores de navegador.
- Catorce valores privados profesionales quedaron fuera del DOM paciente.
- Capturas inspeccionadas sin defectos bloqueantes:
  - `patient-agenda-light-1440.png`
  - `patient-agenda-dark-390.png`
- Gate global: 56 archivos, 126 suites y 295/295 pruebas; TypeScript frontend/servidor, build (121 módulos), auditoría, firmas y `git diff --check` aprobados.

## No incluido

- Historial longitudinal de consultas.
- Navegación mes/semana/día sobre eventos persistidos.
- Confirmación de asistencia, conflictos, recurrencia o zona horaria configurable.
- Gestión del turno por paciente; permanece bajo autoridad profesional.
- Notas clínicas o `prep_note`.
- Persistencia real/Supabase, bloqueada por contrato 016 y RLS.
- Aprobación visual general del producto.
