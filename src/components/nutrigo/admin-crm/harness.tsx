import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { AdminCrm } from './AdminCrm';

/* Sólo para verificación visual en el local: monta el centro de mando
   sin depender de la sesión real (React y React DOM salen del mismo grafo). */
export function mountAdminCrmHarness() {
  const host = document.createElement('div');
  document.body.innerHTML = '';
  document.body.appendChild(host);
  createRoot(host).render(createElement(AdminCrm));
}
