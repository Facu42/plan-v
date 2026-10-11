# Progreso global (2026-10-10)

Pantalla de la nutricionista que muestra a toda su cartera junta: `/crm/progreso-global`, en el menú dentro de «Acompañamiento».

## Qué muestra
- Período de 7, 30 o 90 días, comparado con el período anterior de la misma duración.
- Tres indicadores: pacientes con registros, comidas registradas (con las pendientes de revisión y la variación) y pacientes con peso.
- Lista por paciente: último peso y variación contra el último del período anterior, comidas registradas, comidas por revisar, y accesos a la ficha y a sus registros.
- Filtro (todas, con registros, sin registros) y orden (nombre, más comidas, mayor cambio de peso). Nadie sale de la lista al ordenar.

## Reglas
- La falta de registros se dice como falta de datos («Sin registros en el período»), nunca como incumplimiento.
- El peso solo aparece con el permiso de mediciones vigente de la paciente; sin permiso dice «Sin permiso», sin cero ni valor inventado.
- Si el resumen de una paciente no se puede consultar, se avisa aparte y no cuenta como cero.
- Solo pacientes activas del consultorio de la profesional (el mismo alcance que la bandeja). Sin migración: reutiliza el cálculo por paciente de «Progreso» (`get_patient_progress`).

## Código
`server/crm/progress-global.ts` (cálculo puro), `loadGlobalProgress` en `server/crm/repository.ts`, ruta `GET /api/crm/progress-global?days=`, `src/lib/progress-global.ts`, `src/components/nutrigo/ProfessionalProgressGlobal.tsx`. Piezas del archivo de Nutrigo: tarjetas de indicadores y tabla del directorio de pacientes.

## No incluido (con motivo)
- Adherencia al plan, ánimo y síntomas: la app de la paciente todavía no los registra.
- Gráfico semanal de la cartera y «última actividad» de comidas por día: el resumen actual no trae fechas de comidas.
- No se vio una pantalla de Progreso global del video de Nutriboost: la definición salió de la matriz v3 (§5) y de la lista de módulos del repo; sin comparación contra Figma porque Nutrigo no dibuja esta pantalla.
