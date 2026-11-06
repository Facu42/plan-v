import { useEffect, useState } from 'react';
import { currentPushState, disablePush, enablePush, pushPublicKey, pushSupported, type PushState } from '../../pwa/push';

/** Texto de la fila según el estado del teléfono. Null si este navegador no puede recibir avisos. */
export function filaTelefonoNutri(estado: PushState, fallo: boolean): { nombre: string; detalle: string } | null {
  if (estado === 'unsupported') return null;
  if (fallo) return { nombre: 'No pudimos activar los avisos', detalle: 'Probá de nuevo.' };
  if (estado === 'blocked') return { nombre: 'Avisos bloqueados', detalle: 'Permitilos para Nutridash en los ajustes del navegador.' };
  return { nombre: 'Avisos en este dispositivo', detalle: 'Cuando una paciente te escribe, cambia su consulta o avisa un pago.' };
}

type Props = { Interruptor: (p: { etiqueta: string; activo: boolean; alCambiar?: () => void; disabled?: boolean }) => React.ReactElement };

/** Fila con interruptor para recibir en este dispositivo los avisos de las pacientes. No aparece si el servidor no los tiene activos. */
export function AvisosTelefonoNutri({ Interruptor }: Props) {
  const [clave, setClave] = useState<string | null>(null);
  const [estado, setEstado] = useState<PushState>('unsupported');
  const [ocupado, setOcupado] = useState(false);
  const [fallo, setFallo] = useState(false);
  useEffect(() => {
    if (!pushSupported()) return undefined;
    let activo = true;
    Promise.all([pushPublicKey(), currentPushState()])
      .then(([key, actual]) => { if (activo && key) { setClave(key); setEstado(actual); } })
      .catch(() => undefined);
    return () => { activo = false; };
  }, []);
  const fila = clave ? filaTelefonoNutri(estado, fallo) : null;
  if (!fila || !clave) return null;
  const alternar = async () => {
    if (ocupado || estado === 'blocked') return;
    setOcupado(true); setFallo(false);
    try { setEstado(estado === 'on' ? await disablePush() : await enablePush(clave)); } catch { setFallo(true); } finally { setOcupado(false); }
  };
  return <div className="pubhr"><div><b>{fila.nombre}</b><span>{fila.detalle}</span>
    <Interruptor etiqueta={fila.nombre} activo={estado === 'on'} disabled={ocupado || estado === 'blocked'} alCambiar={() => { void alternar(); }} /></div></div>;
}
