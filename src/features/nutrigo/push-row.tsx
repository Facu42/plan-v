import { useEffect, useState } from 'react';
import { Icon } from '../../components/shared/Icon';
import { currentPushState, disablePush, enablePush, pushPublicKey, pushSupported, type PushState } from '../../pwa/push';

type RowText = { title: string; note: string };

export function pushRowText(state: PushState, failed: boolean): RowText | null {
  if (state === 'unsupported') return null;
  if (failed) return { title: 'No pudimos activar los avisos', note: 'Tocá para probar de nuevo.' };
  if (state === 'on') return { title: 'Avisos activados en este teléfono', note: 'Tocá para desactivarlos.' };
  if (state === 'blocked') return { title: 'Los avisos están bloqueados', note: 'Permitilos para Plan V en los ajustes del teléfono.' };
  return { title: 'Recibir avisos en este teléfono', note: 'Te avisamos cuando tu nutricionista te escriba, publique tu plan o cambie tu consulta.' };
}

/** Fila de la hoja de avisos para prender o apagar los avisos al teléfono. No aparece si el servidor no los tiene activos. */
export function PushRow() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [state, setState] = useState<PushState>('unsupported');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!pushSupported()) return undefined;
    let active = true;
    Promise.all([pushPublicKey(), currentPushState()])
      .then(([key, current]) => { if (active && key) { setPublicKey(key); setState(current); } })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const text = publicKey ? pushRowText(state, failed) : null;
  if (!text || !publicKey) return null;

  const toggle = async () => {
    if (busy || state === 'blocked') return;
    setBusy(true);
    setFailed(false);
    try {
      setState(state === 'on' ? await disablePush() : await enablePush(publicKey));
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <p className="pms-group">En este teléfono</p>
      <button type="button" className="pms-row pms-push" aria-pressed={state === 'on'} aria-busy={busy} disabled={state === 'blocked'} onClick={() => { void toggle(); }}>
        <span className="pms-icon" aria-hidden="true"><Icon name="bell" size={18} /></span>
        <span className="pms-text"><span className="pms-label">{text.title}</span><small>{text.note}</small></span>
      </button>
    </>
  );
}
