# Corte 48 — Agenda profesional multipaciente Nutrigo

## Implementado

- `ShowroomAgenda` reemplaza la apertura legacy del módulo **Agenda** para el rol profesional.
- Calendario mensual agregado con las próximas consultas de **todos los pacientes activos**, no sólo del seleccionado.
- Una próxima ocurrencia por paciente derivada del `when` textual existente (día de semana + hora); no se inventa historial longitudinal, recurrencia ni zona horaria.
- Métricas: programadas, videollamadas, presenciales y pacientes sin turno.
- Filtros: Todas / Video / Presenciales / Sin turno.
- Lista ordenada cronológicamente con avatar, fecha derivada, duración, modalidad, enlace de sala seguro (`https`, `target="_blank"`, `rel="noopener noreferrer"`) y acción **Gestionar consulta**.
- Sección **Sin turno** con acceso directo a agendar.
- **Gestionar consulta** abre la superficie Nutrigo `ShowroomConsultations` del paciente correspondiente (Fichas activo); no abre CRM legacy.
- Vista Paciente de Agenda separada y de sólo lectura: muestra su próxima consulta y declara que la gestión corresponde a la nutricionista.
- Los once módulos siguen visibles; Agenda usa ancho completo (sin rail genérico ni `ProfessionalActions`).
- `buildAgendaEntries` y `buildAgendaCalendar` exportados y cubiertos por pruebas.
- Reutiliza `nextAppointmentDate`, `parseAppointmentWhen` y `secureMeetUrl` exportados desde `ShowroomConsultations` (una sola fuente de derivación de fecha).

## Verificación

- `showroom-agenda.test.tsx`: orden cronológico, agrupación por día, celdas 35, métricas, acciones, límite del modelo.
- Gate global: 266/266 pruebas, 114/114 suites, 50 archivos, TypeScript, build 121 módulos, auditoría 0 vulnerabilidades, firmas OK, `git diff --check` OK.
- Browser QA (servicios principales 3010/5180, Chrome aislado 9231): `{"checks":5,"views":6,"scheduled":3,"unassigned":0,"errors":[]}`.
  - Conteos agregados contra API, enlaces seguros, filtros, navegación a Consultas por paciente, 6 vistas responsive (1440/800/390 × claro/oscuro), vista Paciente separada.
- Capturas: `agenda-light-1440.png`, `agenda-dark-390.png` y 4 más en esta carpeta. Inspección visual asistida no disponible en esta sesión (provider sin endpoint de visión); geometría y overflow verificados por aserciones del harness.

## Límites que se mantienen explícitos

- Sigue siendo una próxima consulta por paciente; Agenda longitudinal real requiere el modelo del contrato 016.
- `when` sigue siendo texto (`'Jueves · 14:30'`); la fecha mostrada es derivada, no persistida.
- Sin confirmación de asistencia, recordatorios, conflictos de horario ni auditoría.
