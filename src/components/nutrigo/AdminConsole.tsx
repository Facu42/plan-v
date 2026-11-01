import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Icon, Mark } from '../shared/Icon';
import { NvButton, NvState } from './primitives';
import { SERVICIO_TAB_ICONS, SERVICIO_TABS, ShowroomServicio, type ServicioTab } from './ShowroomServicio';
import '@fontsource/poppins/latin-400.css';
import '@fontsource/poppins/latin-500.css';
import '@fontsource/poppins/latin-600.css';
import '@fontsource/poppins/latin-700.css';
import './nutrigo.css';
import './clinic-professional.css';
import './app-shell.css';
import './nutrigo-parity.css';
import './nutrigo-fidelity.css';
import './shell-fig.css';
import './motion.css';
import './servicio-fig.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/instrument-serif/latin-400.css';
import '@fontsource/instrument-serif/latin-400-italic.css';
import './admin-console.css';
import './admin-redesign.css';
import './admin-plan-v.css';

/**
 * Pantalla propia del administrador del servicio (/admin). No es la de una nutricionista ni la de
 * una paciente: sólo pide la sesión y que la base confirme que la cuenta es administradora.
 */
export function AdminConsole({ darkMode, onToggleTheme, onSignOut, userName }: { darkMode: boolean; onToggleTheme?: () => void; onSignOut?: () => void; userName?: string }) {
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<ServicioTab>('resumen');
  useEffect(() => {
    let active = true;
    api.getAdminMe().then((result) => { if (active) setAdmin(result.admin === true); }).catch(() => { if (active) setAdmin(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    // El fondo detrás de la app (rebote de scroll, bordes) sigue el tema.
    const root = document.documentElement;
    const prev = { bg: document.body.style.background, scheme: root.style.colorScheme };
    document.body.style.background = darkMode ? '#15161B' : '#F3F3F2';
    root.style.colorScheme = darkMode ? 'dark' : '';
    return () => { document.body.style.background = prev.bg; root.style.colorScheme = prev.scheme; };
  }, [darkMode]);

  return <div className={`nv-app nv-pro nv-fees-page nv-admin${darkMode ? ' nv-dark' : ''}`}>
    <nav className="nv-admin-rail" aria-label="Nutridash">
      <a className="nv-admin-brand" href="/admin" aria-label="Nutridash, panel del servicio"><Mark /><span className="nv-admin-brand-copy"><strong>Nutridash</strong><small>Panel del servicio</small></span></a>
      {admin ? <div className="nv-admin-rail-links"><span className="nv-admin-rail-label">Administración</span>{SERVICIO_TABS.map((item) => <button key={item.id} type="button" className="nv-admin-rail-link" aria-current={tab === item.id ? 'page' : undefined} aria-label={item.label} title={item.label} onClick={() => setTab(item.id)}><Icon name={SERVICIO_TAB_ICONS[item.id]} size={17} /><span>{item.label}</span></button>)}</div> : null}
      <span className="nv-admin-rail-gap" />
      {onToggleTheme ? <button type="button" className="nv-admin-theme" aria-label={darkMode ? 'Usar tema claro' : 'Usar tema oscuro'} aria-pressed={darkMode} title={darkMode ? 'Tema claro' : 'Tema oscuro'} onClick={onToggleTheme}><Icon name={darkMode ? 'sun' : 'moon'} size={18} /></button> : null}
    </nav>
    <div className="nv-admin-body">
      <header className="nv-admin-bar">
        <div className="nv-admin-title"><h1>Panel del servicio</h1><p>Las nutricionistas de Nutridash, <em>de un vistazo.</em></p></div>
        <div className="nv-admin-user">
          {userName ? <span>{userName}</span> : null}
          {onSignOut ? <NvButton className="nv-soft" onClick={onSignOut}>Cerrar sesión</NvButton> : null}
        </div>
      </header>
    <main id="nv-main" tabIndex={-1} className="nv-main nv-admin-main">
      {admin === null ? <NvState kind="loading" title="Cargando…" description="Estamos verificando tu acceso." />
        : admin ? <ShowroomServicio tab={tab} onTab={setTab} />
          : <NvState title="No tenés permiso para ver esta pantalla" description="El Panel del servicio es sólo para quien administra Nutridash." action={<NvButton className="nv-soft" onClick={() => { window.location.assign('/'); }}>Ir al inicio</NvButton>} />}
    </main>
    </div>
  </div>;
}
