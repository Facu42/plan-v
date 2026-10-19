import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { panelStorage, panelTheme, readPanelPreference, resolvedPanelTheme, writePanelPreference, type PanelTheme } from './panel-preferences';

/** Preferencia cosmética de la cuenta; nunca se usa como permiso ni se guarda contenido clínico. */
export function usePanelTheme() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const initial = () => readPanelPreference(panelStorage(), userId);
  const [preference, setPreference] = useState<PanelTheme>(() => panelTheme(session?.user.user_metadata.panel_theme) ?? initial());
  const [systemDark, setSystemDark] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [status, setStatus] = useState('');
  const saving = useRef(false);
  const currentUser = useRef(userId); currentUser.current = userId;
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemDark(media.matches);
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const storedProfile = panelTheme(session?.user.user_metadata.panel_theme);
  useEffect(() => {
    const next = storedProfile ?? readPanelPreference(panelStorage(), userId);
    setPreference(next); writePanelPreference(panelStorage(), userId, next); setStatus('');
  }, [userId, storedProfile]);
  const choose = async (next: PanelTheme) => {
    if (saving.current) return;
    setPreference(next); writePanelPreference(panelStorage(), userId, next);
    if (!session || !supabase) { setStatus('Tema guardado en este navegador.'); return; }
    saving.current = true; setBusy(true); setStatus('Guardando tema…');
    try {
      const { error } = await supabase.auth.updateUser({ data: { panel_theme: next } });
      if (currentUser.current === userId) setStatus(error ? 'Se guardó en este navegador. No pudimos sincronizarlo con tu cuenta; volvé a elegir el tema para reintentar.' : 'Tema guardado en tu cuenta.');
    } catch {
      if (currentUser.current === userId) setStatus('Se guardó en este navegador. No pudimos sincronizarlo con tu cuenta; volvé a elegir el tema para reintentar.');
    } finally { saving.current = false; setBusy(false); }
  };
  return { preference, dark: resolvedPanelTheme(preference, systemDark) === 'dark', choose, status, busy };
}
