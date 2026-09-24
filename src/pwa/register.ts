import { emitShellUpdate } from './shell-update';

export function registerPlanVWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  const standalone = window.matchMedia('(display-mode: standalone)').matches;
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js', { scope: '/' }).then((registration) => {
      if (registration.waiting && navigator.serviceWorker.controller) emitShellUpdate({ waiting: true });
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) emitShellUpdate({ waiting: true });
        });
      });
    }).catch(() => {
      if (standalone) return;
    });
  });
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'SHELL_UPDATED') emitShellUpdate({ updated: true, waiting: false });
  });
}
