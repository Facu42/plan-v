import { useEffect, useState } from 'react';
import { detectInstallPlatform, INSTALL_COPY, type InstallPlatform } from './install-copy';
import './pwa.css';

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void> };

export function InstallBanner({ platform: forced }: { platform?: Exclude<InstallPlatform, 'standalone'> } = {}) {
  const [platform, setPlatform] = useState(() => forced ?? detectInstallPlatform({
    userAgent: typeof navigator === 'undefined' ? '' : navigator.userAgent,
    standalone: typeof navigator !== 'undefined' && 'standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
    displayModeStandalone: typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches,
  }));
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(() => typeof sessionStorage !== 'undefined' && sessionStorage.getItem('pv-install-dismissed') === '1');

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  useEffect(() => {
    if (forced) {
      setPlatform(forced);
      return;
    }
    const media = window.matchMedia('(display-mode: standalone)');
    const sync = () => setPlatform(detectInstallPlatform({
      userAgent: navigator.userAgent,
      standalone: 'standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
      displayModeStandalone: media.matches,
    }));
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, [forced]);

  if (hidden || platform === 'standalone') return null;
  const copy = INSTALL_COPY[platform];
  const dismiss = () => {
    sessionStorage.setItem('pv-install-dismissed', '1');
    setHidden(true);
  };

  return <aside className="pv-install" aria-label={copy.title}>
    <div>
      <strong>{copy.title}</strong>
      <p>{copy.body}</p>
    </div>
    <div className="pv-install-actions">
      {platform !== 'ios' && deferred && <button type="button" onClick={() => { void deferred.prompt(); dismiss(); }}>{copy.action}</button>}
      <button type="button" className="pv-install-dismiss" onClick={dismiss}>{platform === 'ios' ? copy.action : 'Ahora no'}</button>
    </div>
  </aside>;
}
