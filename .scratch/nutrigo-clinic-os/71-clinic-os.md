# Corte 71 — Consultorio nutricional y revisión visible al paciente

Fecha: 2026-09-15

## Dirección visual

El usuario pidió cerrar el criterio visual como una app nutricional moderna y profesional, no como réplica del kit. Plan V queda como consultorio: paleta del logo, Poppins, tipo operativo ≥ 12 px, topbar en el workspace, menú activo en verde bosque y showroom canónico en demo (`?design=legacy` como escape).

## Cambios

- Nueva capa `clinic-professional.css` (tokens, shell, botones, métricas, topbar sticky).
- Piso tipográfico en 21 hojas CSS del showroom (7–10 px → 11–13 px).
- Diario paciente: `patientVisibleReview` distingue confirmada/ajustada, muestra alimentos y macros publicados, oculta notas internas y deja el detalle visible en móvil.

## Límites

No se copiaron assets del kit. No se ejecutó SQL ni se habilitaron datos reales. La fidelidad pixel a pixel con Nutrigo deja de ser el criterio de aceptación.
