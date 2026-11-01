import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { decideMfaStep, mfaEnforcedInApp, type MfaStep } from './mfa';

/** Consulta a Supabase en qué nivel está la sesión y cuántos códigos tiene dados de alta. */
export function useMfaGate(session: Session | null, requiredForAccount: boolean, ready: boolean, enforced = mfaEnforcedInApp()) {
  const userId = session?.user.id ?? null;
  const [step, setStep] = useState<MfaStep>(userId && supabase ? 'checking' : null);

  const refresh = useCallback(async () => {
    if (!supabase || !userId) { setStep(null); return; }
    try {
      const [level, factors] = await Promise.all([
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
        supabase.auth.mfa.listFactors(),
      ]);
      setStep(decideMfaStep({
        currentLevel: level.data?.currentLevel ?? null,
        verifiedFactors: factors.data?.totp.length ?? 0,
        requiredForAccount,
        enforced,
      }));
    } catch {
      // Si Supabase no responde, /admin no entra. Quien lo tiene opcional sigue: el servidor frena
      // solo a quien ya dio de alta el código.
      setStep(enforced && requiredForAccount ? 'enroll' : null);
    }
  }, [userId, requiredForAccount, enforced]);

  useEffect(() => {
    if (!ready) return;
    void refresh();
  }, [ready, refresh]);

  return { step: ready ? step : userId ? 'checking' as const : null, refresh };
}
