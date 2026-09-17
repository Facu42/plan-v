# 45 — Plan semanal profesional en el diseño Nutrigo

## Implementado

- `ShowroomMealPlan` reemplaza el puente legacy de **Editar plan** desde Dashboard y Ficha.
- Selector multipaciente que conserva el paciente elegido al entrar al editor.
- Siete días visibles y ordenados de lunes a domingo, incluidos los días sin comidas.
- Edición de títulos existentes, alta por momento del día y eliminación con confirmación.
- Búsqueda por título o momento sin eliminar las filas semanales; cada día distingue “Sin comidas asignadas” de “Sin coincidencias”.
- La superficie profesional usa ancho completo, sin rail derecho; **Fichas** permanece marcado como módulo activo.
- La vista Paciente continúa separada, publicada y de solo lectura.
- No se infieren porciones, macros, calorías, cantidades ni recetas.

## Geometría de referencia

Fuente local: frames `84:2994` (1440), `463:14306` (800) y `470:15300` (390).

- Tabla fuente de escritorio: 1161 × 824 px, cabecera de 40 px y filas base de 96 px.
- Escritorio verificado: siete filas de 96 px y tabla sin scroll interno.
- Tablet/móvil verificados: siete filas de 184 px y grilla interna mínima de 700 px con scroll horizontal contenido.
- No existe overflow horizontal en el documento a 1440/800/390.

## Verificación

- RED inicial: `ShowroomMealPlan` no existía. GREEN: cuatro pruebas nuevas para orden semanal, filas vacías, edición explícita, búsqueda y ausencia de datos inventados.
- Browser: cinco flujos — entrada desde Editar plan; edición/restauración; alta/eliminación; búsqueda preservando siete días; separación paciente/profesional.
- Las mutaciones usaron la API real demo y restauraron el estado original de `pat-sofia`.
- Seis vistas: claro/oscuro × 1440/800/390, sin rail, sin puente legacy y sin errores JavaScript.
- Suite completa: 254 pruebas / 47 archivos (108 suites); TypeScript frontend/server, build 121 módulos, `npm audit` 0 vulnerabilidades, firmas 91/attestations 46 y `git diff --check` aprobados.

## No incluido

- La asignación de recetas, porciones, macros, cantidades, duplicación de plantillas y navegación entre semanas permanece pendiente.
- Objetivos mantiene temporalmente su editor anterior.
- Contrato 016, Supabase/RLS, producción y aprobación visual global permanecen pendientes.
