# Acta de salida al piloto — PV-33

**Veredicto de este entorno: `go-synthetic-no-go-live`.** No es GO de staging ni de producción. No se mergeó. No se re-apuntó Railway. No se aplicó SQL ni buckets en el proyecto con `patients`.

Versión ejecutable: `piloto-acta.v1` (`server/piloto/acta.ts`). El código emite el mismo veredicto que este documento.

## GO sintético (este PR)

| Circuito | Evidencia |
| --- | --- |
| Demo memoria Sofía / Marina | `server/piloto/e2e.integration.test.ts` — receta asignada, plan fechado publicado, diario con IA deshabilitada (el registro queda), mensajes, turno, exportación ARCO, Marina no lee el paquete de Sofía, webhook Mercado Pago 404. Un solo `DEMO_NUTRITIONIST_ID`. |
| PGlite Nutri A/B + Paciente A/B | `server/piloto/postgres.integration.test.ts` — el mismo circuito en JWT shim (`set local role authenticated` + `request.jwt.claim.sub`). Cross-tenant `42501`. RPC ausente `42883`. |
| Viewports 390 / 1440 | `src/piloto/viewports.test.ts` — paths `/app/*` y `/crm/*`, `lockedRole` no cruza superficies. Anchos como **contratos de layout**, no aprobación visual Nutrigo. |
| Simulacro de error | IA `disabled` conserva la comida; `expected_version` inválida 400; privacidad cruzada 404/403; persistente sin RPC 42883. |

`eval.v1` se ejecuta al publicar/asignar (PV-28). **No es una puerta clínica automática.** Verónica sigue revisando el set.

Cobros: en demo la excepción comercial `waived` sigue en memoria. Persistente Mercado Pago es **P1 (PV-32)**; no hay webhook ni claves inventadas.

## NO-GO live / staging / producción

| Puerta | Estado aquí |
| --- | --- |
| Railway en **esta** rama | No. El API público sigue el binario de [PR #1](https://github.com/Facu42/plan-v/pull/1) (`/api/ready` 401, CORS `*`). |
| Auth live dos roles en Supabase **vacío descartable** | No. No hay `DISPOSABLE_SUPABASE_URL` ni JWTs. El proyecto hospedado tiene `patients`. |
| PWA Add-to-Home en Android e iPhone físicos | No acreditado. |
| Revisión humana de `eval.v1` | Pendiente (no es gate automático). |
| Retención confirmada por privacidad/legal | Los plazos de PV-31 son de trabajo. |
| Aprobación visual Nutrigo | No. PV-37 aterrizó contratos de layout/estado 1440/800/390/320; **no es sign-off de Facu.** |
| Mercado Pago sandbox | No (P1 PV-32). |

Decisión explícita (checklist 016 §5): **no aprobar staging / no aprobar producción.**

## Checklist Facu (live two-role)

1. Crear un proyecto Supabase **vacío descartable** (nunca el que ya tiene `patients`).
2. Aplicar las migraciones de **esta** rama ahí (incluyendo `privacy_ops`). Buckets privados sólo en ese vacío.
3. Provisionar Nutri A, Nutri B, Paciente A, Paciente B. Entregar JWTs de actor (nunca `service_role` en `VITE_*`).
4. Apuntar Railway (o un servicio staging) a `cursor/disposable-postgres-3f32` con `WORKER_SEPARATE=1`. **No hecho en este corte.**
5. Setear `PLANV_LIVE_AUTH=1` + `DISPOSABLE_SUPABASE_URL` + JWTs en el runner de `npm run test:live-auth` / `test:disposable`.
6. Add-to-Home en un Android Chrome y un iPhone Safari reales.
7. Pedir a Verónica la revisión del set `eval.v1`.
8. Confirmar plazos de retención con privacidad/legal.

Hasta que eso exista, el acta permanece **GO sintético / NO-GO live**.
