# Seguridad y privacidad (apartado A)

Registro vivo del apartado A de `docs/plan-apartados.md`. Lo lleva el hilo "Seguridad y
privacidad". Agentes: `appsec-engineer` (lidera), `secrets-credential-engineer`,
`privacy-engineer`, `penetration-tester`, `legal-compliance-checker`.

## Estado

| Punto del plan | Estado |
| --- | --- |
| 1. Funciones de la base abiertas (129 avisos) | Arreglado en el código (PR de este apartado). Falta aplicarlo en la base de producción con el OK de Facundo. |
| 2. Protección contra contraseñas filtradas | Bloqueado: Supabase la da sólo en el plan Pro; la cuenta está en el plan gratuito. Se decide junto con el plan pago (apartado E). |
| 3. 12 tablas con acceso por fila y sin reglas | Revisadas: son sólo del servidor y así deben quedar. Se encontró y arregló un uso roto (ver abajo). |
| 4. Cabeceras de seguridad de web y API | Hecho en el código, probado en navegador. Se publica con el merge. |
| 5. Prueba con dos cuentas | Hecha dentro de la base (pruebas automáticas). Falta repetirla sobre la app publicada. |
| 6. Términos, privacidad, consentimiento, descargar y borrar la cuenta | En curso. Necesita los datos del responsable. |

## 2026-09-29: funciones de la base

**Qué se encontró.** Las migraciones sacaban el permiso de ejecutar a "public" y "anon",
pero Supabase le da además permiso directo a toda cuenta con sesión sobre cada función
nueva. De las 129 funciones que el asesor marcó, 95 son las que la app usa y validan por
dentro quién llama. Las otras 34 son internas (arman respuestas o validan acceso dentro de
otras funciones) y no validan nada por sí mismas.

**Fuga comprobada** (en una base local armada con las mismas migraciones y los mismos
permisos que Supabase, que da exactamente 129): una nutricionista ajena llamaba
`thread_message_json` con el id de un mensaje y recibía el texto de un mensaje entre otra
nutricionista y su paciente. Hace falta conocer el id del mensaje (es aleatorio), pero es
una puerta abierta a datos de salud.

**Arreglo.** Migración `20260929120000_close_internal_functions.sql`: saca el permiso a las
34 internas y hace que toda función nueva nazca cerrada. Ninguna de las 34 se usa desde la
API, la web, reglas de acceso, vistas ni disparadores (revisado en el código y en la base).
Prueba nueva `server/security/definer-grants.postgres.test.ts`: arma la base con los
permisos de Supabase y exige que sólo las 95 queden abiertas, que "anon" no ejecute
ninguna, que la fuga ya no ocurra y que la dueña siga leyendo sus mensajes. Sin la
migración, la prueba falla.

**Las 95 que siguen abiertas** están listadas en esa prueba. El asesor las seguirá
mostrando como aviso: es esperable, porque la app las llama con la sesión de cada persona
y cada una controla por dentro quién llama. Sumar una nueva a la lista exige que valide
a quien llama.

## 2026-09-29: tablas sin reglas

`audit_events`, `notification_deliveries`, `notification_preferences`, `outbox_events`,
`patient_invite_events`, `payment_webhook_events`, `privacy_access_events`,
`privacy_export_packages`, `privacy_requests`, `processing_jobs`, `recipe_day_assignments`,
`recipe_version_cards`. Todas se leen y escriben sólo desde funciones de la base o desde
el servidor. Sin reglas nadie con sesión puede tocarlas directamente: es lo correcto.

Único problema: el historial de invitaciones (`patient_invite_events`) se escribía con la
sesión de la nutricionista, la base lo rechazaba y el error se ignoraba, así que nunca se
guardaba. Ahora lo escribe el servidor. En producción todavía no hay invitaciones, así
que no se perdió nada.

## 2026-09-29: cabeceras de seguridad

- **Web** (`vercel.json`): política de contenido (sólo scripts propios; conexiones sólo a
  la API y a Supabase; no se puede embeber en otra página), no adivinar tipos, HTTPS
  obligatorio, cámara sólo para la propia app, sin micrófono ni ubicación.
- **API** (`server/index.ts`): no se puede embeber, no adivinar tipos, HTTPS obligatorio,
  sin referencias a otras páginas. Prueba `server/security/headers.test.ts`.
- Comprobado: se armó la web con la política activa y se recorrieron 14 pantallas de
  paciente y nutricionista en modo demo sin ningún bloqueo.

## Contraseñas filtradas

Supabase la ofrece sólo desde el plan Pro (la organización de Facundo está en el plan
gratuito, consultado el 2026-09-29). Queda atada a la decisión del plan pago del
apartado E. Cuando se pase a Pro, se activa en Authentication → Providers → Email →
"Prevent use of leaked passwords".

## Para el hilo del cobro (no es de este apartado)

La dueña de una organización puede ponerle a su propia suscripción el estado "sin cargo"
(`set_organization_subscription_status` acepta `waived`), y eso habilita la delegación de
pacientes entre profesionales. Hoy ninguna pantalla lo usa y no hay cobro, así que no se
tocó. Cuando se arme el cobro, ese estado debería poder ponerlo sólo el servidor.
