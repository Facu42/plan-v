import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Mark } from '../shared/Icon';
import { NvButton, NvState } from './primitives';
import { ShowroomServicio } from './ShowroomServicio';
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
import './admin-console.css';

/**
 * Pantalla propia del administrador del servicio (/admin). No es la de una nutricionista ni la de
 * una paciente: sólo pide la sesión y que la base confirme que la cuenta es administradora.
 */
export function AdminConsole({ darkMode, onSignOut, userName }: { darkMode: boolean; onSignOut?: () => void; userName?: string }) {
  const [admin, setAdmin] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    api.getAdminMe().then((result) => { if (active) setAdmin(result.admin === true); }).catch(() => { if (active) setAdmin(false); });
    return () => { active = false; };
  }, []);

  return <div className={`nv-app nv-pro nv-fees-page nv-admin${darkMode ? ' nv-dark' : ''}`}>
    <header className="nv-admin-bar">
      <a className="nv-admin-brand" href="/admin" aria-label="Plan V, panel del servicio"><Mark /><span>Plan V</span></a>
      <h1>Panel del servicio</h1>
      <div className="nv-admin-user">
        {userName ? <span>{userName}</span> : null}
        {onSignOut ? <NvButton className="nv-soft" onClick={onSignOut}>Cerrar sesión</NvButton> : null}
      </div>
    </header>
    <main id="nv-main" tabIndex={-1} className="nv-main nv-admin-main">
      {admin === null ? <NvState kind="loading" title="Cargando…" description="Estamos verificando tu acceso." />
        : admin ? <ShowroomServicio />
          : <NvState title="No tenés permiso para ver esta pantalla" description="El Panel del servicio es sólo para quien administra Plan V." action={<NvButton className="nv-soft" onClick={() => { window.location.assign('/'); }}>Ir al inicio</NvButton>} />}
    </main>
  </div>;
}
