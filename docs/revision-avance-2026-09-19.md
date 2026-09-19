# Plan V: secuencia del 19 de septiembre de 2026

Fecha: 19 de septiembre de 2026. Estado: **secuencia de ejecución acordada**, no cierre de staging ni del piloto.

Este corte fija el orden para terminar el circuito clínico con datos sintéticos y cierra varias entregas que hoy están en revisión. No sustituye el [plan de acción](plan-de-accion-2026-09-16.md) ni infla el porcentaje del dashboard. Conserva la regla: **no aplicar SQL a un proyecto que pueda tener pacientes**.

Base de trabajo: rama `cursor/professional-app-ai-ca47`. Informe previo: [17/09](revision-avance-2026-09-17.md). Verificación de seguimiento: Centro de seguimiento y fecha futura en español.

## Tres cortes

### 1. Cerrar invitación → ingreso → revisión → plan publicado (H1 + H2, con publicación del plan vigente)

Resultado utilizable: dos profesionales y dos pacientes ficticios recorren el circuito en una instancia **descartable**. El paciente acepta la invitación, completa y reanuda el ingreso, comparte o omite estudios, y ve un plan publicado. La profesional revisa sin exponer notas privadas. Un cambio de sesión y un reinicio de API conservan lo guardado. Nutri A no ve a Paciente B.

| Criterio de salida | Cómo se comprueba | Estado al 19/09 |
| --- | --- | --- |
| Ver seguimiento abre el centro, no Inicio | Navegador, Pacientes → Ver seguimiento | **Hecho** (`7b6d3c1`) |
| Fecha futura en español | Formulario de peso/cintura / estudio | **Hecho** (`7b6d3c1`) |
| Dos profesionales y dos pacientes sintéticos | Nutri A/B, Paciente A/B; nunca datos reales | Bloqueado: falta `DISPOSABLE_DATABASE_URL` |
| Matriz de permisos RLS-01…23 | JWT de cada actor, no `service_role` | **PGlite RLS-01…23 + reopen PASS** (`server/rls-matrix.postgres.test.ts`). Live JWT omitido |
| Persistencia tras reinicio y cambio de sesión | Reabrir API/base y otra sesión | PGlite reabre el directorio; Auth real pendiente |
| Subida y retiro de un estudio PDF/JPG/PNG | Consentimiento, visor temporal, retiro, aislamiento A/B, sin IA | **Circuito demo + PGlite en este corte**; Storage live pendiente |
| Invitación de un uso → ingreso → revisión profesional → plan publicado | Recorrido de dos roles en staging | Pendiente de instancia descartable. En demo: ingreso, revisión y menú publicado ya existen |

Entregas que este corte puede pasar a **completadas** cuando haya evidencia live: PV-07, PV-08, PV-09, PV-11, PV-12, PV-13, PV-14. PV-10 (read-back real), PV-15 (Storage completo) y PV-16 (estudios en Auth/Storage reales) cierran con la misma instancia. El “plan publicado” de este corte es el plan semanal vigente que la profesional edita y el paciente lee, más alternativas ya revisadas. No exige todavía el catálogo versionado de recetas (PV-18/19).

### 2. Validar acompañamiento e IA sobre esa base (H4)

Sólo después del corte 1, con las mismas cuentas sintéticas:

1. Diario de comidas persistente (foto/texto, revisión, fallo de IA sin perder el registro).
2. Mensajes entre sesiones y entre dispositivos.
3. Agenda con confirmación/reprogramación.
4. Propuesta de menú/receta → revisión de Verónica → publicación. El paciente no ve el borrador.

Criterio de salida: IA no publica ni envía mensajes sola; alergias declaradas se respetan; un segundo dispositivo ve lo publicado y no lo privado. Tickets: PV-22, PV-23, PV-25, PV-27, PV-28.

### 3. Completar el piloto operable (H5)

PWA instalable, procesamiento durable, respaldos con restauración conjunta DB+Storage, y recorrido final en móvil (paciente y CRM). Tickets: PV-29…PV-33. Go/no-go explícito; no se cuenta como piloto listo un showroom en memoria.

## Qué no entra en el corte 1

- Cobros Mercado Pago, organizaciones, biblioteca de ejercicios, paridad visual integral Nutrigo.
- Aplicar `016` / `016b` draft, `supabase db push` o SQL sobre un proyecto con filas en `public.patients`.
- Interpretación automática de estudios o envío de PDF/fotos corporales a un proveedor de IA.

## Bloqueo de staging

`npm run apply:disposable` aplica `core` / `intake` / `care` / `clinical_documents` a Postgres vacío y aborta si ya hay pacientes. Este entorno no tiene `DISPOSABLE_DATABASE_URL` ni `DISPOSABLE_SUPABASE_APPLY`. Hasta contar con un proyecto **vacío y descartable**, el corte 1 se verifica en demo (memoria) y en PGlite (RLS con shims de Auth/Storage). Eso no acredita invitaciones, JWT ni Storage de Supabase.

## Trabajo de este informe

- Secuencia de tres cortes y criterios de salida, alineados al pedido del 19/09.
- Circuito de estudios opcionales: consentimiento `clinical_document`, PDF/JPG/PNG, visor de un minuto, retiro por el paciente, aislamiento y exclusión de IA.
- Correcciones de seguimiento del 18/09 ya en la rama.
- Matriz RLS-01…23 ejecutable en PGlite (JWT shim, no Auth/PostgREST live) con Nutri A/B y Paciente A/B sintéticos.

Próximo movimiento del corte 1: conectar la instancia descartable, repetir la matriz con JWT reales y el recorrido con dos profesionales y dos pacientes ficticios, incluyendo subida y retiro de un estudio.
