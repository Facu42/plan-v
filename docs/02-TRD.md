# 02 · TRD — Plan V (requisitos técnicos)

> Fuentes: `package.json`, `vercel.json`, `server/**`, `docs/supabase-setup.md`, `docs/autenticacion.md`, `AGENTS.md`, estado 10/10 y asesoría 9/10.

## 1. Arquitectura (existe hoy)
```
Navegador (SPA React, PWA)  ──►  Vercel  plan-v-eight.vercel.app   (rutas /app, /crm, /admin, /pacientes)
        │  supabase-js (auth, lecturas con RLS, Storage)
        │  fetch /api/*                                   
        ▼                                                  
API Node (Hono) en Railway  api-production-aad6.up.railway.app
        │  service role / funciones SQL                   
        ▼                                                  
Supabase "plan-v-app" (sa-east-1, ref wvosvlxpfytokwfbcero): Postgres + Auth + Storage
        ▲
Worker (mismo repo, `npm run worker`) en Railway: cola `processing_jobs` (leases) → IA vía OpenRouter
```

## 2. Stack (de `package.json`)
| Capa | Tecnología |
|---|---|
| Front | React 19, Vite 6, TypeScript 5.7, Tailwind CSS 4.3 (CLI), Zustand 5, Phosphor Icons, pdfjs-dist |
| Fuentes | `@fontsource/poppins` (canónica Nutrigo), también instaladas Fraunces, DM Sans, Inter (ver doc 04) |
| API | Hono 4.13 + `@hono/node-server`, ejecutado con `tsx`; validación con Zod 4 |
| IA | `ai` (Vercel AI SDK 7) + `@ai-sdk/openai` apuntando a **OpenRouter** (Chat Completions compatible) |
| Datos | `@supabase/supabase-js` 2.x; `pg` en tests |
| Tests | Vitest 5, PGlite (Postgres en memoria), Postgres descartable, pruebas RLS A/B, pixelmatch para comparación visual |
| Herramientas | concurrently, scripts propios en `scripts/` (seed, demo, backup/restore, figma-pull, chequeos) |

### Scripts clave
`npm run dev` (API + Vite) · `check` (tsc front + server) · `test` · `test:auth-isolation` · `check:migrations` (seguridad de migraciones) · `check:views` (falla si una vista pública puede escribir o saltear RLS) · `check:secrets` · `worker` · `backup`/`restore` · `seed:demo`.

## 3. Módulos de la API (`server/*/routes.ts`)
admin, ai-jobs, alcance, appointments, assets, care, crm, diary, exercise, fees, foods, messages, models, orgs, outbox, plans, privacy, progress, recipes, resources, shopping, targets. ~190 rutas registradas.

## 4. IA (existe hoy)
- Proveedor: OpenRouter. `DEFAULT_OPENROUTER_MODEL = 'openrouter/free'`; `server/ai/provider.ts` **solo acepta modelos gratuitos** y rechaza `models`, `plugins`, `tools`, búsqueda web.
- Modos: `AI_MODE` (simulado / live), `APP_MODE` (production exige configuración válida).
- Usos: borrador de menú (`menu_draft`), borrador de receta, análisis de comida por foto/texto (`meal_analysis_runs`), portadas de platos e ingredientes (`menu_dish_covers`, `ingredient_covers`, tope diario `cover_daily_usage`), reemplazos.
- Trazabilidad: `ai_jobs` (modelo, versión de prompt, hash de contexto, tokens, consentimiento), `ai_artifacts`, `ai_briefs`.
- Consentimiento: la IA sobre datos de la paciente requiere permiso (`consent_events`, `ai_consent_sequence`).
- **Pendiente** (asesoría #2): `data_collection: "deny"`, lista fija de modelos, sin PII en el prompt — no está en el código.

## 5. Auth
Supabase Auth (mail + contraseña; Google preparado, falta activar en Supabase/Google Cloud). Trigger `handle_new_user` crea `profiles`. Rol en `profiles.role` (`nutri` | `paciente`). Paciente se vincula aceptando `patient_invites` (`accept_patient_invite`). Pantalla "Antes de seguir" exige aceptar la versión vigente de términos (`src/legal.ts`). Admin: `platform_admins`.

## 6. Seguridad y decisiones técnicas tomadas
- RLS en las 92 tablas; escrituras sensibles por funciones SQL con guardas (`SECURITY DEFINER`, ~275 funciones).
- Vistas `*_patient_view` = proyecciones de solo lectura para la paciente (invoker). CI bloquea vistas con escritura.
- CSP estricta, HSTS, `X-Frame-Options DENY`, `Permissions-Policy` (cámara solo propia) en `vercel.json`.
- Storage privado con intents de subida (`asset_upload_intents`).
- Día del servidor en hora de Argentina.
- Reglas para agentes: nada directo a `main`; nada en la base de producción sin frase escrita de Facu; PR con informe de `regression-guard`.

## 7. Existe hoy vs planeado (infra)
| Tema | Hoy | Planeado |
|---|---|---|
| Staging de base | ❌ no hay | rama/proyecto Supabase + previews |
| Monitoreo | `/api/health` | Sentry redactado + monitoreo externo |
| Respaldo Storage | ❌ | diario + simulacro mensual |
| Dominio/correo | `vercel.app`, `railway.app` | dominio propio, mail transaccional SPF/DKIM |
| Correo de avisos | outbox existe (`outbox_events`, `notification_deliveries`) | envío real (D3) |
| Tiempo real (chat) | ❌ | Supabase Realtime u otro |
| Mobile | PWA | Capacitor (Android primero) |
| Pagos | manual | Mercado Pago (tablas `payments`, `payment_webhook_events` ya existen) |

## 8. Decisiones abiertas para Facu
1. **IA paga con retención cero**: ¿presupuesto si los modelos gratis con `deny` no alcanzan (fotos, balanza)? ¿Qué modelos fijos?
2. **Aprobar por escrito** la migración que revoca escrituras en `appointments_patient_view`, `intake_patient_view`, `messages_patient_view`.
3. **Staging**: ¿rama de Supabase (paga) o proyecto separado?
4. **Monitoreo**: ¿Sentry? ¿qué servicio para el health externo?
5. **Correo transaccional**: ¿proveedor (Resend, Postmark, SES…) y dominio?
6. **Chat en tiempo real**: ¿Supabase Realtime o polling?
7. **Android**: ¿Capacitor o TWA?
