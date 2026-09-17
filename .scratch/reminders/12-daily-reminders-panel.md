# Corte 12 — Panel in-app de recordatorios diarios

Estado: **completado** (2026-09-05).

## Qué quedó implementado

1. **Dominio determinista** (`daily-reminders.ts`): combina menú del día, comidas registradas, hidratación y consulta. Clasifica cada entrada como `done`, `perdido`, `ahora` o `proximo`, usando una ventana de ±30 minutos.
2. **Orden**: comidas y consulta por hora; aviso de agua al final. El agua desaparece al llegar a 8/8 y la consulta sólo aparece si corresponde al día local actual.
3. **Panel in-app** (`DailyRemindersPanel.tsx`): la campana de Inicio abre un diálogo con copy neutral (`Horario anterior`, no juicio), hora, estado y detalle.
4. **Acciones**:
   - `Registrar` abre el flujo de comida con el slot preseleccionado.
   - `+1 vaso` persiste mediante la API de hábitos y actualiza el panel.
5. **Accesibilidad**: `role=dialog`, `aria-modal`, `aria-expanded`, foco inicial en cerrar, cierre con `Escape` o backdrop, botones nativos y error visible.
6. **Tema y responsive**: variantes claro/oscuro, animación desactivada con `prefers-reduced-motion` y layout móvil sin overflow.

## Verificación

- Tests del dominio: 5 casos para comidas registradas/vencidas/próximas, ventana de 30 min, agua, consulta del día y orden.
- Chrome real a 390×844:
  - Panel abierto desde campana: 6 filas, foco en `Cerrar recordatorios`, `scrollWidth=390`.
  - `Registrar` de Desayuno cerró el panel y abrió el modal con Desayuno activo.
  - `+1 vaso` actualizó el panel y la home de 6/8 a 7/8.
  - `Escape` cerró y dejó `aria-expanded=false`.

## No incluye

- Notificaciones del navegador o push en segundo plano.
- Configuración persistente de horarios (`reminders.time_local`) hasta contar con schema 016.
- Sueño: el modelo actual de paciente todavía no captura minutos/horario de sueño.
