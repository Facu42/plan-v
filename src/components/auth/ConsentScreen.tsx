import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PRIVACY_URL, TERMS_URL } from '../../legal';
import { Mark } from '../shared/Icon';

// Aparece una sola vez a quien entró sin haber aceptado la versión vigente de los
// términos (por ejemplo, alguien que entró con Google sin pasar por el registro).
export function ConsentScreen() {
  const { acceptLegal, signOut } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = async () => {
    setBusy(true);
    setError(null);
    const res = await acceptLegal();
    if (res.error) setError(res.error);
    setBusy(false);
  };

  return (
      <div className="loading-card consent-card">
        <Mark />
        <p className="eyebrow">Plan V</p>
        <h2>Antes de seguir</h2>
        <p>Para usar Plan V necesitamos que aceptes cómo cuidamos tus datos.</p>
        <label className="auth-consent">
          <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
          <span>Leí y acepto los <a href={TERMS_URL} target="_blank" rel="noreferrer">términos y condiciones</a> y la <a href={PRIVACY_URL} target="_blank" rel="noreferrer">política de privacidad</a>, y doy mi consentimiento expreso para que se traten mis datos de salud, incluso en servidores fuera de Argentina, para los fines que ahí se explican.</span>
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="button" className="primary-button" disabled={!accepted || busy} onClick={accept}>{busy ? 'Un momento…' : 'Aceptar y seguir'}</button>
        <button type="button" className="soft-button" onClick={() => signOut()}>Salir</button>
      </div>
  );
}
