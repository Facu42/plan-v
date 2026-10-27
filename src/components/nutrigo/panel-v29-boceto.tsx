import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CERRAR_PANEL_MS, TOAST_DESMONTE_MS, TOAST_MS, movimientoReducido } from './panel-v29-motion';

/** El boceto monta `#actw` cerrado y le agrega `.on` en el frame siguiente. Al cerrar saca `.on` y espera 220 ms. */
export function usePanelBoceto(onClose: () => void) {
  const [abierta, setAbierta] = useState(false);
  const cerrando = useRef(false);
  const espera = useRef<number | null>(null);
  const alCerrar = useRef(onClose);
  alCerrar.current = onClose;
  useEffect(() => {
    const id = requestAnimationFrame(() => setAbierta(true));
    return () => {
      cancelAnimationFrame(id);
      if (espera.current != null) window.clearTimeout(espera.current);
    };
  }, []);
  const cerrar = useCallback(() => {
    if (cerrando.current) return;
    cerrando.current = true;
    if (movimientoReducido()) {
      alCerrar.current();
      return;
    }
    setAbierta(false);
    espera.current = window.setTimeout(() => alCerrar.current(), CERRAR_PANEL_MS);
  }, []);
  return { clase: abierta ? 'on' : '', cerrar };
}

/** El aviso ya está en el DOM con opacidad 0. `.on` entra en el frame siguiente y sale a los 3600 ms. */
export function AvisoBoceto({ texto }: { texto: string }) {
  const [prendido, setPrendido] = useState(false);
  useEffect(() => {
    const entrar = requestAnimationFrame(() => setPrendido(true));
    const salir = window.setTimeout(() => setPrendido(false), TOAST_MS);
    return () => {
      cancelAnimationFrame(entrar);
      window.clearTimeout(salir);
    };
  }, [texto]);
  const nodo = <div id="atoast" className={prendido ? 'on' : undefined} role="status">{texto}</div>;
  const host = typeof document === 'undefined' ? null : document.querySelector('#pv-panel-v29 .app');
  return host ? createPortal(nodo, host) : nodo;
}

export function avisoEnElPanel(texto: string) {
  const host = document.querySelector('#pv-panel-v29 .app');
  if (!host) return;
  host.querySelector('#atoast')?.remove();
  const nodo = document.createElement('div');
  nodo.id = 'atoast';
  nodo.setAttribute('role', 'status');
  nodo.textContent = texto;
  host.appendChild(nodo);
  requestAnimationFrame(() => nodo.classList.add('on'));
  window.setTimeout(() => nodo.classList.remove('on'), TOAST_MS);
  window.setTimeout(() => nodo.remove(), TOAST_DESMONTE_MS);
}
