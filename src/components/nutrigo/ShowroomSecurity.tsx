import { useEffect, useState, type FormEvent } from 'react';
import { totpEnrollParams } from '../../context/mfa';
import { supabase } from '../../lib/supabase';
import { NvButton } from './primitives';

type Enrollment = { factorId: string; qr: string; secret: string };
type Phase = 'loading' | 'off' | 'enrolling' | 'on';

/**
 * "Verificación en dos pasos" (issue #132): cualquiera puede activar o quitar el código de 6 cifras
 * desde el menú de cuenta. Si la cuenta lo tiene obligatorio, el botón de quitar no aparece.
 */
export function ShowroomSecurity({ canDisable, onClose }: { canDisable: boolean; onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [factorId, setFactorId] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) { setPhase('off'); return; }
    void supabase.auth.mfa.listFactors().then(({ data }) => {
      const active = data?.totp[0];
      setFactorId(active?.id ?? null);
      setPhase(active ? 'on' : 'off');
    }).catch(() => setPhase('off'));
  }, []);

  const start = async () => {
    if (!supabase) return;
    setBusy(true); setError('');
    try {
      const { data: existing } = await supabase.auth.mfa.listFactors();
      for (const factor of existing?.all ?? []) {
        if (factor.factor_type === 'totp' && factor.status === 'unverified') await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }
      const created = await supabase.auth.mfa.enroll(totpEnrollParams());
      if (created.error || !created.data) { setError('No pudimos preparar el código. Probá de nuevo.'); return; }
      setEnrollment({ factorId: created.data.id, qr: created.data.totp.qr_code, secret: created.data.totp.secret });
      setPhase('enrolling');
    } catch { setError('No pudimos preparar el código. Probá de nuevo.'); }
    finally { setBusy(false); }
  };

  const confirm = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !enrollment || busy) return;
    setBusy(true); setError('');
    try {
      const result = await supabase.auth.mfa.challengeAndVerify({ factorId: enrollment.factorId, code: code.trim() });
      if (result.error) { setError('El código no coincide. Revisá la hora de tu teléfono y probá con el código nuevo.'); return; }
      await supabase.auth.refreshSession();
      setFactorId(enrollment.factorId); setEnrollment(null); setCode(''); setPhase('on');
    } catch { setError('No pudimos verificar el código. Probá de nuevo.'); }
    finally { setBusy(false); }
  };

  const disable = async () => {
    if (!supabase || !factorId || busy) return;
    setBusy(true); setError('');
    try {
      const result = await supabase.auth.mfa.unenroll({ factorId });
      if (result.error) { setError('No pudimos quitar el código. Volvé a entrar e intentá de nuevo.'); return; }
      await supabase.auth.refreshSession();
      setFactorId(null); setPhase('off');
    } catch { setError('No pudimos quitar el código. Probá de nuevo.'); }
    finally { setBusy(false); }
  };

  return <div className="nv-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !busy && onClose()}>
    <section className="nv-dialog nv-privacy" role="dialog" aria-modal="true" aria-labelledby="nv-security-title">
      <header className="nv-dialog-head">
        <div><p className="nv-eyebrow">Tu cuenta</p><h2 id="nv-security-title">Verificación en dos pasos</h2><p>Además de tu clave o Google, te pedimos un código de 6 cifras de una aplicación como Google Authenticator.</p></div>
        <button type="button" onClick={onClose} disabled={busy} aria-label="Cerrar">×</button>
      </header>
      {phase === 'loading' && <p role="status">Un momento…</p>}
      {phase === 'off' && <>
        <p>Todavía no la activaste.</p>
        {error && <p className="nv-dialog-error" role="alert">{error}</p>}
        <footer className="nv-dialog-actions"><NvButton onClick={() => { void start(); }} disabled={busy || !supabase}>{busy ? 'Preparando…' : 'Activar'}</NvButton></footer>
      </>}
      {phase === 'enrolling' && enrollment && <form onSubmit={(event) => { void confirm(event); }}>
        <p>Escaneá el código con tu aplicación y escribí el número de 6 cifras que te muestra.</p>
        <img src={enrollment.qr} alt="Código QR para tu aplicación de códigos" width={176} height={176} />
        <p>¿No podés escanear? Escribí esta clave en la aplicación: <strong style={{ wordBreak: 'break-all' }}>{enrollment.secret}</strong></p>
        <input aria-label="Código de 6 cifras" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} />
        {error && <p className="nv-dialog-error" role="alert">{error}</p>}
        <footer className="nv-dialog-actions">
          <NvButton className="nv-ghost" onClick={onClose} disabled={busy}>Cancelar</NvButton>
          <NvButton type="submit" disabled={busy || code.length !== 6}>{busy ? 'Verificando…' : 'Activar'}</NvButton>
        </footer>
      </form>}
      {phase === 'on' && <>
        <p><strong>Está activada.</strong> Te vamos a pedir el código cada vez que entres.</p>
        {error && <p className="nv-dialog-error" role="alert">{error}</p>}
        <footer className="nv-dialog-actions">
          {canDisable && <NvButton className="nv-danger" onClick={() => { void disable(); }} disabled={busy}>{busy ? 'Quitando…' : 'Quitar'}</NvButton>}
          <NvButton onClick={onClose} disabled={busy}>Listo</NvButton>
        </footer>
      </>}
    </section>
  </div>;
}
