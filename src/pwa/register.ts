export function registerPlanVWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  const standalone = window.matchMedia('(display-mode: standalone)').matches;
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      if (standalone) return;
    });
  });
}
