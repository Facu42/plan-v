import { useEffect, useState } from 'react';
import { detectInstallPlatform, INSTALL_COPY, type InstallPlatform } from './install-copy';

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void> };
export type InstallOffer = (typeof INSTALL_COPY)[keyof typeof INSTALL_COPY];

export const INSTALL_DISMISS_KEY = 'pv-install-dismissed';

// El navegador avisa una sola vez que se puede instalar, a veces antes de que se abra la pantalla
// que lo ofrece: se guarda acá para que la tarjeta del menú lo encuentre después.
let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(listener => listener());
const captured = new WeakSet<object>();

export function captureInstallPrompt(target: Window = window): void {
  if (captured.has(target)) return;
  captured.add(target);
  target.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    notify();
  });
  target.addEventListener('appinstalled', () => { deferred = null; notify(); });
}

export const hasInstallPrompt = (): boolean => deferred !== null;

export async function promptInstall(): Promise<void> {
  const event = deferred;
  deferred = null;
  notify();
  await event?.prompt();
}

export function resetInstallPrompt(): void {
  deferred = null;
  notify();
}

export function subscribeInstallPrompt(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** Qué ofrecer: en iPhone siempre se explica Safari; en el resto, solo si el navegador permite instalar. */
export function installOffer({ platform, hasPrompt, dismissed }: { platform: InstallPlatform; hasPrompt: boolean; dismissed: boolean }): InstallOffer | null {
  if (dismissed || platform === 'standalone') return null;
  if (platform === 'ios') return INSTALL_COPY.ios;
  return hasPrompt ? INSTALL_COPY[platform] : null;
}

export function currentInstallPlatform(): InstallPlatform {
  if (typeof window === 'undefined') return 'standalone';
  return detectInstallPlatform({
    userAgent: navigator.userAgent,
    standalone: 'standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
    displayModeStandalone: window.matchMedia('(display-mode: standalone)').matches,
  });
}

const readDismissed = (): boolean => {
  try { return sessionStorage.getItem(INSTALL_DISMISS_KEY) === '1'; } catch { return false; }
};

export function dismissInstall(): void {
  try { sessionStorage.setItem(INSTALL_DISMISS_KEY, '1'); } catch { /* sin almacenamiento: se oculta solo en esta vista */ }
  notify();
}

/** Oferta vigente para la pantalla, con sus dos acciones. */
export function useInstallOffer(): { offer: InstallOffer | null; install: () => void } {
  const [, setTick] = useState(0);
  useEffect(() => subscribeInstallPrompt(() => setTick(tick => tick + 1)), []);
  const platform = currentInstallPlatform();
  const offer = installOffer({ platform, hasPrompt: hasInstallPrompt(), dismissed: readDismissed() });
  const install = () => {
    if (platform === 'ios') { dismissInstall(); return; }
    void promptInstall().finally(dismissInstall);
  };
  return { offer, install };
}
