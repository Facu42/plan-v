# D. Autenticación e ingreso — registro

Hilo "Ingreso y autenticación de la app". Rama `claude/autenticacion-ingreso-0zntyd`.

## 2026-09-29 — Entrar con Google (preparado, falta prenderlo)

Hecho en la app:

- Botón "Continuar con Google" en Entrar y "Registrarme con Google" en Registro. Aparece solo
  cuando Google está prendido en Supabase (la app lo consulta al abrir), así que se puede
  publicar antes de tener las credenciales: hasta entonces no se ve nada distinto.
- En Registro, el botón de Google pide primero la casilla de términos. Si eligió "Soy
  nutricionista", al volver de Google se abre el consultorio igual que con mail (solo en cuentas
  recién creadas: una cuenta vieja no cambia de tipo).
- Pantalla "Antes de seguir": cualquier cuenta con sesión que no haya aceptado la versión vigente
  de los términos (`src/legal.ts`) la ve una vez antes de usar la app. Hasta aceptar no se cargan
  datos ni se acepta una invitación. Cubre a quien entra con Google desde "Entrar" sin haber
  pasado por el registro y, por decisión por defecto, también a las cuentas creadas antes del
  29/09/2026 (no aceptaron los textos publicados ese día). Si cambia la versión, se vuelve a pedir.
- La invitación por enlace sigue andando con Google (queda guardada en la pestaña mientras va y
  vuelve).
- Google marca el mail como verificado, así que la invitación se acepta sin mail de confirmación.
  Si la persona ya tenía cuenta con ese mail, Supabase une las dos: entra a la misma cuenta.

Sin migraciones: no toca la base.

Pruebas: `src/context/google-signup.test.ts`. 899 pruebas en total, `npm run check` limpio.

### Lo que falta para prenderlo (lo hace Facundo, fuera del código)

1. En Google Cloud (console.cloud.google.com), proyecto nuevo "Plan V":
   - Pantalla de consentimiento de OAuth: tipo Externo, nombre "Plan V", mail
     planv.nutricion@gmail.com, dominio plan-v-eight.vercel.app, enlaces a
     `/legal/privacidad.html` y `/legal/terminos.html`. Publicarla ("En producción").
   - Credenciales → ID de cliente de OAuth → Aplicación web.
     - Orígenes autorizados: `https://plan-v-eight.vercel.app`
     - URI de redireccionamiento: `https://wvosvlxpfytokwfbcero.supabase.co/auth/v1/callback`
2. En Supabase (proyecto plan-v-app) → Authentication → Sign In / Providers → Google: pegar el ID
   de cliente y el secreto, y activar.
3. En Supabase → Authentication → URL Configuration: Site URL `https://plan-v-eight.vercel.app`
   y la misma dirección en Redirect URLs.

Los pasos 2 y 3 son cambios de producción: necesitan el OK escrito de Facundo.

## Pendiente del apartado (docs/plan-apartados.md, D)

2. Mails de confirmación y recuperación con remitente propio (espera los mails reales).
3. Límite de intentos fallidos y aviso de ingreso desde un equipo nuevo.
4. "Cerrar sesión en todos los equipos" y cambiar contraseña desde el perfil.
5. Pantallas de ingreso con los componentes del archivo.
6. Apple: solo cuando se publique en la tienda de iPhone.
