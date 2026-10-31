import { useEffect } from 'react';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { AdminConsole } from '../AdminConsole';
import './nd-styles.css';

/**
 * Anfitrión del CRM Nutridash completo en /admin: el prototipo (vanilla) vive
 * aquí con sus datos de ejemplo, y su entrada «Panel del servicio» monta la
 * pantalla real de administración (AdminConsole) en su lugar.
 */

const SHELL_HTML = `
  <div class="nd-app" id="app">
    <aside class="nd-sidebar" id="sidebar" aria-label="Navegación principal"></aside>
    <div class="nd-shell">
      <header class="nd-topbar" id="topbar"></header>
      <main class="nd-view" id="view" tabindex="-1"></main>
    </div>
  </div>
  <div id="overlay-root"></div>
  <div class="nd-toasts" id="toast-root" aria-live="polite"></div>
`;

// El prototipo corre una sola vez por pestaña (los módulos quedan cacheados).
let bootPromise: Promise<typeof import('./boot')> | null = null;
let serviceRoot: Root | null = null;

type NdRuntime = {
  off?: boolean;
  go: (view: string, opts?: { conv?: string }) => void;
  views: Record<string, () => string>;
  ui: { view?: string };
  who?: { name: string; role: string };
};

function nd(): NdRuntime | null {
  if (typeof window === 'undefined') return null;
  return (window as unknown as { ND?: NdRuntime }).ND ?? null;
}

function mountService() {
  const host = document.getElementById('crm-service-root');
  if (!host || serviceRoot) return;
  serviceRoot = createRoot(host);
  serviceRoot.render(createElement(AdminConsole, { darkMode: false }));
}

function unmountService() {
  if (!serviceRoot) return;
  try { serviceRoot.unmount(); } catch { /* ya desmontado */ }
  serviceRoot = null;
}

/** Primera pantalla en /admin: vista del hash (#/pipeline) o el resumen. */
function initialView(): string {
  const raw = (window.location.hash || '').replace(/^#\/?/, '').trim();
  return raw || 'resumen';
}

export function AdminCrm({ adminName }: { adminName?: string }) {
  useEffect(() => {
    let disposed = false;
    // Se lee antes de arrancar el prototipo: su boot reescribe el hash.
    const wanted = initialView();
    void (async () => {
      bootPromise ||= import('./boot');
      const boot = await bootPromise;
      const runtime = nd();
      if (!runtime || disposed) { if (runtime) runtime.off = true; return; }
      boot.listenAdminCrmView((view) => {
        if (disposed) return;
        if (view === 'servicio') mountService();
        else unmountService();
      });
      // La esquina del CRM muestra a quien firmó la sesión administrativa
      // real; las personas y cifras de las demás vistas siguen siendo de la demo.
      if (adminName) runtime.who = { name: adminName, role: 'Administración · Nutridash' };
      runtime.off = false;
      boot.openAdminCrmView(wanted);
    })();
    return () => {
      disposed = true;
      unmountService();
      const runtime = nd();
      if (runtime) runtime.off = true;
    };
  }, []);

  return <div className="nd-admin-crm" dangerouslySetInnerHTML={{ __html: SHELL_HTML }} />;
}
