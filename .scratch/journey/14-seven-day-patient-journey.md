# Corte 14 — Mi camino con resumen longitudinal

Estado: **completado** (2026-09-06).

## Alcance

1. `Mi camino` dejó de ser una lista plana y ahora deriva una ventana de los últimos siete días desde `habit_logs` y `meal_logs`.
2. La pantalla conserva el score de adherencia existente sin mostrar `adherence_why`.
3. Se incorporaron:
   - registros de hoy: agua, energía y descanso;
   - promedio semanal de hidratación;
   - cantidad de días con descanso y promedio de los días registrados;
   - comidas revisadas y pendientes por separado;
   - detalle diario de agua, descanso, comidas revisadas y pendientes;
   - comidas recientes ordenadas desde la más nueva.
4. Las fechas se agrupan por calendario local, incluido el cruce nocturno de UTC.
5. Las comidas `pending_review` no se cuentan como revisadas y se identifican como estimaciones pendientes de Verónica.

## Límites clínicos y privacidad

- No se agregaron peso, objetivos de peso, circunferencias, fotos corporales ni laboratorios: están fuera del contrato v0.
- El resumen sólo usa datos declarados por la paciente y revisiones profesionales existentes.
- No diagnostica, califica ni interpreta hábitos.
- La paciente no recibe `adherence_why`, `note_for_nutri`, `brief` ni sugerencias internas.
- No se añadió persistencia ni endpoint nuevo; el corte deriva información ya autorizada.

## TDD

`journey-summary.test.ts` cubre:

- siete fechas locales ordenadas de más antigua a hoy;
- cruce UTC/local nocturno;
- separación de revisadas y pendientes;
- exclusión de registros fuera de la ventana;
- promedio de agua sobre siete días;
- promedio de descanso sólo sobre días registrados.

## QA en Chrome real

Chrome headless aislado, zona `America/Argentina/Buenos_Aires`:

- Score visible: `63`.
- Promedio de agua: `2,6 vasos/día`.
- Descanso: `6/7 días`, promedio `7 h 13 min`.
- Comidas: `10` revisadas y `2` en revisión.
- Siete filas diarias y doce comidas recientes.
- No apareció la explicación privada `10 de 14 comidas revisadas esta semana`.
- Sin overflow horizontal en 320, 390, 768, 1024 y 1440 px.
- El shell paciente conserva ancho máximo de 470 px en escritorio.

## No incluido

- Tendencias de peso o medidas corporales.
- Diagnósticos o recomendaciones automáticas.
- Edición de registros desde `Mi camino`.
- Persistencia Supabase hasta aprobar la migración `016` y RLS.
