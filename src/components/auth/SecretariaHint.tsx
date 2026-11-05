// Cuenta sin vincular: si es secretaria de algún consultorio, va directo a su espacio (/equipo).
// Si no, deja un enlace para quien tiene un código de secretaria.
import { useEffect } from 'react';
import { teamApi } from '../../api/team';

export function SecretariaHint({ go = (href: string) => window.location.assign(href) }: { go?: (href: string) => void }) {
  useEffect(() => {
    let vivo = true;
    teamApi.workplaces().then(r => { if (vivo && r.workplaces.length) go('/equipo'); }).catch(() => { /* Sin acceso de secretaria: se queda en esta pantalla. */ });
    return () => { vivo = false; };
  }, [go]);
  return <p>¿Te invitaron como secretaria de un consultorio? <a href="/equipo">Entrá con tu código</a>.</p>;
}
