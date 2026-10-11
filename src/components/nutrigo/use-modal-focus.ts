import { useEffect, useRef } from 'react';

/** Mantiene el teclado en el diálogo activo y devuelve el foco al control que lo abrió. */
export function useModalFocus(active: boolean, onClose: () => void) {
  const root = useRef<HTMLDivElement>(null);
  const close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    if (!active || !root.current) return;
    const dialog = root.current;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const controls = () => [...dialog.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),a[href],[tabindex="0"]')].filter(el => el.getClientRects().length);
    (controls()[0] ?? dialog).focus();
    const onKey = (event: KeyboardEvent) => {
      const dialogs = [...document.querySelectorAll<HTMLElement>('dialog[open],[role="dialog"]')].filter(el => el.getClientRects().length);
      if (dialogs[dialogs.length - 1] !== dialog) return;
      if (event.key === 'Escape') { event.preventDefault(); close.current(); }
      if (event.key !== 'Tab') return;
      const items = controls(); const first = items[0]; const last = items[items.length - 1];
      if (!first) { event.preventDefault(); dialog.focus(); }
      else if (!dialog.contains(document.activeElement) || !event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); if (opener?.isConnected) opener.focus(); };
  }, [active]);
  return root;
}
