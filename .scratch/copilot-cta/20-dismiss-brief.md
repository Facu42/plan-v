# Corte 20 — Marcar luego del copiloto

Estado: **completado** (2026-09-06).

## Alcance

1. **Marcar luego** descarta la acción visible actual.
2. La card queda en `Sin acción urgente` y oculta el CTA y el borrador.
3. El descarte persiste en el store demo mientras el servidor siga activo.
4. **Generar sugerencia / Actualizar copiloto** crea un brief nuevo y limpia el descarte.
5. El brief original permanece internamente con su `suggested_action`; la serialización para CRM muestra la acción como vacía cuando está descartada.

## Seguridad y alcance

- No se agrega un evento clínico al timeline.
- No se envía ningún mensaje.
- No se modifica adherencia.
- Con Supabase activo, el endpoint autoriza como acción profesional y devuelve `501` porque `ai_briefs.status='dismissed'` depende del contrato `016`.
- La paciente no recibe este estado: `brief` y `adherence_why` ya están excluidos de su vista segura.

## Tests

- `server/brief-dismiss.integration.test.ts`:
  - descarte;
  - idempotencia;
  - persistencia interna;
  - regeneración;
  - `404` para paciente inexistente.
- `src/components/crm/crm-interactions.test.ts`:
  - `visibleBrief` oculta briefs descartados o sin acción.

## QA en Chrome

1. Sofía mostraba `Mensaje · el nutri confirma`.
2. `Marcar luego` cambió la card a `Sin acción urgente` y quitó el botón.
3. Al recargar, seguía `Sin acción urgente`.
4. `Generar sugerencia` volvió a mostrar una acción y restauró `Marcar luego`.

## No incluido

- Persistencia Supabase del estado `dismissed`.
- Expiración temporal configurable.
- Métricas de descarte.
- Reapertura manual sin regenerar el brief.
