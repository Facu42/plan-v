# 41 — Calendario semanal del panel derecho

## Implementado

- Reemplaza la tira de abreviaturas por siete fechas locales de lunes a domingo, también si faltan días en el plan.
- Hoy lleva subrayado y `aria-current=date`; el día seleccionado usa fondo y `aria-pressed`. Botón Hoy real, fechas completas accesibles y foco de teclado.
- Selección de comidas por nombre de día, no por índice de un plan parcial/desordenado. Los días sin asignación quedan vacíos, nunca toman las comidas de hoy.
- Fecha actual y botón Hoy resuelven `todayPlan`; los otros días consultan `weekPlan` sin inventar horarios. La nota aclara que es una plantilla, no historial fechado.
- Al cambiar de paciente o rol vuelve a hoy. Datos, API, contratos, persistencia y CRM operativo sin modificaciones.

## Fuente local

Archivo Nutrigo licenciado, Dashboard `12:792`, rail `33:1104`, calendario `28:962`.

- Marco 269 × 128; padding 12; header `28:378` 245 × 30.
- Título 14 px y año 11 px; fila `28:951` 245 × 58 a y=58.
- La fuente muestra seis celdas de 40.83 px. Se adapta a siete días para no omitir fines de semana; no es réplica literal.
- No se copiaron flechas de navegación sin función: el modelo actual no almacena planes por fecha. Se usa Hoy como acción disponible.

## Verificación real

- RED: prueba nueva falla por módulo aún inexistente; GREEN: ocho pruebas cubren fechas locales, domingo, cambio de año, bisiesto, plan parcial/desordenado, ausencia de comidas, cambio de paciente y ARIA.
- Suite completa: 234 pruebas / 43 archivos; TypeScript frontend/backend y build aprobados.
- npm audit: cero vulnerabilidades. Firmas: 91 verificadas, 46 attestations. git diff --check aprobado con avisos LF/CRLF de dos archivos no tocados.
- `verify.py`: 16 vistas únicas (dos roles × claro/oscuro × 1440/800/390/320), siete celdas, una selección, altura 128, targets >=24px, sin overflow.
- 14 selecciones (siete días × dos pacientes) comparadas con los títulos de la API demo. Hoy por teclado y reinicio de selección al cambiar paciente comprobados.
- Errores JS/promesas rechazadas: ninguno en ese recorrido.
- Capturas inspeccionadas: paciente escritorio claro, profesional móvil oscuro. Calendario legible y sin superposiciones en ambas. Las capturas móviles se desplazan al panel derecho, no son el comienzo del dashboard.
- Evidencia en `verification.json`, `flows.json` y capturas de esta carpeta.

## No incluido / pendiente

No es el módulo Calendario completo, ni agenda fechada, ni navegación entre semanas, ni aprobación visual. El resto del showroom y los editores legacy siguen su migración pendiente. Sin Supabase, datos reales, nuevas integraciones, commits ni publicación.
