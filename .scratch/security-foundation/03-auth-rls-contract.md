# 03 — Base segura de Auth/RLS

## Objetivo

Preparar el servidor para conectar el schema 016 sin aplicar el draft SQL bloqueado ni exponer datos profesionales al rol paciente.

## Aceptación

- [x] Existe un comando `npm test` reproducible.
- [x] Cliente y servidor se validan con `npm run check`.
- [x] Con Supabase activo, las rutas protegidas fallan con 401 sin token.
- [x] Demo sólo funciona cuando no hay service role configurada.
- [x] Las acciones sobre pacientes se autorizan por rol y relación.
- [x] La vista paciente elimina notas profesionales, briefs y mensajes no enviados.
- [x] Comidas nuevas sólo nacen como `pending_review`.
- [x] Entradas de comidas, revisiones, hábitos, mensajes y alta de nutricionista se validan con Zod.
- [ ] Probar las mismas reglas contra la migración 016 publicada y RLS real.

## Verificación

```bash
npm test
npm run check
npm run build
npm audit
npm audit signatures
git diff --check
```

## Bloqueo externo

No aplicar `supabase/migrations/_DRAFT_DO_NOT_APPLY_plan_v_v0.sql`. La integración con datos reales continúa bloqueada hasta recibir y revisar el schema 016.
