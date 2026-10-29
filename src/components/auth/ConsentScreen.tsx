import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PRIVACY_URL, TERMS_URL } from '../../legal';
import { EntryButton, EntryChrome } from './entry-shell';

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
    <EntryChrome title="Antes de seguir" subtitle="Para usar Nutridash necesitamos que aceptes cómo cuidamos tus datos.">
      <label className="entry-check">
        <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
        <span>Leí y acepto los <a href={TERMS_URL} target="_blank" rel="noreferrer">términos y condiciones</a> y la <a href={PRIVACY_URL} target="_blank" rel="noreferrer">política de privacidad</a>, y doy mi consentimiento expreso para que se traten mis datos de salud, incluso en servidores fuera de Argentina, para los fines que ahí se explican.</span>
      </label>
      {error && <p className="entry-error" role="alert">{error}</p>}
      <div className="entry-actions">
        <EntryButton label={busy ? 'Un momento…' : 'Aceptar y seguir'} disabled={!accepted || busy} onClick={() => { void accept(); }} />
        <EntryButton tone="secondary" label="Salir" onClick={() => { void signOut(); }} />
      </div>
    </EntryChrome>
  );
}
