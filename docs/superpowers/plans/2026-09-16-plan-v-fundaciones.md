# Plan V: fundaciones — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Leer también el spec. Este archivo es un plan; sus fragmentos aún no fueron aplicados al código.

**Goal:** cerrar las brechas de configuración, privacidad y falsos éxitos antes de agregar persistencia y datos personales.

**Architecture:** conservar el stack y contratos de la demo, introducir configuración explícita y serializers restrictivos. Separar el modo de IA del modo de datos. No tocar una base externa ni hacer un refactor general en este bloque.

**Tech Stack:** React/TypeScript, Hono, Supabase JS, Zod, Vitest, Vite, Node.

**Spec:** [Arquitectura](../specs/2026-09-16-plan-v-arquitectura-design.md), especialmente secciones 1, 4, 6 y 9; [plan de acción](../../plan-de-accion-2026-09-16.md), PV-01…05.

## Global Constraints

- La aplicación activa es `plan-v/`; preservar cambios locales preexistentes.
- Primera entrega: PWA paciente y CRM web; no aplicaciones de tiendas en esta fase.
- Conservar React, TypeScript, Vite, Hono, Zod, Supabase y la identidad Plan V/Poppins.
- Fotos de comidas, estudios y fotos corporales opcionales forman parte del piloto.
- Publicación de planes, recetas y recomendaciones siempre por la nutricionista.
- Ningún dato simulado puede reemplazar silenciosamente un resultado real.
- Datos clínicos, fotos, mensajes y documentos no se guardan en localStorage ni en el cache del service worker.
- Sesiones productivas nunca pueden activar demo ni elegir un rol desde una query o control visual.
- No ejecutar los borradores SQL existentes; preparar migraciones revisadas y probarlas en un entorno descartable con datos sintéticos.
- RLS y permisos deben probarse con JWT de cada actor; service role no sirve para demostrar aislamiento.

## Mapa de archivos de este bloque

| Archivo | Responsabilidad / cambio |
| --- | --- |
| `server/config/runtime.ts` (nuevo) | Resolver modo explícito y requisitos de configuración |
| `server/config/runtime.test.ts` (nuevo) | Matriz de configuración válida/inválida |
| `server/middleware/auth.ts` y `.test.ts` | Demo sólo cuando está permitida; no fallback por ausencia de DB |
| `server/security/contracts.ts` y `.test.ts` | DTO paciente por allowlist y prueba de campos privados nuevos |
| `server/db/supabase-repo.ts` y `.test.ts` | No perder visibilidad de eventos; propagar errores de mensajes/brief |
| `server/ai/errors.ts` (nuevo) | Error explícito y uniforme de proveedor/configuración IA |
| `server/ai/meal-analyzer.ts`, `copilot.ts` | Mock sólo si modo IA demo; fallos sin respuesta ficticia |
| `server/ai/provider-failure.test.ts` (nuevo) | Fallos de proveedor, output vacío y modo deshabilitado |
| `server/index.ts`, `server/schemas.ts` | Error 503 redactado; rechazar foto persistente no soportada antes de llamar IA |
| `src/context/AuthContext.tsx`, `src/components/auth/LoginScreen.tsx` | Demo sólo habilitada explícitamente, no registro público profesional |
| `src/components/design-entry.ts` y `.test.ts` | Mantener demo aislada mientras se prepara promoción visual posterior |
| `.env.example`, `package.json`, `README.md` | Configuración real, scripts y límites de este bloque |
| `scripts/check-migration-safety.mjs` (nuevo) | Impedir uso de borradores como migración |
| `.github/workflows/ci.yml` (nuevo) | Verificación reproducible sin credenciales clínicas |

Los nombres nuevos de funciones que se proponen abajo quedan definidos en su tarea. Ajustar imports al patrón ESM actual; no añadir dependencias para resolver estos cambios.

## Tarea 1 — Baseline y cambios previos (PV-01)

**Files:** revisar Git del repositorio activo, `package.json`, `package-lock.json`, `.gitignore`, `README.md`; crear `docs/release-baseline.md`.

**Interfaces:** consume working tree actual; produce inventario revisable, comandos reproducibles y delimitación del diff propio. No modifica lógica.

- [ ] Ejecutar en `plan-v/` y registrar rama/commit/status, sin volcar secretos:

```powershell
git status --short
git log -1 --oneline
git diff --stat
node --version
npm --version
npm test
npm run check
npm run build
```

- [ ] Registrar en el baseline fecha, versión de herramientas, 73 archivos/370 pruebas si siguen coincidiendo y limitación del showroom DEV. Si el estado cambió, guardar el nuevo resultado real.
- [ ] Inventariar los cambios previos en grupos: interfaz, backend, pruebas, docs, artefactos. No usar `git add .` ni restaurar archivos. Detectar credenciales antes de consolidar sin imprimir sus valores.
- [ ] Acordar unidad de trabajo aislada conservando este working tree: un worktree desde HEAD no contiene los cambios sin commit. Si se crea uno, incluir deliberadamente el estado de trabajo revisado; no perderlo ni copiar `.env`, caches o `.scratch` indiscriminadamente.
- [ ] Revisar diff de esta tarea. Un commit documental, si se decide hacerlo, debe listar únicamente sus archivos; no dar por revisado el resto del árbol.

**Aceptación:** otra persona identifica el repo correcto, reproduce los checks y entiende qué no cubren. No se necesita una prueba unitaria para un inventario documental.

## Tarea 2 — Modos explícitos y auth cerrada (PV-02)

**Files:** crear configuración y tests; modificar middleware/auth tests, `resolveRequestAuth`, `server/index.ts`, AuthContext/LoginScreen, `.env.example` y scripts de desarrollo/pruebas.

**Interfaces:** `readRuntimeConfig(env: Record<string, string | undefined>): RuntimeConfig`, donde `RuntimeConfig` contiene `mode`, `dataMode`, `aiMode`. El middleware recibe `allowDemo: () => boolean`; una DB ausente por sí sola deja de conceder demo.

- [ ] Crear primero estas pruebas de la función pura:

```ts
import { describe, expect, it } from 'vitest';
import { readRuntimeConfig } from './runtime.js';

const db = { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'synthetic-key' };

describe('runtime modes', () => {
  it('requires an explicit application mode', () => {
    expect(() => readRuntimeConfig({})).toThrow('APP_MODE');
  });
  it('does not allow demo in a production process', () => {
    expect(() => readRuntimeConfig({ APP_MODE: 'demo', NODE_ENV: 'production' })).toThrow();
  });
  it('rejects incomplete production database settings', () => {
    expect(() => readRuntimeConfig({ APP_MODE: 'production', AI_MODE: 'disabled' })).toThrow('Supabase');
  });
  it('supports local synthetic demo without provider keys', () => {
    expect(readRuntimeConfig({ APP_MODE: 'demo', AI_MODE: 'demo' })).toEqual({ mode: 'demo', dataMode: 'memory', aiMode: 'demo' });
  });
  it('rejects simulated AI with persistent patient data', () => {
    expect(() => readRuntimeConfig({ ...db, APP_MODE: 'staging', AI_MODE: 'demo' })).toThrow();
  });
  it('allows manual operation with AI disabled', () => {
    expect(readRuntimeConfig({ ...db, APP_MODE: 'production', AI_MODE: 'disabled' }).aiMode).toBe('disabled');
  });
});
```

- [ ] Ejecutar `npm test -- server/config/runtime.test.ts`; debe fallar por módulo inexistente antes de implementar, no por import defectuoso.
- [ ] Implementar el contrato de referencia:

```ts
export type RuntimeConfig = {
  mode: 'demo' | 'test' | 'staging' | 'production';
  dataMode: 'memory' | 'supabase';
  aiMode: 'demo' | 'disabled' | 'live';
};

export function readRuntimeConfig(env: Record<string, string | undefined>): RuntimeConfig {
  const mode = env.APP_MODE;
  if (mode !== 'demo' && mode !== 'test' && mode !== 'staging' && mode !== 'production') {
    throw new Error('APP_MODE is required');
  }
  if (env.NODE_ENV === 'production' && (mode === 'demo' || mode === 'test')) {
    throw new Error('Synthetic mode is forbidden in production');
  }
  const persistent = mode === 'staging' || mode === 'production';
  if (persistent && (!(env.SUPABASE_URL ?? env.VITE_SUPABASE_URL) || !env.SUPABASE_SERVICE_ROLE_KEY)) {
    throw new Error('Supabase configuration is required');
  }
  const aiMode = env.AI_MODE ?? 'disabled';
  if (aiMode !== 'demo' && aiMode !== 'disabled' && aiMode !== 'live') throw new Error('Invalid AI_MODE');
  if (persistent && aiMode === 'demo') throw new Error('Simulated AI is forbidden with persistent data');
  if (aiMode === 'live' && !env.OPENAI_API_KEY) throw new Error('AI provider configuration is required');
  return { mode, dataMode: persistent ? 'supabase' : 'memory', aiMode };
}
```

Este contrato usa service role como requisito transitorio del adaptador actual; PV-08 la separa del cliente JWT de operaciones normales. No implica que deba usarse admin para lecturas clínicas.

- [ ] Conectar configuración al arranque **antes** de `serve()`, no validar sólo en el frontend. Si el proceso fue configurado staging/production y Supabase deja de estar disponible, devolver indisponibilidad; nunca pasar a memory.
- [ ] Extender `createAuthMiddleware` con `allowDemo`. Lógica: health pública mínima; si DB no disponible y `allowDemo()` verdadero → demo; si DB ausente y demo no permitida → 503; con DB disponible, bearer inválido → 401. Añadir test con stub `allowDemo: () => false`, `isSupabaseEnabled: () => false`, y comprobar que no llama al handler.
- [ ] Añadir `allowDemo` al input de `resolveRequestAuth` y actualizar todos sus callers/tests, usando `rg -n 'resolveRequestAuth|createAuthMiddleware' server`. No dejar un helper que todavía infiera demo por ausencia de DB.
- [ ] Frontend: derivar la oferta de demo de `import.meta.env.DEV && import.meta.env.VITE_ALLOW_DEMO === 'true'`; no activar demo por falta de URL. Cuenta sin perfil/vínculo muestra estado de vinculación y no intenta listar pacientes. Registro público siempre paciente; privilegios reales siguen verificados por servidor/DB.
- [ ] Scripts locales deben suministrar `APP_MODE=demo` y `AI_MODE=demo` mediante un launcher Node portable o carga explícita de `.env` validada; no usar `VAR=x command` como único camino en Windows. Tests configuran `APP_MODE=test` sin depender del entorno del desarrollador. Documentar variables, arranque y fallo esperado.
- [ ] Ejecutar tests de config/auth/contratos, `npm run check`, build y comprobar login del build sin switch demo. Revisar diff antes de commit selectivo.

**Aceptación:** quitar credenciales no abre una demo pública; configurar mal producción impide iniciar. Demo local y suite sintética siguen funcionando explícitamente.

## Tarea 3 — Privacidad de la respuesta paciente (PV-03)

**Files:** `server/security/contracts.ts`, sus tests, `server/db/supabase-repo.ts` y sus tests; `src/types/index.ts` sólo si se agrega metadato de visibilidad al dominio interno.

**Interfaces:** `toPatientSelfView(patient: Patient): PatientSelfView` conserva el nombre y contrato necesario para UI existente, pero construye el resultado explícitamente. No usa `...patient` ni un `Omit` como única defensa.

- [ ] Agregar al fixture existente en `contracts.test.ts` una prueba de campo futuro y timeline privada:

```ts
it('excludes unknown internal fields and unclassified timeline from patient JSON', () => {
  const sentinel = 'PRIVATE_AUDIT_SENTINEL';
  const input = {
    ...patient,
    billing_status: 'waived' as const,
    plan_b: sentinel,
    next_focus: sentinel,
    sensitive_hours: sentinel,
    internalFutureField: sentinel,
    timeline: [{ id: 'private', kind: 'goal' as const, atLabel: 'HOY', title: sentinel, body: sentinel }],
  };
  const output = toPatientSelfView(input);
  expect(JSON.stringify(output)).not.toContain(sentinel);
  expect(output.id).toBe(patient.id);
  expect(output.messages.every((message) => Boolean(message.sent_at))).toBe(true);
});
```

- [ ] Ejecutar `npm test -- server/security/contracts.test.ts`; este caso debe demostrar el fallo actual. No modificar fixtures para ocultarlo.
- [ ] Reemplazar el spread residual por selección explícita, manteniendo las funciones ya existentes `toPatientSelfMealLog`, filtro de mensajes enviados y lógica de billing. Contrato conservador del primer corte:

```ts
const visible = {
  id: patient.id,
  name: patient.name,
  initials: patient.initials,
  tone: patient.tone,
  billing_status: resolveBillingStatus(patient),
  billing_until: patient.billing_until,
  status: patient.status,
  stage: patient.stage,
  goal: patient.goal,
  goal_status: patient.goal_status,
  goal_progress: patient.goal_progress,
  goal_updated_at: patient.goal_updated_at,
  sensitive_hours: '',
  plan_b: '',
  next_focus: '',
  adherence_score: patient.adherence_score,
  time: patient.time,
  hydration: patient.hydration,
  energy: patient.energy,
  sleep_minutes: patient.sleep_minutes,
  appointment: patient.appointment,
  appointment_history: patient.appointment_history ?? [],
  habit_logs: patient.habit_logs,
  activity_logs: patient.activity_logs ?? [],
  resource_assignments: patient.resource_assignments ?? [],
  todayPlan: patient.todayPlan,
  weekPlan: patient.weekPlan,
  timeline: [],
  meal_logs: patient.meal_logs.map(toPatientSelfMealLog),
  messages: patient.messages
    .filter((message) => Boolean(message.sent_at))
    .map(({ id, patient_id, from, text, sent_at, delivered_at, read_at }) =>
      ({ id, patient_id, from, text, sent_at, delivered_at, read_at })),
};
```

Este fragmento muestra el campo por campo de primer nivel. Antes de cerrar la tarea, hacer lo mismo con objetos anidados (appointment, logs, hábitos, asignaciones, planes) para que una propiedad privada futura tampoco cruce por ellos. Mantener `timeline: []` en este parche hasta que exista una proyección pública clasificada; la timeline profesional se conserva. `plan_b` publicado tendrá su campo explícito en el contrato nuevo, no reutilizar la nota interna.

- [ ] En `loadPatientExtras`, conservar `visibility` en el modelo profesional y preparar lectura por audiencia con `.eq('visibility', 'patient')` para el futuro endpoint paciente; una fila sin clasificación no se vuelve pública. Añadir prueba al harness que verifica ese filtro cuando se usa lectura paciente. No confiar en el mapper cliente del showroom.
- [ ] Repetir el test sentinel en `/api/me/patient` y `/api/patients/:id` con actor paciente usando patrón de mocks de integración existente. Comprobar que actor profesional conserva nota y timeline; A/B siguen aislados. Introducir sentinelas anidados para `appointment.prep_note` y una futura nota de plan.
- [ ] Ejecutar `npm test -- server/security/contracts.test.ts server/db/supabase-repo.test.ts`, las dos integraciones nuevas, `npm run check` y browser smoke del paciente. Revisar cualquier cambio visual causado por ocultar un dato que nunca debió publicarse; no reexponerlo para conservar la apariencia.

**Aceptación:** serializer/API no devuelven los sentinelas en ningún nivel. Los contratos nuevos de datos personales deben mantener esta propiedad.

## Tarea 4 — IA y DB sin falsos éxitos (PV-04)

**Files:** ambos módulos IA, `server/ai/errors.ts`, `server/ai/provider-failure.test.ts`, `server/index.ts`, repo Supabase y tests.

**Interfaces:** `AIUnavailableError` con `code='AI_UNAVAILABLE'`; funciones existentes conservan su salida de éxito. `AI_MODE=disabled` devuelve indisponibilidad explícita. En este primer corte no se crea un registro falso; PV-22 separará el guardado de comida y el job asíncrono para conservarlo incluso ante fallos.

- [ ] Agregar prueba de proveedor fallido con mock de SDK; ejemplo para ampliar con fixture de paciente del store:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('ai', () => ({
  generateText: vi.fn().mockRejectedValue(new Error('provider unavailable')),
  Output: { object: vi.fn((value) => value) },
}));
import { analyzeMeal } from './meal-analyzer.js';

afterEach(() => vi.unstubAllEnvs());
describe('meal provider failures', () => {
  it('never substitutes demo food when live generation fails', async () => {
    vi.stubEnv('AI_MODE', 'live');
    vi.stubEnv('OPENAI_API_KEY', 'synthetic-only');
    await expect(analyzeMeal({ description: 'comida de prueba', slot: 'Almuerzo' }))
      .rejects.toMatchObject({ code: 'AI_UNAVAILABLE' });
  });
});
```

- [ ] Ejecutar test y observar que el comportamiento actual devuelve mock y falla. Agregar casos output null, timeout, modo disabled y demo explícita. En copilot usar `getStore().patients[0]` sintético y verificar el mismo error; no usar pacientes reales.
- [ ] Implementar error:

```ts
export class AIUnavailableError extends Error {
  readonly code = 'AI_UNAVAILABLE';
  constructor() {
    super('El análisis no está disponible. Podés volver a intentarlo.');
    this.name = 'AIUnavailableError';
  }
}
```

- [ ] En cada módulo, resolver modo desde config. `demo` permite `mockFromText/mockFromImage/mockBrief`; `disabled` lanza AIUnavailableError. En `live`, `output` ausente o error de SDK lanza AIUnavailableError, nunca mock. Configurar timeout/cancelación en la capa SDK de acuerdo con su versión instalada; conservar detalles del error sólo en log técnico redactado.
- [ ] Hono convierte ese error en 503 con `{ code: 'AI_UNAVAILABLE', message, requestId }`. UI mantiene la captura y ofrece reintentar/registro manual al quedar habilitado PV-22. Antes de analizar, rechazar foto con Storage persistente no soportado: mover comprobación que hoy ocurre después de `analyzeMeal`. Probar que el mock de SDK **no se llamó** cuando la operación devuelve 501.
- [ ] En `sbAddMessage` comprobar `error` del insert y lanzarlo. Test con el harness existente:

```ts
it('propagates an unsuccessful message insert', async () => {
  const error = { message: 'synthetic database failure' };
  harness.push('messages', { data: null, error });
  await expect(sbAddMessage('patient-1', 'nutri-1', 'author-1', 'hola', false))
    .rejects.toEqual(error);
});
```

- [ ] Revisar cada resultado de escritura en `sbSetBrief`; ninguna falla se ignora. No declarar atómica la secuencia delete/insert/update: reemplazar por RPC transaccional en PV-08; mientras tanto el error aborta, no devuelve éxito y la limitación queda documentada.
- [ ] En integración de mensajes, simular error del repositorio y exigir no-2xx, ninguna timeline de éxito y ninguna marca enviada. Verificar que detalles DB no aparecen en el cuerpo público.
- [ ] Ejecutar pruebas IA/DB/integración, `npm run check` y revisión del diff. Mantener mocks sintéticos únicamente en modo demo/test elegido.

**Aceptación:** no aparece una comida ficticia al fallar IA; no se afirma envío si falló DB; una foto rechazada no consume una llamada de IA.

## Tarea 5 — CI y seguridad de migraciones (PV-05)

**Files:** crear guard, workflow y política de migración; actualizar scripts/README. La migración histórica insegura se preserva, no se ejecuta ni se borra.

**Interfaces:** `npm run check:migrations` sale 1 ante cualquier marcador de borrador en `supabase/migrations/*.sql`; sin marcadores sale 0. El pipeline no requiere secretos productivos.

- [ ] Implementar el guard como script de lectura:

```js
import { readdir, readFile } from 'node:fs/promises';
const dir = new URL('../supabase/migrations/', import.meta.url);
const files = (await readdir(dir)).filter((name) => name.endsWith('.sql'));
const unsafe = [];
for (const name of files) {
  const text = await readFile(new URL(name, dir), 'utf8');
  if (/DRAFT|DO NOT APPLY|NO CORRER/i.test(text)) unsafe.push(name);
}
if (unsafe.length) {
  console.error('Review-only SQL is in the migration chain:', unsafe.join(', '));
  process.exitCode = 1;
}
```

- [ ] Ejecutar contra estado actual: debe fallar nombrando `20260901000000_plan_v_v0.sql`. Es una prueba de la guarda, no autorización a correr SQL.
- [ ] Inventariar si existe algún ambiente que haya aplicado ese archivo antes de alterar historia. Sin evidencia de despliegue, registrar la migración como legado no ejecutable y moverla con Git a `supabase/contracts/legacy/`, preservando contenido y actualizando referencias. Si está aplicada, mantener historial y diseñar reparación incremental en PV-08; no falsear hashes ni simular un baseline limpio. En Windows comprobar rutas absolutas origen/destino dentro de `plan-v/supabase/` antes de mover.
- [ ] Añadir script `"check:migrations": "node scripts/check-migration-safety.mjs"`. Elegir y fijar Node compatible con todas las dependencias instaladas, registrar su versión en baseline y validar con `npm ci`; no imponer una versión de runtime no comprobada.
- [ ] Crear workflow: checkout, setup-node con la versión validada, `npm ci`, `npm test`, `npm run check`, `npm run build`, `npm run check:migrations`. Variables sintéticas `APP_MODE=test`, `AI_MODE=demo`, sin claves de proveedores. Al agregar E2E/RLS en PV-08/PV-33, incorporar jobs separados, no prometer que esta CI ya los ejecuta.
- [ ] CI publica sólo artifacts de build/reportes redactados. No subir `.env`, datos pacientes, capturas sensibles ni todo `.scratch`. Workflow de deploy futuro depende de CI y revisión del contrato.
- [ ] Ejecutar localmente la secuencia equivalente y verificar la ausencia del showroom en build como limitación conocida hasta PV-07. Revisar diff y documentar salida; no desplegar como parte de este bloque.

**Aceptación:** CI detecta fallos reales y no puede usar inadvertidamente el draft SQL. Código, pruebas y docs de fundaciones están revisados de manera independiente del gran diff previo.

## Cierre del bloque y siguiente entrega

- [ ] Cada tarea cuenta con evidencia propia de salida, sin marcar el lote completo por una sola prueba.
- [ ] La suite y build siguen aprobados; los sentinelas privados y fallos de IA están cubiertos por regresiones.
- [ ] Actualizar estado PV-01…05 en backlog sólo según evidencia, preservando los IDs restantes pendientes.
- [ ] Continuar con contrato piloto (PV-06), promoción visual autenticada (PV-07) y DB/RLS (PV-08). Después invitación → onboarding → ficha → archivos.

No se requiere resolver las 39 entregas en un único PR. Al ejecutar, cada subsistema posterior recibe su plan detallado contra el contrato aprobado, con pruebas reales de ambas superficies. Este documento termina al cerrar fundaciones y no autoriza publicar la app.
