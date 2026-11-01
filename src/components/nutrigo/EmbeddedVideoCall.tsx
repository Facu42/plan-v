import { openCall } from '../../lib/call-pip';
import { embeddedVideoEnabled } from '../../lib/embedded-video';

/** Abre la sala flotante del cascarón. Con la bandera apagada no muestra nada. */
export function EmbeddedVideoCall({ enabled = embeddedVideoEnabled(), patientId = '', label = 'Consulta', appointmentId = '' }: {
  enabled?: boolean; patientId?: string; label?: string; appointmentId?: string;
}) {
  if (!enabled) return null;
  return <button type="button" data-open-call="true" onClick={() => openCall({ patientId, label, appointmentId }, enabled)}>Abrir sala</button>;
}
