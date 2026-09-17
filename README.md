
  # Plan V

  Revisión de arquitectura y backlog (2026-09-16): [plan de acción y prioridades](docs/plan-de-accion-2026-09-16.md) · [arquitectura](docs/superpowers/specs/2026-09-16-plan-v-arquitectura-design.md) · [onboarding e IA](docs/superpowers/specs/2026-09-16-plan-v-onboarding-ia-design.md) · [primer bloque ejecutable](docs/superpowers/plans/2026-09-16-plan-v-fundaciones.md).

  Estado actual: demo funcional; la persistencia completa, el diseño Nutrigo autenticado/productivo, los archivos privados y la IA generadora de menús/recetas siguen pendientes. Las instrucciones de esta revisión son propuestas; no se aplicaron cambios de producto ni SQL.

  Dashboard del plan: ejecutar `npm run dashboard` y abrir <http://127.0.0.1:4317>. Incluye 39 entregas, siete hitos, hallazgos y actualización persistente de estados con evidencia. [Uso y verificación](implementation-dashboard/README.md).

  This is a code bundle for Plan V. The original project is available at https://www.figma.com/design/7VTASs2smFVuTG8ZSNo78R/Plan-V.

  ## Running the code

  ```bash
  npm install
  npm run dev
  ```

  Esto levanta el frontend (Vite) y el servidor API con IA en paralelo.

  ### Funcionalidades

  - **App paciente**: navegación Hoy / Mi plan / Mi camino / Mensajes. Registro de comidas por **foto o descripción** con macros automáticos (IA).
  - **CRM nutricionista**: copiloto con sugerencias (Up next, borrador de mensaje), revisión de comidas pendientes, confirmación.
  **IA**: `AI_MODE=live` con `OPENAI_API_KEY` usa el proveedor. `AI_MODE=demo` sólo en `APP_MODE=demo` o `test`. En staging/producción la IA simulada está prohibida.

  Copiá `.env.example` a `.env`. `npm run dev` fija `APP_MODE=demo`, `AI_MODE=demo` y `VITE_ALLOW_DEMO=true` mediante `scripts/with-env.mjs` (funciona en Windows). Sin `APP_MODE` el API no arranca. `APP_MODE=production` o `staging` sin URL y service role de Supabase aborta el proceso. Un build de producción no muestra el botón demo.

  ### Verificación local

  ```bash
  npm test
  npm run check
  npm run build
  npm run check:migrations
  ```

  `npm test` define `APP_MODE=test` y `AI_MODE=demo` en Vitest, sin depender del `.env` del desarrollador. `npm run check` valida tanto el cliente como el servidor. Las pruebas cubren autenticación fail-closed, autorización por relación, privacidad de la vista paciente y validación de entradas API.

  ### Supabase (auth + base de datos)

  Guía: [`docs/supabase-setup.md`](docs/supabase-setup.md) · checklist de aprobación y staging: [`docs/016-approval-and-staging-checklist.md`](docs/016-approval-and-staging-checklist.md)

  Expansión Nutrigo/Plan V: [`tasks/plan.md`](tasks/plan.md) · tareas ejecutables desde el paso 1: [`tasks/todo.md`](tasks/todo.md) · pendientes y estado de producción: [`docs/pending-work.md`](docs/pending-work.md)

  **No aplicar** los borradores SQL de este repo. El contrato 016 local sigue en revisión y debe ampliarse y validarse antes de convertirse en migración.
  Sin service role la API no cae a demo salvo `APP_MODE=demo` o `test`. Login público crea pacientes; el alta profesional se provisiona con `PROVISION_SECRET` (`POST /api/ops/nutritionists`). La invitación de paciente es de un uso, con vencimiento y revocación. Recuperación de cuenta: “Olvidé mi contraseña”.
