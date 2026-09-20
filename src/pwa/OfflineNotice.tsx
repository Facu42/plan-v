import { useEffect, useState } from 'react';
import './pwa.css';

export function OfflineNotice() {
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false);
  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);
  if (!offline) return null;
  return <p className="pv-offline" role="status">Sin conexión. Todavía no se guardó. Este piloto necesita red para registrar datos clínicos.</p>;
}
