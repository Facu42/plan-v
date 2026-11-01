import { useEffect, useRef, useState } from 'react';
import { api } from '../../api/client';
import { supabase } from '../../lib/supabase';
import { friendlyError } from '../../lib/error-messages';
import { listVerifiedTotp } from '../../lib/mfa-totp';
import type { CanalAviso } from './ficha-ajustes';

type PreferenciasAviso = Record<CanalAviso, boolean>;

/** Preferencias de la profesional, nunca de la paciente seleccionada. */
export function useAvisosProfesional() {
  const [prefs, setPrefs] = useState<PreferenciasAviso | null>(null), [error, setError] = useState(''), [status, setStatus] = useState(''), [busy, setBusy] = useState(false), [revision, setRevision] = useState(0);
  const lock = useRef(false);
  useEffect(() => { let alive = true; api.getNotificationPrefs(undefined, 'pro').then(r => { if (alive) setPrefs(r.prefs); }).catch(e => { if (alive) setError(friendlyError(e)); }); return () => { alive = false; }; }, [revision]);
  async function toggle(key: CanalAviso) {
    if (!prefs || lock.current) return; lock.current = true; setBusy(true); setError(''); setStatus('');
    try { const current = await api.getNotificationPrefs(undefined, 'pro'); const saved = await api.saveNotificationPrefs({ ...current.prefs, [key]: !prefs[key] }, undefined, 'pro'); setPrefs(saved.prefs); setStatus('Preferencias guardadas. El envío depende de los canales habilitados.'); } catch (e) { setError(friendlyError(e)); } finally { setBusy(false); lock.current = false; }
  }
  const retry = () => { setError(''); setRevision(r => r + 1); };
  return { prefs, error, status, busy, toggle, retry };
}

/** Estado de la verificación en dos pasos de la profesional; solo consulta. */
export function useDosPasos() {
  const [mfa, setMfa] = useState('Consultando…'), [error, setError] = useState('');
  useEffect(() => { let alive = true; if (!supabase) { setMfa('No disponible en modo demo'); return; } listVerifiedTotp(supabase).then((factors) => { if (alive) setMfa(factors.length ? 'Activa' : 'Apagada'); }).catch(e => { if (alive) { setMfa('Sin información'); setError(friendlyError(e)); } }); return () => { alive = false; }; }, []);
  return { mfa, error };
}
