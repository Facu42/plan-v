// Ajustes › Mi cuenta › Tus datos › Descargar: cajón `export` del boceto v29 (`aOpen` con `aCk`), con la descarga real.
// El boceto manda un link por mail; acá el .zip se baja en el momento (los mails propios todavía no están prendidos).
import { useEffect, useRef, useState } from 'react';
import { ajustesApi } from '../../api/ajustes';
import { friendlyError } from '../../lib/error-messages';
import { CajonV29, Tildes } from './CajonV29';
import { avisoEnElPanel } from './panel-v29-boceto';

export const PARTES_EXPORTAR = [
  ['pacientes', 'Pacientes (planilla de Excel)'],
  ['turnos', 'Turnos (planilla de Excel)'],
  ['historia', 'Historia clínica de cada paciente (PDF)'],
] as const;
type Parte = (typeof PARTES_EXPORTAR)[number][0];

function bajar(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function DescargarMisDatos({ onClose }: { onClose: () => void }) {
  const [partes, setPartes] = useState<Record<Parte, boolean>>({ pacientes: true, turnos: true, historia: true });
  const [ocupado, setOcupado] = useState(false), [aviso, setAviso] = useState('');
  const control = useRef<AbortController | null>(null);
  useEffect(() => () => control.current?.abort(), []);
  const ninguna = !Object.values(partes).some(Boolean);
  const preparar = () => {
    if (ocupado || ninguna) return false;
    const c = new AbortController(); control.current = c;
    setOcupado(true); setAviso('');
    ajustesApi.exportData(partes, c.signal)
      .then(({ blob, filename }) => { if (c.signal.aborted) return; bajar(blob, filename); avisoEnElPanel('Tus datos se descargaron.'); onClose(); })
      .catch(e => { if (!c.signal.aborted) { setAviso(friendlyError(e)); setOcupado(false); } });
    return false;
  };
  return <CajonV29 titulo="Descargar mis datos" sub="Se baja un archivo .zip en este dispositivo" ok={ocupado ? 'Preparando…' : 'Preparar'} bloqueado={ocupado || ninguna} aviso={aviso || (ninguna ? 'Elegí al menos una parte.' : undefined)} onGuardar={preparar} onClose={onClose} antesDeCerrar={() => { control.current?.abort(); return true; }}>
    <Tildes filas={PARTES_EXPORTAR.map(([clave, text]) => ({ text, on: partes[clave] }))} onCambiar={(texto, on) => { const clave = PARTES_EXPORTAR.find(([, t]) => t === texto)?.[0]; if (clave) setPartes(p => ({ ...p, [clave]: on })); }} />
    <p className="mhelp">Son datos de salud: guardá el archivo en un lugar seguro. La historia clínica sale solo de las pacientes que dieron el permiso de atención y no incluye tus notas privadas.</p>
  </CajonV29>;
}
