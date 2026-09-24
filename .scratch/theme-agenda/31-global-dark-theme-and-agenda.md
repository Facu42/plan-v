# Corte 31 — tema oscuro global y Agenda accionable

Estado: **completado**.

## Entregado

- Preferencia de tema global `claro | oscuro`, persistida en `localStorage` y con respaldo en la preferencia del sistema.
- Tema oscuro consistente en login, app paciente y CRM, con controles accesibles para volver al tema claro.
- Superficies, navegación, cards, formularios, modales y estados activos del CRM adaptados al contraste oscuro.
- Agenda ampliada para mostrar pacientes con y sin turno.
- Acciones `Agendar turno` / `Gestionar turno` que abren la ficha correcta directamente en **Consultas**, con el formulario de alta o reagendado.
- Videollamadas filtra solo consultas cuyo canal es video.

## Archivos principales

- `src/theme-preference.ts`
- `src/theme-preference.test.ts`
- `src/components/PlanVExperience.tsx`
- `src/components/auth/LoginScreen.tsx`
- `src/components/patient/PatientApp.tsx`
- `src/components/crm/CrmDashboard.tsx`
- `src/components/crm/CrmModuleView.tsx`
- `src/components/crm/crm-module-actions.ts`
- `src/components/crm/crm-module-actions.test.ts`
- `src/plan-v.css`

## Verificación

- RED confirmado: los dos tests nuevos fallaron antes de existir las implementaciones.
- `npm test`: 29 archivos / 166 tests ✓
- `npm run check` ✓
- `npm run build`: 114 módulos ✓
- `npm audit`: 0 vulnerabilidades ✓
- `npm audit signatures`: 90 firmas y 45 attestations verificadas ✓
- `git diff --check` ✓
- Browser Harness: tema oscuro persistente en login, paciente y CRM; Agenda abrió y sus acciones llevaron a Consultas para el paciente correcto ✓

## Próximo corte de producto

Profundizar el siguiente módulo todavía parcial sin tocar cloud: **Objetivos**, con estados, edición y seguimiento temporal en modo memoria. La activación de Supabase continúa bloqueada por las puertas de aprobación del corte 30.
