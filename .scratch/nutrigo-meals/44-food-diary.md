# 44 — Comidas y hábitos en el diseño Nutrigo

## Implementado

- `ShowroomMeals` reemplaza el puente legacy para **Actividades** y para **Revisar comidas** desde Dashboard/Ficha.
- Selector multipaciente sin salir del Diario; `buildMealDiary` filtra defensivamente `meal_logs` y `habit_logs` por `patient_id` y ordena comidas nuevas primero.
- Cuatro métricas derivadas de datos existentes: registros totales, pendientes, revisadas y días con hábitos. No se fabrican macros, calorías ni fechas.
- Hábitos rotulados como declarados por la paciente: hidratación, energía y descanso del último registro disponible; la superficie profesional no los presenta como prescripción ni permite editarlos.
- Tabla de historial con fecha, tipo de comida, detalle, estado y revisión. Las filas pendientes abren `MealReviewPanel`; confirmar/ajustar conserva el flujo operativo y refresca el paciente.
- Las notas `note_for_nutri` permanecen fuera de la tabla y solo aparecen dentro del diálogo profesional de revisión. El diálogo conserva su lógica operativa, pero usa Poppins, tokens Nutrigo y contraste corregido en claro/oscuro. La experiencia Paciente no expone el Diario profesional ni esas notas.
- Búsqueda por comida, detalle visible y estado, con vacío explícito.
- La superficie usa ancho completo sin rail derecho, igual que Food Diary del pack.

## Geometría de referencia

Fuente local: frame `105:2649` (escritorio), `492:13177` (tablet) y `492:14886` (móvil).

- Escritorio: cuerpo de 1161 px; sección estadística de 104 px con cuatro tarjetas de 72 px; tabla con filas de 68 px.
- Tablet: métricas 2×2, tarjetas de 72 px y sección de 192 px.
- Móvil: cuatro tarjetas verticales de 72 px, separación de 16 px y sección total de 368 px.
- Tabla desplazable dentro de su contenedor en 800/390/320; el documento no produce overflow horizontal.

## Verificación

- RED inicial: `ShowroomMeals` no existía. GREEN: 4 pruebas nuevas de derivación, aislamiento, métricas/tabla, búsqueda y hábitos no editables.
- Browser: 6 flujos — Actividades abre Diario Nutrigo; aislamiento contra API; búsqueda/vacío; diálogo profesional; acción Revisar comidas conserva paciente; vista Paciente excluye notas privadas.
- 8 vistas: claro/oscuro × 1440/800/390/320; cuatro métricas, sin rail ni errores JS. Geometría 104/192/368 y tarjetas de 72 px comprobadas por DOM.
- Suite completa: 250 pruebas / 46 archivos; TypeScript frontend/server, build 121 módulos, `npm audit` 0 vulnerabilidades, firmas 91/attestations 46 y `git diff --check` aprobados.
- Regresión Ficha actualizada: 6 checks, 8 vistas, privacidad y selección aprobadas con el Diario nuevo.

## No incluido

- No se agregó edición profesional de hábitos: siguen siendo autodeclarados por la paciente.
- Consultas mantiene su editor anterior; es el siguiente corte visual.
- Contrato 016, Supabase/RLS, producción y aprobación visual global permanecen pendientes.
