import { useEffect, useRef } from 'react';

const pending = new Map<symbol, { dirty: boolean; busy: boolean }>();
export function canLeaveWorkspace(confirm: (message: string) => boolean = (message) => window.confirm(message)): boolean {
  if ([...pending.values()].some((entry) => entry.busy)) return false;
  if (![...pending.values()].some((entry) => entry.dirty)) return true;
  if (!confirm('Tenés cambios sin guardar. ¿Querés descartarlos y salir de esta pantalla?')) return false;
  pending.clear();
  return true;
}

/** Un formulario registra su estado real, sin considerar guardado un submit fallido. */
export function useUnsavedChanges(dirty: boolean, busy = false) {
  const token = useRef(Symbol('formulario'));
  useEffect(() => {
    const key = token.current;
    pending.set(key, { dirty, busy });
    const onUnload = (event: BeforeUnloadEvent) => {
      if (![...pending.values()].some((entry) => entry.dirty || entry.busy)) return;
      event.preventDefault(); event.returnValue = '';
    };
    window.addEventListener('beforeunload', onUnload);
    return () => { pending.delete(key); window.removeEventListener('beforeunload', onUnload); };
  });
}

export function registerPendingFormForTest(key: symbol, dirty: boolean, busy = false) {
  pending.set(key, { dirty, busy });
  return () => pending.delete(key);
}
