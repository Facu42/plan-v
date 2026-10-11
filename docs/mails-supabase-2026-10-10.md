# Mails de Plan V: Supabase y Brevo (2026-10-10)

Facundo eligió primero Supabase y después Brevo para los mails a pacientes.

## Hecho (PR #89, sin migración)

- **Invitación por mail.** «Mandar por mail» en «Invitación lista», junto a «Copiar enlace» y «WhatsApp».
  - Con Brevo configurado, Supabase solo arma el enlace (`generateLink`) y el mail sale por Brevo, en castellano.
    No hace falta tocar el servidor de mails ni las plantillas de Supabase.
  - Sin cuenta: invitación (alta como paciente). Con cuenta: enlace para entrar.
  - Al abrirlo, la app acepta la invitación con las reglas de siempre: mail confirmado y coincidente.
  - Sin Brevo: usa el mail de fábrica de Supabase, que solo llega al equipo del proyecto (unos 2 por hora).
- **Recordatorio de turno por mail, 24 horas antes.**
  - Lo hace el mismo proceso de tareas de la API (`server/mail/reminder-worker.ts`). Cada tramo de 10 minutos busca
    los turnos agendados que empiezan 24 horas después.
  - Solo escribe a pacientes activas, vinculadas y con mail confirmado.
  - Tiene día y hora de Argentina, modalidad, enlace de la videollamada y botón a la Agenda.
  - No guarda nada en la base. Para no repetir el envío, cada turno y horario lleva una llave fija
    (`idempotencyKey` de Brevo).
  - Si se cambia el horario del turno, sale un recordatorio nuevo para el horario nuevo.
- En la demo y sin clave no sale ningún mail.

## Variables (solo en Railway, nunca `VITE_`)

- `BREVO_API_KEY`: clave de Brevo (SMTP y API › Claves API).
- `BREVO_SENDER_EMAIL`: remitente verificado en Brevo (Remitentes).
- `BREVO_SENDER_NAME`: opcional, por omisión «Plan V».
- La dirección del sitio sale de `PUBLIC_SITE_URL` o `CORS_ORIGINS`, como hoy.

## Límites y pendientes

- **Recordatorios perdidos.** Si la API está caída justo en el tramo de un turno, ese recordatorio no sale; no hay
  reintento guardado. Para reintentos y registro de lo enviado haría falta una migración, que no se pidió.
- **Opción de no recibir mails.** La paciente todavía no puede elegir no recibir recordatorios por mail.
- **Remitente.** Un remitente con dominio propio (por ejemplo, hola@planv.app) llega mejor que uno de Gmail.
  Para eso hay que verificar el dominio en Brevo.
- **Dirección de vuelta.** Tiene que estar permitida en Supabase › Auth › URL Configuration, por ejemplo
  `https://plan-v-eight.vercel.app/**`. Si no lo está, el enlace lleva al inicio del sitio y la paciente debe abrir
  el enlace copiado. No se pudo comprobar desde la nube.
- **Fuentes:** https://supabase.com/docs/guides/auth/auth-smtp y
  https://developers.brevo.com/changelog/email-api-now-supports-idempotency
