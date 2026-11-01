# Verificación en dos pasos (TOTP)

Código de 6 cifras de una aplicación (Google Authenticator o parecida). Usa el MFA de Supabase Auth: `enroll`, `challenge` y `verify`. El token queda en nivel `aal2`.

## Quién la usa

- **Nutricionistas:** opcional. La prenden o apagan en Ajustes → Seguridad, o en el menú de cuenta. Ven un QR y, si no pueden escanear, la clave escrita. Si ya la activaron, al entrar se les pide el código.
- **`/admin`:** obligatoria. El frente obliga a dar de alta el código. El servidor rechaza `/api/admin/*` sin `aal2` (salvo `/api/admin/me`, para el aviso del menú), aunque `MFA_ENFORCE` esté apagado.
- **Pacientes:** no se les exige. Si una paciente la activa por su cuenta, al entrar se le pide el código.

## Interruptores (siguen apagados de fábrica)

- Frente: `VITE_MFA_ENFORCE=1` obliga el alta a nutricionistas.
- API: `MFA_ENFORCE=1` rechaza a nutricionistas o administradoras con token `aal1` en el resto de la API.
- Base: `supabase/migrations/20261017030000_mfa_aal2_gate.sql` **sin aplicar**. No se prende sin la frase escrita de Facundo.

Pasos para prenderlos: [verificacion-dos-pasos-2026-10-17.md](verificacion-dos-pasos-2026-10-17.md).

## Si se pierde la aplicación de códigos

Hay que quitarle el factor desde Supabase → Authentication → Users → Factors. La app no guarda la clave secreta.

## Qué no hace este cambio

No aplica migraciones en producción. No publica a Vercel ni Railway. No toca #244 ni #245.

## Informe del paso 10 (Regression Guard)

- **Flujos críticos verificados:** ingreso con sesión aal1/aal2 ✅ (unitario); alta TOTP enroll/challenge/verify ✅; Ajustes de la nutri (activar/desactivar) ✅ unitario y e2e de demo; `/admin` sin aal2 → 403 ✅; pacientes sin MFA obligatorio ✅. Sesión real de `/admin` en producción ⚠️ (no se tocó prod).
- **Regresiones cubiertas:** bootstrap de nutri nueva antes de MFA (setup y cola vacía) se conserva; `/api/admin/me` sigue libre para el aviso del menú.
- **Contratos revisados:** frente (`decideMfaStep`, Ajustes/QR) ↔ cliente `supabase.auth.mfa` (enroll/challenge/verify) ↔ middleware (`isAdminProtectedPath` + `requireAdmin`). El payload de error es `{ error, code: 'mfa_required' }`.
- **Áreas frágiles:** auth y `/admin`. Un token aal1 en `/api/admin/*` (salvo `/me`) ahora se corta en el middleware aunque `MFA_ENFORCE` esté apagado.
- **Migraciones:** N/A en este cambio. La existente `20261017030000_mfa_aal2_gate.sql` sigue sin aplicar.
- **Fire test:** `isAdminProtectedPath` forzado a falso → la prueba de `/admin` aal1 pasó de 403 a 200 ❌; se revirtió y volvió a verde ✅.
- **Automatizaciones nuevas:** pruebas unitarias de TOTP y del guard de admin; e2e de Ajustes en demo. No hay variable nueva de producción.
- **Veredicto:** HOLD. Listo para revisión. Sin merge ni producción hasta el ok de Facundo.

## Informe del paso 10 (Regression Guard)

- **Flujos críticos verificados:** ingreso con sesión aal1/aal2 ✅ (unitario); alta TOTP enroll/challenge/verify ✅; Ajustes de la nutri (activar/desactivar) ✅ unitario y e2e de demo; `/admin` sin aal2 → 403 ✅; pacientes sin MFA obligatorio ✅. Sesión real de `/admin` en producción ⚠️ (no se tocó prod).
- **Regresiones cubiertas:** bootstrap de nutri nueva antes de MFA (setup y cola vacía) se conserva; `/api/admin/me` sigue libre para el aviso del menú.
- **Contratos revisados:** frente (`decideMfaStep`, Ajustes/QR) ↔ cliente `supabase.auth.mfa` (enroll/challenge/verify) ↔ middleware (`isAdminProtectedPath` + `requireAdmin`). El payload de error es `{ error, code: 'mfa_required' }`.
- **Áreas frágiles:** auth y `/admin`. Un token aal1 en `/api/admin/*` (salvo `/me`) ahora se corta en el middleware aunque `MFA_ENFORCE` esté apagado.
- **Migraciones:** N/A en este cambio. La existente `20261017030000_mfa_aal2_gate.sql` sigue sin aplicar.
- **Fire test:** `isAdminProtectedPath` forzado a falso → la prueba de `/admin` aal1 pasó de 403 a 200 ❌; se revirtió y volvió a verde ✅.
- **Automatizaciones nuevas:** pruebas unitarias de TOTP y del guard de admin; e2e de Ajustes en demo. No hay variable nueva de producción.
- **Veredicto:** HOLD. Listo para revisión. Sin merge ni producción hasta el ok de Facundo.
