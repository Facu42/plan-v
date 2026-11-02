import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { HechoAccion } from '../../lib/hoy-accion';
import { HOY_HECHO } from '../../lib/hoy-sesion';

export function useHechosHoy() {
  const [hechos, setHechos] = useState<HechoAccion[]>([]);
  useEffect(() => {
    let vivo = true;
    const cargar = () => {
      void api.listarHechosHoy()
        .then(respuesta => { if (vivo) setHechos(respuesta.hechos ?? []); })
        .catch(() => undefined);
    };
    cargar();
    window.addEventListener(HOY_HECHO, cargar);
    return () => { vivo = false; window.removeEventListener(HOY_HECHO, cargar); };
  }, []);
  return hechos;
}
