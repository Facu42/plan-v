import { useEffect, useState } from 'react';
import { applyWaitingShell, getShellUpdateState, subscribeShellUpdate } from './shell-update';
import './pwa.css';

export function ShellUpdateNotice() {
  const [state, setState] = useState(getShellUpdateState);
  useEffect(() => subscribeShellUpdate(setState), []);
  if (!state.waiting && !state.updated) return null;

  const reload = () => {
    const waiting = typeof navigator !== 'undefined' ? navigator.serviceWorker?.controller : null;
    if (state.waiting && typeof navigator !== 'undefined') {
      void navigator.serviceWorker.getRegistration().then((registration) => {
        applyWaitingShell(registration?.waiting ?? waiting);
        window.location.reload();
      });
      return;
    }
    window.location.reload();
  };

  return <p className="pv-shell-update" role="status">
    {state.waiting ? 'Hay una versión nueva del shell.' : 'El shell de la app se actualizó.'}
    {' '}Los datos clínicos no se guardan en este dispositivo.
    <button type="button" onClick={reload}>Recargar</button>
  </p>;
}
