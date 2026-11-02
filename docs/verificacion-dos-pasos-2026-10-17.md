# Verificación en dos pasos (TOTP de Supabase Auth)

Código de 6 cifras de una aplicación (Google Authenticator o parecida).

## Quién lo tiene

- **`/admin` es obligatorio.** Quien entra ahí tiene que dar de alta el código y usarlo. El servidor lo pide en las rutas del centro de mando aunque `MFA_ENFORCE` esté apagado. La pantalla de alta aparece sola al abrir `/admin`.
- **La nutricionista lo elige.** En Ajustes → Seguridad, el interruptor «Dos pasos para vos» abre la alta (código QR). Puede quitarlo cuando quiera. Si lo activó, cada ingreso le pide el código y la API rechaza la sesión que no lo pasó.
- **La paciente no está obligada.** Si alguna vez lo activó, también se le pide al entrar.

No hace falta prender `MFA_ENFORCE` ni `VITE_MFA_ENFORCE`. Esos interruptores ya no obligan a todo el consultorio.

## Qué hay

- **Pantallas** (`src/components/auth/MfaScreen.tsx` y `ShowroomSecurity.tsx`): alta con QR y clave escrita, y pedido de código. Usan `supabase.auth.mfa` con TOTP y el nombre «Nutridash». Sirven también a quien entró con Google.
- **Cuándo aparece** (`src/context/mfa.ts`): con un código ya dado de alta, siempre. Sin código, solo en `/admin`.
- **Servidor** (`server/security/mfa.ts`, `server/middleware/auth.ts`, `server/admin/routes.ts`): si Auth dice que hay un TOTP verificado y el token es `aal1`, responde 403. `/admin` exige `aal2` en sus rutas. El ingreso y `/api/admin/me` siguen abiertos para poder mostrar la pantalla.
- **Base** (`supabase/migrations/20261017030000_mfa_aal2_gate.sql`, **sin aplicar**): una regla extra en tablas clínicas, apagada de fábrica. No se aplica sin la frase de Facundo.

## Qué tiene que hacer Facundo

1. En Supabase → Authentication → Multi-Factor, dejar prendido TOTP (Enroll y Verify). Sin eso el QR no se puede crear.
2. Entrar a `/admin` y dar de alta su código antes de usar el centro de mando. Si pierde la aplicación de códigos, hay que quitarle el factor en Supabase (Authentication → Users → Factors).
3. No cargar `MFA_ENFORCE` ni `VITE_MFA_ENFORCE` para obligar a las nutricionistas. Ellas lo prenden en Ajustes.

## Riesgo

Dejar afuera a quien administra si todavía no dio de alta el código. Por eso `/admin` muestra la alta antes de cargar el centro, y las rutas de ingreso quedan libres.
