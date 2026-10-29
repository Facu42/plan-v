// Preferencias de este dispositivo (Ajustes → Apariencia): letra más grande y menos movimiento. No hace falta guardarlas en la base.
import { useCallback, useEffect, useState } from 'react';
import './ajustes-prefs.css';

export type PrefPanel = 'letra' | 'movimiento';
const CLAVES: Record<PrefPanel, string> = { letra: 'plan-v:panel-letra-grande', movimiento: 'plan-v:panel-menos-movimiento' };
const ATRIBUTOS: Record<PrefPanel, [string, string]> = { letra: ['data-letra', 'grande'], movimiento: ['data-movimiento', 'menos'] };

export function leerPref(pref: PrefPanel): boolean {
  try { return localStorage.getItem(CLAVES[pref]) === '1'; } catch { return false; }
}
function guardarPref(pref: PrefPanel, activa: boolean) {
  try { if (activa) localStorage.setItem(CLAVES[pref], '1'); else localStorage.removeItem(CLAVES[pref]); } catch { /* sin almacenamiento: queda sólo en esta sesión */ }
}
/** Pone (o saca) el atributo que usa el CSS en la raíz del panel. */
export function aplicarPref(pref: PrefPanel, activa: boolean, raiz = typeof document === 'undefined' ? null : document.getElementById('pv-panel-v29')) {
  if (!raiz) return;
  const [nombre, valor] = ATRIBUTOS[pref];
  if (activa) raiz.setAttribute(nombre, valor); else raiz.removeAttribute(nombre);
}
export const aplicarPrefsGuardadas = () => (['letra', 'movimiento'] as const).forEach(p => aplicarPref(p, leerPref(p)));

export function usePrefsPanel() {
  const [prefs, setPrefs] = useState<Record<PrefPanel, boolean>>({ letra: false, movimiento: false });
  useEffect(() => { setPrefs({ letra: leerPref('letra'), movimiento: leerPref('movimiento') }); }, []);
  const alternar = useCallback((pref: PrefPanel) => setPrefs(actual => {
    const activa = !actual[pref]; guardarPref(pref, activa); aplicarPref(pref, activa); return { ...actual, [pref]: activa };
  }), []);
  return { prefs, alternar };
}
