/* Arranque del CRM Nutridash (/admin).
   El prototipo es estático y se ejecuta solo: en orden gsap → utilidades →
   datos → gráficos → movimiento → vistas → shell. Después cableamos el
   Panel del servicio real (React) en el lugar que tenía la vista demo. */
import './vendor/gsap.min.js';
import './vendor/Flip.min.js';
import './ui.js';
import './data.js';
import './charts.js';
import './motion.js';
import './views.js';
import './app.js';

const ND = window.ND;

/* El Panel del servicio ya no es la vista demo del prototipo: en producción
   esa entrada monta AdminConsole (datos y permiso reales). */
ND.views.servicio = () => '<section id="crm-service-root" class="nd-service-mount" tabindex="-1"></section>';

let notifyAdminCrmView = null;
const originalGo = ND.go;
ND.go = function adminCrmGo(view, opts) {
  originalGo(view, opts);
  if (typeof notifyAdminCrmView === 'function') notifyAdminCrmView(ND.ui.view);
};

/**
 * Suscribe el anfitrión React a los cambios de vista del CRM vanilla,
 * para montar o desmontar el Panel del servicio real.
 */
export function listenAdminCrmView(callback) {
  notifyAdminCrmView = callback;
}

/** Abre una vista si el CRM la conoce (enlace profundo #/pipeline, etc.). */
export function openAdminCrmView(view) {
  if (ND.views[view]) {
    ND.go(view);
    return true;
  }
  ND.go('resumen');
  return false;
}
