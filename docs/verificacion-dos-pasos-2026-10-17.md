# Verificación en dos pasos (issue #132, tarea 1)

Código de 6 cifras de una aplicación (Google Authenticator o parecida) para nutricionistas y administradoras.
Todo viene **apagado de fábrica**: sin tocar nada, la app se comporta igual que hoy.

## Qué hay
- **Pantallas** (`src/components/auth/MfaScreen.tsx`): alta con QR y clave escrita, y pedido de código. Sirven también a quien entró con Google.
- **Cuándo aparece** (`src/context/mfa.ts`): a quien ya dio de alta su código se le pide siempre al entrar. A quien no, solo si es nutricionista o entra a `/admin` **y** `VITE_MFA_ENFORCE=1`. A las pacientes no se les exige.
- **Servidor** (`server/security/mfa.ts`, `server/middleware/auth.ts`, `server/admin/routes.ts`): con `MFA_ENFORCE=1`, una nutricionista o administradora con token `aal1` recibe 403 `mfa_required` en toda la API, salvo `/api/auth/*` y `/api/admin/me`. `requireAdmin` lo repite.
- **Base** (`supabase/migrations/20261017030000_mfa_aal2_gate.sql`, **sin aplicar**): una regla restrictiva `mfa_aal2_gate` en 7 tablas de datos clínicos (las del panel de administración las protege el servidor), controlada por `private.mfa_enforcement.enabled` (falso de fábrica). Aditiva: sin DROP.

## Cómo prenderlo, en este orden (cada paso con la frase escrita de Facundo)
1. Supabase → Authentication → Multi-Factor: dejar prendido TOTP (Enroll y Verify).
2. Publicar este PR (no cambia nada: los interruptores están apagados).
3. Facundo y Verónica entran y dan de alta su código (aparece solo si se prende el paso 4; o desde la pantalla de ingreso apenas se prenda).
4. Prender el frente y el servidor: `VITE_MFA_ENFORCE=1` en Vercel y `MFA_ENFORCE=1` en Railway (API).
5. Aplicar la migración y, recién después, `update private.mfa_enforcement set enabled = true;`.
Para volver atrás: quitar las variables o `enabled = false`.

## Riesgo principal
Dejar afuera a quien administra. Por eso el frente pide el código antes de que el servidor lo exija, y las rutas de ingreso quedan libres. Si alguien pierde su aplicación de códigos hay que quitarle el factor desde Supabase (Authentication → Users → Factors).

## Lo que queda para otra tarea
- Ofrecerlo a pacientes desde el menú de cuenta (hoy solo se pide a quien ya lo dio de alta).
- Cuentas que crea el administrador (`email_confirm: true`): quedan obligadas en su primer ingreso apenas se prende el interruptor, porque no tienen código dado de alta.
