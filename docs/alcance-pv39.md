# PV-39 — Decisión de alcance (presupuesto, actividad, video)

Ticket: **PV-39** (P2 / M) del [plan de acción 16 sep](plan-de-accion-2026-09-16.md). Depende de PV-33. **No inventa PV-40.**

Estado: decisión de producto **ejecutable**. No es implementación de presupuesto, wearables ni WebRTC. **No es aprobación visual de Nutrigo** (`PLANV_NUTRIGO_VISUAL` sigue en `0`).

## Evidencia de uso (por qué OUT)

| Capacidad | Qué hay hoy | Evidencia |
| --- | --- | --- |
| Presupuesto de compras | Lista operativa PV-21 (cantidades/unidades, manuales, checks). Grocery Nutrigo no muestra precios. | Ningún registro de gasto ni supermercado. Nadie pidió cobro de canasta. |
| Integración de actividad | PV-35: `activity_logs` autodeclarados + biblioteca/rutinas con habilitación de servidor. | No hay adaptador Fitbit / Apple Health / Google Fit ni consentimiento de wearables. Calorías no se infieren. |
| Video nativo | Turno `channel=video` con `meet_url` HTTPS. CTA abre el enlace o no-op. | mvp-v0 deja videollamada propia fuera. Consultas pegan un Meet/Zoom. No hay sala ni grabación. |

## Decisiones

| Feature | Status | Se conserva | Queda bloqueado |
| --- | --- | --- | --- |
| `grocery_budget` | **out** | Lista PV-21 | presupuesto, gastos, precios, moneda, supermercado |
| `activity_import` | **out** | Actividad autodeclarada PV-35 | Fitbit, Apple Health, Google Fit, importar pasos/kcal |
| `native_video` | **out** | `meet_url` HTTPS | WebRTC, sala nativa, grabación, Calendly, proveedor de video |

## Contrato de API

- `GET /api/alcance` (público) → snapshot `alcance.v1`. `nutrigo_visual_approved` es **siempre** `false`.
- `POST /api/patients/:id/shopping/budget` → **501**
- `POST /api/patients/:id/activity/import` → **501**
- `POST /api/appointments/:id/video-room` → **501**
- `POST /api/video/rooms` → **501**

Mensaje: `Esa capacidad quedó fuera de alcance hasta evidencia de uso.` Sin schema hipotético: `Esa capacidad de alcance no está instalada.` Códigos `42P01` / `42883` / `PGRST202` / `PGRST205` → 501.

Una bandera de entorno no abre estas escrituras. No hay tablas `shopping_budgets`. No se inventan claves de proveedor ni Mercado Pago.

## Fuera de este ticket

Railway re-point, PWA física, revisión clínica de `eval.v1`, retención legal, email/push `sent`, SQL en el proyecto con `patients`, piloto cobrado (PV-32 se salta). Esos quedan humanos. El plan numerado **PV-01…PV-39** queda cubierto en código en esta rama; no hay PV-40.
