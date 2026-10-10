# Mails con Supabase (2026-10-10)

Facundo eligió mandar los mails con Supabase, sin servicio nuevo.

## Hecho (PR #89)

- **Invitación a pacientes por mail.** En el aviso «Invitación lista» se suma «Mandar por mail», junto a
  «Copiar enlace» y «WhatsApp». Manda el mismo enlace vigente (`/app/inicio?invite=…`):
  - Sin cuenta: la invitación de Supabase Auth crea la cuenta como paciente.
  - Con cuenta: un enlace para entrar (sin crear otra cuenta).
  - Al abrirlo, la app acepta la invitación con las reglas de siempre: mail confirmado y coincidente.
- En la demo no sale ningún mail real; se avisa en pantalla.
- No hay migración ni claves nuevas: usa la clave de servicio que la API ya tiene. La dirección del sitio sale de
  `PUBLIC_SITE_URL` o de `CORS_ORIGINS`, igual que las altas del panel.

## Lo que Supabase solo no alcanza

1. **El servidor de mails que trae Supabase** solo manda a direcciones del equipo del proyecto. A cualquier otra
   responde «Email address not authorized», y tiene un tope de unos 2 mails por hora.
   - Sin cambiar eso, a una paciente real la app le dice que copie el enlace o lo mande por WhatsApp.
   - Se arregla cargando un servidor de mails propio (SMTP) en Supabase, Auth › SMTP. Opciones: Brevo o Resend
     con plan gratis, o un Gmail con clave de aplicación. Lo decide Facundo, y es configuración de producción.
   - Fuente: https://supabase.com/docs/guides/auth/auth-smtp
2. **Recordatorios de turnos y avisos por mail.** Supabase Auth solo manda mails de cuenta (alta, invitación, enlace
   para entrar, cambio de clave), no mensajes libres.
   - Programarlos se puede (tareas programadas en la base o una función de Supabase), pero el envío necesita un
     servicio de mails aparte.
   - Hoy los avisos quedan dentro de la app.
3. **Los textos del mail** (asunto y cuerpo de la invitación) se cambian en Supabase › Auth › Email Templates.
   Hoy son los de fábrica, en inglés.
4. **La dirección de vuelta** tiene que estar permitida en Supabase › Auth › URL Configuration, por ejemplo
   `https://plan-v-eight.vercel.app/**`. Si no lo está, el enlace lleva al inicio del sitio y la paciente debe abrir
   el enlace copiado. No se pudo comprobar desde la nube.
