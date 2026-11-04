import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { ActivacionTarjeta } from './ActivacionTarjeta';

type Paso = { id: string; label: string; estado: 'hecho' | 'pendiente' | 'sin_dato' };

/** Checklist de arranque en el inicio de la nutri. Se oculta si no hay nada pendiente. */
export function ActivacionCard() {
  const [pasos, setPasos] = useState<Paso[] | null>(null);
  const [nota, setNota] = useState('');
  const [trabada, setTrabada] = useState(false);
  const [oculta, setOculta] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    api.getActivacionPropia().then((row) => {
      if (controller.signal.aborted || !row.visible) return;
      setPasos(row.pasos);
      setNota(row.nota);
      setTrabada(row.trabada);
    }).catch(() => { /* sin checklist si la cuenta no es de nutri o la base no responde */ });
    return () => controller.abort();
  }, []);

  if (oculta || !pasos?.length) return null;
  return <ActivacionTarjeta pasos={pasos} nota={nota} trabada={trabada} onOcultar={() => { setOculta(true); void api.ocultarActivacionPropia().catch(() => undefined); }} />;
}
