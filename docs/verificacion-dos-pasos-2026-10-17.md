# Verificación en dos pasos (issue #132, tarea 1)

Resumen actualizado: [mfa-totp.md](mfa-totp.md).

Código de 6 cifras de una aplicación (Google Authenticator o parecida) para nutricionistas y administradoras.
Todo viene **apagado de fábrica** para nutricionistas: `/admin` sí pide el segundo paso.

## Qué hay
- **Pantallas** (`src/components/auth/MfaScreen.tsx`): alta con QR y clave escrita, y pedido de código. Sirven también a quien entró con Google.
- **Cuándo aparece** (`src/context/mfa.ts`): a quien ya dio de alta su código se le pide siempre al entrar. A quien no, solo si es nutricionista o entra a `/admin` **y** `VITE_MFA_ENFORCE=1`. A las pacientes no se les exige.
- **Menú de cuenta** (`ShowroomSecurity.tsx`): «Verificación en dos pasos» para activar o quitar el código, para todos los roles. A quien lo tiene obligatorio no se le ofrece quitarlo.
- **Servidor** (`server/security/mfa.ts`, `server/middleware/auth.ts`, `server/admin/routes.ts`): con `MFA_ENFORCE=1`, una nutricionista o administradora con token `aal1` recibe 403 `mfa_required` en toda la API, salvo `/api/auth/*` y `/api/admin/me`. `requireAdmin` lo repite.
- **Base** (`supabase/migrations/20261017030000_mfa_aal2_gate.sql`, **sin aplicar**): una regla restrictiva `mfa_aal2_gate` en 7 tablas de datos clínicos (las del panel de administración las protege el servidor), controlada por `private.mfa_enforcement.enabled` (falso de fábrica). Aditiva: sin DROP.

## Cómo prenderlo, en este orden (cada paso con la frase escrita de Facundo)
1. Supabase → Authentication → Multi-Factor: dejar prendido TOTP (Enroll y Verify).
2. Publicar este PR (no cambia nada: los interruptores están apagados).
3. Facundo y Verónica entran y dan de alta su código desde el menú de cuenta → «Verificación en dos pasos» → Activar. Lo mismo vale para cualquier paciente que quiera.
4. Prender el frente: `VITE_MFA_ENFORCE=1` en Vercel. Desde ahí, una nutri o quien entre a `/admin` sin código ve la pantalla de alta al entrar.
5. Cuando ellos dos ya entraron con código, prender el servidor: `MFA_ENFORCE=1` en Railway (API).
6. Aplicar la migración y, recién después, `update private.mfa_enforcement set enabled = true;`.
Para volver atrás: quitar las variables o `enabled = false`.

## Riesgo principal
Dejar afuera a quien administra. Por eso el frente pide el código antes de que el servidor lo exija, y las rutas de ingreso quedan libres. Si alguien pierde su aplicación de códigos hay que quitarle el factor desde Supabase (Authentication → Users → Factors).

## Lo que queda para otra tarea
- Cuentas que crea el administrador (`email_confirm: true`): quedan obligadas en su primer ingreso apenas se prende el interruptor, porque no tienen código dado de alta.
