import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { CODE_MISMATCH_MESSAGE, MISSING_FACTOR_MESSAGE, PREPARE_ERROR_MESSAGE, VERIFY_ERROR_MESSAGE, challengeAndConfirmTotp, enrollTotp, listVerifiedTotp } from '../../lib/mfa-totp';
import { EntryButton, EntryChrome, EntryField } from './entry-shell';

type Enrollment = { factorId: string; qr: string; secret: string };

// Segundo paso del ingreso: código de 6 cifras de una aplicación como Google Authenticator.
export function MfaScreen({ mode, onDone }: { mode: 'verify' | 'enroll'; onDone: () => void }) {
  const { signOut } = useAuth();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (mode !== 'enroll' || started.current || !supabase) return;
    started.current = true;
    void (async () => {
      const created = await enrollTotp(supabase);
      if (!created.ok) { setError(created.error || PREPARE_ERROR_MESSAGE); return; }
      setEnrollment({ factorId: created.factorId, qr: created.qr, secret: created.secret });
    })();
  }, [mode]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase || busy) return;
    setBusy(true); setError('');
    try {
      const factorId = mode === 'enroll' ? enrollment?.factorId : (await listVerifiedTotp(supabase))[0]?.id;
      if (!factorId) { setError(MISSING_FACTOR_MESSAGE); return; }
      const result = await challengeAndConfirmTotp(supabase, factorId, code);
      if (!result.ok) { setError(result.error || CODE_MISMATCH_MESSAGE); return; }
      onDone();
    } catch { setError(VERIFY_ERROR_MESSAGE); }
    finally { setBusy(false); }
  }

  const enrolling = mode === 'enroll';
  return (
    <EntryChrome
      title={enrolling ? 'Activá la verificación en dos pasos' : 'Ingresá tu código'}
      subtitle={enrolling
        ? 'Escaneá el código con Google Authenticator (o una app parecida) y escribí el número de 6 cifras que te muestra.'
        : 'Abrí tu aplicación de códigos y escribí el número de 6 cifras de Nutridash.'}
    >
      <form onSubmit={(event) => { void submit(event); }} aria-busy={busy}>
        <fieldset disabled={busy} style={{ border: 0, padding: 0, display: 'grid', gap: 16 }}>
          {enrolling && enrollment && (
            <div style={{ display: 'grid', gap: 8, justifyItems: 'center' }}>
              <img src={enrollment.qr} alt="Código QR para tu aplicación de códigos" width={176} height={176} />
              <p className="entry-hint" style={{ margin: 0, textAlign: 'center' }}>
                ¿No podés escanear? Escribí esta clave en la aplicación: <strong style={{ wordBreak: 'break-all' }}>{enrollment.secret}</strong>
              </p>
            </div>
          )}
          <label className="entry-label">Código de 6 cifras
            <EntryField label="Código de 6 cifras" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} />
          </label>
          {error && <p className="entry-error" role="alert">{error}</p>}
          <div className="entry-actions">
            <EntryButton type="submit" label={busy ? 'Verificando…' : enrolling ? 'Activar y entrar' : 'Entrar'} disabled={busy || code.length !== 6 || (enrolling && !enrollment)} />
            <EntryButton tone="secondary" label="Salir" onClick={() => { void signOut(); }} />
          </div>
        </fieldset>
      </form>
    </EntryChrome>
  );
}
