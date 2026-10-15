# Baseline de release — PV-01

Fecha de captura: 16 de septiembre de 2026. Repo activo: `plan-v/` (independiente del directorio padre). Esta nota no modifica lógica de producto.

## Identificación

| Campo | Valor |
| --- | --- |
| Rama | `cursor/professional-app-ai-ca47` |
| HEAD | `37f3a22` — `checkpoint before checking out main` |
| Remoto de la rama | `origin/cursor/professional-app-ai-ca47` — HEAD local está **2 commits adelante** (`2ba2b11`, `37f3a22`) |
| Working tree | limpio (`git status --short` vacío). El árbol enorme sin seguimiento que figuraba en `docs/pending-work.md` quedó dentro del checkpoint local; **no se empujó**. |
| Node | `v24.16.0` |
| npm | `11.13.0` |
| Suite de comandos | `npm test` · `npm run check` · `npm run build` |

Un worktree nuevo desde HEAD **sí** contiene el código de producto actual, porque el checkpoint ya consolidó el working tree. No copiar `.env`, `node_modules/`, `dist/` ni `.scratch` a otro árbol.

## Verificación ejecutada en esta captura

| Comando | Resultado real | Qué no cubre |
| --- | --- | --- |
| `npm test` | **72 archivos OK / 1 fallido; 366 pruebas OK / 4 fallidas / 370 totales**. Fallos: `server/contracts-016.test.ts` (vistas paciente, invites, storage/`patient_has_full_access`). El plan de acción citaba 73/370 en verde; ese número **ya no coincide**. | RLS contra instancia real, pagos, email, IA con datos de pacientes, navegador. |
| `npm run check` | Aprobado (`tsc` cliente + `tsconfig.server.json`). | Código excluido por `tsconfig.json` (UI heredada no usada). |
| `npm run build` | Aprobado. Vite 6.4.3, **121 módulos**. Emite `PatientApp` y `CrmDashboard` legacy. | El showroom Nutrigo no entra al bundle productivo: `shouldShowNutrigo` exige `development && demoMode && !hasSession` (`src/components/design-entry.ts`). Eso se corrige en PV-07, no aquí. |

No se ejecutaron migraciones, despliegues ni `npm ci` en esta captura. `npm warn Unknown env config "devdir"` aparece en los scripts y no altera el exit code.

## Inventario de cambios previos (no revisados línea por línea)

Diff `origin/cursor/professional-app-ai-ca47...HEAD` (~635 rutas). Agrupación para no mezclar PRs futuros:

| Grupo | Volumen | Contenido típico |
| --- | --- | --- |
| Artefactos `.scratch/` | 410 | Cortes 1–78, capturas PNG, scripts de verificación. No es código de producto. |
| Interfaz `src/` | 163 | Showroom Nutrigo, onboarding demo, agenda/calendario, mensajes, hábitos, CRM. |
| Backend `server/` | 30 | Store en memoria, contratos, auth, IA, adaptador Supabase. |
| Docs | 12 | Plan de acción, specs Superpowers, inventario de contrato, pendientes. |
| Dashboard de implementación | 8 | Tablero local de PV-01…39. |
| Tareas | 3 | `tasks/plan.md`, `tasks/todo.md`, status JSON. |
| Marca / config | pocos | `marca/`, `package.json`, Vite, `.openai/hosting.json`, un PNG de logo. |
| `supabase/` | 1 | Referencias de contrato; el SQL de migraciones históricas sigue en el árbol completo de la rama. |

Esta captura **no da por revisado** ese diff. Los commits locales no se publicaron. No usar `git add .` para seguir: cada PR de fundaciones lista sólo sus archivos.

## Secretos

- `.env` y `.env.local` están en `.gitignore`. No hay `.env`, `.pem` ni service role trackeados.
- `.env.example` documenta nombres de variables. Contiene una URL de proyecto Supabase (no es una clave). Las claves van vacías. No imprimir valores de un `.env` local.
- El checkpoint no se inspeccionó byte a byte; si aparece un secreto en un PR, no incluirlo.

## Limitaciones que el baseline no cierra

- Auth sin DB sigue abriendo demo (`server/middleware/auth.ts`).
- Serializer paciente todavía puede filtrar campos internos (PV-03).
- IA puede devolver mock ante fallo de proveedor (PV-04).
- SQL de borrador sigue bajo `supabase/migrations/` (PV-05).
- Diseño Nutrigo ausente del build de producción (PV-07).

Siguiente movimiento: PV-06 contrato piloto, PV-07 promoción visual autenticada y PV-08 DB/RLS.

## Fundaciones aplicadas después de esta captura (misma fecha)

PV-02…05 se implementaron sobre este baseline. `check:migrations` queda en verde. La suite todavía tiene 4 fallos en `contracts-016.test.ts` (contrato 016, no este bloque). `sbSetBrief` sigue sin transacción atómica (PV-08).
